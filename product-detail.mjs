import { productBySlug } from "./data/products.mjs";
import { formatPresentation } from "./product-catalog.mjs";

const formatMoney = (value) => new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
}).format(value);

const product = productBySlug.get("colageno-marino");
const root = document.querySelector("[data-product-detail]");

if (product && root) {
  const mainImage = root.querySelector("[data-product-main-image]");
  const thumbnails = root.querySelector("[data-product-thumbnails]");
  const name = root.querySelector("[data-product-name]");
  const category = root.querySelector("[data-product-category]");
  const presentation = root.querySelector("[data-product-presentation]");
  const price = root.querySelector("[data-product-price]");
  const addButton = root.querySelector("[data-product-add]");

  name.textContent = product.name;
  category.textContent = product.category;

  product.images.forEach((src, index) => {
    const button = document.createElement("button");
    button.className = "product-gallery__thumbnail";
    button.type = "button";
    button.setAttribute("aria-label", `Ver imagen ${index + 1} de ${product.name}`);
    button.setAttribute("aria-pressed", String(index === 0));
    const image = document.createElement("img");
    image.src = src;
    image.alt = "";
    image.width = 160;
    image.height = 160;
    image.loading = index === 0 ? "eager" : "lazy";
    button.append(image);
    button.addEventListener("click", () => {
      mainImage.src = src;
      mainImage.alt = `${product.name}, imagen ${index + 1} de ${product.images.length}`;
      thumbnails.querySelectorAll("button").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
    });
    thumbnails.append(button);
  });

  mainImage.src = product.image;
  mainImage.alt = `${product.name}, imagen 1 de ${product.images.length}`;
  name.textContent = product.name;

  const purchasableOptions = product.variants.length
    ? product.variants.map((variant) => ({
        id: `${product.id}-${variant.id}`,
        presentation: variant.presentation,
        price: variant.price,
      }))
    : [{ id: product.id, presentation: product.presentation, price: product.price }];

  purchasableOptions.forEach((option, index) => {
    const element = document.createElement("option");
    element.value = String(index);
    element.textContent = formatPresentation(option.presentation);
    presentation.append(element);
  });

  const updateSelection = () => {
    const selected = purchasableOptions[Number(presentation.value)];
    price.textContent = Number.isInteger(selected?.price) ? formatMoney(selected.price) : "";
    if (!selected || !Number.isInteger(selected.price) || selected.price <= 0) {
      addButton.disabled = true;
      return;
    }
    addButton.dataset.productId = selected.id;
    addButton.dataset.productName = `${product.name} ${selected.presentation}`;
    addButton.dataset.productDisplayName = product.name;
    addButton.dataset.productPresentation = formatPresentation(selected.presentation);
    addButton.dataset.productPrice = String(selected.price);
    addButton.dataset.productImage = product.image;
  };

  presentation.addEventListener("change", updateSelection);
  updateSelection();
}
