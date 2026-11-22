export const productOptions = (product) => product.variants.length
  ? product.variants.map((variant) => ({
      id: `${product.id}-${variant.id}`,
      presentation: variant.presentation,
      price: variant.price,
    }))
  : [{ id: product.id, presentation: product.presentation, price: product.price }];

export function selectedOptionIndex(product, search = "") {
  const options = productOptions(product);
  const requestedId = new URLSearchParams(search).get("presentacion");
  const requested = options.findIndex((option) => option.id === requestedId);
  if (requested >= 0) return requested;
  const preferred = options.findIndex(({ presentation }) => presentation.replace(/\s/g, "") === "250g");
  if (preferred >= 0) return preferred;
  const current = options.findIndex(({ presentation }) => presentation === product.presentation);
  return current >= 0 ? current : 0;
}
