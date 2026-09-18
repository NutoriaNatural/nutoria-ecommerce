import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import checkoutHandler from "../api/wompi/checkout.js";
import eventsHandler from "../api/wompi/events.js";
import transactionHandler from "../api/wompi/transaction.js";
import { getDatabase, closeDatabase } from "../db/client.mjs";

process.env.WOMPI_PUBLIC_KEY = "pub_test_preview";
process.env.WOMPI_INTEGRITY_SECRET = "test_integrity_preview";
process.env.WOMPI_EVENTS_SECRET = "test_events_preview";

const response = () => ({
  statusCode: 200,
  headers: {},
  status(code) { this.statusCode = code; return this; },
  setHeader(name, value) { this.headers[name] = value; return this; },
  end(value) { this.body = value ? JSON.parse(value) : null; return this; },
});

const database = getDatabase();
let orderId;

try {
  const idempotencyKey = `api_test_${randomUUID()}`;
  const checkoutRequest = {
    method: "POST",
    headers: { "idempotency-key": idempotencyKey },
    body: {
      items: [{ id: "producto-2-125g", quantity: 2, price: 1 }],
      customer: {
        name: "Prueba API Preview",
        email: "api-preview@example.com",
        phone: "3000000000",
        address: "DirecciÃ³n de prueba",
        addressDetail: "Detalle de prueba",
        city: "Envigado",
        region: "Antioquia",
      },
    },
  };
  const checkoutResponse = response();
  await checkoutHandler(checkoutRequest, checkoutResponse);
  assert.equal(checkoutResponse.statusCode, 200);
  assert.equal(checkoutResponse.body.total, 30000);
  assert.equal(checkoutResponse.body.parameters["amount-in-cents"], "3000000");

  const stored = await database.query("SELECT * FROM orders WHERE reference = $1", [checkoutResponse.body.reference]);
  assert.equal(stored.rowCount, 1);
  orderId = stored.rows[0].id;
  assert.equal(stored.rows[0].shipping_address_detail, "Detalle de prueba");

  const repeatedResponse = response();
  await checkoutHandler(checkoutRequest, repeatedResponse);
  assert.equal(repeatedResponse.body.reference, checkoutResponse.body.reference);
  const count = await database.query("SELECT COUNT(*)::int AS count FROM orders WHERE idempotency_key = $1", [idempotencyKey]);
  assert.equal(count.rows[0].count, 1);

  const transactionId = `api-test-tx-${randomUUID()}`;
  const transaction = {
    id: transactionId,
    reference: checkoutResponse.body.reference,
    status: "APPROVED",
    amount_in_cents: 3000000,
    currency: "COP",
    payment_method_type: "TEST",
  };
  const timestamp = Date.now();
  const checksum = createHash("sha256")
    .update(`${transaction.id}${transaction.status}${transaction.amount_in_cents}${timestamp}${process.env.WOMPI_EVENTS_SECRET}`)
    .digest("hex");
  const event = {
    event: "transaction.updated",
    environment: "test",
    timestamp,
    data: { transaction },
    signature: {
      properties: ["transaction.id", "transaction.status", "transaction.amount_in_cents"],
      checksum,
    },
  };
  const eventRequest = { method: "POST", headers: { "x-event-checksum": checksum }, body: event };
  const eventResponse = response();
  await eventsHandler(eventRequest, eventResponse);
  assert.equal(eventResponse.statusCode, 200);
  assert.equal(eventResponse.body.processed, true);

  const duplicateResponse = response();
  await eventsHandler(eventRequest, duplicateResponse);
  assert.equal(duplicateResponse.body.duplicate, true);

  const statusResponse = response();
  await transactionHandler({ method: "GET", query: { id: transactionId } }, statusResponse);
  assert.equal(statusResponse.statusCode, 200);
  assert.equal(statusResponse.body.status, "APPROVED");
  assert.equal(statusResponse.body.orderStatus, "confirmed");

  console.log("API Preview: checkout persistido, webhook firmado y estado confirmado correctamente.");
} finally {
  if (orderId) await database.query("DELETE FROM orders WHERE id = $1", [orderId]);
  delete process.env.WOMPI_PUBLIC_KEY;
  delete process.env.WOMPI_INTEGRITY_SECRET;
  delete process.env.WOMPI_EVENTS_SECRET;
  await closeDatabase();
}
