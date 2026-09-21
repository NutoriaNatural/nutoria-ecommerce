import { timingSafeEqual } from "node:crypto";

const json = (response, status, body) => {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
};

const safeEqual = (left, right) => {
  const first = Buffer.from(typeof left === "string" ? left : "", "utf8");
  const second = Buffer.from(typeof right === "string" ? right : "", "utf8");
  return first.length === second.length && timingSafeEqual(first, second);
};

export function verifyMetaWebhook(query, verificationToken) {
  const mode = query?.["hub.mode"];
  const token = query?.["hub.verify_token"];
  const challenge = query?.["hub.challenge"];
  return mode === "subscribe"
    && typeof challenge === "string"
    && challenge.length > 0
    && safeEqual(token, verificationToken);
}

export default function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method === "GET") {
    const verificationToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
    if (!verificationToken) {
      return json(response, 503, { error: "Webhook de WhatsApp no configurado." });
    }
    if (!verifyMetaWebhook(request.query, verificationToken)) {
      return json(response, 403, { error: "Verificacion rechazada." });
    }
    response.status(200).setHeader("Content-Type", "text/plain; charset=utf-8");
    return response.end(request.query["hub.challenge"]);
  }

  if (request.method === "POST") {
    // Meta requiere una respuesta 200 rapida. El procesamiento de eventos entrantes
    // se agregara de forma independiente cuando Nutoria defina cuales necesita usar.
    return json(response, 200, { received: true, processed: false });
  }

  response.setHeader("Allow", "GET, POST");
  return json(response, 405, { error: "Metodo no permitido." });
}
