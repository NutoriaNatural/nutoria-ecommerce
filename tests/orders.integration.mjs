import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { getDatabase, closeDatabase } from "../db/client.mjs";
import { createOrder } from "../lib/orders.mjs";
import { processVerifiedWompiEvent } from "../lib/wompi-events.mjs";

const database = getDatabase();
const createdOrderIds = [];
const customer = {
  name: "Prueba Preview",
  email: "preview@example.com",
  phone: "3000000000",
  address: "Dirección de prueba",
  addressDetail: "Complemento de prueba",
  city: "Envigado",
  region: "Antioquia",
};

const eventFor = (order, transactionId, status, amount = order.total * 100) => {
  const checksum = createHash("sha256")
    .update(`${order.reference}:${transactionId}:${status}:${amount}:${randomUUID()}`)
    .digest("hex");
  return {
    event: "transaction.updated",
    environment: "test",
    timestamp: Date.now(),
    data: {
      transaction: {
        id: transactionId,
        reference: order.reference,
        status,
        amount_in_cents: amount,
        currency: "COP",
        payment_method_type: "TEST",
      },
    },
    signature: { properties: ["transaction.id"], checksum },
  };
};

try {
  const idempotencyKey = `test_${randomUUID()}`;
  const first = await createOrder({
    requestedItems: [
      { id: "producto-2-125g", quantity: 2 },
      { id: "producto-3-125g", quantity: 1 },
    ],
    customerInput: customer,
    idempotencyKey,
  });
  createdOrderIds.push(first.order.id);
  assert.equal(first.created, true);
  assert.equal(first.order.items.length, 2);
  assert.equal(first.order.subtotal, 19500);
  assert.equal(first.order.shipping, 16000);
  assert.equal(first.order.total, 35500);

  const repeated = await createOrder({
    requestedItems: [
      { id: "producto-2-125g", quantity: 2 },
      { id: "producto-3-125g", quantity: 1 },
    ],
    customerInput: customer,
    idempotencyKey,
  });
  assert.equal(repeated.created, false);
  assert.equal(repeated.order.id, first.order.id);

  const transactionId = `test-tx-${randomUUID()}`;
  const pendingEvent = eventFor(first.order, transactionId, "PENDING");
  const pending = await processVerifiedWompiEvent(pendingEvent);
  assert.equal(pending.processed, true);

  const duplicate = await processVerifiedWompiEvent(pendingEvent);
  assert.equal(duplicate.duplicate, true);

  const approved = await processVerifiedWompiEvent(eventFor(first.order, transactionId, "APPROVED"));
  assert.equal(approved.processed, true);

  const downgrade = await processVerifiedWompiEvent(eventFor(first.order, transactionId, "DECLINED"));
  assert.equal(downgrade.ignoredDowngrade, true);

  const saved = await database.query("SELECT * FROM orders WHERE id = $1", [first.order.id]);
  assert.equal(saved.rows[0].payment_status, "approved");
  assert.equal(saved.rows[0].order_status, "confirmed");
  assert.equal(saved.rows[0].shipping_address_detail, "Complemento de prueba");

  const rejectedOrder = await createOrder({
    requestedItems: [{ id: "producto-2-125g", quantity: 1 }],
    customerInput: customer,
    idempotencyKey: `test_${randomUUID()}`,
  });
  createdOrderIds.push(rejectedOrder.order.id);
  await processVerifiedWompiEvent(
    eventFor(rejectedOrder.order, `test-tx-${randomUUID()}`, "DECLINED"),
  );
  const rejectedSaved = await database.query("SELECT * FROM orders WHERE id = $1", [rejectedOrder.order.id]);
  assert.equal(rejectedSaved.rows[0].payment_status, "declined");
  assert.equal(rejectedSaved.rows[0].order_status, "cancelled");

  const mismatchedOrder = await createOrder({
    requestedItems: [{ id: "producto-2-125g", quantity: 1 }],
    customerInput: customer,
    idempotencyKey: `test_${randomUUID()}`,
  });
  createdOrderIds.push(mismatchedOrder.order.id);
  const mismatchTransactionId = `test-tx-${randomUUID()}`;
  const mismatch = await processVerifiedWompiEvent(
    eventFor(mismatchedOrder.order, mismatchTransactionId, "APPROVED", 1),
  );
  assert.equal(mismatch.reason, "amount_mismatch");
  const mismatchSaved = await database.query("SELECT * FROM orders WHERE id = $1", [mismatchedOrder.order.id]);
  assert.equal(mismatchSaved.rows[0].payment_status, "pending");

  const corrected = await processVerifiedWompiEvent(
    eventFor(mismatchedOrder.order, mismatchTransactionId, "APPROVED"),
  );
  assert.equal(corrected.processed, true);
  const correctedSaved = await database.query("SELECT * FROM orders WHERE id = $1", [mismatchedOrder.order.id]);
  assert.equal(correctedSaved.rows[0].payment_status, "approved");

  console.log("Integración Preview: persistencia, idempotencia y estados correctos.");
} finally {
  if (createdOrderIds.length) {
    await database.query("DELETE FROM orders WHERE id = ANY($1::uuid[])", [createdOrderIds]);
  }
  await closeDatabase();
}
