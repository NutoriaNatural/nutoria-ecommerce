import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("el catálogo móvil usa dos columnas sin alterar los breakpoints superiores", () => {
  const css = read("styles.css");
  assert.match(css, /\.product-grid\s*{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.product-card__name\s*{[^}]*-webkit-line-clamp:\s*2/s);
  assert.match(css, /@media\s*\(min-width:\s*1024px\)[\s\S]*?\.product-grid\s*{[^}]*repeat\(4,/s);
  assert.doesNotMatch(css, /\.product-grid\s*{[^}]*min-width:\s*[4-9]\d{2}px/s);
});

test("las tarjetas móviles priorizan compra y conservan objetivos táctiles", () => {
  const css = read("styles.css");
  const catalog = read("product-catalog.mjs");
  assert.match(catalog, /button\.textContent = "Agregar"/);
  assert.match(css, /\.product-card__button\s*{[^}]*min-height:\s*48px/s);
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.product-card__details,[\s\S]*?\.product-card__whatsapp\s*{\s*display:\s*none/s);
  assert.match(css, /\.product-card__image\s*{[^}]*aspect-ratio:\s*1\s*\/\s*1/s);
  assert.match(css, /\.product-card__image img\s*{[^}]*object-fit:\s*cover/s);
});

test("agregar actualiza el carrito, confirma visualmente y no abre el checkout", () => {
  const cart = read("cart.mjs");
  const handler = cart.match(/document\.querySelectorAll\("\.product-card__button\[data-product-id\]"\)[\s\S]*?checkoutForm\.addEventListener/)?.[0] || "";
  assert.match(handler, /cart\.add\(/);
  assert.match(handler, /persist\(\)/);
  assert.match(handler, /render\(\)/);
  assert.match(handler, /button\.textContent = "Agregado ✓"/);
  assert.match(handler, /button\.textContent = "Agregar"/);
  assert.doesNotMatch(handler, /dialog\.showModal\(/);
  assert.doesNotMatch(handler, /\/api\/wompi\/checkout/);
});
