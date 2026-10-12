import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { products } from "../data/products.mjs";
import { categories, categoryByName } from "../data/categories.mjs";
import {
  canonicalForProduct,
  renderProductDocument,
  renderSitemap,
  seoMetadataForProduct,
  structuredDataForProduct,
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

test("el sitemap contiene portada, cuatro categorías y 74 fichas sin duplicados", () => {
  const sitemap = read("sitemap.xml");
  assert.equal(sitemap, renderSitemap(products));
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => match[1]);
  assert.equal(urls.length, 79);
  assert.equal(new Set(urls).size, 79);
  assert.equal(urls[0], "https://nutoria.com.co/");
  assert.deepEqual(urls.slice(1, 5), categories.map(({ path }) => `https://nutoria.com.co${path}`));
  assert.deepEqual(urls.slice(5), products.map((product) => canonicalForProduct(product)));
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

test("genera title, Open Graph y Twitter desde la fuente única", () => {
  const titles = new Set();

  for (const product of products) {
    const html = read(`productos/${product.slug}/index.html`);
    const metadata = seoMetadataForProduct(product);

    assert.equal((html.match(/<title>/gu) || []).length, 1, product.slug);
    assert.match(html, new RegExp(`<title>${escapeRegExp(metadata.title)}<\\/title>`));
    assert.equal(titles.has(metadata.title), false, metadata.title);
    titles.add(metadata.title);

    assert.match(html, new RegExp(`<meta property="og:title" content="${escapeRegExp(metadata.title)}" \\/>`));
    assert.match(html, new RegExp(`<meta property="og:url" content="${escapeRegExp(metadata.canonical)}" \\/>`));
    assert.match(html, new RegExp(`<meta property="og:image" content="${escapeRegExp(metadata.image)}" \\/>`));
    assert.match(html, new RegExp(`<meta property="og:image:alt" content="${escapeRegExp(metadata.imageAlt)}" \\/>`));
    assert.match(html, /<meta property="og:type" content="product" \/>/u);
    assert.match(html, /<meta property="og:site_name" content="Nutoria" \/>/u);
    assert.match(html, /<meta property="og:locale" content="es_CO" \/>/u);

    assert.match(html, /<meta name="twitter:card" content="summary_large_image" \/>/u);
    assert.match(html, new RegExp(`<meta name="twitter:title" content="${escapeRegExp(metadata.title)}" \\/>`));
    assert.match(html, new RegExp(`<meta name="twitter:image" content="${escapeRegExp(metadata.image)}" \\/>`));
    assert.match(html, new RegExp(`<meta name="twitter:image:alt" content="${escapeRegExp(metadata.imageAlt)}" \\/>`));

    assert.doesNotMatch(html, /vercel\.app/u, product.slug);
  }

  assert.equal(titles.size, products.length);
});

test("solo publica meta descriptions respaldadas por contenido aprobado", () => {
  const withDescription = products.filter((product) => seoMetadataForProduct(product).description);
  const withoutDescription = products.filter((product) => !seoMetadataForProduct(product).description);

  assert.deepEqual(withDescription.map(({ slug }) => slug), ["colageno-marino"]);
  assert.equal(withoutDescription.length, 73);

  for (const product of products) {
    const html = read(`productos/${product.slug}/index.html`);
    const metadata = seoMetadataForProduct(product);
    const descriptionTags = html.match(/<meta name="description"/gu) || [];
    const ogDescriptionTags = html.match(/<meta property="og:description"/gu) || [];
    const twitterDescriptionTags = html.match(/<meta name="twitter:description"/gu) || [];
    const expectedCount = metadata.description ? 1 : 0;

    assert.equal(descriptionTags.length, expectedCount, product.slug);
    assert.equal(ogDescriptionTags.length, expectedCount, product.slug);
    assert.equal(twitterDescriptionTags.length, expectedCount, product.slug);
  }
});

test("genera Product y BreadcrumbList reales para las 74 fichas", () => {
  const multiplePresentationProducts = products.filter(({ variants }) => variants.length > 0);
  const singlePresentationProducts = products.filter(({ variants }) => variants.length === 0);

  assert.equal(multiplePresentationProducts.length, 64);
  assert.equal(singlePresentationProducts.length, 10);

  for (const product of products) {
    const html = read(`productos/${product.slug}/index.html`);
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gu)];
    assert.equal(scripts.length, 1, product.slug);

    const data = JSON.parse(scripts[0][1]);
    assert.deepEqual(data, structuredDataForProduct(product), product.slug);
    assert.equal(data["@context"], "https://schema.org");
    assert.equal(data["@graph"].length, 2);

    const productEntity = data["@graph"].find(({ "@type": type }) => type === "Product");
    const breadcrumb = data["@graph"].find(({ "@type": type }) => type === "BreadcrumbList");
    assert.ok(productEntity, product.slug);
    assert.ok(breadcrumb, product.slug);
    assert.equal(productEntity.name, product.name);
    assert.equal(productEntity.url, canonicalForProduct(product));
    assert.deepEqual(productEntity.image, product.images.map((image) => `https://nutoria.com.co${image}`));
    assert.equal(productEntity.category, product.category);

    const expectedOffer = product.variants.length
      ? product.variants.find(({ presentation }) => presentation === "250g")
      : product;
    assert.ok(expectedOffer, `${product.slug}: falta la presentación predeterminada 250 g`);
    assert.equal(productEntity.offers.length, 1, product.slug);
    assert.equal(productEntity.offers[0].name, `${product.name} - ${expectedOffer.presentation.replace(/(\d[\d.]*)\s*(mg|kg|g|ml|l)\b/giu, "$1 $2")}`);
    assert.equal(productEntity.offers[0].price, expectedOffer.price, product.slug);
    assert.equal(productEntity.offers.every(({ priceCurrency }) => priceCurrency === "COP"), true);
    assert.equal(productEntity.offers.every(({ url }) => url === canonicalForProduct(product)), true);

    const category = categoryByName.get(product.category);
    assert.ok(category, product.category);
    assert.deepEqual(breadcrumb.itemListElement, [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://nutoria.com.co/" },
      { "@type": "ListItem", position: 2, name: category.name, item: `https://nutoria.com.co${category.path}` },
      { "@type": "ListItem", position: 3, name: product.name },
    ]);

    assert.match(html, new RegExp(`<a href="${escapeRegExp(category.path)}">${escapeRegExp(category.name)}<\\/a>`));

    const serialized = JSON.stringify(data);
    assert.doesNotMatch(serialized, /vercel\.app|nutoria-ecommerce-/u);
    assert.doesNotMatch(serialized, /aggregateRating|review|gtin|sku|mpn|brand|availability|itemCondition/u);
  }
});

