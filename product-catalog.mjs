export { PRODUCT_CATEGORIES, products } from "./data/products.mjs";
import { PRODUCT_CATEGORIES, products } from "./data/products.mjs";

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

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";
  card.dataset.category = product.category;

  const imageContainer = document.createElement("div");
  imageContainer.className = "product-card__image";
  const image = document.createElement("img");
  image.src = product.image;
  image.alt = `Fotografía de ${product.name}`;
  image.width = 600;
  image.height = 600;
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

const grid = typeof document !== "undefined" ? document.querySelector("[data-product-grid]") : null;
if (grid) {
  const cards = products.map(createProductCard);
  grid.replaceChildren(...cards);

  const searchInput = document.querySelector("[data-product-search]");
  const categoryContainer = document.querySelector("[data-category-filters]");
  const resultCount = document.querySelector("[data-product-count]");
  const emptyState = document.querySelector("[data-catalog-empty]");
  const clearButton = document.querySelector("[data-catalog-clear]");
  const featuredCategoryLinks = document.querySelectorAll("[data-catalog-category]");
  const productSection = document.querySelector("#productos");
  let activeCategory = "Todos";

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
    const matches = new Set(filterProducts(products, {
      query: searchInput?.value,
      category: activeCategory,
    }).map((product) => product.id));

    cards.forEach((card, index) => { card.hidden = !matches.has(products[index].id); });
    categoryButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.category === activeCategory));
    });
    const count = matches.size;
    if (resultCount) resultCount.textContent = `${count} ${count === 1 ? "producto" : "productos"}`;
    if (emptyState) emptyState.hidden = count > 0;
  };

  const selectCategory = (category) => {
    activeCategory = category;
    applyFilters();
  };

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => selectCategory(button.dataset.category));
  });
  featuredCategoryLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      selectCategory(link.dataset.catalogCategory);
      productSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  searchInput?.addEventListener("input", applyFilters);
  clearButton?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    selectCategory("Todos");
    searchInput?.focus();
  });
  applyFilters();
}
