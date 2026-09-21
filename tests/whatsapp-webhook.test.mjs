import test from "node:test";
import assert from "node:assert/strict";
import handler, { verifyMetaWebhook } from "../api/whatsapp/webhook.js";

const response = () => ({
  statusCode: 200,
  headers: {},
  status(code) { this.statusCode = code; return this; },
  setHeader(name, value) { this.headers[name] = value; return this; },
  end(value) { this.body = value; return this; },
});

test("valida el token y devuelve el challenge de Meta", () => {
  const query = {
    "hub.mode": "subscribe",
    "hub.verify_token": "token-seguro-de-prueba",
    "hub.challenge": "123456789",
  };
  assert.equal(verifyMetaWebhook(query, "token-seguro-de-prueba"), true);
  assert.equal(verifyMetaWebhook(query, "token-incorrecto"), false);

  const previous = process.env.WHATSAPP_VERIFY_TOKEN;
  process.env.WHATSAPP_VERIFY_TOKEN = "token-seguro-de-prueba";
  const result = response();
  handler({ method: "GET", query }, result);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body, "123456789");
  assert.match(result.headers["Content-Type"], /^text\/plain/);
  if (previous === undefined) delete process.env.WHATSAPP_VERIFY_TOKEN;
  else process.env.WHATSAPP_VERIFY_TOKEN = previous;
});

test("rechaza verificaciones incorrectas y acepta POST sin procesarlo", () => {
  const previous = process.env.WHATSAPP_VERIFY_TOKEN;
  process.env.WHATSAPP_VERIFY_TOKEN = "token-seguro-de-prueba";
  const rejected = response();
  handler({
    method: "GET",
    query: { "hub.mode": "subscribe", "hub.verify_token": "otro", "hub.challenge": "1" },
  }, rejected);
  assert.equal(rejected.statusCode, 403);

  const received = response();
  handler({ method: "POST", query: {}, body: { object: "whatsapp_business_account" } }, received);
  assert.equal(received.statusCode, 200);
  assert.deepEqual(JSON.parse(received.body), { received: true, processed: false });
  if (previous === undefined) delete process.env.WHATSAPP_VERIFY_TOKEN;
  else process.env.WHATSAPP_VERIFY_TOKEN = previous;
});
