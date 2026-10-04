import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatPresentation, products } from "../product-catalog.mjs";

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
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.product-card__button\s*{[^}]*min-height:\s*44px/s);
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.product-card__details\s*{\s*display:\s*none/s);
  assert.match(css, /\.product-card__image\s*{[^}]*aspect-ratio:\s*1\s*\/\s*1/s);
  assert.match(css, /\.product-card__image img\s*{[^}]*object-fit:\s*cover/s);
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.product-card__image\s*{[^}]*aspect-ratio:\s*4\s*\/\s*3/s);
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.product-card__image img\s*{[^}]*object-fit:\s*contain/s);
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.product-card__label\s*{[^}]*display:\s*none/s);
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.product-card__presentation,\s*\.product-card__presentation-value\s*{[^}]*min-height:\s*40px/s);
  assert.match(catalog, /product-card__value product-card__presentation-value/);
});

test("uniforma el área de presentación y normaliza solo su texto visible", () => {
  const catalogSource = read("product-catalog.mjs");
  assert.equal(formatPresentation("1.000g"), "1.000 g");
  assert.equal(formatPresentation("500g"), "500 g");
  assert.equal(formatPresentation("90g (90 und)"), "90 g (90 und)");
  assert.equal(formatPresentation("250 g"), "250 g");
  assert.equal(products.find((product) => product.variants.length)?.variants[0].presentation, "125g");
  assert.match(catalogSource, /findIndex\(\(\{ presentation \}\) => presentation === "250g"\)/);
  assert.match(catalogSource, /presentationValue\.value = String\(defaultVariantIndex\)/);
});

test("solo conserva el WhatsApp flotante general en móvil y desktop", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const whatsapp = read("whatsapp.mjs");
  const catalog = read("product-catalog.mjs");
  assert.match(html, /class="whatsapp-help"[^>]*data-whatsapp-general/);
  assert.match(html, /aria-label="Contactar por WhatsApp"/);
  assert.match(html, /class="whatsapp-help__icon"[^>]*aria-hidden="true"/);
  assert.doesNotMatch(html, />\s*WhatsApp\s*<\/a>/);
  assert.doesNotMatch(catalog, /product-card__whatsapp|createProductWhatsAppUrl/);
  assert.doesNotMatch(css, /\.product-card__whatsapp/);
  assert.match(css, /\.whatsapp-help\s*{[^}]*width:\s*56px[^}]*height:\s*56px[^}]*border-radius:\s*50%/s);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.whatsapp-help\s*{[^}]*width:\s*54px[^}]*height:\s*54px/s);
  assert.match(whatsapp, /document\.querySelector\("\[data-whatsapp-general\]"\)/);
  assert.match(whatsapp, /573117411563/);
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
