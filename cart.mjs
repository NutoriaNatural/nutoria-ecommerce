export class Cart {
  #items = new Map();

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
    return { items, quantity, subtotal, total: subtotal };
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

const cart = new Cart();

function initializeCart() {
  const dialog = document.querySelector("#cart-dialog");
  const openButton = document.querySelector(".cart-slot");
  const closeButton = document.querySelector(".cart-dialog__close");
  const itemsContainer = document.querySelector(".cart-items");
  const count = document.querySelector(".cart-count");
  const subtotal = document.querySelector("[data-cart-subtotal]");
  const total = document.querySelector("[data-cart-total]");

  if (!dialog || !openButton || !closeButton || !itemsContainer) return;

  const render = () => {
    const state = cart.snapshot();
    count.textContent = String(state.quantity);
    subtotal.textContent = formatMoney(state.subtotal);
    total.textContent = formatMoney(state.total);
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
          render();
        });
        label.append(quantity);

        const remove = document.createElement("button");
        remove.className = "cart-item__remove";
        remove.type = "button";
        remove.textContent = "Eliminar";
        remove.addEventListener("click", () => {
          cart.remove(item.id);
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
      render();
      dialog.showModal();
    });
  });

  render();
}

if (typeof document !== "undefined") initializeCart();
