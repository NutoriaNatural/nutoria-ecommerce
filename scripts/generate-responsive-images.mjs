import { stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { products } from "../data/products.mjs";
import {
  PRODUCT_IMAGE_SOURCE_WIDTH,
  PRODUCT_IMAGE_WIDTHS,
} from "../lib/responsive-product-images.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sources = [...new Set(products.map(({ image }) => image))];
let outputBytes = 0;
let outputCount = 0;

for (const source of sources) {
  if (!/\/01\.webp$/u.test(source)) {
    throw new Error(`La imagen principal no admite derivados WebP: ${source}`);
  }

  const input = resolve(root, `.${source}`);
  const metadata = await sharp(input).metadata();
  if (metadata.width !== PRODUCT_IMAGE_SOURCE_WIDTH || metadata.height !== PRODUCT_IMAGE_SOURCE_WIDTH) {
    throw new Error(`Dimensiones inesperadas en ${source}: ${metadata.width}x${metadata.height}`);
  }

  for (const width of PRODUCT_IMAGE_WIDTHS) {
    const output = input.replace(/\.webp$/u, `-${width}.webp`);
    await sharp(input)
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 88, effort: 6, smartSubsample: true })
      .toFile(output);
    outputBytes += (await stat(output)).size;
    outputCount += 1;
  }
}

console.log(`Imágenes responsive generadas: ${outputCount} archivos (${(outputBytes / 1024 / 1024).toFixed(2)} MiB).`);
