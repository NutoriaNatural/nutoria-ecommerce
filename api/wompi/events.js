import { createHash, timingSafeEqual } from "node:crypto";
import { expectedWompiEnvironment, processVerifiedWompiEvent } from "../../lib/wompi-events.mjs";

const json = (response, status, body) => {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

const getProperty = (data, path) => path.split(".").reduce((value, key) => value?.[key], data);
const getEventSecret = () =>
  [process.env.WOMPI_EVENTS_SECRET, process.env.WOMPI_EVENT_SECRET, process.env.WOMPI_SECRET_EVENTS]
    .find((value) => typeof value === "string" && value.trim())
    ?.trim();

const parseBody = (body) => {
  if (body && typeof body === "object" && !Buffer.isBuffer(body)) return body;
  if (Buffer.isBuffer(body)) return JSON.parse(body.toString("utf8"));
  if (typeof body === "string") return JSON.parse(body);
  throw new TypeError("El evento no contiene un cuerpo JSON vÃ¡lido.");
};

const sameChecksum = (received, calculated) => {
  if (typeof received !== "string" || received.length !== calculated.length) return false;
  return timingSafeEqual(
    Buffer.from(received.toLowerCase(), "utf8"),
    Buffer.from(calculated.toLowerCase(), "utf8"),
  );
};

export function verifyWompiEvent(event, headerChecksum, secret) {
  const properties = event?.signature?.properties;
  if (!Array.isArray(properties) || !properties.length || event.timestamp == null) return false;
  const values = properties.map((property) => getProperty(event.data, property));
  if (values.some((value) => value == null || typeof value === "object")) return false;
  const signedValue = `${values.map(String).join("")}${event.timestamp}${secret}`;
  const calculated = createHash("sha256").update(signedValue, "utf8").digest("hex");
  return sameChecksum(headerChecksum || event.signature?.checksum, calculated);
}

export default async function handler(request, response) {
  if (request.method === "GET") return json(response, 200, { service: "wompi-events", status: "ready" });
  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return json(response, 405, { error: "MÃ©todo no permitido." });
  }

  const secret = getEventSecret();
  if (!secret) return json(response, 503, { error: "Servicio de eventos no configurado." });

  let event;
  try {
    event = parseBody(request.body);
  } catch {
    return json(response, 400, { error: "JSON invÃ¡lido." });
  }

  if (!verifyWompiEvent(event, request.headers["x-event-checksum"], secret)) {
    return json(response, 401, { error: "Firma de evento invÃ¡lida." });
  }

  const expectedEnvironment = expectedWompiEnvironment(secret);
  if (!expectedEnvironment || event.environment !== expectedEnvironment) {
    return json(response, 400, { error: "El ambiente del evento no corresponde a las credenciales." });
  }

  try {
    const result = await processVerifiedWompiEvent(event);
    return json(response, 200, { received: true, ...result });
  } catch (error) {
    console.error("No fue posible procesar el evento verificado de Wompi.", { code: error.code });
    return json(response, 500, { error: "No fue posible procesar el evento." });
  }
}
