import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { products, filterProducts } from "../product-catalog.mjs";
import { productOptions, selectedOptionIndex } from "../lib/product-presentation-options.mjs";
import { renderStaticCatalogCard } from "../lib/catalog-static-cards.mjs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("el HTML inicial ofrece enlaces normales a las 74 fichas, incluido 7 Colágeno", () => {
  const html = read("todos-los-productos/index.html").replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "").replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/g, "");
  const links = new Set([...html.matchAll(/<a\b[^>]*href="(\/productos\/[^"?#]+\/)"/g)].map((match) => match[1]));
  assert.equal(links.size, 74);
  assert.deepEqual([...links], products.map(({ detailPath }) => detailPath));
  assert.ok(links.has("/productos/7-colagenos/"));
  assert.equal((html.match(/<article class="product-card"/g) || []).length, 74);
  assert.ok(html.includes(products.map(renderStaticCatalogCard).join("\n")));
});

test("las tarjetas iniciales usan exactamente las variantes y precios vigentes", () => {
  for (const product of products) {
    const html = renderStaticCatalogCard(product);
    const options = productOptions(product);
    const selected = options[selectedOptionIndex(product)];
    assert.ok(html.includes(`data-static-product-id="${selected.id}"`), product.id);
    assert.ok(!html.includes('data-product-id="'), "La compra y analítica se activan solo con la tarjeta interactiva.");
    assert.ok(html.includes(`data-product-price="${selected.price}"`), product.id);
    assert.equal((html.match(/class="product-card__presentation-option"/g) || []).length, options.length > 1 ? options.length : 0);
    assert.equal((html.match(/aria-pressed="true"/g) || []).length, options.length > 1 ? 1 : 0);
  }
  const almond = products.find(({ slug }) => slug === "almendras");
  assert.equal(filterProducts(products, { category: "Semillas" }).length, 10);
  assert.ok(renderStaticCatalogCard({ ...almond, name: '<script>"&' }).includes('&lt;script&gt;&quot;&amp;'));
});
