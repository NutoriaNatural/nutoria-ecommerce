import { trackBeginCheckout, trackCompletedPurchase } from "./analytics.mjs";

const STORAGE_KEY = "nutoria_cart";
const CHECKOUT_KEY = "nutoria_checkout_key";
const PAYMENT_STATUS_ATTEMPTS = 15;
const PAYMENT_STATUS_DELAY_MS = 2000;
export const FREE_SHIPPING_SUBTOTAL = 300001;

export function calculateShipping(subtotal) {
  if (subtotal <= 0) return 0;
  if (subtotal < 100000) return 16000;
  if (subtotal < 200000) return 12000;
  if (subtotal < FREE_SHIPPING_SUBTOTAL) return 8000;
  return 0;
}

export function shippingProgressMessage(subtotal) {
  if (subtotal >= FREE_SHIPPING_SUBTOTAL) return "¡Tu pedido tiene envío gratis!";
  return `Te faltan ${formatMoney(FREE_SHIPPING_SUBTOTAL - Math.max(0, subtotal))} para obtener envío gratis.`;
}

export class Cart {
  #items = new Map();

  constructor(items = []) {
    items.forEach((item) => {
      this.#validateProduct(item);
      const quantity = Number(item.quantity);
      if (Number.isInteger(quantity) && quantity > 0) {
        this.#items.set(item.id, { ...item, quantity });
      }
    });
  }

  add(product) {
    this.#validateProduct(product);
    const current = this.#items.get(product.id);
    const quantity = current ? current.quantity + 1 : 1;
    this.#items.set(product.id, { ...product, quantity });
    return this.snapshot();
  }

  remove(productId) {
    this.#items.delete(productId);
    return this.snapshot();
  }

  clear() {
    this.#items.clear();
    return this.snapshot();
  }

  setQuantity(productId, quantity) {
    const item = this.#items.get(productId);
    if (!item) return this.snapshot();

    const nextQuantity = Number(quantity);
    if (!Number.isInteger(nextQuantity)) {
      throw new TypeError("La cantidad debe ser un número entero.");
    }

    if (nextQuantity < 1) return this.remove(productId);
    this.#items.set(productId, { ...item, quantity: nextQuantity });
    return this.snapshot();
  }

  snapshot() {
    const items = Array.from(this.#items.values(), (item) => ({ ...item }));
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = calculateShipping(subtotal);
    return { items, quantity, subtotal, shipping, total: subtotal + shipping };
  }

  #validateProduct(product) {
    if (!product || typeof product.id !== "string" || !product.id.trim()) {
      throw new TypeError("El producto necesita un identificador.");
    }
    if (typeof product.name !== "string" || !product.name.trim()) {
      throw new TypeError("El producto necesita un nombre.");
    }
    if (!Number.isInteger(product.price) || product.price < 0) {
      throw new TypeError("El precio debe expresarse como un número entero.");
    }
  }
}

const formatMoney = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const readStoredItems = () => {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function waitForPaymentStatus(
  transactionId,
  {
    attempts = PAYMENT_STATUS_ATTEMPTS,
    delayMs = PAYMENT_STATUS_DELAY_MS,
    request = fetch,
    pause = wait,
  } = {},
) {
  let result;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await request(`/api/wompi/transaction?id=${encodeURIComponent(transactionId)}`);
    result = await response.json();
    if (!response.ok) throw new Error(result.error || "No fue posible consultar el pago.");
    if (result.status !== "PENDING" || attempt === attempts - 1) return result;
    await pause(delayMs);
  }
  return result;
}

