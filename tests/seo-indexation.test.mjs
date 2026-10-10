import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { products } from "../data/products.mjs";
import {
  canonicalForProduct,
  renderProductDocument,
  renderSitemap,
} from "../lib/product-page-template.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

test("las 74 fichas generadas permanecen sincronizadas con la fuente única", () => {
  assert.equal(products.length, 74);
  for (const product of products) {
    const html = read(`productos/${product.slug}/index.html`);
    assert.equal(html, renderProductDocument(product), product.slug);
    assert.equal((html.match(/<h1\b/giu) || []).length, 1, product.slug);
    assert.match(html, new RegExp(`<h1[^>]*>${escapeRegExp(product.name)}<\\/h1>`));
    assert.match(html, new RegExp(`src="${escapeRegExp(product.image)}"`));
    assert.match(html, new RegExp(`alt="${escapeRegExp(product.name)}, imagen 1 de`));
    assert.equal((html.match(/rel="canonical"/gu) || []).length, 1, product.slug);
    assert.match(html, new RegExp(`href="${escapeRegExp(canonicalForProduct(product))}"`));
    assert.doesNotMatch(html, /vercel\.app|\/index\.html|rel="canonical"[^>]*[?&]/u);
  }
});

test("el sitemap contiene portada y 74 fichas canónicas sin duplicados", () => {
  const sitemap = read("sitemap.xml");
  assert.equal(sitemap, renderSitemap(products));
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => match[1]);
  assert.equal(urls.length, 75);
  assert.equal(new Set(urls).size, 75);
  assert.equal(urls[0], "https://nutoria.com.co/");
  assert.deepEqual(urls.slice(1), products.map((product) => canonicalForProduct(product)));
  assert.equal(urls.some((url) => /vercel\.app|\/admin\/|\/api\/|\/index\.html|[?&]/u.test(url)), false);
});

test("robots conserva el sitemap oficial y el generador es reproducible", () => {
  assert.match(read("robots.txt"), /Sitemap: https:\/\/nutoria\.com\.co\/sitemap\.xml/u);
  assert.match(read("scripts/generate-seo-pages.mjs"), /renderProductDocument\(product\)/u);
  assert.match(read("scripts/generate-seo-pages.mjs"), /renderSitemap\(products\)/u);
});

test("el HTML inicial incluye el contenido aprobado sin inventar bloques vacíos", () => {
  const marine = read("productos/colageno-marino/index.html");
  assert.match(marine, /Fórmula con colágeno marino hidrolizado/u);
  assert.match(marine, /data-product-description-content>[\s\S]*Colágeno Marino Hidrolizado Colavina/u);
  assert.match(marine, /Registro sanitario/u);

  const almonds = read("productos/almendras/index.html");
  assert.doesNotMatch(almonds, /data-product-short-description|data-product-description|data-product-info/u);
  assert.match(almonds, /Almendras/u);
  assert.match(almonds, /Frutos secos y más/u);
  assert.match(almonds, /125 g|250 g|500 g|1\.000 g/u);
});
