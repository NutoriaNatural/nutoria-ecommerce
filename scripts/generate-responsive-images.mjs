import { stat } from "node:fs/promises";
import { extname, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { products } from "../data/products.mjs";
import {
  PRODUCT_IMAGE_SOURCE_WIDTH,
  PRODUCT_IMAGE_WIDTHS,
  PRODUCT_THUMBNAIL_WIDTH,
  productThumbnailPath,
} from "../lib/responsive-product-images.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const homepageSources = [
  "/assets/images/optimized/Almendras.jpg",
  "/assets/images/optimized/Ajonjoli.jpg",
  "/assets/images/optimized/Mango Deshidratado.jpg",
  "/assets/images/optimized/Colageno Marino.jpg",
];
const sources = [...new Set(products.map(({ image }) => image))];
const gallerySources = [...new Set(products.flatMap(({ images }) => images))];
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

for (const source of gallerySources) {
  const input = resolve(root, `.${source}`);
  const output = resolve(root, `.${productThumbnailPath(source)}`);
  await sharp(input)
    .resize({
      width: PRODUCT_THUMBNAIL_WIDTH,
      height: PRODUCT_THUMBNAIL_WIDTH,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 88, effort: 6, smartSubsample: true })
    .toFile(output);
  outputBytes += (await stat(output)).size;
  outputCount += 1;
}

for (const source of homepageSources) {
  const input = resolve(root, `.${source}`);
  const extension = extname(input);
  for (const width of [320, 480]) {
    const output = input.replace(extension, `-${width}.webp`);
    await sharp(input)
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 88, effort: 6, smartSubsample: true })
      .toFile(output);
    outputBytes += (await stat(output)).size;
    outputCount += 1;
  }
}

const logoInput = resolve(root, "assets/images/logo-nutoria-180.png");
const logoOutput = resolve(root, "assets/images/logo-nutoria-header-120.webp");
await sharp(logoInput)
  .resize({ width: 120, height: 120, fit: "contain", withoutEnlargement: true })
  .webp({ quality: 92, effort: 6, smartSubsample: true })
  .toFile(logoOutput);
outputBytes += (await stat(logoOutput)).size;
outputCount += 1;

console.log(`Imágenes responsive generadas: ${outputCount} archivos (${(outputBytes / 1024 / 1024).toFixed(2)} MiB).`);
