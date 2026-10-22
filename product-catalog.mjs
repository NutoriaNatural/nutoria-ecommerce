export { PRODUCT_CATEGORIES, products } from "./data/products.mjs";
import { PRODUCT_CATEGORIES, products } from "./data/products.mjs";
import { CATALOG_IMAGE_SIZES, productImageAttributes } from "./lib/responsive-product-images.mjs";

const formatMoney = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

export const formatPresentation = (value) =>
  value.replace(/(\d[\d.]*)\s*(mg|kg|g|ml|l)\b/giu, "$1 $2");

export const normalizeSearchText = (value) => String(value ?? "")
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .toLocaleLowerCase("es-CO")
  .trim();

export function filterProducts(productList, { query = "", category = "Todos" } = {}) {
  const normalizedQuery = normalizeSearchText(query);
  return productList.filter((product) => {
    const matchesCategory = category === "Todos" || product.category === category;
    const matchesQuery = !normalizedQuery || normalizeSearchText(product.name).includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });
}

const detailFields = [
  ["ingredients", "Ingredientes"],
  ["content", "Contenido"],
  ["nutrition", "Información nutricional"],
  ["usage", "Forma de consumo"],
  ["sanitaryRegistration", "Registro sanitario"],
];

function createProductDetails(product) {
  const availableFields = detailFields.filter(([key]) => product[key].trim());
  if (!availableFields.length) return null;

  const details = document.createElement("details");
  details.className = "product-card__details";
  const summary = document.createElement("summary");
  summary.textContent = "Información para decidir";
  const list = document.createElement("dl");
  list.className = "product-card__details-list";

  availableFields.forEach(([key, label]) => {
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = product[key];
    list.append(term, description);
  });

  details.append(summary, list);
  return details;
}

export function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";
  card.dataset.category = product.category;

  const imageContainer = document.createElement("div");
  imageContainer.className = "product-card__image";
  const image = document.createElement("img");
  const responsiveImage = productImageAttributes(product.image, CATALOG_IMAGE_SIZES);
  image.src = responsiveImage.src;
  image.srcset = responsiveImage.srcset;
  image.sizes = responsiveImage.sizes;
  image.alt = `Fotografía de ${product.name}`;
  image.width = 1563;
  image.height = 1563;
  image.loading = "lazy";
  if (product.detailPath) {
    const imageLink = document.createElement("a");
    imageLink.className = "product-card__image-link";
    imageLink.href = product.detailPath;
    imageLink.setAttribute("aria-label", `Ver ${product.name}`);
    imageLink.append(image);
    imageContainer.append(imageLink);
  } else {
    imageContainer.append(image);
  }

  const body = document.createElement("div");
  body.className = "product-card__body";

  const name = document.createElement("h3");
  name.className = "product-card__name";
  if (product.detailPath) {
    const nameLink = document.createElement("a");
    nameLink.className = "product-card__name-link";
    nameLink.href = product.detailPath;
    nameLink.textContent = product.name;
    name.append(nameLink);
  } else {
    name.textContent = product.name;
  }

  const composition = document.createElement("p");
  composition.className = "product-card__composition";
  if (product.composition.length) {
    const visibleIngredients = product.composition.slice(0, 3);
    const remaining = product.composition.length - visibleIngredients.length;
    composition.textContent = remaining > 0
      ? `${visibleIngredients.join(", ")} + ${remaining} más`
      : visibleIngredients.join(", ");
  }

  const presentation = document.createElement("div");
  presentation.className = "product-card__field";
  const presentationLabel = document.createElement("span");
  presentationLabel.className = "product-card__label";
  presentationLabel.textContent = "Presentación";
  const presentationValue = document.createElement(product.variants.length ? "select" : "p");
  presentationValue.className = product.variants.length
    ? "product-card__presentation"
    : "product-card__value product-card__presentation-value";
  if (product.variants.length) {
    presentationValue.setAttribute("aria-label", `Presentación de ${product.name}`);
    product.variants.forEach((variant, variantIndex) => {
      const option = document.createElement("option");
      option.value = String(variantIndex);
      option.textContent = formatPresentation(variant.presentation);
      presentationValue.append(option);
    });
    const defaultVariantIndex = product.variants.findIndex(({ presentation }) => presentation === "250g");
    if (defaultVariantIndex >= 0) presentationValue.value = String(defaultVariantIndex);
  } else {
    presentationValue.textContent = formatPresentation(product.presentation);
  }
  presentation.append(presentationLabel, presentationValue);

  const price = document.createElement("div");
  price.className = "product-card__field product-card__field--price";
  const priceLabel = document.createElement("span");
  priceLabel.className = "product-card__label";
  priceLabel.textContent = "Precio";
  const priceValue = document.createElement("p");
  priceValue.className = "product-card__value";
  priceValue.textContent = Number.isInteger(product.price) ? formatMoney(product.price) : "";
  price.append(priceLabel, priceValue);

  const button = document.createElement("button");
  button.className = "product-card__button";
  button.type = "button";
  button.textContent = "Agregar";
  if (Number.isInteger(product.price) && product.price > 0) {
    button.dataset.productId = product.id;
    button.dataset.productName = product.name;
    button.dataset.productDisplayName = product.name;
    button.dataset.productPresentation = formatPresentation(product.presentation);
    button.dataset.productPrice = String(product.price);
    button.dataset.productImage = product.image;
  } else {
    button.disabled = true;
  }

  if (product.variants.length) {
    const updateVariant = () => {
      const variant = product.variants[Number(presentationValue.value)];
      priceValue.textContent = formatMoney(variant.price);
      button.dataset.productId = `${product.id}-${variant.id}`;
      button.dataset.productName = `${product.name} ${variant.presentation}`;
      button.dataset.productDisplayName = product.name;
      button.dataset.productPresentation = formatPresentation(variant.presentation);
      button.dataset.productPrice = String(variant.price);
      button.dataset.productImage = product.image;
    };
    presentationValue.addEventListener("change", updateVariant);
    updateVariant();
  }

  const details = createProductDetails(product);
  body.append(name);
  if (product.composition.length) body.append(composition);
  body.append(presentation, price);
  if (details) body.append(details);
  body.append(button);
  card.append(imageContainer, body);
  return card;
}

