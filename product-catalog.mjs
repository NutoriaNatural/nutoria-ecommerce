const standardVariants = (prices) =>
  ["1.000g", "500g", "250g", "125g"].map((presentation, index) => ({
    id: presentation.replace(".", ""),
    presentation,
    price: prices[index],
  }));

const fixedPrice = (presentation, price) => ({ presentation, price, variants: [] });

const productPricing = {
  "7 Colagenos": fixedPrice("", null),
  "Ajonjoli Negro": { variants: standardVariants([51000, 27000, 14000, 7000]) },
  "Ajonjoli Tostado": { variants: standardVariants([39000, 21000, 11000, 5500]) },
  Ajonjoli: { variants: standardVariants([35000, 19000, 10000, 5000]) },
  Albaricoques: { variants: standardVariants([111000, 57000, 29000, 14500]) },
  "Almendra Laminada": { variants: standardVariants([83000, 43000, 22000, 11000]) },
  Almendras: fixedPrice("", null),
  Amaranto: { variants: standardVariants([31000, 17000, 9000, 4500]) },
  Arandanos: { variants: standardVariants([45000, 25000, 13000, 6500]) },
  Avellanas: { variants: standardVariants([153000, 79000, 40000, 20000]) },
  "Avena en Hojuelas sin Gluten": { variants: standardVariants([13000, 7000, 4000, 2000]) },
  "Brevas Meladas": { variants: standardVariants([39000, 21000, 11000, 5500]) },
  "Calcio Coral Marino": fixedPrice("1.000g", 89900),
  "Ciruelas Pasas": { variants: standardVariants([39000, 21000, 11000, 5500]) },
  "Coco Acaramelado": { variants: standardVariants([89000, 47000, 24000, 11000]) },
  "Coco Laminado Deshidratado": { variants: standardVariants([65000, 35000, 18000, 9000]) },
  "Coffe + Colageno": fixedPrice("250g", 32900),
  "Colageno Hidrolizado": { variants: standardVariants([153000, 79000, 40000, 20000]) },
  "Colageno Marino": fixedPrice("1.000g", 89900),
  Datiles: { variants: standardVariants([53000, 29000, 15000, 7500]) },
  "Flor de Jamaica": { variants: standardVariants([65000, 35000, 18000, 9000]) },
  "Garbanzo Tostados": { variants: standardVariants([81000, 43000, 22000, 11000]) },
  "Habas Saladas": { variants: standardVariants([47000, 26000, 13000, 6500]) },
  "Harina de Almendras": { variants: standardVariants([81000, 43000, 22000, 11000]) },
  "Lentejas Tostadas": { variants: standardVariants([81000, 43000, 22000, 11000]) },
  "Maca Negra, Roja, Shihua Y Amarilla": fixedPrice("1.000g", 89900),
  "Macadamia Acaramelada": { variants: standardVariants([129000, 67000, 34000, 17000]) },
  Macadamia: { variants: standardVariants([113000, 59000, 30000, 15000]) },
  "Mango Deshidratado": { variants: standardVariants([153000, 79000, 40000, 20000]) },
  "Mani Confitado": { variants: standardVariants([28000, 15000, 8000, 4000]) },
  Marañon: { variants: standardVariants([113000, 59000, 30000, 15000]) },
  "Mix Golden (leche dorada)": fixedPrice("250g", 31900),
  "Mix Rojos Deshidratado": { variants: standardVariants([153000, 79000, 40000, 20000]) },
  "Mix Tropical Deshidratado": { variants: standardVariants([153000, 79000, 40000, 20000]) },
  "Nibs de Cacao": { variants: standardVariants([105000, 55000, 28000, 14000]) },
  "Nuez del Brasil": { variants: standardVariants([113000, 59000, 30000, 15000]) },
  "Nuez Nogal": { variants: standardVariants([93000, 49000, 25000, 12500]) },
  "Nuez Pecana": { variants: standardVariants([153000, 79000, 40000, 20000]) },
  "Piña Deshidratada": { variants: standardVariants([153000, 79000, 40000, 20000]) },
  Pistachos: { variants: standardVariants([113000, 59000, 30000, 15000]) },
  "Proteina Whey": fixedPrice("900g", 179900),
  Quinua: { variants: standardVariants([29000, 17000, 9000, 4500]) },
  Resveratrol: fixedPrice("90g (90 und)", 63900),
  "Sales de Magnesio Mg2": fixedPrice("1.000g", 89900),
  "Semillas de Amapola": { variants: standardVariants([81000, 43000, 22000, 11000]) },
  "Te Chai": fixedPrice("250g", 31900),
  "Uvas Pasas": { variants: standardVariants([24000, 13000, 7000, 3500]) },
};

