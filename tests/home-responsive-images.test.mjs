import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync, existsSync } from "node:fs";
import sharp from "sharp";
import { HOME_IMAGE_SOURCES } from "../scripts/generate-home-images.mjs";

test("los derivados Home conservan el lienzo, transparencia y píxeles sin pérdida tras redimensionar", async () => {
  for (const [name, source, widths] of HOME_IMAGE_SOURCES) {
    assert.ok(existsSync(source), source);
    for (const width of widths) {
      const output = `assets/images/home-responsive/${name}-${width}.webp`;
      assert.ok(statSync(output).size < statSync(source).size, output);
      const expected = await sharp(source).resize({ width, withoutEnlargement: true, kernel: sharp.kernel.lanczos3 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const actual = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      assert.equal(actual.info.width, expected.info.width, output);
      assert.equal(actual.info.height, expected.info.height, output);
      for (let i = 0; i < expected.data.length; i += 4) {
        assert.equal(actual.data[i + 3], expected.data[i + 3], `${output}: alpha`);
        if (expected.data[i + 3] > 0) {
          assert.equal(actual.data[i], expected.data[i], `${output}: red`);
          assert.equal(actual.data[i + 1], expected.data[i + 1], `${output}: green`);
          assert.equal(actual.data[i + 2], expected.data[i + 2], `${output}: blue`);
        }
      }
    }
  }
});

test("el Hero se descubre en HTML y es prioritario; el resto continúa con lazy", () => {
  const html = readFileSync("index.html", "utf8");
  const hero = html.match(/<img class="hero-composition__image"[^>]*>/)[0];
  assert.match(hero, /srcset="[^"]+hero-640\.webp 640w/);
  assert.match(hero, /sizes="/);
  assert.match(hero, /loading="eager"/);
  assert.match(hero, /fetchpriority="high"/);
  assert.match(hero, /width="4800" height="3200"/);
  assert.ok(html.includes('src="assets/images/logo-nutoria-footer.webp"'));
  for (const tag of html.matchAll(/<img[^>]*src="assets\/images\/home-responsive\/(?!hero)[^"]+"[^>]*>/g)) {
    assert.match(tag[0], /loading="lazy"/);
  }
  for (const match of html.matchAll(/assets\/images\/home-responsive\/[a-z0-9-]+\.webp/g)) {
    assert.ok(existsSync(match[0]), match[0]);
  }
});
