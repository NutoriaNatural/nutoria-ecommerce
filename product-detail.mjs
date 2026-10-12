import {
  PRODUCT_DETAIL_IMAGE_SIZES,
  productImageAttributes,
  productThumbnailPath,
} from "./lib/responsive-product-images.mjs";

const formatPresentation = (value) =>
  value.replace(/(\d[\d.]*)\s*(mg|kg|g|ml|l)\b/giu, "$1 $2");

const formatMoney = (value) => new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
}).format(value);

export function initializeProductDetail(product) {
  const root = document.querySelector("[data-product-detail]");
  if (!product || !root) return false;
  const mainImage = root.querySelector("[data-product-main-image]");
  const thumbnails = root.querySelector("[data-product-thumbnails]");
  const presentation = root.querySelector("[data-product-presentation]");
  const price = root.querySelector("[data-product-price]");
  const addButton = root.querySelector("[data-product-add]");
  const quantityOutput = root.querySelector("[data-product-quantity]");
  const decreaseQuantity = root.querySelector("[data-product-quantity-decrease]");
  const increaseQuantity = root.querySelector("[data-product-quantity-increase]");
  const galleryImageLoads = new Map();
  let gallerySelection = 0;

  const loadGalleryImage = (src) => {
    if (!galleryImageLoads.has(src)) {
      const loader = new Image();
      const pending = new Promise((resolve, reject) => {
        loader.addEventListener("load", () => resolve(src), { once: true });
        loader.addEventListener("error", reject, { once: true });
        loader.src = src;
      }).catch((error) => {
        galleryImageLoads.delete(src);
        throw error;
      });
      galleryImageLoads.set(src, pending);
    }
    return galleryImageLoads.get(src);
  };

  thumbnails.replaceChildren();
  product.images.forEach((src, index) => {
    const button = document.createElement("button");
    button.className = "product-gallery__thumbnail";
    button.type = "button";
    button.setAttribute("aria-label", `Ver imagen ${index + 1} de ${product.name}`);
    button.setAttribute("aria-pressed", String(index === 0));
    button.dataset.fullImageSrc = src;
    const image = document.createElement("img");
    image.src = productThumbnailPath(src);
    image.alt = "";
    image.width = 160;
    image.height = 160;
    image.loading = index === 0 ? "eager" : "lazy";
    button.append(image);
    button.addEventListener("click", async () => {
      const selection = ++gallerySelection;
      thumbnails.querySelectorAll("button").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
      if (index === 0) {
        const responsiveImage = productImageAttributes(src, PRODUCT_DETAIL_IMAGE_SIZES);
        mainImage.src = responsiveImage.src;
        mainImage.srcset = responsiveImage.srcset;
        mainImage.sizes = responsiveImage.sizes;
        mainImage.alt = `${product.name}, imagen 1 de ${product.images.length}`;
        mainImage.removeAttribute("aria-busy");
      } else {
        mainImage.setAttribute("aria-busy", "true");
        try {
          await loadGalleryImage(src);
        } catch {
          if (selection === gallerySelection) mainImage.removeAttribute("aria-busy");
          return;
        }
        if (selection !== gallerySelection) return;
        mainImage.src = src;
        mainImage.removeAttribute("srcset");
        mainImage.removeAttribute("sizes");
        mainImage.alt = `${product.name}, imagen ${index + 1} de ${product.images.length}`;
        mainImage.removeAttribute("aria-busy");
      }
    });
    thumbnails.append(button);
  });

  const responsiveMainImage = productImageAttributes(product.image, PRODUCT_DETAIL_IMAGE_SIZES);
  mainImage.src = responsiveMainImage.src;
  mainImage.srcset = responsiveMainImage.srcset;
  mainImage.sizes = responsiveMainImage.sizes;
  mainImage.alt = `${product.name}, imagen 1 de ${product.images.length}`;
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