export const INITIAL_CATALOG_BATCH_SIZE = 12;
export const CATALOG_BATCH_SIZE = 16;

const scheduleIdle = (callback) => {
  const scheduled = { frameId: null, idleId: null, timerId: null };
  scheduled.frameId = window.requestAnimationFrame(() => {
    scheduled.frameId = null;
    if (typeof window.requestIdleCallback === "function") {
      scheduled.idleId = window.requestIdleCallback(callback, { timeout: 250 });
    } else {
      scheduled.timerId = window.setTimeout(callback, 0);
    }
  });
  return scheduled;
};

const cancelIdle = (scheduled) => {
  if (!scheduled) return;
  if (scheduled.frameId !== null) window.cancelAnimationFrame(scheduled.frameId);
  if (scheduled.idleId !== null) window.cancelIdleCallback(scheduled.idleId);
  if (scheduled.timerId !== null) window.clearTimeout(scheduled.timerId);
};

export function createProgressiveRenderer({
  container,
  items,
  renderItem,
  initialBatchSize = INITIAL_CATALOG_BATCH_SIZE,
  batchSize = CATALOG_BATCH_SIZE,
  schedule = scheduleIdle,
  cancel = cancelIdle,
}) {
  let cursor = 0;
  let scheduled = null;
  let cancelled = false;

  container.replaceChildren();
  container.dataset.initialProductCount = String(Math.min(initialBatchSize, items.length));
  container.dataset.renderedProductCount = "0";
  container.dataset.catalogComplete = String(items.length === 0);

  const appendBatch = (size) => {
    if (cancelled) return;
    const end = Math.min(cursor + size, items.length);
    const nodes = items.slice(cursor, end).map(renderItem);
    if (nodes.length) {
      const fragment = container.ownerDocument.createDocumentFragment();
      fragment.append(...nodes);
      container.append(fragment);
    }
    cursor = end;
    container.dataset.renderedProductCount = String(cursor);
    container.dataset.catalogComplete = String(cursor >= items.length);
  };

  const scheduleNext = () => {
    if (cancelled || cursor >= items.length) return;
    scheduled = schedule(() => {
      scheduled = null;
      appendBatch(batchSize);
      scheduleNext();
    });
  };

  appendBatch(initialBatchSize);
  scheduleNext();

  return {
    cancel() {
      cancelled = true;
      cancel(scheduled);
      scheduled = null;
    },
    get renderedCount() { return cursor; },
  };
}

const grid = typeof document !== "undefined" ? document.querySelector("[data-product-grid]") : null;
if (grid) {
  const searchInput = document.querySelector("[data-product-search]");
  const categoryContainer = document.querySelector("[data-category-filters]");
  const resultCount = document.querySelector("[data-product-count]");
  const emptyState = document.querySelector("[data-catalog-empty]");
  const clearButton = document.querySelector("[data-catalog-clear]");
  const featuredCategoryLinks = document.querySelectorAll("[data-catalog-category]");
  const productSection = document.querySelector("#productos");
  let activeCategory = "Todos";
  let activeRenderer = null;
  let initialRenderFrame = null;

  const categoryButtons = ["Todos", ...PRODUCT_CATEGORIES].map((category) => {
    const button = document.createElement("button");
    button.className = "catalog-category";
    button.type = "button";
    button.textContent = category;
    button.dataset.category = category;
    button.setAttribute("aria-pressed", String(category === activeCategory));
    categoryContainer?.append(button);
    return button;
  });

  const applyFilters = () => {
    const matches = filterProducts(products, {
      query: searchInput?.value,
      category: activeCategory,
    });

    activeRenderer?.cancel();
    activeRenderer = createProgressiveRenderer({
      container: grid,
      items: matches,
      renderItem: createProductCard,
    });
    categoryButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.category === activeCategory));
    });
    const count = matches.length;
    if (resultCount) resultCount.textContent = `${count} ${count === 1 ? "producto" : "productos"}`;
    if (emptyState) emptyState.hidden = count > 0;
  };

  const selectCategory = (category) => {
    if (initialRenderFrame !== null) {
      window.cancelAnimationFrame(initialRenderFrame);
      initialRenderFrame = null;
    }
    activeCategory = category;
    applyFilters();
  };

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => selectCategory(button.dataset.category));
  });
  featuredCategoryLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (link.getAttribute("href") !== "#productos") return;
      event.preventDefault();
      selectCategory(link.dataset.catalogCategory);
      productSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  searchInput?.addEventListener("input", () => {
    if (initialRenderFrame !== null) {
      window.cancelAnimationFrame(initialRenderFrame);
      initialRenderFrame = null;
    }
    activeCategory = "Todos";
    applyFilters();
    if (searchInput.value.trim()) {
      productSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  clearButton?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    selectCategory("Todos");
    searchInput?.focus();
  });
  window.requestAnimationFrame(() => {
    initialRenderFrame = window.requestAnimationFrame(() => {
      initialRenderFrame = null;
      applyFilters();
    });
  });
}
