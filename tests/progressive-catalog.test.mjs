import test from "node:test";
import assert from "node:assert/strict";
import {
  CATALOG_BATCH_SIZE,
  INITIAL_CATALOG_BATCH_SIZE,
  createProgressiveRenderer,
  filterProducts,
  products,
} from "../product-catalog.mjs";

function createContainer() {
  return {
    children: [],
    dataset: {},
    replaceChildren(...nodes) { this.children = [...nodes]; },
    append(...nodes) { this.children.push(...nodes); },
  };
}

function createQueue() {
  const callbacks = [];
  return {
    callbacks,
    schedule(callback) {
      callbacks.push(callback);
      return callback;
    },
    cancel() {},
    flush() {
      while (callbacks.length) callbacks.shift()();
    },
  };
}

test("crea un bloque inicial y completa los 74 productos en lotes ordenados", () => {
  const container = createContainer();
  const queue = createQueue();
  createProgressiveRenderer({
    container,
    items: products,
    renderItem: ({ id }) => ({ id }),
    schedule: queue.schedule,
    cancel: queue.cancel,
  });

  assert.equal(container.children.length, INITIAL_CATALOG_BATCH_SIZE);
  assert.equal(container.dataset.catalogComplete, "false");
  queue.flush();
  assert.equal(container.children.length, 74);
  assert.deepEqual(container.children.map(({ id }) => id), products.map(({ id }) => id));
  assert.equal(new Set(container.children.map(({ id }) => id)).size, 74);
  assert.equal(container.dataset.catalogComplete, "true");
  assert.equal(CATALOG_BATCH_SIZE, 8);
});

test("cancelar un render impide que lotes obsoletos reaparezcan tras un filtro", () => {
  const container = createContainer();
  const firstQueue = createQueue();
  const first = createProgressiveRenderer({
    container,
    items: products,
    renderItem: ({ id }) => ({ id }),
    schedule: firstQueue.schedule,
    cancel: firstQueue.cancel,
  });

  first.cancel();
  const matches = filterProducts(products, { query: "linaza", category: "Semillas" });
  const secondQueue = createQueue();
  createProgressiveRenderer({
    container,
    items: matches,
    renderItem: ({ id }) => ({ id }),
    schedule: secondQueue.schedule,
    cancel: secondQueue.cancel,
  });

  firstQueue.flush();
  secondQueue.flush();
  assert.deepEqual(container.children.map(({ id }) => id), matches.map(({ id }) => id));
  assert.equal(container.children.length, 1);
});

test("las categorías operan sobre la fuente completa antes de renderizar", () => {
  assert.equal(filterProducts(products, { category: "Frutos secos y más" }).length, 42);
  assert.equal(filterProducts(products, { category: "Semillas" }).length, 10);
  assert.equal(filterProducts(products, { category: "Deshidratados" }).length, 11);
  assert.equal(filterProducts(products, { category: "Suplementos y alimentos naturales" }).length, 11);
});
