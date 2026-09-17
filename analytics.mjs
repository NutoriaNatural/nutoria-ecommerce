const sendEvent = (name, parameters = {}) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, parameters);
  }
};

const itemFromButton = (button, quantity = 1) => ({
  item_id: button.dataset.productId,
  item_name: button.dataset.productName,
  price: Number(button.dataset.productPrice),
  quantity,
});

function observeProducts() {
  const viewed = new WeakSet();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || viewed.has(entry.target)) return;

        const button = entry.target.querySelector(".product-card__button[data-product-id]");
        if (!button) return;

        viewed.add(entry.target);
        observer.unobserve(entry.target);
        sendEvent("view_item", {
          currency: "COP",
          value: Number(button.dataset.productPrice),
          items: [itemFromButton(button)],
        });
      });
    },
    { threshold: 0.5 },
  );

  document.querySelectorAll(".product-card").forEach((card) => observer.observe(card));
}

function initializeAnalytics() {
  observeProducts();

  document.addEventListener("change", (event) => {
    const presentation = event.target.closest(".product-card__presentation");
    if (!presentation) return;

    const button = presentation.closest(".product-card")?.querySelector(".product-card__button[data-product-id]");
    if (!button) return;

    sendEvent("select_presentation", {
      currency: "COP",
      value: Number(button.dataset.productPrice),
      items: [itemFromButton(button)],
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target.closest("a, button");
    if (!target) return;

    if (target.matches('.button--primary[href="#productos"]')) {
      sendEvent("select_content", {
        content_type: "cta",
        item_id: "comprar_productos",
      });
      return;
    }

    if (target.matches("[data-whatsapp-general], .product-card__whatsapp")) {
      sendEvent("whatsapp_click", {
        link_location: target.matches("[data-whatsapp-general]") ? "general" : "producto",
        product_name: target.closest(".product-card")?.querySelector(".product-card__name")?.textContent || undefined,
      });
      return;
    }

    if (target.matches(".cart-slot")) {
      sendEvent("view_cart");
      return;
    }

    if (target.matches(".cart-item__remove")) {
      const row = target.closest(".cart-item");
      if (!row) return;

      const item = {
        item_id: row.dataset.productId,
        item_name: row.dataset.productName,
        price: Number(row.dataset.productPrice),
        quantity: Number(row.dataset.productQuantity),
      };
      sendEvent("remove_from_cart", {
        currency: "COP",
        value: item.price * item.quantity,
        items: [item],
      });
      return;
    }

    if (target.matches(".product-card__button[data-product-id]")) {
      sendEvent("add_to_cart", {
        currency: "COP",
        value: Number(target.dataset.productPrice),
        items: [itemFromButton(target)],
      });
    }
  });
}

// Se invocará únicamente cuando el futuro flujo de pago confirme una venta real.
export function trackCompletedPurchase({ transactionId, value, items }) {
  if (typeof transactionId !== "string" || !transactionId.trim()) {
    throw new TypeError("La compra confirmada necesita un identificador de transacción.");
  }

  sendEvent("purchase", {
    transaction_id: transactionId,
    currency: "COP",
    value,
    items,
  });
}

export function trackBeginCheckout({ value, items }) {
  sendEvent("begin_checkout", {
    currency: "COP",
    value,
    items,
  });
}

if (typeof document !== "undefined") initializeAnalytics();
