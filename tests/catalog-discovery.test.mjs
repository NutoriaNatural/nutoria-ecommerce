import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PRODUCT_CATEGORIES,
  filterProducts,
  normalizeSearchText,
  products,
} from "../product-catalog.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("clasifica los 47 productos en las cuatro categorías aprobadas", () => {
  assert.deepEqual(PRODUCT_CATEGORIES, [
    "Frutos secos, semillas y granos",
    "Deshidratados",
    "Alimentos naturales",
    "Suplementos",
  ]);
  assert.equal(products.length, 47);
  assert.deepEqual(
    Object.fromEntries(PRODUCT_CATEGORIES.map((category) => [
      category,
      products.filter((product) => product.category === category).length,
    ])),
    {
      "Frutos secos, semillas y granos": 20,
      Deshidratados: 12,
      "Alimentos naturales": 7,
      Suplementos: 8,
    },
  );
  assert.equal(products.find(({ name }) => name === "Avena en Hojuelas sin Gluten")?.category, "Alimentos naturales");
  assert.equal(products.find(({ name }) => name === "Harina de Almendras")?.category, "Alimentos naturales");
  assert.equal(products.find(({ name }) => name === "Flor de Jamaica")?.category, "Alimentos naturales");
});

test("busca por nombre sin distinguir mayúsculas ni acentos", () => {
  assert.equal(normalizeSearchText("  COLÁGENO  "), "colageno");
  assert.equal(filterProducts(products, { query: "colageno" }).length, 4);
  assert.equal(filterProducts(products, { query: "COLÁGENO" }).length, 4);
  assert.equal(filterProducts(products, { query: "maca" })[0]?.name, "Maca Negra, Roja, Shihua Y Amarilla");
  assert.equal(filterProducts(products, { query: "almendra" }).length, 3);
});

test("combina categoría y búsqueda y permite volver a Todos", () => {
  assert.equal(filterProducts(products, { category: "Todos" }).length, 47);
  assert.equal(filterProducts(products, { category: "Frutos secos, semillas y granos" }).length, 20);
  assert.equal(filterProducts(products, { category: "Deshidratados" }).length, 12);
  assert.equal(filterProducts(products, { category: "Alimentos naturales" }).length, 7);
  assert.equal(filterProducts(products, { category: "Suplementos" }).length, 8);
  assert.equal(filterProducts(products, { category: "Suplementos", query: "colageno" }).length, 4);
  assert.deepEqual(filterProducts(products, { category: "Deshidratados", query: "colageno" }), []);
});

test("la interfaz cuenta resultados, muestra estado vacío y restablece filtros", () => {
  const html = read("index.html");
  const catalog = read("product-catalog.mjs");
  assert.match(html, /<input type="search"[^>]*placeholder="Buscar productos\.\.\."[^>]*data-product-search/);
  assert.match(html, /data-category-filters[^>]*role="group"[^>]*aria-label="Filtrar por categoría"/);
  assert.match(html, /data-product-count[^>]*aria-live="polite"/);
  assert.match(html, /No encontramos productos con esa búsqueda\./);
  assert.match(html, /data-catalog-clear>Restablecer búsqueda y filtros/);
  assert.match(html, /<h2 id="titulo-productos">Nuestros productos<\/h2>/);
  assert.doesNotMatch(html, /Compra según lo que necesitas|id="necesidades"/);
  assert.match(catalog, /resultCount\.textContent = `\$\{count\} \$\{count === 1 \? "producto" : "productos"\}`/);
  assert.match(catalog, /emptyState\.hidden = count > 0/);
  assert.match(catalog, /searchInput\.value = ""/);
  assert.match(catalog, /selectCategory\("Todos"\)/);
});

