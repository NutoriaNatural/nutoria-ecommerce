import { createProductWhatsAppUrl } from "./whatsapp.mjs";

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
].map((name, index) => ({
  id: `producto-${index + 1}`,
  name,
  image: `assets/images/optimized/${name}.jpg`,
  presentation: name === "Almendras" ? "1.000g" : "",
  price: name === "7 Colagenos" ? 89900 : name === "Almendras" ? 75000 : 0,
  variants: name === "Almendras" ? [
    { id: "1000g", presentation: "1.000g", price: 75000 },
    { id: "500g", presentation: "500g", price: 39000 },
    { id: "250g", presentation: "250g", price: 20000 },
    { id: "125g", presentation: "125g", price: 10000 },
  ] : [],
  category: "",
  ingredients: "",
  content: "",
  nutrition: "",
  usage: "",
  sanitaryRegistration: "",
}));

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
  priceValue.textContent = formatMoney(product.price);
  price.append(priceLabel, priceValue);

  const button = document.createElement("button");
  button.className = "product-card__button";
  button.type = "button";
  button.textContent = "Comprar";
  button.dataset.productId = product.id;
  button.dataset.productName = product.name;
  button.dataset.productPrice = String(product.price);

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

const grid = document.querySelector("[data-product-grid]");
if (grid) grid.replaceChildren(...products.map(createProductCard));
