import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { products } from "../data/products.mjs";
import { categories } from "../data/categories.mjs";
import { filterProducts } from "../product-catalog.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("cada filtro conserva exactamente las fichas de su categoría publicada", () => {
  for (const category of categories) {
    const html = execFileSync("git", ["show", `HEAD:${category.path.slice(1)}index.html`], { encoding: "utf8" });
    const links = [...html.matchAll(/href="(\/productos\/[^"#?]+\/)">/g)].map((match) => match[1]).sort();
    const filtered = filterProducts(products, { category: category.name }).map((product) => product.detailPath).sort();
    assert.deepEqual(links, filtered, category.name);
    console.log(`${category.name}: ${filtered.length}/${links.length} coinciden`);
  }
});
test("Home enlaza al catálogo completo sin duplicar su cuadrícula", () => {
  const home = read("index.html");
  assert.doesNotMatch(home, /data-product-grid|data-category-filters|data-product-count/);
  assert.equal((home.match(/href="\/todos-los-productos\/"/g) || []).length, 3);
  assert.equal((home.match(/class="choice-card choice-card--category"/g) || []).length, 4);
  const catalog = read("todos-los-productos/index.html");
  assert.match(catalog, /<h1 id="titulo-productos">Todos los productos<\/h1>/);
  for (const selector of ["data-product-grid", "data-category-filters", "data-product-count", "data-cart-open"]) assert.ok(catalog.includes(selector));
  assert.match(catalog, /<base href="\/"/);
});
test("buscador compartido conserva coincidencias parciales, mayúsculas y tildes", () => {
  assert.ok(filterProducts(products, { query: "MAGNESIO" }).length > 0);
  assert.deepEqual(filterProducts(products, { query: "colageno" }), filterProducts(products, { query: "COLÁGENO" }));
  assert.equal(filterProducts(products, { query: "" }).length, 74);
  assert.equal(filterProducts(products, { query: "zzzzsinproducto" }).length, 0);
});
