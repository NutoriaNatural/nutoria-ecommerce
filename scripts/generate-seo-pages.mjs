import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { products } from "../data/products.mjs";
import { renderProductDocument, renderSitemap } from "../lib/product-page-template.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

for (const product of products) {
  if (!product.detailPath) throw new Error(`El producto ${product.id} no tiene detailPath.`);
  const directory = resolve(root, `.${product.detailPath}`);
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, "index.html"), renderProductDocument(product), "utf8");
}

await writeFile(resolve(root, "sitemap.xml"), renderSitemap(products), "utf8");
console.log(`SEO generado: ${products.length} fichas y ${products.length + 1} URLs en sitemap.xml.`);
