import test from "node:test";
import assert from "node:assert/strict";
import { CUSTOMER_EMAIL_LINKS, customerOrderEmail } from "../lib/customer-email-template.mjs";

const order = {
  reference: "NUTORIA-PRUEBA-1",
  customer_name: "Cliente <Nutoria>",
  customer_email: "cliente@example.com",
  document_number: "DOCUMENTO-NO-DEBE-APARECER",
  shipping_address: "Carrera 1 # 2-3",
  shipping_address_detail: "Apto 4",
  shipping_city: "Envigado",
  shipping_region: "Antioquia",
  subtotal_in_cents: 1950000,
  shipping_in_cents: 1600000,
  total_in_cents: 3550000,
  items: [{
    product_name: "Producto de prueba",
    presentation: "125 g",
    unit_price_in_cents: 1950000,
    quantity: 1,
    line_total_in_cents: 1950000,
  }],
};

test("genera confirmacion factual para el cliente sin exponer el panel", () => {
  const email = customerOrderEmail(order, "customer_order_confirmed");
  assert.match(email.subject, /NUTORIA-PRUEBA-1/);
  assert.match(email.html, /Cliente &lt;Nutoria&gt;/);
  assert.match(email.html, /Producto de prueba/);
  assert.match(email.html, /125 g/);
  assert.match(email.html, /Cant\./);
  assert.match(email.html, /Precio/);
  assert.match(email.html, /Carrera 1 # 2-3/);
  assert.match(email.html, /Apto 4/);
  assert.match(email.html, /Envigado, Antioquia/);
  assert.match(email.html, /Seguimiento del pedido/);
  assert.ok(email.html.includes("¡Gracias por tu compra!"));
  assert.ok(email.html.includes("Recibimos correctamente la confirmación de tu pago y tu pedido quedó registrado."));
  assert.match(email.text, /Cantidad: 1/);
  assert.match(email.text, /Subtotal:/);
  assert.match(email.text, /Información de entrega/);
  assert.doesNotMatch(email.html, /\/admin\//);
  assert.doesNotMatch(email.text, /\/admin\//);
  assert.doesNotMatch(email.html, /DOCUMENTO-NO-DEBE-APARECER/);
  assert.doesNotMatch(email.text, /DOCUMENTO-NO-DEBE-APARECER/);
});

test("genera los seguimientos aprobados con la misma referencia", () => {
  const expected = {
    customer_preparing: ["Estamos preparando tu pedido", "Estamos organizando cuidadosamente tus productos para que todo llegue en excelentes condiciones."],
    customer_dispatched: ["¡Tu pedido ya va en camino!", "Tu pedido ha sido despachado y se encuentra en proceso de entrega."],
    customer_delivered: ["¡Tu pedido ha sido entregado!", "Gracias por elegir Nutoria. Esperamos que disfrutes tus productos."],
    customer_cancelled: ["Tu pedido ha sido cancelado", "no confirma una devolución, reversión ni reembolso"],
  };
  for (const [type, phrases] of Object.entries(expected)) {
    const email = customerOrderEmail(order, type);
    assert.match(email.subject, /NUTORIA-PRUEBA-1/);
    assert.match(email.html, /NUTORIA-PRUEBA-1/);
    assert.match(email.text, /NUTORIA-PRUEBA-1/);
    for (const phrase of phrases) {
      assert.ok(email.html.includes(phrase));
      assert.ok(email.text.includes(phrase));
    }
  }
});

test("muestra el progreso correcto y separa la cancelacion", () => {
  const preparing = customerOrderEmail(order, "customer_preparing");
  assert.match(preparing.html, /Confirmado/);
  assert.match(preparing.html, /En preparación/);
  assert.match(preparing.text, /Confirmado → En preparación/);

  const delivered = customerOrderEmail(order, "customer_delivered");
  assert.match(delivered.text, /Confirmado → En preparación → Despachado → Entregado/);

  const cancelled = customerOrderEmail(order, "customer_cancelled");
  assert.match(cancelled.html, /Estado: Cancelado/);
  assert.doesNotMatch(cancelled.html, /Seguimiento del pedido/);
  assert.doesNotMatch(cancelled.text, /Confirmado →/);
  assert.match(cancelled.text, /no confirma una devolución, reversión ni reembolso/);
});

test("usa exclusivamente los enlaces publicos oficiales de Nutoria", () => {
  const email = customerOrderEmail(order, "customer_order_confirmed");
  for (const url of Object.values(CUSTOMER_EMAIL_LINKS)) assert.match(email.html, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal(CUSTOMER_EMAIL_LINKS.logo, "https://nutoria.com.co/assets/images/logo-nutoria-180.png");
  assert.equal(CUSTOMER_EMAIL_LINKS.whatsapp, "https://wa.me/573117411563");
  assert.match(email.html, /alt="Sitio web"[^>]*>Sitio web/);
  assert.match(email.html, /alt="WhatsApp"[^>]*>WhatsApp/);
  assert.match(email.html, /alt="Instagram"[^>]*>Instagram/);
  assert.match(email.html, /alt="Facebook"[^>]*>Facebook/);
  assert.match(email.html, /class="email-logo"[^>]*width:110px;height:110px/);
  const publicResources = [...email.html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(publicResources.length > 0);
  assert.equal(publicResources.every((url) => Object.values(CUSTOMER_EMAIL_LINKS).includes(url)), true);
});

test("usa estructura compatible con clientes de correo comunes", () => {
  const email = customerOrderEmail(order, "customer_dispatched");
  assert.match(email.html, /role="presentation"/);
  assert.match(email.html, /style="[^"]+"/);
  assert.doesNotMatch(email.html, /<script|display:\s*(flex|grid)|position:\s*(fixed|absolute)/i);
  assert.match(email.html, /@media only screen and \(max-width:620px\)/);
});

test("omite el complemento cuando no existe y escapa contenido dinamico", () => {
  const unsafe = {
    ...order,
    customer_name: '<img src=x onerror="alert(1)">',
    shipping_address_detail: "",
    items: [{ ...order.items[0], product_name: "<script>malicioso</script>" }],
  };
  const email = customerOrderEmail(unsafe, "customer_order_confirmed");
  assert.doesNotMatch(email.html, /<script>malicioso<\/script>/);
  assert.doesNotMatch(email.html, /<img src=x/);
  assert.match(email.html, /&lt;script&gt;malicioso&lt;\/script&gt;/);
  assert.doesNotMatch(email.html, /Apto 4/);
});

test("rechaza tipos de correo al cliente no definidos", () => {
  assert.throws(() => customerOrderEmail(order, "otro"), /invalido/);
});

test("las notificaciones no incluyen el documento del cliente", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) =>
    readFile(new URL("../lib/notifications.mjs", import.meta.url), "utf8"));
  assert.doesNotMatch(source, /document_number|documentNumber|Número de documento/);
});
