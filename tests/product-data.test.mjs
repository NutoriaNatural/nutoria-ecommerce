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

test("mantiene exactamente los 47 productos y define identificadores permanentes únicos", () => {
  assert.equal(products.length, 47);
  assert.equal(new Set(products.map(({ id }) => id)).size, 47);
  assert.equal(new Set(products.map(({ slug }) => slug)).size, 47);
  assert.equal(new Set(products.map(({ legacyId }) => legacyId)).size, 47);
  products.forEach((product, index) => {
    assert.equal(product.id, product.slug);
    assert.equal(product.legacyId, `producto-${index + 1}`);
    assert.equal(productById.get(product.id), product);
    assert.equal(productBySlug.get(product.slug), product);
    assert.equal(productByLegacyId.get(product.legacyId), product);
  });
});

test("conserva imágenes, categorías, presentaciones y precios en la fuente única", () => {
  const ajonjoli = productById.get("ajonjoli-negro");
  assert.equal(ajonjoli.image, "assets/images/optimized/Ajonjoli Negro.jpg");
  assert.equal(ajonjoli.category, "Frutos secos, semillas y granos");
  assert.deepEqual(
    ajonjoli.variants.map(({ presentation, price }) => ({ presentation, price })),
    [
      { presentation: "1.000g", price: 51000 },
      { presentation: "500g", price: 27000 },
      { presentation: "250g", price: 14000 },
      { presentation: "125g", price: 7000 },
    ],
  );
  const whey = productById.get("proteina-whey");
  assert.equal(whey.presentation, "900g");
  assert.equal(whey.price, 179900);
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
