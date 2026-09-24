import { getDatabase } from "../db/client.mjs";

export const fulfillmentStatuses = [
  "awaiting_payment",
  "ready_to_prepare",
  "preparing",
  "dispatched",
  "delivered",
  "cancelled",
];

const clean = (value, maximum) =>
  typeof value === "string" ? value.trim().slice(0, maximum) : "";

const customerNotificationByStatus = {
  preparing: "customer_preparing",
  dispatched: "customer_dispatched",
  delivered: "customer_delivered",
  cancelled: "customer_cancelled",
};

export async function listOrders({ status = "", limit = 100 } = {}, database = getDatabase()) {
  const filters = [];
  const parameters = [];
  if (status) {
    if (!fulfillmentStatuses.includes(status)) throw new TypeError("Estado invalido.");
    parameters.push(status);
    filters.push(`fulfillment_status = $${parameters.length}`);
  }
  parameters.push(Math.min(Math.max(Number(limit) || 100, 1), 200));
  const result = await database.query(
    `SELECT id, reference, order_status, payment_status, fulfillment_status,
            customer_name, customer_email, customer_phone, shipping_city, shipping_region,
            total_in_cents, currency, created_at, paid_at, dispatched_at, delivered_at
     FROM orders
     ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
     ORDER BY created_at DESC LIMIT $${parameters.length}`,
    parameters,
  );
  return result.rows;
}

export async function getOrderDetail(id, database = getDatabase()) {
  const orderResult = await database.query("SELECT * FROM orders WHERE id = $1", [id]);
  if (!orderResult.rowCount) return null;
  const [items, history, notifications] = await Promise.all([
    database.query("SELECT * FROM order_items WHERE order_id = $1 ORDER BY id", [id]),
    database.query(
      "SELECT fulfillment_status, notes, changed_by, created_at FROM order_status_history WHERE order_id = $1 ORDER BY created_at DESC",
      [id],
    ),
    database.query(
      `SELECT id, notification_type, channel, status, attempts, last_error, sent_at, updated_at
       FROM notification_jobs WHERE order_id = $1 ORDER BY id`,
      [id],
    ),
  ]);
  return { ...orderResult.rows[0], items: items.rows, history: history.rows, notifications: notifications.rows };
}

export async function updateFulfillmentStatus({ id, status, notes }, database = getDatabase()) {
  if (!fulfillmentStatuses.includes(status)) throw new TypeError("Estado invalido.");
  const safeNotes = clean(notes, 500);
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query("SELECT * FROM orders WHERE id = $1 FOR UPDATE", [id]);
    if (!current.rowCount) {
      await client.query("ROLLBACK");
      return null;
    }
    if (status === "cancelled" && current.rows[0].fulfillment_status === "delivered") {
      throw new TypeError("Un pedido entregado no se puede cancelar.");
    }
    if (status === "cancelled" && !safeNotes) {
      throw new TypeError("Debes indicar el motivo de la cancelacion en las notas internas.");
    }
    if (status !== "cancelled" && current.rows[0].payment_status !== "approved") {
      throw new TypeError("No puedes preparar o despachar un pedido que no esta pagado.");
    }
    const customerNotification = current.rows[0].payment_status === "approved"
      ? customerNotificationByStatus[status]
      : null;
    const updated = await client.query(
      `UPDATE orders SET fulfillment_status = $2, fulfillment_notes = $3,
         dispatched_at = CASE WHEN $2 = 'dispatched' THEN COALESCE(dispatched_at, CURRENT_TIMESTAMP) ELSE dispatched_at END,
         delivered_at = CASE WHEN $2 = 'delivered' THEN COALESCE(delivered_at, CURRENT_TIMESTAMP) ELSE delivered_at END,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, status, safeNotes],
    );
    await client.query(
      `INSERT INTO order_status_history (order_id, fulfillment_status, notes, changed_by)
       VALUES ($1, $2, $3, 'admin')`,
      [id, status, safeNotes],
    );
    if (customerNotification) {
      await client.query(
        `INSERT INTO notification_jobs (order_id, notification_type, channel)
         VALUES ($1, $2, 'customer_email')
         ON CONFLICT (order_id, notification_type, channel) DO NOTHING`,
        [id, customerNotification],
      );
    }
    await client.query("COMMIT");
    return { ...updated.rows[0], customerNotificationQueued: Boolean(customerNotification) };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
