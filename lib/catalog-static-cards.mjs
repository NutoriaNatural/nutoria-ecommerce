import { productOptions, selectedOptionIndex } from "./product-presentation-options.mjs";
import { CATALOG_IMAGE_SIZES, productImageAttributes } from "./responsive-product-images.mjs";
import { formatPresentation } from "../product-catalog.mjs";

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("'", "&#39;");
const money = (price) => new Intl.NumberFormat("es-CO", {
  style: "currency", currency: "COP", maximumFractionDigits: 0,
}).format(price);

// Initial, ordinary HTML. The existing progressive renderer replaces these
// nodes when JavaScript starts; without JavaScript all detail links remain.
export function renderStaticCatalogCard(product) {
  const options = productOptions(product);
  const selectedIndex = selectedOptionIndex(product);
  const selected = options[selectedIndex];
  const multiple = options.length > 1;
  const mobileThree = multiple && options.length === 4 && options.every((option, index) =>
    option.presentation.replace(/[.\s]/g, "") === ["125g", "250g", "500g", "1000g"][index]);
  const image = productImageAttributes(product.image, CATALOG_IMAGE_SIZES);
  const presentation = multiple
    ? `<div class="product-card__presentation product-card__presentation--buttons${options.length === 4 ? " product-card__presentation--four" : ""}" role="group" aria-label="Presentación de ${escapeHtml(product.name)}"${mobileThree ? ' data-mobile-three="true"' : ""}>${options.map((option, index) => `<button class="product-card__presentation-option" type="button" disabled aria-pressed="${index === selectedIndex}"${mobileThree && index === 3 ? ' data-mobile-detail-only="true"' : ""}>${escapeHtml(formatPresentation(option.presentation))}</button>`).join("")}</div>`
    : `<p class="product-card__value product-card__presentation-value">${escapeHtml(formatPresentation(selected.presentation))}</p>`;
  const composition = product.composition.length
    ? `<p class="product-card__composition">${escapeHtml(product.composition.slice(0, 3).join(", "))}${product.composition.length > 3 ? ` + ${product.composition.length - 3} más` : ""}</p>` : "";
  const fields = [["ingredients", "Ingredientes"], ["content", "Contenido"], ["nutrition", "Información nutricional"], ["usage", "Forma de consumo"], ["sanitaryRegistration", "Registro sanitario"]]
    .filter(([key]) => product[key].trim());
  const details = fields.length ? `<details class="product-card__details"><summary>Información para decidir</summary><dl class="product-card__details-list">${fields.map(([key, label]) => `<dt>${label}</dt><dd>${escapeHtml(product[key])}</dd>`).join("")}</dl></details>` : "";
  return `<article class="product-card" data-category="${escapeHtml(product.category)}">
  <div class="product-card__image"><a class="product-card__image-link" href="${escapeHtml(product.detailPath)}" aria-label="Ver ${escapeHtml(product.name)}"><img src="${escapeHtml(image.src)}" srcset="${escapeHtml(image.srcset)}" sizes="${escapeHtml(image.sizes)}" alt="Fotografía de ${escapeHtml(product.name)}" width="1563" height="1563" loading="lazy" /></a></div>
  <div class="product-card__body">
    <h3 class="product-card__name"><a class="product-card__name-link" href="${escapeHtml(product.detailPath)}">${escapeHtml(product.name)}</a></h3>
    ${composition}
    <div class="product-card__field"><span class="product-card__label product-card__presentation-label">Presentación</span>${presentation}</div>
    <div class="product-card__field product-card__field--price"><span class="product-card__label">Precio</span><p class="product-card__value">${escapeHtml(money(selected.price))}</p></div>
    ${details}
    <button class="product-card__button" type="button" disabled data-static-product-id="${escapeHtml(selected.id)}" data-product-price="${selected.price}">Agregar al carrito</button>
  </div>
</article>`.replace(/[\t ]+$/gm, "");
}
