import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  Cart,
  FREE_SHIPPING_SUBTOTAL,
  SHIPPING_TIERS,
  calculateShipping,
  shippingProgress,
  shippingProgressMessage,
} from "../cart.mjs";
import { shippingFor } from "../lib/order-pricing.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("el botón flotante abre el único carrito y comparte el contador real", () => {
  const html = read("index.html");
  const cart = read("cart.mjs");
  const openers = html.match(/data-cart-open/g) || [];
  const counters = html.match(/data-cart-count/g) || [];
  assert.equal(openers.length, 2);
  assert.equal(counters.length, 2);
  assert.match(html, /class="cart-fab"[^>]*aria-label="Abrir carrito"/);
  assert.equal((html.match(/id="cart-dialog"/g) || []).length, 1);
  assert.match(cart, /document\.querySelectorAll\("\[data-cart-open\]"\)/);
  assert.match(cart, /openButtons\.forEach\(\(button\) => button\.addEventListener\("click", openCart\)\)/);
  assert.match(cart, /counts\.forEach\(\(count\) => \{ count\.textContent = String\(state\.quantity\); \}\)/);
  assert.match(cart, /dialog\.addEventListener\("close", \(\) => document\.body\.classList\.remove\("cart-open"\)\)/);
});

test("aumentar, disminuir y eliminar conservan cálculos y cantidades válidas", () => {
  const cart = new Cart([{ id: "producto", name: "Producto 250g", price: 10000, quantity: 1 }]);
  assert.equal(cart.snapshot().quantity, 1);
  cart.setQuantity("producto", 2);
  assert.deepEqual(cart.snapshot(), {
    items: [{ id: "producto", name: "Producto 250g", price: 10000, quantity: 2 }],
    quantity: 2,
    subtotal: 20000,
    shipping: 16000,
    total: 36000,
  });
  cart.setQuantity("producto", 1);
  assert.equal(cart.snapshot().quantity, 1);
  cart.remove("producto");
  assert.deepEqual(cart.snapshot(), { items: [], quantity: 0, subtotal: 0, shipping: 0, total: 0 });

  const source = read("cart.mjs");
  assert.match(source, /decrease\.disabled = item\.quantity <= 1/);
  assert.match(source, /Math\.max\(1, item\.quantity - 1\)/);
  assert.match(source, /cart\.setQuantity\(item\.id, item\.quantity \+ 1\)/);
  assert.match(source, /remove\.setAttribute\("aria-label", "Eliminar producto"\)/);
});

test("los mensajes del próximo beneficio derivan de la misma regla de envío", () => {
  assert.equal(FREE_SHIPPING_SUBTOTAL, 300000);
  assert.deepEqual(SHIPPING_TIERS, [
    { minimum: 0, shipping: 16000 },
    { minimum: 100000, shipping: 12000 },
    { minimum: 200000, shipping: 8000 },
    { minimum: 300000, shipping: 0 },
  ]);
  assert.equal(calculateShipping(299999), 8000);
  assert.equal(calculateShipping(FREE_SHIPPING_SUBTOTAL), 0);
  [
    [99999, 16000],
    [100000, 12000],
    [199999, 12000],
    [200000, 8000],
    [299999, 8000],
    [300000, 0],
  ].forEach(([subtotal, expected]) => {
    assert.equal(calculateShipping(subtotal), expected);
    assert.equal(shippingFor(subtotal), expected);
  });
  [
    [99999, /\$\s?1.*envío baje a.*12[.]000/],
    [100000, /100[.]000.*envío baje a.*8[.]000/],
    [199999, /\$\s?1.*envío baje a.*8[.]000/],
    [200000, /100[.]000.*envío gratis/],
    [299999, /\$\s?1.*envío gratis/],
  ].forEach(([subtotal, expectedMessage]) => {
    assert.match(shippingProgressMessage(subtotal), expectedMessage);
  });
  assert.match(shippingProgressMessage(0), /100[.]000/);
  assert.match(shippingProgressMessage(299999), /\$\s?1\b/);
  assert.equal(shippingProgressMessage(FREE_SHIPPING_SUBTOTAL), "¡Tu pedido tiene envío gratis!");

  const firstLevel = shippingProgress(35500);
  assert.match(firstLevel.primary, /64[.]500.*envío baje a.*12[.]000/);
  assert.match(firstLevel.secondary, /12[.]000 desde.*100[.]000.*8[.]000 desde.*200[.]000.*Gratis desde.*300[.]000/);
  const secondLevel = shippingProgress(150000);
  assert.match(secondLevel.primary, /50[.]000.*envío baje a.*8[.]000/);
  assert.doesNotMatch(secondLevel.secondary, /12[.]000/);
  assert.match(secondLevel.secondary, /8[.]000 desde.*200[.]000.*Gratis desde.*300[.]000/);
  const thirdLevel = shippingProgress(230000);
  assert.match(thirdLevel.primary, /70[.]000.*envío gratis/);
  assert.equal(thirdLevel.secondary.replace(/\s/g, " ").replace(/ +/g, " "), "Envío: Gratis desde $ 300.000");
  assert.deepEqual(shippingProgress(300000), {
    primary: "¡Tu pedido tiene envío gratis!",
    secondary: "",
  });
  const html = read("index.html");
  assert.match(html, /data-shipping-message[^>]*aria-live="polite"/);
  assert.match(html, /data-shipping-details/);
  assert.doesNotMatch(html, /\$16\.000 hasta \$99\.999/);
});

