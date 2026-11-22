import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { products } from "../data/products.mjs";
import { productOptions, selectedOptionIndex } from "../lib/product-presentation-options.mjs";
import { renderProductBody } from "../lib/product-page-template.mjs";
import { initializeProductDetail } from "../product-detail.mjs";
import { Cart } from "../cart.mjs";

test("las 74 fichas representan sus opciones reales y usan 250 g cuando existe", () => {
  for (const product of products) {
    const options = productOptions(product);
    const html = renderProductBody(product);
    const buttons = [...html.matchAll(/data-presentation-index="(\d+)" aria-pressed="(true|false)"/g)];
    assert.equal(buttons.length, options.length > 1 ? options.length : 0);
    if (options.length > 1) assert.deepEqual(buttons.filter((b) => b[2] === "true").map((b) => Number(b[1])), [selectedOptionIndex(product)]);
    else assert.match(html, /class="product-presentation__single"/);
    const preferred = options.findIndex((o) => o.presentation === "250g");
    if (preferred >= 0) assert.equal(selectedOptionIndex(product), preferred);
    assert.ok(html.indexOf("data-product-presentation") < html.indexOf("data-product-price"));
    assert.ok(!html.includes("<select"));
  }
  const base = { id: "future", presentation: "500g", variants: [{ id: "125g", presentation: "125g", price: 10 }, { id: "500g", presentation: "500g", price: 20 }] };
  assert.equal(selectedOptionIndex(base), 1);
  assert.equal(selectedOptionIndex({ ...base, presentation: "invalid" }), 0);
});

test("selección de 500 g actualiza precio y añade la cantidad elegida al mismo carrito", () => {
  class Element {
    constructor() { this.children = []; this.childNodes = []; this.dataset = {}; this.listeners = {}; this.attributes = {}; }
    append(node) { this.children.push(node); }
    replaceChildren(...nodes) { this.children = nodes; }
    setAttribute(key, value) { this.attributes[key] = value; }
    querySelectorAll() { return this.children.filter((node) => node.type === "button"); }
    addEventListener(key, callback) { (this.listeners[key] ||= []).push(callback); }
    click() { for (const callback of this.listeners.click || []) callback(); this.bubble?.(); }
  }
  const product = products.find((p) => p.slug === "almendras");
  const nodes = Object.fromEntries(["main-image", "thumbnails", "presentation", "price", "add", "quantity", "quantity-decrease", "quantity-increase"].map((key) => [`[data-product-${key}]`, new Element()]));
  const root = { querySelector: (key) => nodes[key] };
  const savedDocument = globalThis.document;
  const savedObserver = globalThis.MutationObserver;
  globalThis.document = { querySelector: () => root, createElement: () => new Element() };
  globalThis.MutationObserver = class { observe() {} };
  try {
    assert.equal(initializeProductDetail(product), true);
    const buttons = nodes["[data-product-presentation]"].children;
    assert.deepEqual(buttons.map((b) => b.textContent), ["125 g", "250 g", "500 g", "1.000 g"]);
    assert.equal(buttons[1].attributes["aria-pressed"], "true");
    buttons[2].click();
    assert.equal(buttons[2].attributes["aria-pressed"], "true");
    assert.equal(buttons[1].attributes["aria-pressed"], "false");
    assert.match(nodes["[data-product-price]"].textContent, /39.000/);
    nodes["[data-product-quantity-increase]"].click();
    const cart = new Cart();
    const add = nodes["[data-product-add]"];
    add.bubble = () => cart.add({ id: add.dataset.productId, name: add.dataset.productName, presentation: add.dataset.productPresentation, price: Number(add.dataset.productPrice) });
    add.click();
    const state = cart.snapshot();
    assert.equal(state.items[0].presentation, "500 g");
    assert.equal(state.items[0].price, 39000);
    assert.equal(state.items[0].quantity, 2);
    assert.equal(state.total, 94000);
    const single = products.find((p) => p.slug === "colageno-marino");
    initializeProductDetail(single);
    assert.equal(nodes["[data-product-presentation]"].children.length, 1);
    assert.equal(nodes["[data-product-presentation]"].children[0].className, "product-presentation__single");
    console.log("Almendras 500 g × 2: subtotal $78.000 + envío $16.000 = $94.000; presentación única 1.000 g correcta.");
  } finally {
    if (savedDocument === undefined) delete globalThis.document; else globalThis.document = savedDocument;
    if (savedObserver === undefined) delete globalThis.MutationObserver; else globalThis.MutationObserver = savedObserver;
  }
});

test("los cuatro gramajes tienen una sola fila sin truncamiento y sin tipografía pausada", () => {
  const css = readFileSync(new URL("../product-detail.css", import.meta.url), "utf8");
  assert.match(css, /\.product-presentation--four\s*\{[^}]*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.product-presentation__option\s*\{[^}]*white-space: nowrap/);
  const html = readFileSync(new URL("../productos/almendras/index.html", import.meta.url), "utf8");
  assert.ok(!html.includes("typography.css"));
});
