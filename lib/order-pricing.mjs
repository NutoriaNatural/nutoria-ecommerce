import { products } from "../data/products.mjs";

const MAX_ITEMS = 50;
const MAX_QUANTITY = 100;

const indexedProduct = (productId, product, presentation, price) => [
  productId,
  { productId, name: product.name, presentation, price },
];

export const productIndex = new Map(products.flatMap((product) => {
  if (product.variants.length) {
    return product.variants.flatMap((variant) => [
      indexedProduct(`${product.id}-${variant.id}`, product, variant.presentation, variant.price),
      indexedProduct(`${product.legacyId}-${variant.id}`, product, variant.presentation, variant.price),
    ]);
  }

  if (!Number.isInteger(product.price) || product.price <= 0) return [];
  return [
    indexedProduct(product.id, product, product.presentation, product.price),
    indexedProduct(product.legacyId, product, product.presentation, product.price),
  ];
}));

export function shippingFor(subtotal) {
  if (subtotal <= 0) return 0;
  if (subtotal < 100000) return 16000;
  if (subtotal < 200000) return 12000;
  if (subtotal < 300000) return 8000;
  return 0;
}

export function priceOrder(requestedItems) {
  if (!Array.isArray(requestedItems) || !requestedItems.length || requestedItems.length > MAX_ITEMS) {
    throw new TypeError("El carrito está vacío o contiene demasiados productos.");
  }

  let subtotal = 0;
  const items = requestedItems.map((requestedItem) => {
    const product = productIndex.get(requestedItem?.id);
    const quantity = Number(requestedItem?.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new TypeError("El carrito contiene un producto o una cantidad inválida.");
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
