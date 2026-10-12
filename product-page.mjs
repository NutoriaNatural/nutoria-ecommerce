import { initializeProductDetail } from "./product-detail.mjs";

const runtimeData = document.querySelector("#product-runtime-data");
let product;

try {
  product = JSON.parse(runtimeData?.textContent || "null");
} catch {
  product = null;
}

if (!product || product.slug !== document.documentElement.dataset.productSlug) {
  document.body.innerHTML = `<main class="container product-page"><h1>Producto no encontrado</h1><p><a href="/#productos">Volver a productos</a></p></main>`;
} else {
  initializeProductDetail(product);
  await import("./cart.mjs");
  await import("./whatsapp.mjs");
}
