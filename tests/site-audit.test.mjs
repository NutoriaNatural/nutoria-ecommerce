import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { productIndex } from "../lib/order-pricing.mjs";
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

test("productos sin precio suministrado no pueden entrar al checkout", () => {
  assert.equal(productIndex.has("producto-1"), false);
  assert.equal(productIndex.has("producto-7"), false);
});

test("PostgreSQL conserva validación completa del certificado TLS", () => {
  const value = secureConnectionString("postgresql://user:password@example.com/db?sslmode=require");
  assert.equal(new URL(value).searchParams.get("sslmode"), "verify-full");
});
