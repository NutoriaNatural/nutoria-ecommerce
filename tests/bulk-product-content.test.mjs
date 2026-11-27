import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { productBySlug } from "../data/products.mjs";
import { renderProductDocument, structuredDataForProduct } from "../lib/product-page-template.mjs";

const slugs = ["almendra-laminada", "almendras", "avellanas", "avena-en-hojuelas-sin-gluten", "coco-acaramelado"];
test("el segundo lote conserva los dos párrafos y el resumen completo en JSON-LD inicial", () => {
  const secondBatch = ["flor-de-jamaica", "garbanzo-tostados", "habas-saladas", "harina-de-almendras", "lentejas-tostadas"];
  for (const [index, slug] of secondBatch.entries()) {
    const product = productBySlug.get(slug);
    const html = renderProductDocument(product);
    const initial = readFileSync(new URL(`../productos/${slug}/index.html`, import.meta.url), "utf8").replaceAll("\r\n", "\n");
    assert.equal(initial, html);
    assert.equal(product.shortDescription.split("\n\n").length, 2);
    const visibleSummary = initial.match(/data-product-short-description>([\s\S]*?)<\/p>/u)[1];
    const data = JSON.parse(initial.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/u)[1]);
    assert.equal(visibleSummary, product.shortDescription);
    assert.equal(data["@graph"][0].description, visibleSummary);
    assert.equal(product.description, "");
    assert.doesNotMatch(initial, /data-product-description-content/u);
    assert.deepEqual(product.productInfo.map(({ label }) => label), ["Presentación", "Características", "Conservación"]);
    assert.equal(product.highlights.length, index === 0 ? 5 : 4);
    for (const text of [...product.productInfo.map(({ value }) => value), ...product.highlights]) assert.ok(initial.includes(text), `${slug}: ${text}`);
    assert.ok(initial.indexOf("data-product-add") < initial.indexOf("data-product-short-description"));
    assert.ok(initial.indexOf("data-product-info>") < initial.indexOf("data-product-properties>"));
  }
  const css = readFileSync(new URL("../product-detail.css", import.meta.url), "utf8");
  assert.match(css, /\.product-purchase__short-description\s*\{[^}]*white-space:\s*pre-line/u);
});

test("las cinco fichas a granel muestran resumen, información y propiedades en orden", () => {
  slugs.forEach((slug, index) => {
    const product = productBySlug.get(slug);
    const html = renderProductDocument(product);
    assert.ok(product.shortDescription);
    assert.deepEqual(product.productInfo.map(({ label }) => label), ["Presentación", "Características", "Conservación"]);
    assert.equal(product.productInfo[0].value, "A granel");
    assert.equal(product.highlights.length, [4, 5, 5, 4, 4][index]);
    for (const text of [product.shortDescription, ...product.productInfo.map(({ value }) => value), ...product.highlights]) assert.ok(html.includes(text), `${slug}: ${text}`);
    assert.ok(html.indexOf("data-product-add") < html.indexOf("data-product-short-description"));
    assert.ok(html.indexOf("data-product-info>") < html.indexOf("data-product-properties>"));
    assert.equal(html.includes("data-product-description-content"), ["almendra-laminada", "avellanas"].includes(slug));
    if (product.description) assert.ok(html.includes(product.description));
    assert.equal(structuredDataForProduct(product)["@graph"][0].description, product.shortDescription);
    assert.equal(readFileSync(new URL(`../productos/${slug}/index.html`, import.meta.url), "utf8").replaceAll("\r\n", "\n"), html);
  });
});
