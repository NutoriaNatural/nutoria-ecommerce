import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Cart, waitForPaymentStatus } from "../cart.mjs";
import { products } from "../data/products.mjs";
import { reconcileOrderItems } from "../lib/order-pricing.mjs";
import { validateCustomer } from "../lib/orders.mjs";
import { retryOrderNotifications } from "../lib/notifications.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const customer = {
  name: "Ana María",
  email: "ana@example.com",
  phone: "3001234567",
  documentNumber: "1234567",
  address: "Calle 10 # 20-30",
  addressDetail: "",
  city: "Cali",
  region: "Valle del Cauca",
};

const purchasable = products.find((product) => product.variants.length > 0);
const variant = purchasable.variants.find(({ presentation }) => presentation === "250g") || purchasable.variants[0];
const productId = `${purchasable.id}-${variant.id}`;

test("reconcilia un precio antiguo con la fuente autoritativa sin perder cantidad", () => {
  const result = reconcileOrderItems([{ id: productId, quantity: 2, price: 1 }]);
  assert.equal(result.invalidItemIds.length, 0);
  assert.equal(result.items[0].price, variant.price);
  assert.equal(result.items[0].presentation, variant.presentation);
  assert.equal(result.items[0].quantity, 2);

  const cart = new Cart([{ id: productId, name: purchasable.name, price: 1, quantity: 2 }]);
  cart.replace(result.items);
  assert.equal(cart.snapshot().subtotal, variant.price * 2);
});

test("separa referencias inválidas y conserva las referencias vigentes", () => {
  const result = reconcileOrderItems([
    { id: "producto-inexistente-250g", quantity: 1 },
    { id: productId, quantity: 1 },
  ]);
  assert.deepEqual(result.invalidItemIds, ["producto-inexistente-250g"]);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].id, productId);
  assert.equal(result.total, result.subtotal + result.shipping);
});

test("el checkout reconcilia antes de crear el pedido y exige una segunda confirmación si cambió", () => {
  const source = read("cart.mjs");
  const submit = source.slice(source.indexOf('checkoutForm.addEventListener("submit"'));
  assert.ok(submit.indexOf("await reconcileCart") < submit.indexOf('fetch("/api/wompi/checkout"'));
  assert.match(source, /if \(!reconciliation\.ready \|\| reconciliation\.changed\)/);
  assert.match(source, /Retiramos del carrito productos o presentaciones/);
  assert.match(source, /Actualizamos el carrito con los precios y presentaciones vigentes/);
});

test("mantiene la protección de doble envío mediante botón e idempotencia", () => {
  const source = read("cart.mjs");
  assert.match(source, /checkoutInFlight = true/);
  assert.match(source, /checkoutButton\.disabled = state\.items\.length === 0 \|\| checkoutBlocked \|\| checkoutInFlight/);
  assert.match(source, /sessionStorage\.getItem\(CHECKOUT_KEY\)/);
  assert.match(source, /"Idempotency-Key": idempotencyKey/);
});

test("valida textos de entrega con mínimos prudentes y admite datos colombianos", () => {
  assert.deepEqual(validateCustomer(customer), customer);
  for (const patch of [
    { name: "A" },
    { address: "123" },
    { city: "X" },
    { region: "Y" },
    { address: "Calle\u0000 10" },
  ]) {
    assert.throws(() => validateCustomer({ ...customer, ...patch }), /Completa correctamente/);
  }
  assert.doesNotThrow(() => validateCustomer({ ...customer, name: "Li", city: "La", region: "Huila" }));
});

test("recupera processing antiguo pero nunca selecciona trabajos enviados", async () => {
  const queries = [];
  const database = {
    async query(sql) {
      queries.push(sql);
      return { rowCount: 0, rows: [] };
    },
  };
  await retryOrderNotifications("order-1", database);
  assert.match(queries[0], /status = 'processing'/);
  assert.match(queries[0], /INTERVAL '15 minutes'/);
  assert.doesNotMatch(queries.join("\n"), /status\s*=\s*'sent'/);
  assert.match(queries[1], /status IN \('pending', 'failed'\)/);
});

test("la consulta distingue PENDING, DECLINED y APPROVED", async () => {
  const statuses = ["PENDING", "DECLINED", "APPROVED"];
  let index = 0;
  const result = await waitForPaymentStatus("tx-test", {
    attempts: 3,
    delayMs: 0,
    pause: async () => {},
    request: async () => ({ ok: true, json: async () => ({ id: "tx-test", status: statuses[index++] }) }),
  });
  assert.equal(result.status, "DECLINED");

  const approved = await waitForPaymentStatus("tx-approved", {
    request: async () => ({ ok: true, json: async () => ({ id: "tx-approved", status: "APPROVED" }) }),
  });
  assert.equal(approved.status, "APPROVED");
});
