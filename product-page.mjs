import { productBySlug } from "./data/products.mjs";
import { renderProductBody } from "./lib/product-page-template.mjs";
import { initializeProductDetail } from "./product-detail.mjs";

const slug = document.documentElement.dataset.productSlug;
const product = productBySlug.get(slug);

if (!product || !product.detailPath) {
  document.body.innerHTML = `<main class="container product-page"><h1>Producto no encontrado</h1><p><a href="/#productos">Volver a productos</a></p></main>`;
} else {
  document.title = `${product.name} | Nutoria`;
  if (!document.querySelector("[data-product-detail]")) {
    document.body.innerHTML = renderProductBody(product);
  }
  initializeProductDetail(slug);
  await import("./cart.mjs");
  await import("./whatsapp.mjs");
}