test("las cuatro tarjetas visuales reutilizan los filtros y desplazan al catálogo", () => {
  const html = read("index.html");
  const catalog = read("product-catalog.mjs");
  const categoryCards = html.match(/data-catalog-category="[^"]+"/g) || [];
  assert.equal(categoryCards.length, 4);
  PRODUCT_CATEGORIES.forEach((category) => {
    assert.ok(categoryCards.includes(`data-catalog-category="${category}"`));
  });
  assert.doesNotMatch(html, /data-catalog-category="Frutos secos"/);
  assert.doesNotMatch(html, /data-catalog-category="Semillas"/);
  assert.match(html, /<h2 id="titulo-categorias">Categorías principales<\/h2>/);
  assert.match(catalog, /featuredCategoryLinks\.forEach/);
  assert.match(catalog, /selectCategory\(link\.dataset\.catalogCategory\)/);
  assert.match(catalog, /scrollIntoView\(\{ behavior: "smooth", block: "start" \}\)/);
});

test("filtra las tarjetas existentes sin duplicar catálogo ni romper Agregar", () => {
  const catalog = read("product-catalog.mjs");
  const cart = read("cart.mjs");
  assert.match(catalog, /const cards = products\.map\(createProductCard\)/);
  assert.match(catalog, /cards\.forEach\(\(card, index\) => \{ card\.hidden = !matches\.has\(products\[index\]\.id\); \}\)/);
  assert.equal((catalog.match(/grid\.replaceChildren/g) || []).length, 1);
  assert.match(cart, /document\.querySelectorAll\("\.product-card__button\[data-product-id\]"\)/);
  assert.match(cart, /cart\.add\(/);
  assert.match(cart, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(cart, /fetch\("\/api\/wompi\/checkout"/);
});

test("mantiene dos columnas móviles y contiene el desplazamiento en las categorías", () => {
  const css = read("styles.css");
  const desktopCss = css.split("@media (max-width: 719px)")[0];
  assert.match(css, /\.product-grid\s*{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /\.catalog-categories\s*{[^}]*max-width:\s*100%[^}]*overflow-x:\s*auto[^}]*overscroll-behavior-inline:\s*contain/s);
  assert.match(css, /\.catalog-categories\s*{[^}]*scrollbar-width:\s*none/s);
  assert.match(css, /\.catalog-categories::\-webkit-scrollbar\s*{[^}]*display:\s*none/s);
  assert.match(css, /\.catalog-category\s*{[^}]*min-height:\s*44px[^}]*white-space:\s*nowrap/s);
  assert.match(css, /\.catalog-category\[aria-pressed="true"\]/);
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.choice-grid--categories\s*{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /\.choice-grid--categories \.choice-card\s*{[^}]*height:\s*100%[^}]*justify-content:\s*flex-start/s);
  assert.match(css, /\.choice-grid--categories \.choice-card__name\s*{[^}]*min-height:\s*3\.3em/s);
  assert.match(css, /\.choice-card__media img\s*{[^}]*aspect-ratio:\s*1\s*\/\s*1[^}]*object-fit:\s*cover/s);
  assert.doesNotMatch(desktopCss, /\.choice-grid--categories \.choice-card__media img\s*{[^}]*object-fit:\s*contain/s);
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.choice-grid--categories \.choice-card__name\s*{[^}]*min-height:\s*3\.45em/s);
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.choice-grid--categories \.choice-card__media img\s*{[^}]*height:\s*auto[^}]*aspect-ratio:\s*auto[^}]*object-fit:\s*contain[^}]*object-position:\s*center/s);
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.choice-grid--categories \.choice-card__media\s*{[^}]*padding:\s*0[^}]*border:\s*0[^}]*background:\s*transparent/s);
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.choice-grid--categories \.choice-card__media img\s*{[^}]*border-radius:\s*calc\(var\(--radio\) - 2px\)/s);
  assert.doesNotMatch(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.choice-grid--categories \.choice-card__media\s*{[^}]*aspect-ratio:\s*4\s*\/\s*3/s);
  assert.match(css, /@media\s*\(min-width:\s*1024px\)[\s\S]*?\.product-grid\s*{[^}]*repeat\(4,/s);
});
