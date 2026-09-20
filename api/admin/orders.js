import { isAdminRequest } from "../../lib/admin-auth.mjs";
import { listOrders } from "../../lib/admin-orders.mjs";

const json = (response, status, body) => {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
};

export default async function handler(request, response) {
  if (!isAdminRequest(request)) return json(response, 401, { error: "Acceso no autorizado." });
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return json(response, 405, { error: "Metodo no permitido." });
  }
  try {
    const orders = await listOrders({ status: request.query?.status });
    return json(response, 200, { orders });
  } catch (error) {
    if (error instanceof TypeError) return json(response, 400, { error: error.message });
    console.error("No fue posible listar los pedidos.", { code: error.code });
    return json(response, 500, { error: "No fue posible consultar los pedidos." });
  }
}
