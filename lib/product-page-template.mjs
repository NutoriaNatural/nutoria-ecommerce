import {
  PRODUCT_DETAIL_IMAGE_SIZES,
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

const formatPresentation = (value) =>
  value.replace(/(\d[\d.]*)\s*(mg|kg|g|ml|l)\b/giu, "$1 $2");

const formatMoney = (value) => `$ ${new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
}).format(value)}`;

const productOptions = (product) => product.variants.length
  ? product.variants.map((variant) => ({
      id: `${product.id}-${variant.id}`,
      presentation: variant.presentation,
      price: variant.price,
    }))
  : [{ id: product.id, presentation: product.presentation, price: product.price }];

const structuredOfferOption = (product) => {
  if (!product.variants.length) return productOptions(product)[0];
  return productOptions(product).find(({ presentation }) => presentation === "250g");
};

const absoluteProductImages = (product) =>
  product.images.map((image) => `${PRODUCTION_ORIGIN}${image}`);

const serializeJsonLd = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");

const serializeRuntimeProduct = (product) => serializeJsonLd({
  id: product.id,
  slug: product.slug,
  name: product.name,
  image: product.image,
  images: product.images,
  presentation: product.presentation,
  price: product.price,
  variants: product.variants,
});

const selectedOptionIndex = (product) => {
  if (!product.variants.length) return 0;
  const preferred = product.variants.findIndex(({ presentation }) => presentation === "250g");
  return preferred >= 0 ? preferred : 0;
};

const renderDescription = (product) => {
  if (!product.description) return "";
  const paragraphs = product.description
    .split(/\n\s*\n/u)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
  return `<details class="product-purchase__details" data-product-description>
            <summary>Descripción</summary>
            <div data-product-description-content>${paragraphs}</div>
          </details>`;
};

const renderProductInfo = (product) => {
  if (!product.productInfo.length) return "";
  const items = product.productInfo
    .filter(({ label, value }) => label && value)
    .map(({ label, value }) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
    .join("");
  if (!items) return "";
  return `<details class="product-purchase__details" data-product-info>
            <summary>Información del producto</summary>
            <dl data-product-info-list>${items}</dl>
          </details>`;
};

const renderComposition = (product) => {
  if (!product.composition.length) return "";
  const items = product.composition.map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`).join("");
  return `<section class="product-purchase__composition" data-product-composition>
            <h2>Composición</h2>
            <ul data-product-composition-list>${items}</ul>
          </section>`;
};

export function canonicalForProduct(product) {
  return `${PRODUCTION_ORIGIN}${product.detailPath}`;
}

export function seoMetadataForProduct(product) {
  const title = product.seoTitle?.trim() || `${product.name} | Nutoria`;
  const description = product.seoDescription?.trim() || product.shortDescription?.trim() || "";

  return {
    title,
    description,
    canonical: canonicalForProduct(product),
    image: `${PRODUCTION_ORIGIN}${product.image}`,
    imageAlt: product.name,
  };
}

export function structuredDataForProduct(product) {
  const metadata = seoMetadataForProduct(product);
  const offerOption = structuredOfferOption(product);
  const offers = [offerOption].map(({ presentation, price }) => ({
    "@type": "Offer",
    name: `${product.name} - ${formatPresentation(presentation)}`,
    url: metadata.canonical,
    price,
    priceCurrency: "COP",
    seller: { "@id": `${PRODUCTION_ORIGIN}/#organization` },
  }));
  const productEntity = {
    "@type": "Product",
    "@id": `${metadata.canonical}#product`,
    name: product.name,
    url: metadata.canonical,
    image: absoluteProductImages(product),
    category: product.category,
    offers,
  };

  if (metadata.description) productEntity.description = metadata.description;

  return {
    "@context": "https://schema.org",
    "@graph": [
      productEntity,
      {
        "@type": "BreadcrumbList",
        "@id": `${metadata.canonical}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: `${PRODUCTION_ORIGIN}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: product.name,
          },
        ],
      },
    ],
  };
}

