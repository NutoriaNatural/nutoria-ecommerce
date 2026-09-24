import { getDatabase } from "../db/client.mjs";

const statusMap = {
  PENDING: { payment: "pending", order: "pending_payment" },
  APPROVED: { payment: "approved", order: "confirmed" },
  DECLINED: { payment: "declined", order: "cancelled" },
  VOIDED: { payment: "voided", order: "cancelled" },
  ERROR: { payment: "error", order: "cancelled" },
};

export function expectedWompiEnvironment(secret) {
  if (secret?.startsWith("prod_events_")) return "prod";
  if (secret?.startsWith("test_events_")) return "test";
  return null;
}

export async function processVerifiedWompiEvent(event, database = getDatabase()) {
  if (event?.event !== "transaction.updated") {
    return { accepted: true, processed: false, reason: "unsupported_event" };
  }

  const transaction = event.data?.transaction;
  const mapped = statusMap[transaction?.status];
  if (!transaction?.id || !transaction?.reference || !mapped) {
    return { accepted: true, processed: false, reason: "invalid_transaction" };
  }

  const checksum = event.signature?.checksum;
  if (typeof checksum !== "string" || !checksum) {
    throw new TypeError("El evento verificado no contiene checksum.");
  }

  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const insertedEvent = await client.query(
      `INSERT INTO payment_events (
         event_checksum, event_type, environment, wompi_transaction_id,
         reference, payment_status, amount_in_cents, currency, payload
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT DO NOTHING RETURNING id`,
      [
        checksum, event.event, event.environment, transaction.id,
        transaction.reference, mapped.payment, transaction.amount_in_cents,
        transaction.currency, event,
      ],
    );

    if (!insertedEvent.rowCount) {
      await client.query("COMMIT");
      return { accepted: true, processed: false, duplicate: true };
    }

    const eventId = insertedEvent.rows[0].id;
    const orderResult = await client.query(
      "SELECT * FROM orders WHERE reference = $1 FOR UPDATE",
      [transaction.reference],
    );

    if (!orderResult.rowCount) {
      await client.query(
        `UPDATE payment_events SET processing_error = $2, processed_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [eventId, "order_not_found"],
      );
      await client.query("COMMIT");
      return { accepted: true, processed: false, reason: "order_not_found" };
    }

    const order = orderResult.rows[0];
    const amountMatches = Number(order.total_in_cents) === Number(transaction.amount_in_cents);
    const currencyMatches = order.currency === transaction.currency;
    const transactionMatches =
      !order.wompi_transaction_id || order.wompi_transaction_id === transaction.id;

    if (!amountMatches || !currencyMatches || !transactionMatches) {
      const reason = !amountMatches
        ? "amount_mismatch"
        : !currencyMatches
          ? "currency_mismatch"
          : "transaction_mismatch";
      await client.query(
        `UPDATE payment_events
         SET order_id = $2, processing_error = $3, processed_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [eventId, order.id, reason],
      );
      await client.query("COMMIT");
      return { accepted: true, processed: false, reason };
    }

    const newlyApproved = mapped.payment === "approved" && order.payment_status !== "approved";
    const approvedIsTerminal = order.payment_status === "approved" && mapped.payment !== "approved";
    if (!approvedIsTerminal) {
      await client.query(
        `UPDATE orders SET
           payment_status = $2,
           order_status = $3,
           fulfillment_status = CASE
             WHEN $2 = 'approved' AND fulfillment_status = 'awaiting_payment' THEN 'ready_to_prepare'
             WHEN $2 IN ('declined', 'voided', 'error') AND fulfillment_status = 'awaiting_payment' THEN 'cancelled'
             ELSE fulfillment_status
           END,
           wompi_transaction_id = $4,
           wompi_payment_method_type = $5,
           wompi_status_updated_at = CURRENT_TIMESTAMP,
           paid_at = CASE WHEN $2 = 'approved' THEN COALESCE(paid_at, CURRENT_TIMESTAMP) ELSE paid_at END,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [order.id, mapped.payment, mapped.order, transaction.id, transaction.payment_method_type ?? null],
      );
    }

    if (newlyApproved) {
      await client.query(
        `INSERT INTO order_status_history (order_id, fulfillment_status, notes, changed_by)
         VALUES ($1, 'ready_to_prepare', 'Pago confirmado por Wompi.', 'wompi')`,
        [order.id],
      );
      await client.query(
        `INSERT INTO notification_jobs (order_id, notification_type, channel)
         VALUES ($1, 'payment_approved', 'email'),
                ($1, 'payment_approved', 'whatsapp'),
                ($1, 'customer_order_confirmed', 'customer_email')
         ON CONFLICT (order_id, notification_type, channel) DO NOTHING`,
        [order.id],
      );
    }

    await client.query(
      `UPDATE payment_events SET
         order_id = $2, processed = TRUE, processed_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [eventId, order.id],
    );
    await client.query("COMMIT");
    return {
      accepted: true,
      processed: !approvedIsTerminal,
      ignoredDowngrade: approvedIsTerminal,
      orderId: order.id,
      newlyApproved,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
