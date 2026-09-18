import test from "node:test";
import assert from "node:assert/strict";
import { priceOrder, shippingFor } from "../lib/order-pricing.mjs";

test("calcula todos los rangos de envÃ­o en el servidor", () => {
  assert.equal(shippingFor(0), 0);
  assert.equal(shippingFor(99999), 16000);
  assert.equal(shippingFor(100000), 12000);
  assert.equal(shippingFor(199999), 12000);
  assert.equal(shippingFor(200000), 8000);
  assert.equal(shippingFor(300000), 8000);
  assert.equal(shippingFor(300001), 0);
});

test("ignora precios y nombres enviados por el navegador", () => {
  const result = priceOrder([{ id: "producto-2-125g", quantity: 2, price: 1, name: "Alterado" }]);
  assert.equal(result.items[0].name, "Ajonjoli Negro");
  assert.equal(result.items[0].presentation, "125g");
  assert.equal(result.items[0].price, 7000);
  assert.equal(result.subtotal, 14000);
  assert.equal(result.shipping, 16000);
  assert.equal(result.total, 30000);
});

test("rechaza productos y cantidades invÃ¡lidas", () => {
  assert.throws(() => priceOrder([{ id: "producto-inexistente", quantity: 1 }]));
  assert.throws(() => priceOrder([{ id: "producto-2-125g", quantity: 0 }]));
  assert.throws(() => priceOrder([{ id: "producto-2-125g", quantity: 101 }]));
});
