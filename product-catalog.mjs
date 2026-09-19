import { createProductWhatsAppUrl } from "./whatsapp.mjs";

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

// Edita `presentation`, `price` y `category` únicamente con los datos reales aprobados.
export const products = [
  "7 Colagenos", "Ajonjoli Negro", "Ajonjoli Tostado", "Ajonjoli", "Albaricoques",
  "Almendra Laminada", "Almendras", "Amaranto", "Arandanos", "Avellanas",
  "Avena en Hojuelas sin Gluten", "Brevas Meladas", "Calcio Coral Marino", "Ciruelas Pasas",
  "Coco Acaramelado", "Coco Laminado Deshidratado", "Coffe + Colageno", "Colageno Hidrolizado",
  "Colageno Marino", "Datiles", "Flor de Jamaica", "Garbanzo Tostados", "Habas Saladas",
  "Harina de Almendras", "Lentejas Tostadas", "Maca Negra, Roja, Shihua Y Amarilla",
  "Macadamia Acaramelada", "Macadamia", "Mango Deshidratado", "Mani Confitado", "Marañon",
  "Mix Golden (leche dorada)", "Mix Rojos Deshidratado", "Mix Tropical Deshidratado",
  "Nibs de Cacao", "Nuez del Brasil", "Nuez Nogal", "Nuez Pecana", "Piña Deshidratada",
  "Pistachos", "Proteina Whey", "Quinua", "Resveratrol", "Sales de Magnesio Mg2",
  "Semillas de Amapola", "Te Chai", "Uvas Pasas",
].map((name, index) => {
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
    category: "",
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
    : "product-card__value";
  if (product.variants.length) {
    presentationValue.setAttribute("aria-label", `Presentación de ${product.name}`);
    product.variants.forEach((variant, variantIndex) => {
      const option = document.createElement("option");
      option.value = String(variantIndex);
      option.textContent = variant.presentation;
      presentationValue.append(option);
    });
  } else {
    presentationValue.textContent = product.presentation;
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
  button.textContent = "Comprar";
  if (Number.isInteger(product.price) && product.price > 0) {
    button.dataset.productId = product.id;
    button.dataset.productName = product.name;
    button.dataset.productPrice = String(product.price);
  } else {
    button.disabled = true;
  }

  if (product.variants.length) {
    const updateVariant = () => {
      const variant = product.variants[Number(presentationValue.value)];
      priceValue.textContent = formatMoney(variant.price);
      button.dataset.productId = `${product.id}-${variant.id}`;
      button.dataset.productName = `${product.name} ${variant.presentation}`;
      button.dataset.productPrice = String(variant.price);
    };
    presentationValue.addEventListener("change", updateVariant);
    updateVariant();
  }

  const whatsapp = document.createElement("a");
  whatsapp.className = "product-card__whatsapp";
  whatsapp.href = createProductWhatsAppUrl(product.name);
  whatsapp.target = "_blank";
  whatsapp.rel = "noopener noreferrer";
  whatsapp.textContent = "WhatsApp";

  const details = createProductDetails(product);
  body.append(name, presentation, price);
  if (details) body.append(details);
  body.append(button, whatsapp);
  card.append(imageContainer, body);
  return card;
}

const grid = typeof document !== "undefined" ? document.querySelector("[data-product-grid]") : null;
if (grid) grid.replaceChildren(...products.map(createProductCard));
