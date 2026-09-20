import test from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_COOKIE, adminAuthConfigured, createAdminSession, isAdminRequest,
  verifyAdminPassword, verifyAdminSession,
} from "../lib/admin-auth.mjs";

const previousPassword = process.env.ADMIN_PASSWORD;
const previousSecret = process.env.ADMIN_SESSION_SECRET;
process.env.ADMIN_PASSWORD = "una-clave-segura-de-prueba";
process.env.ADMIN_SESSION_SECRET = "secreto-de-sesion-de-prueba-con-mas-de-32-caracteres";

test("protege el panel con contrasena y sesion firmada", () => {
  assert.equal(adminAuthConfigured(), true);
  assert.equal(verifyAdminPassword("incorrecta"), false);
  assert.equal(verifyAdminPassword(process.env.ADMIN_PASSWORD), true);
  const token = createAdminSession(1_700_000_000_000);
  assert.equal(verifyAdminSession(token, 1_700_000_001_000), true);
  assert.equal(verifyAdminSession(`${token}alterado`, 1_700_000_001_000), false);
  assert.equal(verifyAdminSession(token, 1_700_100_000_000), false);
  const currentToken = createAdminSession();
  assert.equal(isAdminRequest({ headers: { cookie: `${ADMIN_COOKIE}=${encodeURIComponent(currentToken)}` } }), true);
});

test.after(() => {
  if (previousPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = previousPassword;
  if (previousSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = previousSecret;
});
