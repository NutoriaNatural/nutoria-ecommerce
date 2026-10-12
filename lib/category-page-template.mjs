import {
  CATALOG_IMAGE_SIZES,
  PRODUCT_IMAGE_SOURCE_WIDTH,
  productImageAttributes,
} from "./responsive-product-images.mjs";

const PRODUCTION_ORIGIN = "https://nutoria.com.co";

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const serializeJsonLd = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");

export const canonicalForCategory = (category) => `${PRODUCTION_ORIGIN}${category.path}`;

export function structuredDataForCategory(category) {
  const canonical = canonicalForCategory(category);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${canonical}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${PRODUCTION_ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: category.name, item: canonical },
    ],
  };
}

const renderProductLink = (product) => {
  const image = productImageAttributes(product.image, CATALOG_IMAGE_SIZES);
  return `<li class="category-product-card">
            <a href="${escapeHtml(product.detailPath)}">
              <span class="category-product-card__image"><img src="${escapeHtml(image.src)}" srcset="${escapeHtml(image.srcset)}" sizes="${escapeHtml(image.sizes)}" alt="${escapeHtml(product.name)}" width="${PRODUCT_IMAGE_SOURCE_WIDTH}" height="${PRODUCT_IMAGE_SOURCE_WIDTH}" loading="lazy" /></span>
              <span class="category-product-card__name">${escapeHtml(product.name)}</span>
              <span class="category-product-card__link">Ver producto</span>
            </a>
          </li>`;
};

export function renderCategoryDocument(category, products) {
  const canonical = canonicalForCategory(category);
  const productLinks = products.map(renderProductLink).join("\n          ");
  const structuredData = serializeJsonLd(structuredDataForCategory(category));

  return `<!doctype html>
<html lang="es-CO">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="facebook-domain-verification" content="7z5pxg2ieemokpbrasnvnzw6z1pqal" />
    <title>${escapeHtml(category.title)}</title>
    <meta name="description" content="${escapeHtml(category.metaDescription)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <script type="application/ld+json">${structuredData}</script>
    <script src="/ga4-loader.js"></script>
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon.png" />
    <link rel="preload" href="/assets/fonts/cormorant-garamond-600-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/fonts.css" />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="stylesheet" href="/category-page.css" />
  </head>
  <body>
    <header class="site-header" aria-label="Encabezado">
      <div class="container site-header__inner">
        <a class="brand" href="/" aria-label="Nutoria, ir al inicio"><img src="/assets/images/logo-nutoria-180.png" srcset="/assets/images/logo-nutoria-header-120.webp 120w, /assets/images/logo-nutoria-180.png 180w" sizes="60px" alt="Nutoria" width="180" height="180" /></a>
        <nav aria-label="Navegación principal"><ul class="site-nav"><li><a href="/#categorias">Categorías</a></li><li><a href="/#productos">Productos</a></li></ul></nav>
      </div>
    </header>
    <main class="category-page">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Migas de pan"><ol><li><a href="/">Inicio</a></li><li aria-current="page">${escapeHtml(category.name)}</li></ol></nav>
        <header class="category-page__header">
          <h1>${escapeHtml(category.name)}</h1>
          <p>${escapeHtml(category.introduction)}</p>
          <p class="category-page__count">${products.length} ${products.length === 1 ? "producto" : "productos"}</p>
        </header>
        <ul class="category-product-grid" aria-label="Productos de ${escapeHtml(category.name)}">
          ${productLinks}
        </ul>
      </div>
    </main>
  </body>
</html>
`;
}
