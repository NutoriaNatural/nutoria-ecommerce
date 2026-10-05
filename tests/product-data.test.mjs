import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  productById,
  productByLegacyId,
  productBySlug,
  products,
} from "../data/products.mjs";
import { priceOrder, productIndex } from "../lib/order-pricing.mjs";

const catalogSource = readFileSync(new URL("../product-catalog.mjs", import.meta.url), "utf8");
const checkoutSource = readFileSync(new URL("../cart.mjs", import.meta.url), "utf8");

test("mantiene 74 productos e identificadores permanentes únicos", () => {
  assert.equal(products.length, 74);
  assert.equal(new Set(products.map(({ id }) => id)).size, 74);
  assert.equal(new Set(products.map(({ slug }) => slug)).size, 74);
  assert.equal(new Set(products.map(({ legacyId }) => legacyId)).size, 74);
  products.forEach((product, index) => {
    assert.equal(product.id, product.slug);
    assert.equal(product.legacyId, `producto-${index + 1}`);
    assert.equal(productById.get(product.id), product);
    assert.equal(productBySlug.get(product.slug), product);
    assert.equal(productByLegacyId.get(product.legacyId), product);
  });
});

test("conserva los 47 IDs legacy anteriores y añade los nuevos al final", () => {
  assert.equal(productById.get("7-colagenos").legacyId, "producto-1");
  assert.equal(productById.get("uvas-pasas").legacyId, "producto-47");
  assert.equal(productById.get("almendras-con-cobertura-al-60-cacao").legacyId, "producto-48");
  assert.equal(productById.get("uchuvas-con-cobertura-al-60-cacao").legacyId, "producto-72");
  assert.equal(productById.get("anis-estrellado").legacyId, "producto-73");
  assert.equal(productById.get("linaza").legacyId, "producto-74");
});

test("conserva imágenes, categorías, presentaciones y precios en la fuente única", () => {
  const ajonjoli = productById.get("ajonjoli-negro");
  assert.equal(ajonjoli.image, "/assets/images/products/ajonjoli-negro/01.webp");
  assert.equal(ajonjoli.category, "Semillas");
  assert.deepEqual(
    ajonjoli.variants.map(({ presentation, price }) => ({ presentation, price })),
    [
      { presentation: "125g", price: 7000 },
      { presentation: "250g", price: 14000 },
      { presentation: "500g", price: 27000 },
      { presentation: "1.000g", price: 51000 },
    ],
  );
  const whey = productById.get("proteina-whey");
  assert.equal(whey.presentation, "900g");
  assert.equal(whey.price, 179900);
  const naturalSesame = productById.get("ajonjoli");
  assert.equal(naturalSesame.name, "Ajonjolí natural");
  assert.deepEqual(naturalSesame.variants.map(({ price }) => price), [5000, 10000, 19000, 35000]);
});

test("aplica exactamente los nuevos precios y el orden de presentaciones", () => {
  const expected = {
    "avena-en-hojuelas-sin-gluten": [2000, 4000, 7500, 14000],
    "coco-acaramelado": [11000, 22000, 43000, 81000],
    almendras: [10000, 20000, 39000, 73000],
    "habas-saladas": [11000, 22000, 43000, 81000],
    "almendras-con-cobertura-al-60-cacao": [25000, 49000, 95000, 180000],
    "avellanas-con-cobertura-al-60-cacao": [25000, 49000, 95000, 180000],
    "banano-con-cobertura-al-60-cacao": [25000, 49000, 95000, 180000],
    "cafe-con-cobertura-60-cacao": [25000, 49000, 95000, 180000],
    chia: [5500, 11000, 21000, 39000],
    "gelatina-sin-sabor": [11000, 22000, 43000, 81000],
    "habas-con-miel-mostaza": [11000, 22000, 43000, 81000],
    "habas-con-queso": [11000, 22000, 43000, 81000],
    "habas-con-sal": [6500, 13000, 25000, 45000],
    "maiz-con-chile": [9000, 18000, 35000, 67000],
    "maiz-con-miel-mostaza": [9000, 18000, 35000, 67000],
    "maiz-con-queso": [9000, 18000, 35000, 67000],
    "maiz-salado": [9000, 18000, 35000, 67000],
    "mani-con-sal": [4000, 8000, 15000, 28000],
    "mani-horneado": [4000, 8000, 15000, 28000],
    "mix-combinado": [9500, 19000, 37000, 69000],
    "mix-especial": [8000, 16000, 31000, 57000],
    "mix-mani-confitado-y-pasas": [4000, 8000, 15000, 28000],
    "mix-mani-y-pasas": [4000, 8000, 15000, 28000],
    "mix-nuts": [12500, 25000, 49000, 93000],
    "mix-premium": [15500, 31000, 61000, 117000],
    "mix-saludable": [14500, 29000, 57000, 109000],
    "semillas-de-calabaza": [9000, 18000, 35000, 65000],
    "semillas-de-girasol": [5000, 10000, 19000, 33000],
    "uchuvas-con-cobertura-al-60-cacao": [25000, 49000, 95000, 180000],
  };
  const presentations = ["125g", "250g", "500g", "1.000g"];
  Object.entries(expected).forEach(([id, prices]) => {
    const product = productById.get(id);
    assert.deepEqual(product.variants.map(({ presentation }) => presentation), presentations, id);
    assert.deepEqual(product.variants.map(({ price }) => price), prices, id);
    product.variants.forEach((variant, index) => {
      const priced = priceOrder([{ id: `${id}-${variant.id}`, quantity: 1 }]);
      assert.equal(priced.items[0].presentation, presentations[index], id);
      assert.equal(priced.items[0].price, prices[index], id);
    });
  });
  const collagen = productById.get("7-colagenos");
  assert.equal(collagen.name, "7 Colágeno");
  assert.equal(collagen.presentation, "1.000g");
  assert.equal(collagen.price, 89900);
  assert.equal(priceOrder([{ id: "7-colagenos", quantity: 1 }]).items[0].price, 89900);
});

