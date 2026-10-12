import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { categories } from "../data/categories.mjs";
import { products } from "../data/products.mjs";
import {
  canonicalForCategory,
  renderCategoryDocument,
  structuredDataForCategory,
} from "../lib/category-page-template.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

test("genera exactamente las cuatro páginas SEO de categoría aprobadas", () => {
  assert.equal(categories.length, 4);
  assert.deepEqual(categories.map(({ name }) => name), [
    "Frutos secos y más",
    "Semillas",
    "Deshidratados",
    "Suplementos y alimentos naturales",
  ]);
  assert.deepEqual(categories.map(({ slug }) => slug), [
    "frutos-secos-y-mas",
    "semillas",
    "deshidratados",
    "suplementos-y-alimentos-naturales",
  ]);

  for (const category of categories) {
    const html = read(`categorias/${category.slug}/index.html`);
    assert.equal(html, renderCategoryDocument(category, products.filter((product) => product.category === category.name)));
    assert.equal((html.match(/<h1\b/gu) || []).length, 1, category.slug);
    assert.equal((html.match(/<title>/gu) || []).length, 1, category.slug);
    assert.equal((html.match(/<meta name="description"/gu) || []).length, 1, category.slug);
    assert.equal((html.match(/rel="canonical"/gu) || []).length, 1, category.slug);
    assert.match(html, new RegExp(`<link rel="canonical" href="${escapeRegExp(canonicalForCategory(category))}"`));
    assert.doesNotMatch(html, /noindex|vercel\.app|\/index\.html|rel="canonical"[^>]*[?&]/u);
  }
});

test("cada categoría enlaza únicamente sus productos reales", () => {
  const expectedCounts = new Map([
    ["Frutos secos y más", 42],
    ["Semillas", 10],
    ["Deshidratados", 11],
    ["Suplementos y alimentos naturales", 11],
  ]);
  const seen = new Set();

  for (const category of categories) {
    const html = read(`categorias/${category.slug}/index.html`);
    const categoryProducts = products.filter((product) => product.category === category.name);
    const productLinks = [...html.matchAll(/<a href="(\/productos\/[^"#?]+\/)">/gu)].map((match) => match[1]);

    assert.equal(categoryProducts.length, expectedCounts.get(category.name), category.name);
    assert.equal(productLinks.length, categoryProducts.length, category.name);
    assert.deepEqual(productLinks, categoryProducts.map(({ detailPath }) => detailPath), category.name);
    categoryProducts.forEach(({ id }) => {
      assert.equal(seen.has(id), false, id);
      seen.add(id);
    });
  }

  assert.equal(seen.size, products.length);
});

test("portada, categorías y fichas forman un enlazado rastreable", () => {
  const homepage = read("index.html");
  for (const category of categories) {
    assert.match(homepage, new RegExp(`href="${escapeRegExp(category.path)}"[^>]*data-catalog-category="${escapeRegExp(category.name)}"`));
  }

  for (const product of products) {
    const category = categories.find(({ name }) => name === product.category);
    assert.ok(category, product.id);
    const productHtml = read(`productos/${product.slug}/index.html`);
    assert.match(productHtml, new RegExp(`<nav class="breadcrumbs"[\\s\\S]*href="${escapeRegExp(category.path)}"[\\s\\S]*aria-current="page">${escapeRegExp(product.name)}`));
  }
});

test("BreadcrumbList de categorías coincide con la navegación visible", () => {
  for (const category of categories) {
    const html = read(`categorias/${category.slug}/index.html`);
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gu)];
    assert.equal(scripts.length, 1, category.slug);
    assert.deepEqual(JSON.parse(scripts[0][1]), structuredDataForCategory(category));
    assert.match(html, /<nav class="breadcrumbs" aria-label="Migas de pan">/u);
    assert.match(html, /<a href="\/">Inicio<\/a>/u);
    assert.match(html, new RegExp(`<li aria-current="page">${escapeRegExp(category.name)}<\\/li>`));
  }
});