export function renderProductBody(product) {
  const options = productOptions(product);
  const selectedIndex = selectedOptionIndex(product);
  const selected = options[selectedIndex];
  const optionMarkup = options.map((option, index) => (
    `<option value="${index}"${index === selectedIndex ? " selected" : ""}>${escapeHtml(formatPresentation(option.presentation))}</option>`
  )).join("");
  const shortDescription = product.shortDescription
    ? `<p class="product-purchase__short-description" data-product-short-description>${escapeHtml(product.shortDescription)}</p>`
    : "";
  const mainImage = productImageAttributes(product.image, PRODUCT_DETAIL_IMAGE_SIZES);

  return `<header class="site-header" aria-label="Encabezado">
      <div class="container site-header__inner">
        <a class="brand" href="/" aria-label="Nutoria, ir al inicio"><img src="/assets/images/logo-nutoria-180.png" srcset="/assets/images/logo-nutoria-header-120.webp 120w, /assets/images/logo-nutoria-180.png 180w" sizes="60px" alt="Nutoria" width="180" height="180" /></a>
        <nav aria-label="Navegación principal"><ul class="site-nav"><li><a href="/#productos">Productos</a></li></ul></nav>
        <button class="cart-slot" data-cart-open type="button" aria-controls="cart-dialog" aria-haspopup="dialog">Carrito <span class="cart-count" data-cart-count aria-label="Productos en el carrito">0</span></button>
      </div>
    </header>
    <div class="payment-status container" data-payment-status role="status" hidden></div>
    <main class="product-page">
      <article class="container product-detail" data-product-detail>
        <section class="product-gallery" aria-label="Galería de ${escapeHtml(product.name)}">
          <div class="product-gallery__main"><img data-product-main-image src="${escapeHtml(mainImage.src)}" srcset="${escapeHtml(mainImage.srcset)}" sizes="${escapeHtml(mainImage.sizes)}" alt="${escapeHtml(`${product.name}, imagen 1 de ${product.images.length}`)}" width="${PRODUCT_IMAGE_SOURCE_WIDTH}" height="${PRODUCT_IMAGE_SOURCE_WIDTH}" fetchpriority="high" /></div>
          <div class="product-gallery__thumbnails" data-product-thumbnails role="group" aria-label="Seleccionar imagen"></div>
        </section>
        <section class="product-purchase" aria-labelledby="product-name">
          <a class="product-purchase__back" href="/#productos">← Volver a productos</a>
          <p class="product-purchase__category" data-product-category>${escapeHtml(product.category)}</p>
          <h1 id="product-name" data-product-name>${escapeHtml(product.name)}</h1>
          <p class="product-purchase__price" data-product-price aria-live="polite">${escapeHtml(formatMoney(selected.price))}</p>
          <div class="product-purchase__field"><label for="product-presentation">Presentación</label><select id="product-presentation" data-product-presentation>${optionMarkup}</select></div>
          <div class="product-purchase__quantity" role="group" aria-label="Cantidad">
            <span>Cantidad</span>
            <div class="product-purchase__quantity-control">
              <button type="button" data-product-quantity-decrease aria-label="Disminuir cantidad">−</button>
              <output data-product-quantity aria-live="polite" aria-label="Cantidad actual">1</output>
              <button type="button" data-product-quantity-increase aria-label="Aumentar cantidad">+</button>
            </div>
          </div>
          <button class="product-card__button product-purchase__add" data-product-add data-product-id="${escapeHtml(selected.id)}" data-product-name="${escapeHtml(`${product.name} ${selected.presentation}`)}" data-product-display-name="${escapeHtml(product.name)}" data-product-presentation="${escapeHtml(formatPresentation(selected.presentation))}" data-product-price="${selected.price}" data-product-image="${escapeHtml(product.image)}" type="button">
            <svg class="product-purchase__add-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 3h2l2.4 10.2a2 2 0 0 0 2 1.55h7.75a2 2 0 0 0 1.95-1.56L20.5 7H6.1M9.5 20a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm9 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z" /></svg>
            <span>AGREGAR AL CARRITO</span>
          </button>
          ${shortDescription}
          ${renderDescription(product)}
          ${renderProductInfo(product)}
          ${renderComposition(product)}
        </section>
      </article>
    </main>
    <div class="mobile-actions" aria-label="Acciones rápidas">
      <button class="cart-fab" data-cart-open type="button" aria-controls="cart-dialog" aria-haspopup="dialog" aria-label="Abrir carrito">
        <svg class="cart-fab__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 3h2l2.4 10.2a2 2 0 0 0 2 1.55h7.75a2 2 0 0 0 1.95-1.56L20.5 7H6.1M9.5 20a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm9 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z" /></svg>
        <span class="cart-fab__count" data-cart-count aria-hidden="true">0</span>
      </button>
      <a class="whatsapp-help" data-whatsapp-general href="#" target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp">
        <svg class="whatsapp-help__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.009-.371-.011-.57-.011-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.436-9.884 9.89-9.884 2.641 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.993c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
      </a>
    </div>
    <dialog class="cart-dialog" id="cart-dialog" aria-labelledby="cart-title">
      <div class="cart-dialog__header"><h2 id="cart-title">Carrito</h2><button class="cart-dialog__close" type="button" aria-label="Cerrar carrito">×</button></div>
      <div class="cart-items" aria-live="polite"></div>
      <dl class="cart-summary"><div><dt>Subtotal</dt><dd data-cart-subtotal>$0</dd></div><div><dt>Envío</dt><dd data-cart-shipping>$0</dd></div><div><dt>Total</dt><dd data-cart-total>$0</dd></div></dl>
      <div class="shipping-note"><p class="shipping-note__primary" data-shipping-message aria-live="polite"></p><p class="shipping-note__details" data-shipping-details></p></div>
      <form class="checkout-form" data-checkout-form>
        <h3>Datos de entrega</h3><p class="checkout-form__required-note"><span aria-hidden="true">*</span> Campos obligatorios</p>
        <label><span>Nombre completo <span class="required-marker" aria-hidden="true">*</span></span><input name="name" type="text" autocomplete="name" maxlength="100" required /></label>
        <label><span>Correo electrónico <span class="required-marker" aria-hidden="true">*</span></span><input name="email" type="email" autocomplete="email" maxlength="160" required /></label>
        <label><span>Teléfono <span class="required-marker" aria-hidden="true">*</span></span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="20" required /></label>
        <label><span>Número de documento <span class="required-marker" aria-hidden="true">*</span></span><input name="documentNumber" type="text" autocomplete="off" minlength="3" maxlength="40" required /></label>
        <label><span>Dirección de entrega <span class="required-marker" aria-hidden="true">*</span></span><input name="address" type="text" autocomplete="street-address" maxlength="160" required /></label>
        <label><span>Complemento o indicaciones de la dirección (opcional)</span><input name="addressDetail" type="text" maxlength="160" /></label>
        <div class="checkout-form__row"><label><span>Ciudad o municipio <span class="required-marker" aria-hidden="true">*</span></span><input name="city" type="text" autocomplete="address-level2" maxlength="80" required /></label><label><span>Departamento <span class="required-marker" aria-hidden="true">*</span></span><input name="region" type="text" autocomplete="address-level1" maxlength="80" required /></label></div>
        <p class="checkout-form__message" data-checkout-message role="status"></p><button class="checkout-form__button" data-checkout-button type="submit">Pagar con Wompi</button>
      </form>
    </dialog>`.replace(/[ \t]+$/gmu, "");
}

