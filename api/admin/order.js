import { isAdminRequest } from "../../lib/admin-auth.mjs";
import { getOrderDetail, updateFulfillmentStatus } from "../../lib/admin-orders.mjs";

const json = (response, status, body) => {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
};

export default async function handler(request, response) {
  if (!isAdminRequest(request)) return json(response, 401, { error: "Acceso no autorizado." });
  const id = typeof request.query?.id === "string" ? request.query.id : request.body?.id;
  if (!/^[0-9a-f-]{36}$/i.test(id || "")) return json(response, 400, { error: "Pedido invalido." });
  try {
    if (request.method === "GET") {
      const order = await getOrderDetail(id);
      return order ? json(response, 200, { order }) : json(response, 404, { error: "Pedido no encontrado." });
    }
    if (request.method === "PATCH") {
      const updated = await updateFulfillmentStatus({ id, status: request.body?.status, notes: request.body?.notes });
      return updated ? json(response, 200, { updated: true }) : json(response, 404, { error: "Pedido no encontrado." });
    }
    response.setHeader("Allow", "GET, PATCH");
    return json(response, 405, { error: "Metodo no permitido." });
  } catch (error) {
    if (error instanceof TypeError) return json(response, 400, { error: error.message });
    console.error("No fue posible administrar el pedido.", { code: error.code });
    return json(response, 500, { error: "No fue posible actualizar el pedido." });
  }
}
