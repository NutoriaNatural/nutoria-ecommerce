import { productBySlug } from "./data/products.mjs";
import { PRODUCT_DETAIL_IMAGE_SIZES, productImageAttributes } from "./lib/responsive-product-images.mjs";

const formatPresentation = (value) =>
  value.replace(/(\d[\d.]*)\s*(mg|kg|g|ml|l)\b/giu, "$1 $2");

const formatMoney = (value) => new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
}).format(value);

export function initializeProductDetail(slug) {
  const product = productBySlug.get(slug);
  const root = document.querySelector("[data-product-detail]");
  if (!product || !root) return false;
  const mainImage = root.querySelector("[data-product-main-image]");
  const thumbnails = root.querySelector("[data-product-thumbnails]");
  const name = root.querySelector("[data-product-name]");
  const category = root.querySelector("[data-product-category]");
  const presentation = root.querySelector("[data-product-presentation]");
  const price = root.querySelector("[data-product-price]");
  const addButton = root.querySelector("[data-product-add]");
  const composition = root.querySelector("[data-product-composition]");
  const compositionList = root.querySelector("[data-product-composition-list]");
  const shortDescription = root.querySelector("[data-product-short-description]");
  const description = root.querySelector("[data-product-description]");
  const descriptionContent = root.querySelector("[data-product-description-content]");
  const productInfo = root.querySelector("[data-product-info]");
  const productInfoList = root.querySelector("[data-product-info-list]");
  const quantityOutput = root.querySelector("[data-product-quantity]");
  const decreaseQuantity = root.querySelector("[data-product-quantity-decrease]");
  const increaseQuantity = root.querySelector("[data-product-quantity-increase]");

  name.textContent = product.name;
  category.textContent = product.category;

  if (product.shortDescription && shortDescription) {
    shortDescription.textContent = product.shortDescription;
    shortDescription.hidden = false;
  }

  if (product.description && description && descriptionContent) {
    descriptionContent.replaceChildren();
    product.description.split(/\n\s*\n/u).forEach((paragraph) => {
      const element = document.createElement("p");
      element.textContent = paragraph;
      descriptionContent.append(element);
    });
    description.hidden = false;
  }

  if (product.productInfo.length && productInfo && productInfoList) {
    productInfoList.replaceChildren();
    product.productInfo.forEach(({ label, value }) => {
      if (!label || !value) return;
      const term = document.createElement("dt");
      const detail = document.createElement("dd");
      term.textContent = label;
      detail.textContent = value;
      productInfoList.append(term, detail);
    });
    if (productInfoList.children.length) productInfo.hidden = false;
  }

  if (product.composition.length && composition && compositionList) {
    compositionList.replaceChildren();
    product.composition.forEach((ingredient) => {
      const item = document.createElement("li");
      item.textContent = ingredient;
      compositionList.append(item);
    });
    composition.hidden = false;
  }

  thumbnails.replaceChildren();
  product.images.forEach((src, index) => {
    const button = document.createElement("button");
    button.className = "product-gallery__thumbnail";
    button.type = "button";
    button.setAttribute("aria-label", `Ver imagen ${index + 1} de ${product.name}`);
    button.setAttribute("aria-pressed", String(index === 0));
    const image = document.createElement("img");
    image.src = src;
    if (index === 0) {
      const responsiveThumbnail = productImageAttributes(src, "160px");
      image.srcset = responsiveThumbnail.srcset;
      image.sizes = responsiveThumbnail.sizes;
    }
    image.alt = "";
    image.width = 160;
    image.height = 160;
    image.loading = index === 0 ? "eager" : "lazy";
    button.append(image);
    button.addEventListener("click", () => {
      mainImage.src = src;
      if (index === 0) {
        const responsiveImage = productImageAttributes(src, PRODUCT_DETAIL_IMAGE_SIZES);
        mainImage.srcset = responsiveImage.srcset;
        mainImage.sizes = responsiveImage.sizes;
      } else {
        mainImage.removeAttribute("srcset");
        mainImage.removeAttribute("sizes");
      }
      mainImage.alt = `${product.name}, imagen ${index + 1} de ${product.images.length}`;
      thumbnails.querySelectorAll("button").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
    });
    thumbnails.append(button);
  });

  const responsiveMainImage = productImageAttributes(product.image, PRODUCT_DETAIL_IMAGE_SIZES);
  mainImage.src = responsiveMainImage.src;
  mainImage.srcset = responsiveMainImage.srcset;
  mainImage.sizes = responsiveMainImage.sizes;
  mainImage.alt = `${product.name}, imagen 1 de ${product.images.length}`;
  name.textContent = product.name;

  const purchasableOptions = product.variants.length
    ? product.variants.map((variant) => ({
        id: `${product.id}-${variant.id}`,
        presentation: variant.presentation,
        price: variant.price,
      }))
    : [{ id: product.id, presentation: product.presentation, price: product.price }];

  presentation.replaceChildren();
  purchasableOptions.forEach((option, index) => {
    const element = document.createElement("option");
    element.value = String(index);
    element.textContent = formatPresentation(option.presentation);
    presentation.append(element);
  });
  if (product.variants.length) {
    const defaultVariantIndex = product.variants.findIndex(({ presentation: value }) => value === "250g");
    if (defaultVariantIndex >= 0) presentation.value = String(defaultVariantIndex);
  }

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

  let quantity = 1;
  let programmaticAddsRemaining = 0;
  const updateQuantity = () => {
    quantityOutput.value = String(quantity);
    quantityOutput.textContent = String(quantity);
    quantityOutput.setAttribute("aria-label", `Cantidad actual: ${quantity}`);
    decreaseQuantity.disabled = quantity <= 1;
  };
  decreaseQuantity.addEventListener("click", () => {
    quantity = Math.max(1, quantity - 1);
    updateQuantity();
  });
  increaseQuantity.addEventListener("click", () => {
    quantity += 1;
    updateQuantity();
  });
  addButton.addEventListener("click", () => {
    if (programmaticAddsRemaining > 0) {
      programmaticAddsRemaining -= 1;
      return;
    }
    programmaticAddsRemaining = quantity - 1;
    for (let index = 1; index < quantity; index += 1) addButton.click();
  });
  const defaultAddButtonContent = [...addButton.childNodes].map((node) => node.cloneNode(true));
  const labelObserver = new MutationObserver(() => {
    if (addButton.textContent === "Agregar") {
      addButton.replaceChildren(...defaultAddButtonContent.map((node) => node.cloneNode(true)));
    }
  });
  labelObserver.observe(addButton, { childList: true });
  updateQuantity();
  return true;
}