export function renderProductDocument(product) {
  const metadata = seoMetadataForProduct(product);
  const descriptionMetadata = metadata.description
    ? `\n    <meta name="description" content="${escapeHtml(metadata.description)}" />`
    : "";
  const openGraphDescription = metadata.description
    ? `\n    <meta property="og:description" content="${escapeHtml(metadata.description)}" />`
    : "";
  const twitterDescription = metadata.description
    ? `\n    <meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`
    : "";
  const structuredData = serializeJsonLd(structuredDataForProduct(product));
  const runtimeProduct = serializeRuntimeProduct(product);

  return `<!doctype html>
<html lang="es-CO" data-product-slug="${escapeHtml(product.slug)}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="facebook-domain-verification" content="7z5pxg2ieemokpbrasnvnzw6z1pqal" />
    <title>${escapeHtml(metadata.title)}</title>${descriptionMetadata}
    <link rel="canonical" href="${escapeHtml(metadata.canonical)}" />
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${escapeHtml(metadata.title)}" />
    <meta property="og:url" content="${escapeHtml(metadata.canonical)}" />
    <meta property="og:image" content="${escapeHtml(metadata.image)}" />
    <meta property="og:image:alt" content="${escapeHtml(metadata.imageAlt)}" />
    <meta property="og:site_name" content="Nutoria" />
    <meta property="og:locale" content="es_CO" />${openGraphDescription}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(metadata.title)}" />
    <meta name="twitter:image" content="${escapeHtml(metadata.image)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(metadata.imageAlt)}" />${twitterDescription}
    <script type="application/ld+json">${structuredData}</script>
    <script src="/ga4-loader.js"></script>
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon.png" />
    <link rel="preload" href="/assets/fonts/cormorant-garamond-600-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/fonts.css" />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="stylesheet" href="/product-detail.css" />
  </head>
  <body>
    ${renderProductBody(product)}
    <script id="product-runtime-data" type="application/json">${runtimeProduct}</script>
    <script type="module" src="/product-page.mjs"></script>
  </body>
</html>
`;
}

export function renderSitemap(products) {
  const urls = ["/", ...products.map(({ detailPath }) => detailPath)];
  const entries = urls.map((url) => `  <url>\n    <loc>${PRODUCTION_ORIGIN}${url}</loc>\n  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}