function initializeCart() {
  const dialog = document.querySelector("#cart-dialog");
  const openButtons = document.querySelectorAll("[data-cart-open]");
  const closeButton = document.querySelector(".cart-dialog__close");
  const itemsContainer = document.querySelector(".cart-items");
  const counts = document.querySelectorAll("[data-cart-count]");
  const subtotal = document.querySelector("[data-cart-subtotal]");
  const shipping = document.querySelector("[data-cart-shipping]");
  const total = document.querySelector("[data-cart-total]");
  const checkoutForm = document.querySelector("[data-checkout-form]");
  const checkoutButton = document.querySelector("[data-checkout-button]");
  const message = document.querySelector("[data-checkout-message]");
  const paymentStatus = document.querySelector("[data-payment-status]");
  const shippingMessage = document.querySelector("[data-shipping-message]");

  if (!dialog || !openButtons.length || !closeButton || !itemsContainer || !checkoutForm) return;

  const cart = new Cart(readStoredItems());
  const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(cart.snapshot().items));

  const render = () => {
    const state = cart.snapshot();
    counts.forEach((count) => { count.textContent = String(state.quantity); });
    subtotal.textContent = formatMoney(state.subtotal);
    shipping.textContent = state.shipping ? formatMoney(state.shipping) : "Gratis";
    total.textContent = formatMoney(state.total);
    if (shippingMessage) {
      shippingMessage.textContent = shippingProgressMessage(state.subtotal);
      shippingMessage.classList.toggle("is-free", state.subtotal >= FREE_SHIPPING_SUBTOTAL);
    }
    checkoutButton.disabled = state.items.length === 0;

    if (!state.items.length) {
      const empty = document.createElement("p");
      empty.className = "cart-empty";
      empty.textContent = "Tu carrito está vacío.";
      itemsContainer.replaceChildren(empty);
      return;
    }

    itemsContainer.replaceChildren(
      ...state.items.map((item) => {
        const row = document.createElement("article");
        row.className = "cart-item";
        row.dataset.productId = item.id;
        row.dataset.productName = item.name;
        row.dataset.productPrice = String(item.price);
        row.dataset.productQuantity = String(item.quantity);

        const name = document.createElement("p");
        name.className = "cart-item__name";
        name.textContent = item.displayName || item.name;

        const presentation = document.createElement("p");
        presentation.className = "cart-item__presentation";
        presentation.textContent = item.presentation || "";

        const price = document.createElement("p");
        price.className = "cart-item__price";
        price.textContent = formatMoney(item.price * item.quantity);

        const controls = document.createElement("div");
        controls.className = "cart-item__controls";
        const quantity = document.createElement("div");
        quantity.className = "cart-item__quantity";
        quantity.setAttribute("role", "group");
        quantity.setAttribute("aria-label", `Cantidad de ${item.displayName || item.name}`);

        const decrease = document.createElement("button");
        decrease.type = "button";
        decrease.textContent = "−";
        decrease.setAttribute("aria-label", `Disminuir cantidad de ${item.displayName || item.name}`);
        decrease.disabled = item.quantity <= 1;
        decrease.addEventListener("click", () => {
          cart.setQuantity(item.id, Math.max(1, item.quantity - 1));
          persist();
          render();
        });

        const quantityValue = document.createElement("output");
        quantityValue.value = String(item.quantity);
        quantityValue.textContent = String(item.quantity);
        quantityValue.setAttribute("aria-label", `Cantidad actual: ${item.quantity}`);

        const increase = document.createElement("button");
        increase.type = "button";
        increase.textContent = "+";
        increase.setAttribute("aria-label", `Aumentar cantidad de ${item.displayName || item.name}`);
        increase.addEventListener("click", () => {
          cart.setQuantity(item.id, item.quantity + 1);
          persist();
          render();
        });
        quantity.append(decrease, quantityValue, increase);

        const remove = document.createElement("button");
        remove.className = "cart-item__remove";
        remove.type = "button";
        remove.setAttribute("aria-label", "Eliminar producto");
        const removeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        removeIcon.setAttribute("viewBox", "0 0 24 24");
        removeIcon.setAttribute("aria-hidden", "true");
        removeIcon.setAttribute("focusable", "false");
        const removePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        removePath.setAttribute("d", "M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5");
        removeIcon.append(removePath);
        remove.append(removeIcon);
        remove.addEventListener("click", () => {
          cart.remove(item.id);
          persist();
          render();
        });

        controls.append(quantity, remove);
        row.append(name, presentation, price, controls);
        return row;
      }),
    );
  };

  const openCart = () => {
    dialog.showModal();
    document.body.classList.add("cart-open");
  };
  openButtons.forEach((button) => button.addEventListener("click", openCart));
  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => document.body.classList.remove("cart-open"));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  document.querySelectorAll(".product-card__button[data-product-id]").forEach((button) => {
    let feedbackTimer;
    button.addEventListener("click", () => {
      cart.add({
        id: button.dataset.productId,
        name: button.dataset.productName,
        displayName: button.dataset.productDisplayName,
        presentation: button.dataset.productPresentation,
        price: Number(button.dataset.productPrice),
      });
      persist();
      render();
      window.clearTimeout(feedbackTimer);
      button.classList.add("is-added");
      button.textContent = "Agregado ✓";
      feedbackTimer = window.setTimeout(() => {
        button.classList.remove("is-added");
        button.textContent = "Agregar";
      }, 1400);
    });
  });

  checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!checkoutForm.reportValidity()) return;

    const state = cart.snapshot();
    if (!state.items.length) return;
    checkoutButton.disabled = true;
    message.textContent = "Preparando el pago seguro…";

    const formData = new FormData(checkoutForm);
    let idempotencyKey = sessionStorage.getItem(CHECKOUT_KEY);
    if (!idempotencyKey) {
      idempotencyKey = crypto.randomUUID();
      sessionStorage.setItem(CHECKOUT_KEY, idempotencyKey);
    }
    try {
      const response = await fetch("/api/wompi/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          items: state.items.map(({ id, quantity }) => ({ id, quantity })),
          customer: Object.fromEntries(formData),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No fue posible iniciar el pago.");

      trackBeginCheckout({
        value: result.total,
        items: result.items.map(({ id, name, price, quantity }) => ({
          item_id: id,
          item_name: name,
          price,
          quantity,
        })),
      });
      const wompiForm = document.createElement("form");
      wompiForm.method = "GET";
      wompiForm.action = result.checkoutUrl;
      Object.entries(result.parameters).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        wompiForm.append(input);
      });
      document.body.append(wompiForm);
      sessionStorage.removeItem(CHECKOUT_KEY);
      wompiForm.submit();
    } catch (error) {
      message.textContent = error.message;
      checkoutButton.disabled = false;
    }
  });

  const transactionId = new URLSearchParams(location.search).get("id");
  if (transactionId && paymentStatus) {
    paymentStatus.hidden = false;
    paymentStatus.textContent = "Verificando el resultado del pago…";
    waitForPaymentStatus(transactionId)
      .then((result) => {
        if (result.status === "APPROVED") {
          paymentStatus.textContent = "Pago aprobado. Tu pedido quedó confirmado.";
          const marker = `nutoria_purchase_${result.id}`;
          if (!localStorage.getItem(marker)) {
            const state = cart.snapshot();
            trackCompletedPurchase({
              transactionId: result.id,
              value: result.amountInCents / 100,
              items: state.items.map(({ id, name, price, quantity }) => ({
                item_id: id,
                item_name: name,
                price,
                quantity,
              })),
            });
            localStorage.setItem(marker, "1");
          }
          cart.clear();
          persist();
          render();
        } else if (result.status === "PENDING") {
          paymentStatus.textContent = "El pago está pendiente de confirmación.";
        } else {
          paymentStatus.textContent = "El pago no fue aprobado. Puedes intentarlo nuevamente desde el carrito.";
        }
      })
      .catch(() => {
        paymentStatus.textContent = "No fue posible verificar el pago en este momento.";
      });
  }

  render();
}

if (typeof document !== "undefined") initializeCart();
