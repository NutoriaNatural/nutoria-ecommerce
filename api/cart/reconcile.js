import { reconcileOrderItems } from "../../lib/order-pricing.mjs";

const json = (response, status, body) => {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
};

export default function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { error: "Método no permitido." });
  }

  try {
    return json(response, 200, reconcileOrderItems(request.body?.items));
  } catch (error) {
    if (error instanceof TypeError) return json(response, 400, { error: error.message });
    return json(response, 500, { error: "No fue posible verificar el carrito." });
  }
}
