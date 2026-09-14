import assert from "node:assert/strict";
import { Cart } from "./cart.mjs";

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
  total: 4000,
});

cart.add({ id: "a", name: "a", price: 1250 });
cart.setQuantity("b", 3);
assert.equal(cart.snapshot().quantity, 5);
assert.equal(cart.snapshot().subtotal, 10750);
assert.equal(cart.snapshot().total, 10750);

cart.remove("a");
assert.equal(cart.snapshot().quantity, 3);
assert.equal(cart.snapshot().subtotal, 8250);

cart.setQuantity("b", 0);
assert.deepEqual(cart.snapshot(), { items: [], quantity: 0, subtotal: 0, total: 0 });

console.log("Carrito: todas las operaciones funcionan correctamente.");
