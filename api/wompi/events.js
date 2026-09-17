import { createHash, timingSafeEqual } from "node:crypto";

const json = (response, status, body) => {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

const getProperty = (data, path) =>
  path.split(".").reduce((value, key) => value?.[key], data);

const getEventSecret = () =>
  process.env.WOMPI_EVENTS_SECRET ||
  process.env.WOMPI_EVENT_SECRET ||
  process.env.WOMPI_SECRET_EVENTS;

const parseBody = (body) => {
  if (body && typeof body === "object" && !Buffer.isBuffer(body)) return body;
  if (Buffer.isBuffer(body)) return JSON.parse(body.toString("utf8"));
  if (typeof body === "string") return JSON.parse(body);
  throw new TypeError("El evento no contiene un cuerpo JSON válido.");
};

const sameChecksum = (received, calculated) => {
  if (typeof received !== "string" || received.length !== calculated.length) return false;

  const receivedBuffer = Buffer.from(received.toLowerCase(), "utf8");
  const calculatedBuffer = Buffer.from(calculated.toLowerCase(), "utf8");
  return timingSafeEqual(receivedBuffer, calculatedBuffer);
};

export function verifyWompiEvent(event, headerChecksum, secret) {
  const properties = event?.signature?.properties;
  const bodyChecksum = event?.signature?.checksum;

  if (!Array.isArray(properties) || !properties.length || event.timestamp == null) {
    return false;
  }

  const values = properties.map((property) => getProperty(event.data, property));
  if (values.some((value) => value == null || typeof value === "object")) return false;

  const signedValue = `${values.map(String).join("")}${event.timestamp}${secret}`;
  const calculated = createHash("sha256").update(signedValue, "utf8").digest("hex");
  const received = headerChecksum || bodyChecksum;

  return sameChecksum(received, calculated);
}

export default function handler(request, response) {
  if (request.method === "GET") {
    return json(response, 200, { service: "wompi-events", status: "ready" });
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return json(response, 405, { error: "Método no permitido." });
  }

  const secret = getEventSecret();
  if (!secret) {
    console.error("No está configurado el secreto de eventos de Wompi.");
    return json(response, 503, { error: "Servicio de eventos no configurado." });
  }

  let event;
  try {
    event = parseBody(request.body);
  } catch {
    return json(response, 400, { error: "JSON inválido." });
  }

  const headerChecksum = request.headers["x-event-checksum"];
  if (!verifyWompiEvent(event, headerChecksum, secret)) {
    return json(response, 401, { error: "Firma de evento inválida." });
  }

  const transaction = event.data?.transaction;
  console.info("Evento de Wompi verificado.", {
    event: event.event,
    environment: event.environment,
    transactionId: transaction?.id,
    transactionStatus: transaction?.status,
  });

  return json(response, 200, { received: true });
}
