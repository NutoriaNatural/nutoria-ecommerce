import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  Cart,
  FREE_SHIPPING_SUBTOTAL,
  calculateShipping,
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

test("el mensaje de envío gratis deriva de la misma regla de envío", () => {
  assert.equal(FREE_SHIPPING_SUBTOTAL, 300000);
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
  assert.match(shippingProgressMessage(0), /300[.]000/);
  assert.match(shippingProgressMessage(299999), /\$\s?1\b/);
  assert.equal(shippingProgressMessage(FREE_SHIPPING_SUBTOTAL), "¡Tu pedido tiene envío gratis!");
  const html = read("index.html");
  assert.match(html, /data-shipping-message[^>]*aria-live="polite"/);
  assert.doesNotMatch(html, /\$16\.000 hasta \$99\.999/);
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
