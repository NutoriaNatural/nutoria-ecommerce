import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { products } from "../data/products.mjs";
import { createProductCard } from "../product-catalog.mjs";
import { Cart } from "../cart.mjs";
import { reconcileOrderItems } from "../lib/order-pricing.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("la tipografía compartida está presente en Home, catálogo, cuatro categorías y 74 fichas", () => {
  const paths = ["index.html", "todos-los-productos/index.html", ...products.map((p) => `${p.detailPath.slice(1)}index.html`), ...["frutos-secos-y-mas", "semillas", "deshidratados", "suplementos-y-alimentos-naturales"].map((s) => `categorias/${s}/index.html`)];
  for (const path of paths) assert.equal((read(path).match(/href="\/typography.css"/g) || []).length, 1, path);
  for (const product of products) assert.ok(read(`${product.detailPath.slice(1)}index.html`).includes("<span>Agregar al carrito</span>"));
});

test("cambiar Almendras a 500 g conserva precio, variante y total del resumen sin crear pedidos", () => {
  class Element {
    constructor(tag) { this.tagName = tag; this.children = []; this.dataset = {}; this.handlers = {}; }
    append(...nodes) { this.children.push(...nodes); }
    setAttribute(name, value) { this[name] = value; }
    addEventListener(name, callback) { this.handlers[name] = callback; }
  }
  const previousDocument = globalThis.document;
  globalThis.document = { createElement: (tag) => new Element(tag) };
  try {
    const product = products.find((p) => p.slug === "almendras");
    const card = createProductCard(product);
    const nodes = [];
    const walk = (node) => { nodes.push(node); node.children.forEach(walk); };
    walk(card);
    const selector = nodes.find((node) => node.tagName === "select");
    const button = nodes.find((node) => node.tagName === "button");
    selector.value = String(product.variants.findIndex((v) => v.presentation === "500g"));
    selector.handlers.change();
    assert.equal(Number(button.dataset.productPrice), 39000);
    assert.equal(button.dataset.productPresentation, "500 g");
    assert.ok(nodes.find((node) => node.className === "product-card__value" && node.textContent.includes("39.000")));
    const cart = new Cart();
    cart.add({ id: button.dataset.productId, name: button.dataset.productName, price: Number(button.dataset.productPrice), presentation: button.dataset.productPresentation });
    assert.deepEqual({ subtotal: cart.snapshot().subtotal, shipping: cart.snapshot().shipping, total: cart.snapshot().total }, { subtotal: 39000, shipping: 16000, total: 55000 });
    assert.equal(reconcileOrderItems([{ id: button.dataset.productId, quantity: 1 }]).items[0].price, 39000);
    console.log("Almendras 500 g: $39.000 + envío $16.000 = total $55.000. Sin red, pedidos ni pagos.");
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
