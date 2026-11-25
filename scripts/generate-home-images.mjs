import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(root, "assets/images/home-responsive");
export const HOME_IMAGE_SOURCES = [
  ["hero", "assets/images/hero/imagen-hero-nutoria.png", [640, 960, 1440, 1920]],
  ...["frutos-secos-y-mas", "semillas", "deshidratados", "suplementos-y-alimentos-naturales"]
    .map((name) => [name, `assets/images/categories/${name}.webp`, [240]]),
  ["wompi", "assets/images/payment-methods/wompi.jpg", [320, 640]],
  ["visa", "assets/images/payment-methods/visa.webp", [240, 480]],
  ["mastercard", "assets/images/payment-methods/mastercard.png", [240, 480]],
  ["american-express", "assets/images/payment-methods/american-express.png", [240, 480]],
  ["pse", "assets/images/payment-methods/pse.png", [240]],
];

export async function generateHomeImages() {
  await mkdir(outputDirectory, { recursive: true });
  let total = 0;
  for (const [name, source, widths] of HOME_IMAGE_SOURCES) {
    for (const width of widths) {
      const output = resolve(outputDirectory, `${name}-${width}.webp`);
      // Same Sharp/WebP pipeline as product derivatives. Lossless encoding avoids
      // compression artifacts in small package lettering and transparent edges.
      await sharp(resolve(root, source))
        .resize({ width, withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
        .keepIccProfile()
        .webp({ lossless: true, effort: 6 })
        .toFile(output);
      const bytes = (await stat(output)).size;
      if (bytes >= (await stat(resolve(root, source))).size) {
        throw new Error(`Derivative does not reduce size: ${output}`);
      }
      total += bytes;
      console.log(`${name}-${width}.webp: ${bytes} bytes`);
    }
  }
  console.log(`Home derivatives: ${total} bytes. Originals untouched.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateHomeImages();
}
