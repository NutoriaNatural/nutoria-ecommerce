import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getDatabase } from "../db/client.mjs";
import { priceOrder } from "./order-pricing.mjs";

const clean = (value, maximum) =>
  typeof value === "string" ? value.trim().slice(0, maximum) : "";

export function validateCustomer(input) {
  const customer = {
    name: clean(input?.name, 100),
    email: clean(input?.email, 160).toLowerCase(),
    phone: clean(input?.phone, 20).replace(/\D/g, ""),
    address: clean(input?.address, 160),
    addressDetail: clean(input?.addressDetail, 160),
    city: clean(input?.city, 80),
    region: clean(input?.region, 80),
  };

  if (
    !customer.name ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) ||
    customer.phone.length < 7 ||
    !customer.address ||
    !customer.city ||
    !customer.region
  ) {
    throw new TypeError("Completa correctamente los datos de entrega.");
  }
  return customer;
}

const fingerprintFor = (priced, customer) =>
  createHash("sha256")
    .update(JSON.stringify({ items: priced.items, customer }), "utf8")
    .digest("hex");

const publicOrder = (order, items) => ({
  id: order.id,
  reference: order.reference,
  orderStatus: order.order_status,
  paymentStatus: order.payment_status,
  subtotal: Number(order.subtotal_in_cents) / 100,
  shipping: Number(order.shipping_in_cents) / 100,
  total: Number(order.total_in_cents) / 100,
  currency: order.currency,
  items: items.map((item) => ({
    id: item.product_id,
    name: [item.product_name, item.presentation].filter(Boolean).join(" "),
    presentation: item.presentation,
    price: Number(item.unit_price_in_cents) / 100,
    quantity: item.quantity,
  })),
});

export async function createOrder({ requestedItems, customerInput, idempotencyKey }, database = getDatabase()) {
  if (typeof idempotencyKey !== "string" || !/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey)) {
    throw new TypeError("La solicitud de pago no tiene una clave de idempotencia válida.");
  }

  const priced = priceOrder(requestedItems);
  const customer = validateCustomer(customerInput);
  const fingerprint = fingerprintFor(priced, customer);
  const client = await database.connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [idempotencyKey]);
    const existing = await client.query(
      "SELECT * FROM orders WHERE idempotency_key = $1 FOR UPDATE",
      [idempotencyKey],
    );

    if (existing.rowCount) {
      if (existing.rows[0].checkout_fingerprint !== fingerprint) {
        const error = new Error("La clave de idempotencia ya fue utilizada con otro pedido.");
        error.code = "IDEMPOTENCY_CONFLICT";
        throw error;
      }
      const existingItems = await client.query(
        "SELECT * FROM order_items WHERE order_id = $1 ORDER BY id",
        [existing.rows[0].id],
      );
      await client.query("COMMIT");
      return {
        order: publicOrder(existing.rows[0], existingItems.rows),
        customer: {
          name: existing.rows[0].customer_name,
          email: existing.rows[0].customer_email,
          phone: existing.rows[0].customer_phone,
          address: existing.rows[0].shipping_address,
          addressDetail: existing.rows[0].shipping_address_detail,
          city: existing.rows[0].shipping_city,
          region: existing.rows[0].shipping_region,
        },
        created: false,
      };
    }

    const id = randomUUID();
    const reference = `NUTORIA-${Date.now()}-${randomBytes(4).toString("hex")}`;
    const subtotalInCents = priced.subtotal * 100;
    const shippingInCents = priced.shipping * 100;
    const totalInCents = priced.total * 100;
    const inserted = await client.query(
      `INSERT INTO orders (
         id, idempotency_key, checkout_fingerprint, reference,
         customer_name, customer_email, customer_phone,
         shipping_address, shipping_address_detail, shipping_city, shipping_region,
         subtotal_in_cents, shipping_in_cents, total_in_cents
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        id, idempotencyKey, fingerprint, reference,
        customer.name, customer.email, customer.phone,
        customer.address, customer.addressDetail, customer.city, customer.region,
        subtotalInCents, shippingInCents, totalInCents,
      ],
    );

    const storedItems = [];
    for (const item of priced.items) {
      const result = await client.query(
        `INSERT INTO order_items (
           order_id, product_id, product_name, presentation,
           unit_price_in_cents, quantity, line_total_in_cents
         ) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          id, item.productId, item.name, item.presentation,
          item.price * 100, item.quantity, item.lineTotal * 100,
        ],
      );
      storedItems.push(result.rows[0]);
    }

    await client.query("COMMIT");
    return { order: publicOrder(inserted.rows[0], storedItems), customer, created: true };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function getOrderByTransactionId(transactionId, database = getDatabase()) {
  const result = await database.query(
    `SELECT id, reference, order_status, payment_status, total_in_cents,
            currency, wompi_transaction_id
     FROM orders WHERE wompi_transaction_id = $1`,
    [transactionId],
  );
  return result.rows[0] ?? null;
}
