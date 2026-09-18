import { createHash } from "node:crypto";
import { createOrder } from "../../lib/orders.mjs";

const json = (response, status, body) => {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

export function paymentReturnUrl(environment = process.env) {
  if (environment.VERCEL_ENV === "preview" && environment.VERCEL_URL) {
    return `https://${environment.VERCEL_URL}/?payment=return`;
  }
  return `${environment.APP_BASE_URL || "https://nutoria.com.co"}/?payment=return`;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { error: "MÃ©todo no permitido." });
  }

  const publicKey = process.env.WOMPI_PUBLIC_KEY || process.env.WOMPI_PUBLIC_KEY_PROD;
  const integritySecret =
    process.env.WOMPI_INTEGRITY_SECRET ||
    process.env.WOMPI_INTEGRITY_SECRET_PROD ||
    process.env.WOMPI_INTEGRITY_KEY;
  if (!publicKey || !integritySecret) {
    return json(response, 503, { error: "El pago con Wompi aÃºn no estÃ¡ configurado." });
  }

  try {
    const { order, customer } = await createOrder({
      requestedItems: request.body?.items,
      customerInput: request.body?.customer,
      idempotencyKey: request.headers["idempotency-key"],
    });
    const amountInCents = order.total * 100;
    const signature = createHash("sha256")
      .update(`${order.reference}${amountInCents}${order.currency}${integritySecret}`, "utf8")
      .digest("hex");
    return json(response, 200, {
      checkoutUrl: "https://checkout.wompi.co/p/",
      reference: order.reference,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      items: order.items,
      parameters: {
        "public-key": publicKey,
        currency: order.currency,
        "amount-in-cents": String(amountInCents),
        reference: order.reference,
        "signature:integrity": signature,
        "redirect-url": paymentReturnUrl(),
        "customer-data:email": customer.email,
        "customer-data:full-name": customer.name,
        "customer-data:phone-number": String(customer.phone).replace(/\D/g, ""),
        "customer-data:phone-number-prefix": "+57",
        "shipping-address:address-line-1": [customer.address, customer.addressDetail]
          .filter(Boolean)
          .join(", "),
        "shipping-address:country": "CO",
        "shipping-address:phone-number": String(customer.phone).replace(/\D/g, ""),
        "shipping-address:city": customer.city,
        "shipping-address:region": customer.region,
        "shipping-address:name": customer.name,
      },
    });
  } catch (error) {
    if (error instanceof TypeError) return json(response, 400, { error: error.message });
    if (error.code === "IDEMPOTENCY_CONFLICT") return json(response, 409, { error: error.message });
    console.error("No fue posible crear el pedido.", { code: error.code });
    return json(response, 500, { error: "No fue posible crear el pedido antes del pago." });
  }
}
