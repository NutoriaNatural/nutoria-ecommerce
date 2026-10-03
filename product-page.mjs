import { productBySlug } from "./data/products.mjs";
import { initializeProductDetail } from "./product-detail.mjs";

const slug = document.documentElement.dataset.productSlug;
const product = productBySlug.get(slug);

if (!product || !product.detailPath) {
  document.body.innerHTML = `<main class="container product-page"><h1>Producto no encontrado</h1><p><a href="/#productos">Volver a productos</a></p></main>`;
} else {
  document.title = `${product.name} | Nutoria`;
  document.body.innerHTML = `
    <header class="site-header" aria-label="Encabezado">
      <div class="container site-header__inner">
        <a class="brand" href="/" aria-label="Nutoria, ir al inicio"><img src="/assets/images/logo-nutoria-180.png" alt="Nutoria" width="180" height="180" /></a>
        <nav aria-label="Navegación principal"><ul class="site-nav"><li><a href="/#productos">Productos</a></li></ul></nav>
        <button class="cart-slot" data-cart-open type="button" aria-controls="cart-dialog" aria-haspopup="dialog">Carrito <span class="cart-count" data-cart-count aria-label="Productos en el carrito">0</span></button>
      </div>
    </header>
    <div class="payment-status container" data-payment-status role="status" hidden></div>
    <main class="product-page">
      <article class="container product-detail" data-product-detail>
        <section class="product-gallery" aria-label="Galería de ${product.name}">
          <div class="product-gallery__main"><img data-product-main-image src="" alt="" width="1080" height="1080" fetchpriority="high" /></div>
          <div class="product-gallery__thumbnails" data-product-thumbnails role="group" aria-label="Seleccionar imagen"></div>
        </section>
        <section class="product-purchase" aria-labelledby="product-name">
          <a class="product-purchase__back" href="/#productos">← Volver a productos</a>
          <p class="product-purchase__category" data-product-category></p>
          <h1 id="product-name" data-product-name></h1>
          <div class="product-purchase__field"><label for="product-presentation">Presentación</label><select id="product-presentation" data-product-presentation></select></div>
          <p class="product-purchase__price" data-product-price aria-live="polite"></p>
          <button class="product-card__button" data-product-add type="button">Agregar</button>
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
    </dialog>`;

  initializeProductDetail(slug);
  await import("./cart.mjs");
  await import("./whatsapp.mjs");
}