export const PRODUCT_CATEGORIES = Object.freeze([
  "Frutos secos, semillas y granos",
  "Deshidratados",
  "Alimentos naturales",
  "Suplementos",
]);

const productClassification = [
  ["7 Colagenos", "Suplementos"],
  ["Ajonjoli Negro", "Frutos secos, semillas y granos"],
  ["Ajonjoli Tostado", "Frutos secos, semillas y granos"],
  ["Ajonjoli", "Frutos secos, semillas y granos"],
  ["Albaricoques", "Deshidratados"],
  ["Almendra Laminada", "Frutos secos, semillas y granos"],
  ["Almendras", "Frutos secos, semillas y granos"],
  ["Amaranto", "Frutos secos, semillas y granos"],
  ["Arandanos", "Deshidratados"],
  ["Avellanas", "Frutos secos, semillas y granos"],
  ["Avena en Hojuelas sin Gluten", "Alimentos naturales"],
  ["Brevas Meladas", "Deshidratados"],
  ["Calcio Coral Marino", "Suplementos"],
  ["Ciruelas Pasas", "Deshidratados"],
  ["Coco Acaramelado", "Deshidratados"],
  ["Coco Laminado Deshidratado", "Deshidratados"],
  ["Coffe + Colageno", "Suplementos"],
  ["Colageno Hidrolizado", "Suplementos"],
  ["Colageno Marino", "Suplementos"],
  ["Datiles", "Deshidratados"],
  ["Flor de Jamaica", "Alimentos naturales"],
  ["Garbanzo Tostados", "Frutos secos, semillas y granos"],
  ["Habas Saladas", "Frutos secos, semillas y granos"],
  ["Harina de Almendras", "Alimentos naturales"],
  ["Lentejas Tostadas", "Frutos secos, semillas y granos"],
  ["Maca Negra, Roja, Shihua Y Amarilla", "Alimentos naturales"],
  ["Macadamia Acaramelada", "Frutos secos, semillas y granos"],
  ["Macadamia", "Frutos secos, semillas y granos"],
  ["Mango Deshidratado", "Deshidratados"],
  ["Mani Confitado", "Frutos secos, semillas y granos"],
  ["Marañon", "Frutos secos, semillas y granos"],
  ["Mix Golden (leche dorada)", "Alimentos naturales"],
  ["Mix Rojos Deshidratado", "Deshidratados"],
  ["Mix Tropical Deshidratado", "Deshidratados"],
  ["Nibs de Cacao", "Alimentos naturales"],
  ["Nuez del Brasil", "Frutos secos, semillas y granos"],
  ["Nuez Nogal", "Frutos secos, semillas y granos"],
  ["Nuez Pecana", "Frutos secos, semillas y granos"],
  ["Piña Deshidratada", "Deshidratados"],
  ["Pistachos", "Frutos secos, semillas y granos"],
  ["Proteina Whey", "Suplementos"],
  ["Quinua", "Frutos secos, semillas y granos"],
  ["Resveratrol", "Suplementos"],
  ["Sales de Magnesio Mg2", "Suplementos"],
  ["Semillas de Amapola", "Frutos secos, semillas y granos"],
  ["Te Chai", "Alimentos naturales"],
  ["Uvas Pasas", "Deshidratados"],
];

// Edita presentación, precio y categoría únicamente con datos reales aprobados.
export const products = productClassification.map(([name, category], index) => {
  const pricing = productPricing[name];
  const variants = pricing.variants;
  const firstVariant = variants[0];

  return {
    id: `producto-${index + 1}`,
    name,
    image: `assets/images/optimized/${name}.jpg`,
    presentation: pricing.presentation ?? firstVariant.presentation,
    price: Object.hasOwn(pricing, "price") ? pricing.price : firstVariant.price,
    variants,
    category,
    ingredients: "",
    content: "",
    nutrition: "",
    usage: "",
    sanitaryRegistration: "",
  };
});

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
  imageContainer.append(image);

  const body = document.createElement("div");
  body.className = "product-card__body";

  const name = document.createElement("h3");
  name.className = "product-card__name";
  name.textContent = product.name;

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
  body.append(name, presentation, price);
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
