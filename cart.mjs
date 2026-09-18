import { trackBeginCheckout, trackCompletedPurchase } from "./analytics.mjs";

const STORAGE_KEY = "nutoria_cart";
const CHECKOUT_KEY = "nutoria_checkout_key";

export function calculateShipping(subtotal) {
  if (subtotal <= 0) return 0;
  if (subtotal < 100000) return 16000;
  if (subtotal < 200000) return 12000;
  if (subtotal <= 300000) return 8000;
  return 0;
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

function initializeCart() {
  const dialog = document.querySelector("#cart-dialog");
  const openButton = document.querySelector(".cart-slot");
  const closeButton = document.querySelector(".cart-dialog__close");
  const itemsContainer = document.querySelector(".cart-items");
  const count = document.querySelector(".cart-count");
  const subtotal = document.querySelector("[data-cart-subtotal]");
  const shipping = document.querySelector("[data-cart-shipping]");
  const total = document.querySelector("[data-cart-total]");
  const checkoutForm = document.querySelector("[data-checkout-form]");
  const checkoutButton = document.querySelector("[data-checkout-button]");
  const message = document.querySelector("[data-checkout-message]");
  const paymentStatus = document.querySelector("[data-payment-status]");

  if (!dialog || !openButton || !closeButton || !itemsContainer || !checkoutForm) return;

  const cart = new Cart(readStoredItems());
  const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(cart.snapshot().items));

  const render = () => {
    const state = cart.snapshot();
    count.textContent = String(state.quantity);
    subtotal.textContent = formatMoney(state.subtotal);
    shipping.textContent = state.shipping ? formatMoney(state.shipping) : "Gratis";
    total.textContent = formatMoney(state.total);
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
        name.textContent = item.name;

        const price = document.createElement("p");
        price.className = "cart-item__price";
        price.textContent = formatMoney(item.price * item.quantity);

        const controls = document.createElement("div");
        controls.className = "cart-item__controls";
        const label = document.createElement("label");
        label.textContent = "Cantidad";
        const quantity = document.createElement("input");
        quantity.className = "cart-item__quantity";
        quantity.type = "number";
        quantity.min = "1";
        quantity.step = "1";
        quantity.value = String(item.quantity);
        quantity.addEventListener("change", () => {
          cart.setQuantity(item.id, Number(quantity.value));
          persist();
          render();
        });
        label.append(quantity);

        const remove = document.createElement("button");
        remove.className = "cart-item__remove";
        remove.type = "button";
        remove.textContent = "Eliminar";
        remove.addEventListener("click", () => {
          cart.remove(item.id);
          persist();
          render();
        });

        controls.append(label, remove);
        row.append(name, price, controls);
        return row;
      }),
    );
  };

  openButton.addEventListener("click", () => dialog.showModal());
  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  document.querySelectorAll(".product-card__button[data-product-id]").forEach((button) => {
    button.addEventListener("click", () => {
      cart.add({
        id: button.dataset.productId,
        name: button.dataset.productName,
        price: Number(button.dataset.productPrice),
      });
      persist();
      render();
      dialog.showModal();
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
    fetch(`/api/wompi/transaction?id=${encodeURIComponent(transactionId)}`)
      .then((response) => response.json().then((result) => ({ ok: response.ok, result })))
      .then(({ ok, result }) => {
        if (!ok) throw new Error(result.error);
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
