import { isAdminRequest } from "../../lib/admin-auth.mjs";
import { retryOrderNotifications } from "../../lib/notifications.mjs";

const json = (response, status, body) => {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
};

export default async function handler(request, response) {
  if (!isAdminRequest(request)) return json(response, 401, { error: "Acceso no autorizado." });
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { error: "Metodo no permitido." });
  }
  const id = request.body?.id;
  if (!/^[0-9a-f-]{36}$/i.test(id || "")) return json(response, 400, { error: "Pedido invalido." });
  try {
    return json(response, 200, { results: await retryOrderNotifications(id) });
  } catch (error) {
    console.error("No fue posible reintentar las notificaciones.", { code: error.code });
    return json(response, 500, { error: "No fue posible reintentar las notificaciones." });
  }
}
