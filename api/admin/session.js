import {
  adminAuthConfigured, adminCookie, clearAdminCookie, createAdminSession,
  isAdminRequest, verifyAdminPassword,
} from "../../lib/admin-auth.mjs";

const json = (response, status, body) => {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

export default function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method === "GET") {
    return json(response, 200, { authenticated: isAdminRequest(request), configured: adminAuthConfigured() });
  }
  if (request.method === "POST") {
    if (!adminAuthConfigured()) return json(response, 503, { error: "Panel no configurado." });
    if (!verifyAdminPassword(request.body?.password)) return json(response, 401, { error: "Contrasena incorrecta." });
    response.setHeader("Set-Cookie", adminCookie(createAdminSession()));
    return json(response, 200, { authenticated: true });
  }
  if (request.method === "DELETE") {
    response.setHeader("Set-Cookie", clearAdminCookie());
    return json(response, 200, { authenticated: false });
  }
  response.setHeader("Allow", "GET, POST, DELETE");
  return json(response, 405, { error: "Metodo no permitido." });
}
