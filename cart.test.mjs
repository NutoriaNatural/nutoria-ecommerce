import assert from "node:assert/strict";
import { Cart, calculateShipping, waitForPaymentStatus } from "./cart.mjs";

assert.equal(calculateShipping(0), 0);
assert.equal(calculateShipping(99999), 16000);
assert.equal(calculateShipping(100000), 12000);
assert.equal(calculateShipping(199999), 12000);
assert.equal(calculateShipping(200000), 8000);
assert.equal(calculateShipping(300000), 8000);
assert.equal(calculateShipping(300001), 0);

const cart = new Cart();

cart.add({ id: "a", name: "a", price: 1250 });
cart.add({ id: "b", name: "b", price: 2750 });
assert.deepEqual(cart.snapshot(), {
  items: [
    { id: "a", name: "a", price: 1250, quantity: 1 },
    { id: "b", name: "b", price: 2750, quantity: 1 },
  ],
  quantity: 2,
  subtotal: 4000,
  shipping: 16000,
  total: 20000,
});

cart.add({ id: "a", name: "a", price: 1250 });
cart.setQuantity("b", 3);
assert.equal(cart.snapshot().quantity, 5);
assert.equal(cart.snapshot().subtotal, 10750);
assert.equal(cart.snapshot().shipping, 16000);
assert.equal(cart.snapshot().total, 26750);

cart.remove("a");
assert.equal(cart.snapshot().quantity, 3);
assert.equal(cart.snapshot().subtotal, 8250);

cart.setQuantity("b", 0);
assert.deepEqual(cart.snapshot(), { items: [], quantity: 0, subtotal: 0, shipping: 0, total: 0 });

const statuses = ["PENDING", "PENDING", "APPROVED"];
let requests = 0;
const confirmed = await waitForPaymentStatus("transaction-test", {
  attempts: 3,
  delayMs: 0,
  request: async () => ({
    ok: true,
    json: async () => ({ id: "transaction-test", status: statuses[requests++] }),
  }),
  pause: async () => {},
});
assert.equal(confirmed.status, "APPROVED");
assert.equal(requests, 3);

console.log("Carrito: todas las operaciones funcionan correctamente.");
