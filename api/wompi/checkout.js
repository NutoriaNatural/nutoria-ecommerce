import { createHash, randomBytes } from "node:crypto";
import { products } from "../../product-catalog.mjs";

const json = (response, status, body) => {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

const productIndex = new Map(
  products.flatMap((product) =>
    product.variants.length
      ? product.variants.map((variant) => [
          `${product.id}-${variant.id}`,
          { name: `${product.name} ${variant.presentation}`, price: variant.price },
        ])
      : [[product.id, { name: product.name, price: product.price }]],
  ),
);

const shippingFor = (subtotal) => {
  if (subtotal < 100000) return 16000;
  if (subtotal < 200000) return 12000;
  if (subtotal <= 300000) return 8000;
  return 0;
};

const clean = (value, maximum = 160) =>
  typeof value === "string" ? value.trim().slice(0, maximum) : "";

export default function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { error: "Método no permitido." });
  }

  const publicKey = process.env.WOMPI_PUBLIC_KEY || process.env.WOMPI_PUBLIC_KEY_PROD;
  const integritySecret =
    process.env.WOMPI_INTEGRITY_SECRET ||
    process.env.WOMPI_INTEGRITY_SECRET_PROD ||
    process.env.WOMPI_INTEGRITY_KEY;

  if (!publicKey || !integritySecret) {
    return json(response, 503, { error: "El pago con Wompi aún no está configurado." });
  }

  const items = request.body?.items;
  if (!Array.isArray(items) || !items.length) {
    return json(response, 400, { error: "El carrito está vacío." });
  }

  let subtotal = 0;
  const verifiedItems = [];
  for (const requestedItem of items) {
    const product = productIndex.get(requestedItem?.id);
    const quantity = Number(requestedItem?.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1) {
      return json(response, 400, { error: "El carrito contiene un producto inválido." });
    }
    subtotal += product.price * quantity;
    verifiedItems.push({ id: requestedItem.id, name: product.name, price: product.price, quantity });
  }

  const customer = {
    name: clean(request.body?.customer?.name, 100),
    email: clean(request.body?.customer?.email, 160),
    phone: clean(request.body?.customer?.phone, 20).replace(/\D/g, ""),
    address: clean(request.body?.customer?.address, 160),
    city: clean(request.body?.customer?.city, 80),
    region: clean(request.body?.customer?.region, 80),
  };

  if (
    !customer.name ||
    !customer.email.includes("@") ||
    customer.phone.length < 7 ||
    !customer.address ||
    !customer.city ||
    !customer.region
  ) {
    return json(response, 400, { error: "Completa correctamente los datos de entrega." });
  }

  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;
  const amountInCents = total * 100;
  const reference = `NUTORIA-${Date.now()}-${randomBytes(4).toString("hex")}`;
  const currency = "COP";
  const signature = createHash("sha256")
    .update(`${reference}${amountInCents}${currency}${integritySecret}`, "utf8")
    .digest("hex");

  return json(response, 200, {
    checkoutUrl: "https://checkout.wompi.co/p/",
    reference,
    subtotal,
    shipping,
    total,
    items: verifiedItems,
    parameters: {
      "public-key": publicKey,
      currency,
      "amount-in-cents": String(amountInCents),
      reference,
      "signature:integrity": signature,
      "redirect-url": "https://nutoria.com.co/?payment=return",
      "customer-data:email": customer.email,
      "customer-data:full-name": customer.name,
      "customer-data:phone-number": customer.phone,
      "customer-data:phone-number-prefix": "+57",
      "shipping-address:address-line-1": customer.address,
      "shipping-address:country": "CO",
      "shipping-address:phone-number": customer.phone,
      "shipping-address:city": customer.city,
      "shipping-address:region": customer.region,
      "shipping-address:name": customer.name,
    },
  });
}
