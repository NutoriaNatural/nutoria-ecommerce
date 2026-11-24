import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("la jerarquía compartida usa Lora y Jakarta sin cambiar los controles aprobados", () => {
  const css = read("styles.css");
  assert.match(css, /font-family: "Plus Jakarta Sans", Arial, sans-serif/);
  assert.match(css, /font-family: Lora, Georgia, serif/);
  assert.match(css, /\.section-frame--hero h1 \{ font-size: 52px; line-height: 1\.15;/);
  assert.match(css, /\.section-frame--hero h1 \{ font-size: 36px;/);
  assert.match(css, /#titulo-categorias \{ font-size: clamp\(25px, 7\.5vw, 28px\); white-space: nowrap;/);
  assert.match(css, /\.product-grid \.product-card__name\s*\{[^}]*min-height: 0;[^}]*overflow: visible;[^}]*-webkit-line-clamp: unset;/);
  assert.match(css, /\.product-grid \.product-card__body > \.product-card__button \{ margin-top: auto;/);
  assert.match(css, /\.product-grid \.product-card__button\s*\{[^}]*height: 34px;[^}]*border-radius: 16px;/);
  assert.match(css, /\.product-grid \.product-card__presentation-option\s*\{[^}]*height: 28px;[^}]*border-radius: 13px;/);
  assert.match(css, /\.product-grid \.product-card__button\s*\{\s*font-size: 16px;/);
});

test("Por qué Nutoria conserva el texto separado en dos párrafos", () => {
  const home = read("index.html");
  const section = home.match(/<h2 id="titulo-por-que">[\s\S]*?<\/section>/)[0];
  assert.equal((section.match(/<p class="section-copy section-copy--large">/g) || []).length, 2);
  assert.match(section, /vida\.<\/p>\s*<p class="section-copy section-copy--large">Inspiramos a las personas/);
  assert.match(read("product-detail.css"), /\.product-purchase__price \{ font-size: 32px; font-weight: 700;/);
});

test("la presentación única es un indicador fijo y solo las dos etiquetas de ficha aumentan 2 px", () => {
  const css = read("styles.css");
  const detail = read("product-detail.css");
  assert.match(css, /\.product-grid \.product-card__presentation-value\s*\{[^}]*width: fit-content;[^}]*height: 30px;[^}]*border-radius: 13px;[^}]*background: var\(--verde-nutoria\);/);
  assert.match(css, /\.product-grid \.product-card__presentation-value\s*\{\s*height: 28px;/);
  assert.match(detail, /\.product-presentation__single\s*\{[^}]*width: fit-content;[^}]*background: var\(--verde-nutoria\);/);
  assert.match(detail, /\.product-presentation__label\s*\{[^}]*font-size: 13\.5px;/);
  assert.match(detail, /\.product-presentation__label\s*\{\s*font-size: 12\.5px;/);
  assert.match(detail, /\.product-purchase__quantity > span \{ font-size: 18px; \}/);
});
