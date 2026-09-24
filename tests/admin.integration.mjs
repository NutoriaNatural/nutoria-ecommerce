import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { getDatabase, closeDatabase } from "../db/client.mjs";
import { createOrder } from "../lib/orders.mjs";
import { processVerifiedWompiEvent } from "../lib/wompi-events.mjs";
import { getOrderDetail, listOrders, updateFulfillmentStatus } from "../lib/admin-orders.mjs";

const database = getDatabase();
let orderId;
try {
  const created = await createOrder({
    idempotencyKey: `admin_test_${randomUUID()}`,
    requestedItems: [{ id: "producto-2-125g", quantity: 2 }],
    customerInput: {
      name: "Prueba Panel Preview", email: "admin-preview@example.com", phone: "3000000000",
      address: "Direccion de prueba", addressDetail: "Detalle", city: "Envigado", region: "Antioquia",
    },
  }, database);
  orderId = created.order.id;
  const transaction = {
    id: `admin-test-tx-${randomUUID()}`, reference: created.order.reference,
    status: "APPROVED", amount_in_cents: created.order.total * 100,
    currency: "COP", payment_method_type: "TEST",
  };
  const checksum = createHash("sha256").update(randomUUID()).digest("hex");
  const result = await processVerifiedWompiEvent({
    event: "transaction.updated", environment: "test", timestamp: Date.now(),
    data: { transaction }, signature: { checksum },
  }, database);
  assert.equal(result.newlyApproved, true);

  let detail = await getOrderDetail(orderId, database);
  assert.equal(detail.payment_status, "approved");
  assert.equal(detail.fulfillment_status, "ready_to_prepare");
  assert.deepEqual(detail.notifications.map((job) => job.channel), ["email", "whatsapp", "customer_email"]);

  await updateFulfillmentStatus({ id: orderId, status: "preparing", notes: "Prueba interna" }, database);
  await updateFulfillmentStatus({ id: orderId, status: "dispatched", notes: "Transportadora de prueba" }, database);
  await database.query(
    "DELETE FROM notification_jobs WHERE order_id = $1 AND notification_type = 'customer_dispatched'",
    [orderId],
  );
  const repaired = await updateFulfillmentStatus({
    id: orderId, status: "dispatched", notes: "Reconstruccion idempotente",
  }, database);
  assert.equal(repaired.customerNotificationQueued, true);
  await updateFulfillmentStatus({ id: orderId, status: "delivered", notes: "Entrega de prueba" }, database);
  detail = await getOrderDetail(orderId, database);
  assert.equal(detail.fulfillment_status, "delivered");
  assert.equal(detail.history.length, 5);
  assert.deepEqual(
    detail.notifications.filter((job) => job.channel === "customer_email").map((job) => job.notification_type),
    ["customer_order_confirmed", "customer_preparing", "customer_dispatched", "customer_delivered"],
  );
  const listed = await listOrders({ status: "delivered" }, database);
  assert.equal(listed.some((order) => order.id === orderId), true);
  console.log("Panel Preview: pedido, cola unica y seguimiento hasta entrega verificados.");
} finally {
  if (orderId) await database.query("DELETE FROM orders WHERE id = $1", [orderId]);
  await closeDatabase();
}
