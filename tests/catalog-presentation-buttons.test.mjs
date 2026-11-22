import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { products, createProductCard } from "../product-catalog.mjs";
import { productOptions, selectedOptionIndex } from "../lib/product-presentation-options.mjs";
import { Cart } from "../cart.mjs";

test("tarjetas independientes conservan gramajes, selección inicial y variante comprada", () => {
  class Element {
    constructor(tag) { this.tag = tag; this.children = []; this.dataset = {}; this.attributes = {}; this.listeners = {}; }
    append(...nodes) { this.children.push(...nodes); }
    setAttribute(key, value) { this.attributes[key] = value; }
    addEventListener(key, fn) { this.listeners[key] = fn; }
    dispatchEvent(event) { this.lastEvent = event; }
    click() { this.listeners.click?.(); }
  }
  const savedDocument = globalThis.document;
  globalThis.document = { createElement: (tag) => new Element(tag) };
  const flatten = (node) => [node, ...node.children.flatMap(flatten)];
  try {
    for (const product of products) {
      const nodes = flatten(createProductCard(product));
      const buttons = nodes.filter((n) => n.className === "product-card__presentation-option");
      const options = productOptions(product);
      assert.equal(buttons.length, options.length > 1 ? options.length : 0, product.name);
      if (buttons.length) assert.equal(buttons[selectedOptionIndex(product)].attributes["aria-pressed"], "true", product.name);
      else assert.ok(nodes.some((n) => n.className?.includes("product-card__presentation-value")), product.name);
    }
    const product = products.find((p) => p.slug === "almendras");
    const first = flatten(createProductCard(product));
    const second = flatten(createProductCard(product));
    const choices = first.filter((n) => n.className === "product-card__presentation-option");
    assert.deepEqual(choices.map((n) => n.textContent), ["125 g", "250 g", "500 g", "1.000 g"]);
    choices[2].click();
    const add = first.find((n) => n.className === "product-card__button");
    assert.equal(add.dataset.productPresentation, "500 g");
    assert.equal(Number(add.dataset.productPrice), 39000);
    assert.ok(first.some((n) => n.textContent?.includes("39.000")));
    const untouched = second.find((n) => n.className === "product-card__button");
    assert.equal(untouched.dataset.productPresentation, "250 g");
    assert.equal(Number(untouched.dataset.productPrice), 20000);
    const group = first.find((n) => n.className?.includes("product-card__presentation--buttons"));
    assert.equal(group.lastEvent.type, "change");
    assert.equal(group.lastEvent.bubbles, true);
    const cart = new Cart();
    cart.add({ id: add.dataset.productId, name: add.dataset.productName, price: Number(add.dataset.productPrice), presentation: add.dataset.productPresentation });
    assert.equal(cart.snapshot().items[0].id, productOptions(product)[2].id);
    assert.equal(cart.snapshot().items[0].presentation, "500 g");
    assert.equal(cart.snapshot().total, 55000);
    console.log("Almendras 500 g: $39.000, carrito $55.000 con envío; otra tarjeta conserva 250 g y $20.000.");
  } finally {
    if (savedDocument === undefined) delete globalThis.document; else globalThis.document = savedDocument;
  }
});

test("los listados usan las mismas tarjetas y la fila de gramajes no recorta textos", () => {
  const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  for (const path of ["todos-los-productos/index.html", ...["frutos-secos-y-mas", "semillas", "deshidratados", "suplementos-y-alimentos-naturales"].map((s) => `categorias/${s}/index.html`)]) assert.ok(read(path).includes('src="product-catalog.mjs"'));
  const css = read("styles.css");
  assert.match(css, /\.product-card__presentation\.product-card__presentation--four\s*\{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\) minmax\(0, 1\.4fr\)/);
  assert.match(css, /\.product-card__presentation-option\s*\{[^}]*white-space: nowrap/);
  assert.match(css, /\.product-grid \.product-card__presentation-option\s*\{[^}]*height: 30px;[^}]*min-height: 0;[^}]*padding: 0 2px;/);
  assert.match(css, /\.product-grid \.product-card__presentation-option\s*\{[^}]*height: 28px;[^}]*min-height: 0;[^}]*padding: 0 2px;/);
  assert.match(css, /\.product-grid \.product-card__button\s*\{[^}]*height: 34px;[^}]*min-height: 0;[^}]*font-size: 1rem;/);
  assert.ok(!read("index.html").includes("typography.css"));
});
