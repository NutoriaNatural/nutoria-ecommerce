import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/wompi/config.js";

const response = () => ({
  statusCode: 0,
  status(code) { this.statusCode = code; return this; },
  setHeader() { return this; },
  json(body) { this.body = body; return this; },
});

test("informa ambiente test sin exponer credenciales", () => {
  process.env.VERCEL_ENV = "preview";
  process.env.WOMPI_PUBLIC_KEY = " pub_test_secret-value ";
  process.env.WOMPI_INTEGRITY_SECRET = "test_integrity_secret-value\r\n";
  process.env.WOMPI_EVENTS_SECRET = " test_events_secret-value";
  const result = response();
  handler({ method: "GET" }, result);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.safeForTestPayments, true);
  assert.deepEqual(result.body.environments, {
    publicKey: "test",
    integrity: "test",
    events: "test",
  });
  assert.equal(JSON.stringify(result.body).includes("secret-value"), false);
  delete process.env.WOMPI_PUBLIC_KEY;
  delete process.env.WOMPI_INTEGRITY_SECRET;
  delete process.env.WOMPI_EVENTS_SECRET;
  delete process.env.VERCEL_ENV;
});

test("no publica el diagnóstico fuera de Preview", () => {
  process.env.VERCEL_ENV = "production";
  const result = response();
  handler({ method: "GET" }, result);
  assert.equal(result.statusCode, 404);
  delete process.env.VERCEL_ENV;
});
