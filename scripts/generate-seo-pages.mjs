import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { products } from "../data/products.mjs";
import { categories } from "../data/categories.mjs";
import { renderCategoryDocument } from "../lib/category-page-template.mjs";
import { renderProductDocument, renderSitemap } from "../lib/product-page-template.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

for (const product of products) {
  if (!product.detailPath) throw new Error(`El producto ${product.id} no tiene detailPath.`);
  const directory = resolve(root, `.${product.detailPath}`);
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, "index.html"), renderProductDocument(product), "utf8");
}

for (const category of categories) {
  const categoryProducts = products.filter((product) => product.category === category.name);
  if (!categoryProducts.length) throw new Error(`La categoría ${category.name} no tiene productos.`);
  const directory = resolve(root, `.${category.path}`);
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, "index.html"), renderCategoryDocument(category, categoryProducts), "utf8");
}

await writeFile(resolve(root, "sitemap.xml"), renderSitemap(products), "utf8");
console.log(`SEO generado: ${products.length} fichas, ${categories.length} categorías y ${products.length + categories.length + 1} URLs en sitemap.xml.`);