test("los 64 multipresentación publican solo la oferta predeterminada de 250 g", () => {
  const multiplePresentationProducts = products.filter(({ variants }) => variants.length > 0);
  assert.equal(multiplePresentationProducts.length, 64);

  for (const product of multiplePresentationProducts) {
    const expected = product.variants.find(({ presentation }) => presentation === "250g");
    assert.ok(expected, product.slug);
    const productEntity = structuredDataForProduct(product)["@graph"]
      .find(({ "@type": type }) => type === "Product");

    assert.equal(productEntity.offers.length, 1, product.slug);
    assert.equal(productEntity.offers[0].name, `${product.name} - 250 g`, product.slug);
    assert.equal(productEntity.offers[0].price, expected.price, product.slug);
    assert.equal(productEntity.offers[0].priceCurrency, "COP", product.slug);
    assert.equal(productEntity.offers[0].url, canonicalForProduct(product), product.slug);
  }
});

test("los 10 productos de presentación única conservan su oferta real", () => {
  const singlePresentationProducts = products.filter(({ variants }) => variants.length === 0);
  assert.equal(singlePresentationProducts.length, 10);

  for (const product of singlePresentationProducts) {
    const productEntity = structuredDataForProduct(product)["@graph"]
      .find(({ "@type": type }) => type === "Product");

    assert.equal(productEntity.offers.length, 1, product.slug);
    assert.equal(productEntity.offers[0].price, product.price, product.slug);
    assert.equal(productEntity.offers[0].priceCurrency, "COP", product.slug);
    assert.equal(productEntity.offers[0].url, canonicalForProduct(product), product.slug);
  }
});

test("Product solo usa descripción aprobada y no inventa variantes", () => {
  for (const product of products) {
    const data = structuredDataForProduct(product);
    const productEntity = data["@graph"].find(({ "@type": type }) => type === "Product");
    const description = seoMetadataForProduct(product).description;

    assert.equal(productEntity.description, description || undefined, product.slug);
    assert.equal("hasVariant" in productEntity, false);
    assert.equal("productGroupID" in productEntity, false);
  }
});

test("la portada conserva OnlineStore y añade WebSite conectado", () => {
  const html = read("index.html");
  const data = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gu)]
    .map((match) => JSON.parse(match[1]));
  const store = data.find(({ "@type": type }) => type === "OnlineStore");
  const website = data.find(({ "@type": type }) => type === "WebSite");

  assert.ok(store);
  assert.equal(store["@id"], "https://nutoria.com.co/#organization");
  assert.equal(store.url, "https://nutoria.com.co/");
  assert.ok(website);
  assert.equal(website["@id"], "https://nutoria.com.co/#website");
  assert.equal(website.name, "Nutoria");
  assert.equal(website.url, "https://nutoria.com.co/");
  assert.deepEqual(website.publisher, { "@id": store["@id"] });
  assert.equal("potentialAction" in website, false);
});
