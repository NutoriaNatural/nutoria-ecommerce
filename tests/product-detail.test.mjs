import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { productBySlug } from "../data/products.mjs";
import { priceOrder } from "../lib/order-pricing.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const detailSlugs = [
  "7-colagenos",
  "calcio-coral-marino",
  "coffe-colageno",
  "colageno-marino",
  "maca-negra-roja-shihua-y-amarilla",
  "mix-golden",
  "proteina-whey",
  "resveratrol",
  "sales-de-magnesio-mg2",
  "te-chai",
];

test("las diez fichas autorizadas usan cinco imágenes nuevas en orden", () => {
  const detailed = [...productBySlug.values()].filter(({ detailPath }) => detailPath);
  assert.deepEqual(detailed.map(({ slug }) => slug).sort(), [...detailSlugs].sort());
  for (const slug of detailSlugs) {
    const product = productBySlug.get(slug);
    assert.equal(product.detailPath, `/productos/${slug}/`);
    assert.equal(product.images.length, 5, slug);
    assert.equal(product.image, product.images[0]);
    product.images.forEach((image, index) => {
      assert.match(image, new RegExp(`/assets/images/products/${slug}/0${index + 1}\\.(?:webp|jpeg)$`));
      assert.equal(existsSync(new URL(`..${image}`, import.meta.url)), true, image);
    });
  }
});

test("cada URL directa carga la plantilla común mediante rutas absolutas", () => {
  for (const slug of detailSlugs) {
    const html = read(`productos/${slug}/index.html`);
    assert.match(html, new RegExp(`data-product-slug="${slug}"`));
    assert.match(html, /src="\/product-page\.mjs"/);
    assert.match(html, /href="\/styles\.css"/);
    assert.match(html, /href="\/product-detail\.css"/);
    assert.doesNotMatch(html, /Beneficios principales|Ingredientes destacados|Información técnica|Modo de uso/);
  }
});

test("la estructura reutilizable renderiza galería y datos reales sin duplicarlos en HTML", () => {
  const page = read("product-page.mjs");
  const detail = read("product-detail.mjs");
  assert.match(page, /productBySlug\.get\(slug\)/);
  assert.match(page, /data-product-main-image/);
  assert.match(page, /data-product-thumbnails/);
  assert.match(page, /data-product-presentation/);
  assert.match(page, /data-product-price/);
  assert.match(page, /data-product-add/);
  assert.match(page, /initializeProductDetail\(slug\)/);
  assert.match(detail, /product\.images\.forEach/);
  assert.match(detail, /name\.textContent = product\.name/);
  assert.match(detail, /category\.textContent = product\.category/);
});

test("imagen y nombre enlazan solo las fichas existentes y Agregar sigue directo", () => {
  assert.equal(productBySlug.get("almendras").detailPath, "");
  const catalog = read("product-catalog.mjs");
  assert.match(catalog, /imageLink\.href = product\.detailPath/);
  assert.match(catalog, /nameLink\.href = product\.detailPath/);
  assert.match(catalog, /body\.append\(button\)/);
});

test("todas las fichas reutilizan el mismo carrito, badge, persistencia y checkout", () => {
  const page = read("product-page.mjs");
  const detail = read("product-detail.mjs");
  const cart = read("cart.mjs");
  assert.equal((page.match(/id=\"cart-dialog\"/g) || []).length, 1);
  assert.equal((page.match(/data-cart-open/g) || []).length, 2);
  assert.equal((page.match(/data-cart-count/g) || []).length, 2);
  assert.match(page, /data-whatsapp-general/);
  assert.match(page, /await import\("\.\/cart\.mjs"\)/);
  assert.match(page, /await import\("\.\/whatsapp\.mjs"\)/);
  assert.match(detail, /addButton\.dataset\.productId = selected\.id/);
  assert.match(detail, /addButton\.dataset\.productPrice = String\(selected\.price\)/);
  assert.match(cart, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(cart, /fetch\("\/api\/wompi\/checkout"/);
  assert.match(cart, /items: state\.items\.map\(\(\{ id, quantity \}\) => \(\{ id, quantity \}\)\)/);
});

test("precios y presentaciones oficiales continúan en la validación server-side", () => {
  for (const slug of detailSlugs) {
    const product = productBySlug.get(slug);
    if (!Number.isInteger(product.price) || product.price <= 0) continue;
    const priced = priceOrder([{ id: product.id, quantity: 1 }]);
    assert.equal(priced.items[0].presentation, product.presentation, slug);
    assert.equal(priced.items[0].price, product.price, slug);
  }
  assert.equal(productBySlug.get("7-colagenos").price, null);
});

test("la galería es responsive y conserva las imágenes completas", () => {
  const css = read("product-detail.css");
  assert.match(css, /\.product-gallery__main img\s*{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.product-gallery__thumbnails\s*{[^}]*overflow-x:\s*auto[^}]*scroll-snap-type:\s*inline proximity/s);
  assert.match(css, /@media\s*\(min-width:\s*800px\)[\s\S]*?\.product-detail\s*{[^}]*grid-template-columns:/s);
  assert.match(css, /@media\s*\(max-width:\s*799px\)/);
});
