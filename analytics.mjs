const sendEvent = (name, parameters = {}) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, parameters);
  }
};

function initializeAnalytics() {
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

    if (target.matches(".product-card__button[data-product-id]")) {
      sendEvent("add_to_cart", {
        currency: "COP",
        value: Number(target.dataset.productPrice),
        items: [
          {
            item_id: target.dataset.productId,
            item_name: target.dataset.productName,
            price: Number(target.dataset.productPrice),
            quantity: 1,
          },
        ],
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

if (typeof document !== "undefined") initializeAnalytics();
