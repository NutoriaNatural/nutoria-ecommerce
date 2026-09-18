import { products } from "../product-catalog.mjs";

const MAX_ITEMS = 50;
const MAX_QUANTITY = 100;

export const productIndex = new Map(
  products.flatMap((product) =>
    product.variants.length
      ? product.variants.map((variant) => [
          `${product.id}-${variant.id}`,
          {
            productId: `${product.id}-${variant.id}`,
            name: product.name,
            presentation: variant.presentation,
            price: variant.price,
          },
        ])
      : [[
          product.id,
          {
            productId: product.id,
            name: product.name,
            presentation: product.presentation,
            price: product.price,
          },
        ]],
  ),
);

export function shippingFor(subtotal) {
  if (subtotal <= 0) return 0;
  if (subtotal < 100000) return 16000;
  if (subtotal < 200000) return 12000;
  if (subtotal <= 300000) return 8000;
  return 0;
}

export function priceOrder(requestedItems) {
  if (!Array.isArray(requestedItems) || !requestedItems.length || requestedItems.length > MAX_ITEMS) {
    throw new TypeError("El carrito estÃ¡ vacÃ­o o contiene demasiados productos.");
  }

  let subtotal = 0;
  const items = requestedItems.map((requestedItem) => {
    const product = productIndex.get(requestedItem?.id);
    const quantity = Number(requestedItem?.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new TypeError("El carrito contiene un producto o una cantidad invÃ¡lida.");
    }

    const lineTotal = product.price * quantity;
    subtotal += lineTotal;
    return { ...product, quantity, lineTotal };
  });

  if (!Number.isSafeInteger(subtotal) || subtotal <= 0) {
    throw new TypeError("No fue posible calcular el subtotal del pedido.");
  }

  const shipping = shippingFor(subtotal);
  return { items, subtotal, shipping, total: subtotal + shipping };
}
