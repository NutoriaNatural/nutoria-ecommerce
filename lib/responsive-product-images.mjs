export const PRODUCT_IMAGE_WIDTHS = Object.freeze([320, 800]);
export const PRODUCT_IMAGE_SOURCE_WIDTH = 1563;

const responsivePath = (source, width) => source.replace(/\.webp$/u, `-${width}.webp`);

export function productImageAttributes(source, sizes) {
  if (!/\/01\.webp$/u.test(source)) {
    return { src: source, srcset: "", sizes: "" };
  }

  const candidates = [
    ...PRODUCT_IMAGE_WIDTHS.map((width) => `${responsivePath(source, width)} ${width}w`),
    `${source} ${PRODUCT_IMAGE_SOURCE_WIDTH}w`,
  ];

  return {
    src: source,
    srcset: candidates.join(", "),
    sizes,
  };
}

export const CATALOG_IMAGE_SIZES = [
  "(max-width: 719px) calc((100vw - 2.75rem) / 2)",
  "(max-width: 1023px) calc((100vw - 3.25rem) / 2)",
  "280px",
].join(", ");

export const PRODUCT_DETAIL_IMAGE_SIZES = [
  "(max-width: 799px) calc(100vw - 2rem)",
  "(max-width: 1232px) calc((100vw - 5.5rem) * 0.575)",
  "650px",
].join(", ");
