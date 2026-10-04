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
const catalogUpdateSlugs = [
  "albaricoques", "almendras", "arandanos", "avellanas", "banano-con-cobertura-al-60-cacao",
  "brevas-meladas", "cafe-con-cobertura-60-cacao", "chia", "ciruelas-pasas", "colageno-hidrolizado",
  "datiles", "habas-con-miel-mostaza", "habas-con-queso", "habas-con-sal", "habas-saladas",
  "macadamia", "maiz-con-chile", "maiz-con-miel-mostaza", "maiz-con-queso", "mani-con-sal",
  "mani-horneado", "maranon", "mix-mani-y-pasas", "lentejas-tostadas", "mix-especial",
  "mix-rojos-deshidratado", "mix-nuts", "mix-premium", "mix-saludable", "nuez-nogal",
  "pina-deshidratada", "semillas-de-calabaza", "mix-mani-confitado-y-pasas", "mix-combinado",
  "semillas-de-girasol", "uchuvas-con-cobertura-al-60-cacao", "maiz-salado",
  "avena-en-hojuelas-sin-gluten", "almendras-con-cobertura-al-60-cacao", "gelatina-sin-sabor",
  "nibs-de-cacao", "garbanzo-tostados", "harina-de-almendras", "amaranto",
  "avellanas-con-cobertura-al-60-cacao", "almendra-laminada", "uvas-pasas", "pistachos",
  "nuez-pecana", "nuez-del-brasil", "mix-tropical-deshidratado", "mani-confitado",
  "mango-deshidratado", "macadamia-acaramelada", "coco-laminado-deshidratado", "coco-acaramelado",
];

test("las diez fichas autorizadas usan cinco imágenes nuevas en orden", () => {
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

test("las 56 carpetas nuevas alimentan catálogo y ficha reutilizable", () => {
  assert.equal(catalogUpdateSlugs.length, 56);
  assert.equal([...productBySlug.values()].filter(({ detailPath }) => detailPath).length, 72);
  for (const slug of catalogUpdateSlugs) {
    const product = productBySlug.get(slug);
    assert.ok(product, slug);
    assert.equal(product.detailPath, `/productos/${slug}/`);
    assert.equal(product.image, product.images[0]);
    assert.ok(product.images.length >= 1, slug);
    product.images.forEach((image) => {
      assert.equal(existsSync(new URL(`..${image}`, import.meta.url)), true, image);
    });
    const html = read(`productos/${slug}/index.html`);
    assert.match(html, new RegExp(`data-product-slug="${slug}"`));
    assert.match(html, /src="\/product-page\.mjs"/);
  }
});

test("los seis productos existentes conservan IDs y precios y reciben ficha e imagen nuevas", () => {
  const expected = {
    quinua: "Quinua",
    "flor-de-jamaica": "Flor de Jamaica",
    "semillas-de-amapola": "Amapola",
    ajonjoli: "Ajonjolí Natural",
    "ajonjoli-negro": "Ajonjolí Negro",
    "ajonjoli-tostado": "Ajonjolí Tostado",
  };
  Object.entries(expected).forEach(([slug, name]) => {
    const product = productBySlug.get(slug);
    assert.equal(product.id, slug);
    assert.equal(product.name, name);
    assert.equal(product.image, `/assets/images/products/${slug}/01.webp`);
    assert.equal(product.detailPath, `/productos/${slug}/`);
    assert.equal(existsSync(new URL(`..${product.image}`, import.meta.url)), true);
    assert.match(read(`productos/${slug}/index.html`), new RegExp(`data-product-slug="${slug}"`));
    const priced = priceOrder([{ id: `${slug}-${product.variants[0].id}`, quantity: 1 }]);
    assert.equal(priced.items[0].price, product.variants[0].price);
  });
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
  assert.match(page, /data-product-composition/);
  assert.match(page, /initializeProductDetail\(slug\)/);
  assert.match(detail, /product\.images\.forEach/);
  assert.match(detail, /name\.textContent = product\.name/);
  assert.match(detail, /category\.textContent = product\.category/);
  assert.match(detail, /product\.composition\.forEach/);
});

test("imagen y nombre enlazan las fichas existentes y Agregar sigue directo", () => {
  assert.equal(productBySlug.get("almendras").detailPath, "/productos/almendras/");
  assert.equal(productBySlug.get("ajonjoli").detailPath, "/productos/ajonjoli/");
  assert.equal([...productBySlug.values()].filter(({ detailPath }) => detailPath).length, 72);
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
  assert.equal(productBySlug.get("7-colagenos").name, "7 Colágeno");
  assert.equal(productBySlug.get("7-colagenos").price, 89900);
});

test("las fichas seleccionan 250 g por defecto sin alterar productos de presentación única", () => {
  const detail = read("product-detail.mjs");
  assert.match(detail, /if \(product\.variants\.length\)/);
  assert.match(detail, /findIndex\(\(\{ presentation: value \}\) => value === "250g"\)/);
  assert.match(detail, /presentation\.value = String\(defaultVariantIndex\)/);
});

test("la galería es responsive y conserva las imágenes completas", () => {
  const css = read("product-detail.css");
  assert.match(css, /\.product-gallery__main img\s*{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.product-gallery__thumbnails\s*{[^}]*overflow-x:\s*auto[^}]*scroll-snap-type:\s*inline proximity/s);
  assert.match(css, /@media\s*\(min-width:\s*800px\)[\s\S]*?\.product-detail\s*{[^}]*grid-template-columns:/s);
  assert.match(css, /@media\s*\(max-width:\s*799px\)/);
});

test("la composición de los Mix usa separadores uniformes y salto flexible", () => {
  const css = read("product-detail.css");
  assert.match(css, /\.product-purchase__composition ul\s*{[^}]*display:\s*flex[^}]*flex-wrap:\s*wrap[^}]*list-style:\s*none/s);
  assert.match(css, /\.product-purchase__composition li\s*{[^}]*display:\s*inline-flex/s);
  assert.match(css, /\.product-purchase__composition li \+ li::before\s*{[^}]*content:\s*"·"/s);
});
