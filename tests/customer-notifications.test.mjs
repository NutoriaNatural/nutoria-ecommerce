import test from "node:test";
import assert from "node:assert/strict";
import { customerOrderEmail } from "../lib/notifications.mjs";

const order = {
  reference: "NUTORIA-PRUEBA-1",
  customer_name: "Cliente <Nutoria>",
  customer_email: "cliente@example.com",
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
    quantity: 1,
    line_total_in_cents: 1950000,
  }],
};

test("genera confirmacion factual para el cliente sin exponer el panel", () => {
  const email = customerOrderEmail(order, "customer_order_confirmed");
  assert.match(email.subject, /NUTORIA-PRUEBA-1/);
  assert.match(email.html, /Cliente &lt;Nutoria&gt;/);
  assert.match(email.html, /Producto de prueba 125 g x 1/);
  assert.match(email.html, /Carrera 1 # 2-3, Apto 4, Envigado, Antioquia/);
  assert.doesNotMatch(email.html, /\/admin\//);
});

test("genera los seguimientos aprobados con la misma referencia", () => {
  for (const type of ["customer_preparing", "customer_dispatched", "customer_delivered", "customer_cancelled"]) {
    const email = customerOrderEmail(order, type);
    assert.match(email.subject, /NUTORIA-PRUEBA-1/);
    assert.match(email.html, /NUTORIA-PRUEBA-1/);
  }
});

test("rechaza tipos de correo al cliente no definidos", () => {
  assert.throws(() => customerOrderEmail(order, "otro"), /invalido/);
});
