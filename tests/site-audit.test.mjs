import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { productIndex } from "../lib/order-pricing.mjs";
import { products } from "../data/products.mjs";
import { secureConnectionString } from "../db/client.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("usa el dominio oficial en SEO, datos estructurados y rastreo", () => {
  const index = read("index.html");
  assert.match(index, /rel="canonical" href="https:\/\/nutoria\.com\.co\/"/);
  assert.doesNotMatch(index, /nutoria-ecommerce\.vercel\.app/);
  assert.match(read("robots.txt"), /Sitemap: https:\/\/nutoria\.com\.co\/sitemap\.xml/);
  assert.match(read("sitemap.xml"), /<loc>https:\/\/nutoria\.com\.co\/<\/loc>/);
});

test("centraliza GA4 y conserva la cola antes de cargar el script externo", () => {
  const index = read("index.html");
  const loader = read("ga4-loader.js");
  assert.equal((index.match(/src="\/ga4-loader\.js"/g) || []).length, 1);
  assert.doesNotMatch(index, /googletagmanager\.com\/gtag\/js/);
  assert.match(loader, /G-PKDWSJSZSD/);
  assert.match(loader, /window\.dataLayer = window\.dataLayer \|\| \[\]/);
  assert.match(loader, /window\.gtag = window\.gtag \|\| function gtag/);
  assert.match(loader, /window\.dataLayer\.push\(arguments\)/);
  assert.match(loader, /requestAnimationFrame\(\(\) => window\.requestAnimationFrame\(loadExternalScript\)\)/);
  assert.match(loader, /script\[data-nutoria-ga4\]/);
});

test("GA4 cubre fichas y observa tarjetas agregadas progresivamente", () => {
  const analytics = read("analytics.mjs");
  assert.match(read("lib/product-page-template.mjs"), /<script src="\/ga4-loader\.js"><\/script>/);
  assert.match(analytics, /new MutationObserver/);
  assert.match(analytics, /addedNodes/);
  assert.match(analytics, /observeWithin\(node\)/);
  assert.match(analytics, /const observed = new WeakSet\(\)/);
});

test("todas las imágenes declaradas existen y tienen atributo alt", () => {
  const index = read("index.html");
  const images = [...index.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*>/g)];
  assert.ok(images.length > 0);
  for (const image of images) {
    assert.match(image[0], /\balt="[^"]*"/);
    assert.equal(existsSync(resolve(root, decodeURI(image[1]))), true, image[1]);
  }
});

test("no publica texto con codificación corrupta", () => {
  for (const path of ["index.html", "cart.mjs", "lib/orders.mjs", "lib/order-pricing.mjs"]) {
    assert.doesNotMatch(read(path), /[\u00c3\u00c2\u00e2]/, path);
  }
});

test("todos los productos publicados tienen precio y presentación válidos", () => {
  assert.equal(productIndex.has("producto-1"), true);
  assert.equal(productIndex.has("producto-7-125g"), true);
  assert.equal(products.every((product) => (
    product.variants.length
      ? product.variants.every(({ presentation, price }) => presentation && Number.isInteger(price) && price > 0)
      : product.presentation && Number.isInteger(product.price) && product.price > 0
  )), true);
});

test("el checkout exige el documento sin publicarlo en URLs", () => {
  const index = read("index.html");
  const field = index.match(/<input name="documentNumber"[^>]*>/)?.[0] || "";
  assert.match(field, /type="text"/);
  assert.match(field, /maxlength="40"/);
  assert.match(field, /required/);
  assert.doesNotMatch(index, /[?&]document(?:Number|_number)=/);
});

test("PostgreSQL conserva validación completa del certificado TLS", () => {
  const value = secureConnectionString("postgresql://user:password@example.com/db?sslmode=require");
  assert.equal(new URL(value).searchParams.get("sslmode"), "verify-full");
});
