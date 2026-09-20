import { getDatabase } from "../db/client.mjs";

const money = (cents) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
    .format(Number(cents) / 100);

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta configurar ${name}.`);
  return value;
};

const requestJson = async (url, options) => {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(12_000) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`El proveedor respondio ${response.status}.`);
  return body;
};

const orderSummaryHtml = (order) => {
  const items = order.items.map((item) =>
    `<li>${escapeHtml(item.product_name)} ${escapeHtml(item.presentation)} x ${item.quantity} - ${money(item.line_total_in_cents)}</li>`,
  ).join("");
  return `
    <h1>Nuevo pedido pagado</h1>
    <p><strong>Referencia:</strong> ${escapeHtml(order.reference)}</p>
    <p><strong>Cliente:</strong> ${escapeHtml(order.customer_name)}</p>
    <p><strong>Telefono:</strong> ${escapeHtml(order.customer_phone)}</p>
    <p><strong>Correo:</strong> ${escapeHtml(order.customer_email)}</p>
    <p><strong>Entrega:</strong> ${escapeHtml(order.shipping_address)}${order.shipping_address_detail ? `, ${escapeHtml(order.shipping_address_detail)}` : ""}, ${escapeHtml(order.shipping_city)}, ${escapeHtml(order.shipping_region)}</p>
    <ul>${items}</ul>
    <p><strong>Subtotal:</strong> ${money(order.subtotal_in_cents)}</p>
    <p><strong>Envio:</strong> ${money(order.shipping_in_cents)}</p>
    <p><strong>Total pagado:</strong> ${money(order.total_in_cents)}</p>
    <p><a href="https://nutoria.com.co/admin/">Abrir panel de pedidos</a></p>`;
};

async function sendEmail(order, job) {
  const apiKey = required("RESEND_API_KEY");
  const to = required("ORDER_NOTIFICATION_EMAIL");
  const from = required("ORDER_FROM_EMAIL");
  const result = await requestJson("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `order/${order.id}/${job.notification_type}/${job.channel}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Pedido pagado ${order.reference}`,
      html: orderSummaryHtml(order),
    }),
  });
  return result.id || null;
}

async function sendWhatsApp(order) {
  const token = required("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = required("WHATSAPP_PHONE_NUMBER_ID");
  const to = required("ORDER_NOTIFICATION_WHATSAPP").replace(/\D/g, "");
  const template = required("WHATSAPP_ORDER_TEMPLATE");
  const version = required("WHATSAPP_GRAPH_VERSION");
  const language = required("WHATSAPP_TEMPLATE_LANGUAGE");
  const result = await requestJson(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template,
        language: { code: language },
        components: [{
          type: "body",
          parameters: [
            { type: "text", text: order.reference },
            { type: "text", text: order.customer_name },
            { type: "text", text: money(order.total_in_cents) },
            { type: "text", text: `${order.shipping_city}, ${order.shipping_region}` },
          ],
        }],
      },
    }),
  });
  return result.messages?.[0]?.id || null;
}

async function loadNotificationOrder(orderId, database) {
  const order = await database.query("SELECT * FROM orders WHERE id = $1", [orderId]);
  if (!order.rowCount) throw new Error("Pedido no encontrado.");
  const items = await database.query("SELECT * FROM order_items WHERE order_id = $1 ORDER BY id", [orderId]);
  return { ...order.rows[0], items: items.rows };
}

async function claimJob(id, database) {
  const result = await database.query(
    `UPDATE notification_jobs SET status = 'processing', attempts = attempts + 1,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status IN ('pending', 'failed') AND attempts < 5
     RETURNING *`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function dispatchOrderNotifications(orderId, database = getDatabase()) {
  const pending = await database.query(
    `SELECT id FROM notification_jobs
     WHERE order_id = $1 AND status IN ('pending', 'failed') AND attempts < 5
       AND next_attempt_at <= CURRENT_TIMESTAMP ORDER BY id`,
    [orderId],
  );
  if (!pending.rowCount) return [];
  const order = await loadNotificationOrder(orderId, database);
  const results = [];
  for (const row of pending.rows) {
    const job = await claimJob(row.id, database);
    if (!job) continue;
    try {
      const providerId = job.channel === "email" ? await sendEmail(order, job) : await sendWhatsApp(order);
      await database.query(
        `UPDATE notification_jobs SET status = 'sent', provider_message_id = $2,
           last_error = NULL, sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [job.id, providerId],
      );
      results.push({ channel: job.channel, sent: true });
    } catch (error) {
      const message = String(error?.message || "Error de notificacion").slice(0, 300);
      await database.query(
        `UPDATE notification_jobs SET status = 'failed', last_error = $2,
           next_attempt_at = CURRENT_TIMESTAMP + (INTERVAL '5 minutes' * attempts),
           updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [job.id, message],
      );
      results.push({ channel: job.channel, sent: false });
    }
  }
  return results;
}

export async function retryOrderNotifications(orderId, database = getDatabase()) {
  await database.query(
    `UPDATE notification_jobs SET status = 'pending', next_attempt_at = CURRENT_TIMESTAMP,
       last_error = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE order_id = $1 AND status = 'failed' AND attempts < 5`,
    [orderId],
  );
  return dispatchOrderNotifications(orderId, database);
}
