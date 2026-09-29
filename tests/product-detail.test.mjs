import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { productBySlug } from "../data/products.mjs";
import { priceOrder } from "../lib/order-pricing.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Colágeno Marino usa en orden las cinco imágenes WEBP y reemplaza la imagen del catálogo", () => {
  const product = productBySlug.get("colageno-marino");
  assert.ok(product);
  assert.deepEqual(product.images, [
    "/assets/images/products/colageno-marino/01.webp",
    "/assets/images/products/colageno-marino/02.webp",
    "/assets/images/products/colageno-marino/03.webp",
    "/assets/images/products/colageno-marino/04.webp",
    "/assets/images/products/colageno-marino/05.webp",
  ]);
  assert.equal(product.image, product.images[0]);
  product.images.forEach((image) => {
    assert.equal(existsSync(new URL(`..${image}`, import.meta.url)), true, image);
  });
});

test("la ficha directa usa rutas absolutas y no inventa contenido", () => {
  const html = read("productos/colageno-marino/index.html");
  assert.match(html, /data-product-detail/);
  assert.match(html, /src="\/product-detail\.mjs"/);
  assert.match(html, /src="\/cart\.mjs"/);
  assert.match(html, /src="\/whatsapp\.mjs"/);
  assert.match(html, /href="\/styles\.css"/);
  assert.match(html, /data-product-main-image/);
  assert.match(html, /data-product-thumbnails/);
  assert.match(html, /data-product-presentation/);
  assert.match(html, /data-product-price/);
  assert.match(html, /data-product-add/);
  assert.doesNotMatch(html, /Beneficios principales|Ingredientes destacados|Información técnica|Modo de uso/);
});

test("la ficha reutiliza el carrito, badge, persistencia y checkout existentes", () => {
  const html = read("productos/colageno-marino/index.html");
  const detail = read("product-detail.mjs");
  const cart = read("cart.mjs");
  assert.equal((html.match(/id="cart-dialog"/g) || []).length, 1);
  assert.equal((html.match(/data-cart-open/g) || []).length, 2);
  assert.equal((html.match(/data-cart-count/g) || []).length, 2);
  assert.match(html, /data-whatsapp-general/);
  assert.match(detail, /addButton\.dataset\.productId = selected\.id/);
  assert.match(detail, /addButton\.dataset\.productPrice = String\(selected\.price\)/);
  assert.match(cart, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(cart, /fetch\("\/api\/wompi\/checkout"/);
  assert.match(cart, /items: state\.items\.map\(\(\{ id, quantity \}\) => \(\{ id, quantity \}\)\)/);
});

test("la presentación y precio oficial de Colágeno Marino permanecen intactos", () => {
  const product = productBySlug.get("colageno-marino");
  assert.equal(product.presentation, "1.000g");
  assert.equal(product.price, 89900);
  const priced = priceOrder([{ id: "colageno-marino", quantity: 1 }]);
  assert.equal(priced.items[0].presentation, "1.000g");
  assert.equal(priced.items[0].price, 89900);
});

test("la galería es responsive y conserva las imágenes completas", () => {
  const css = read("product-detail.css");
  assert.match(css, /\.product-gallery__main img\s*{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.product-gallery__thumbnails\s*{[^}]*overflow-x:\s*auto[^}]*scroll-snap-type:\s*inline proximity/s);
  assert.match(css, /@media\s*\(min-width:\s*800px\)[\s\S]*?\.product-detail\s*{[^}]*grid-template-columns:/s);
  assert.match(css, /@media\s*\(max-width:\s*799px\)/);
});