test("cada producto reutiliza su imagen del catálogo y ofrece un fallback seguro", () => {
  const catalog = read("product-catalog.mjs");
  const cart = read("cart.mjs");
  const css = read("styles.css");
  assert.match(catalog, /button\.dataset\.productImage = product\.image/);
  assert.match(cart, /image: button\.dataset\.productImage/);
  assert.match(cart, /typeof item\.image === "string" && item\.image\.trim\(\)/);
  assert.match(cart, /image\.addEventListener\("error"/);
  assert.match(cart, /media\.textContent = "Sin imagen"/);
  assert.match(css, /\.cart-item__media\s*{[^}]*width:\s*72px[^}]*height:\s*72px/s);
  assert.match(css, /\.cart-item__media img\s*{[^}]*object-fit:\s*contain/s);
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.cart-item__media\s*{[^}]*width:\s*64px[^}]*height:\s*64px/s);
});

test("el formulario identifica campos obligatorios sin cambiar validaciones", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const requiredInputs = html.match(/<input[^>]*required[^>]*>/g) || [];
  assert.equal(requiredInputs.length, 7);
  assert.equal((html.match(/class="required-marker"/g) || []).length, 7);
  assert.match(html, /Complemento o indicaciones de la dirección \(opcional\)/);
  assert.match(html, /<input name="addressDetail"[^>]*>/);
  assert.doesNotMatch(html.match(/<input name="addressDetail"[^>]*>/)?.[0] || "", /required/);
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.checkout-form input\s*{[^}]*min-height:\s*44px[^}]*padding:\s*0\.5rem 0\.65rem/s);
});

test("persistencia, checkout y contrato público permanecen conectados", () => {
  const cart = read("cart.mjs");
  assert.match(cart, /localStorage\.getItem\(STORAGE_KEY\)/);
  assert.match(cart, /localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(cart\.snapshot\(\)\.items\)\)/);
  assert.match(cart, /fetch\("\/api\/wompi\/checkout"/);
  assert.match(cart, /items: state\.items\.map\(\(\{ id, quantity \}\) => \(\{ id, quantity \}\)\)/);
  assert.match(cart, /customer: Object\.fromEntries\(formData\)/);
});

test("el diálogo móvil y las acciones flotantes respetan espacio y safe-area", () => {
  const css = read("styles.css");
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.cart-dialog\s*{[^}]*width:\s*100%[^}]*max-height:\s*100dvh[^}]*overflow-x:\s*hidden/s);
  assert.match(css, /@media\s*\(max-width:\s*719px\)[\s\S]*?\.cart-fab\s*{[^}]*display:\s*inline-flex[^}]*width:\s*54px[^}]*height:\s*54px/s);
  assert.match(css, /\.mobile-actions\s*{[^}]*flex-direction:\s*column[^}]*gap:\s*0\.75rem/s);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /\.cart-open \.mobile-actions\s*{[^}]*visibility:\s*hidden[^}]*pointer-events:\s*none/s);
  assert.match(css, /\.cart-item__quantity\s*{[^}]*grid-template-columns:\s*44px[^}]*44px/s);
  assert.match(css, /\.checkout-form__button\s*{[^}]*min-height:\s*52px/s);
});

test("el carrito flotante permanece visible y conectado también en desktop", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const cart = read("cart.mjs");
  assert.match(css, /\.cart-fab\s*{[^}]*display:\s*inline-flex[^}]*width:\s*56px[^}]*height:\s*56px/s);
  assert.doesNotMatch(css, /@media\s*\(min-width:\s*720px\)[\s\S]*?\.cart-fab\s*{[^}]*display:\s*none/s);
  assert.match(css, /\.mobile-actions\s*{[^}]*position:\s*fixed[^}]*flex-direction:\s*column[^}]*gap:\s*0\.75rem/s);
  assert.equal((html.match(/class="cart-fab"/g) || []).length, 1);
  assert.match(html, /class="cart-fab"[^>]*data-cart-open[^>]*aria-controls="cart-dialog"/);
  assert.match(html, /class="cart-fab__count"[^>]*data-cart-count/);
  assert.match(cart, /openButtons\.forEach\(\(button\) => button\.addEventListener\("click", openCart\)\)/);
  assert.match(cart, /counts\.forEach\(\(count\) => \{ count\.textContent = String\(state\.quantity\); \}\)/);
});