test("integra Anís estrellado y Linaza en la fuente y validación autoritativas", () => {
  const expected = {
    "anis-estrellado": { name: "Anís estrellado", category: "Frutos secos y más", prices: [12000, 24000, 47000, 89000] },
    linaza: { name: "Linaza", category: "Semillas", prices: [2500, 5000, 9000, 17000] },
  };
  Object.entries(expected).forEach(([id, specification]) => {
    const product = productById.get(id);
    assert.equal(product.name, specification.name);
    assert.equal(product.category, specification.category);
    assert.equal(product.detailPath, `/productos/${id}/`);
    assert.equal(product.image, `/assets/images/products/${id}/01.webp`);
    assert.deepEqual(product.variants.map(({ presentation }) => presentation), ["125g", "250g", "500g", "1.000g"]);
    assert.deepEqual(product.variants.map(({ price }) => price), specification.prices);
    product.variants.forEach((variant, index) => {
      const priced = priceOrder([{ id: `${id}-${variant.id}`, quantity: 1 }]);
      assert.equal(priced.items[0].price, specification.prices[index]);
      assert.equal(priced.items[0].name, specification.name);
    });
  });
});

test("deja vacíos los campos futuros cuando no existe información aprobada", () => {
  products.forEach((product) => {
    assert.equal(product.shortDescription, "");
    assert.equal(product.description, "");
    assert.deepEqual(product.highlights, []);
    assert.equal(product.ingredients, "");
    assert.equal(product.content, "");
    assert.equal(product.nutrition, "");
    assert.equal(product.usage, "");
    assert.equal(product.conservation, "");
    assert.equal(product.sanitaryRegistration, "");
    assert.equal(product.additionalInformation, "");
    assert.equal(product.seoTitle, "");
    assert.equal(product.seoDescription, "");
  });
});

test("guarda exactamente la composición aprobada de los nueve Mix", () => {
  const expected = {
    "mix-mani-y-pasas": ["maní horneado", "uvas pasas"],
    "mix-mani-confitado-y-pasas": ["maní horneado", "maní confitado", "uvas pasas"],
    "mix-especial": ["maní horneado", "maní confitado", "uvas pasas", "arándanos", "coco acaramelado", "habas saladas", "almendras", "nuez de Brasil"],
    "mix-rojos-deshidratado": ["manzana", "papaya", "fresa", "mora"],
    "mix-nuts": ["almendras", "marañón", "macadamia", "nuez de Brasil", "arándanos"],
    "mix-premium": ["almendras", "marañón", "macadamia", "nuez pecana", "semillas de calabaza"],
    "mix-saludable": ["almendras", "marañón", "macadamia", "nuez de Brasil", "nuez de nogal"],
    "mix-combinado": ["maní horneado", "arándanos", "almendras", "nuez de Brasil", "macadamia"],
    "mix-tropical-deshidratado": ["manzana", "papaya", "piña", "mango", "banano", "uchuva", "fresa"],
  };
  Object.entries(expected).forEach(([id, composition]) => {
    assert.deepEqual(productById.get(id).composition, composition);
  });
});

test("acepta IDs permanentes y legacy con exactamente el mismo precio oficial", () => {
  const current = priceOrder([{ id: "ajonjoli-negro-125g", quantity: 2 }]);
  const legacy = priceOrder([{ id: "producto-2-125g", quantity: 2 }]);
  assert.deepEqual(
    { ...current, items: current.items.map(({ productId: _productId, ...item }) => item) },
    { ...legacy, items: legacy.items.map(({ productId: _productId, ...item }) => item) },
  );
  assert.equal(productIndex.has("ajonjoli-negro-125g"), true);
  assert.equal(productIndex.has("producto-2-125g"), true);
});

test("catálogo y checkout conservan el mismo flujo Agregar y el contrato id/quantity", () => {
  assert.match(catalogSource, /from "\.\/data\/products\.mjs"/);
  assert.match(catalogSource, /button\.dataset\.productId = `\$\{product\.id\}-\$\{variant\.id\}`/);
  assert.match(checkoutSource, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(checkoutSource, /items: state\.items\.map\(\(\{ id, quantity \}\) => \(\{ id, quantity \}\)\)/);
});
