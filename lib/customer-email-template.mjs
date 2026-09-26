const BRAND = {
  green: "#042616",
  greenSoft: "#edf4ef",
  gold: "#d8a84e",
  goldSoft: "#f7eedb",
  ivory: "#f7f3e8",
  white: "#ffffff",
  text: "#173126",
  muted: "#64736b",
  border: "#dce4df",
  danger: "#8b1a1a",
  dangerSoft: "#fff0ee",
};

export const CUSTOMER_EMAIL_LINKS = {
  logo: "https://nutoria.com.co/assets/images/logo-nutoria-180.png",
  websiteIcon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Globe_icon.svg/40px-Globe_icon.svg.png",
  website: "https://nutoria.com.co",
  whatsappIcon: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/40px-WhatsApp.svg.png",
  whatsapp: "https://wa.me/573117411563",
  instagramIcon: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Instagram_logo_2022.svg/40px-Instagram_logo_2022.svg.png",
  instagram: "https://www.instagram.com/nutorianatural/",
  facebookIcon: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/40px-2021_Facebook_icon.svg.png",
  facebook: "https://www.facebook.com/profile.php?id=61592060948703&locale=es_LA",
};

const CONTENT = {
  customer_order_confirmed: {
    subject: "Tu pedido fue confirmado",
    eyebrow: "¡Gracias por tu compra!",
    heading: "Tu pedido fue confirmado",
    message: "Recibimos correctamente la confirmación de tu pago y tu pedido quedó registrado.",
    step: 0,
  },
  customer_preparing: {
    subject: "Estamos preparando tu pedido",
    eyebrow: "Tu pedido avanza",
    heading: "Estamos preparando tu pedido",
    message: "Estamos organizando cuidadosamente tus productos para que todo llegue en excelentes condiciones.",
    step: 1,
  },
  customer_dispatched: {
    subject: "¡Tu pedido ya va en camino!",
    eyebrow: "Pedido despachado",
    heading: "¡Tu pedido ya va en camino!",
    message: "Tu pedido ha sido despachado y se encuentra en proceso de entrega.",
    step: 2,
  },
  customer_delivered: {
    subject: "¡Tu pedido ha sido entregado!",
    eyebrow: "Entrega completada",
    heading: "¡Tu pedido ha sido entregado!",
    message: "Gracias por elegir Nutoria. Esperamos que disfrutes tus productos.",
    step: 3,
  },
  customer_cancelled: {
    subject: "Tu pedido ha sido cancelado",
    eyebrow: "Actualización de tu pedido",
    heading: "Tu pedido ha sido cancelado",
    message: "El pedido figura como cancelado. Este mensaje no confirma una devolución, reversión ni reembolso.",
    cancelled: true,
  },
};

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const money = (cents) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(Number(cents) / 100);

const safeQuantity = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

function productRows(order) {
  return order.items.map((item) => `
    <tr>
      <td style="padding:14px 10px;border-bottom:1px solid ${BRAND.border};vertical-align:top;">
        <strong style="display:block;color:${BRAND.text};font-size:14px;line-height:20px;">${escapeHtml(item.product_name)}</strong>
        ${item.presentation ? `<span style="display:block;color:${BRAND.muted};font-size:12px;line-height:18px;">${escapeHtml(item.presentation)}</span>` : ""}
      </td>
      <td align="center" style="padding:14px 6px;border-bottom:1px solid ${BRAND.border};color:${BRAND.text};font-size:13px;vertical-align:top;">${safeQuantity(item.quantity)}</td>
      <td align="right" style="padding:14px 6px;border-bottom:1px solid ${BRAND.border};color:${BRAND.text};font-size:13px;vertical-align:top;white-space:nowrap;">${money(item.unit_price_in_cents)}</td>
      <td align="right" style="padding:14px 10px;border-bottom:1px solid ${BRAND.border};color:${BRAND.text};font-size:13px;font-weight:700;vertical-align:top;white-space:nowrap;">${money(item.line_total_in_cents)}</td>
    </tr>`).join("");
}

function productsTable(order) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
      <tr style="background:${BRAND.greenSoft};">
        <th align="left" style="padding:10px;color:${BRAND.green};font-size:11px;letter-spacing:.5px;text-transform:uppercase;">Producto</th>
        <th align="center" style="padding:10px 6px;color:${BRAND.green};font-size:11px;letter-spacing:.5px;text-transform:uppercase;">Cant.</th>
        <th align="right" style="padding:10px 6px;color:${BRAND.green};font-size:11px;letter-spacing:.5px;text-transform:uppercase;">Precio</th>
        <th align="right" style="padding:10px;color:${BRAND.green};font-size:11px;letter-spacing:.5px;text-transform:uppercase;">Total</th>
      </tr>
      ${productRows(order)}
    </table>`;
}

function totalsTable(order) {
  const row = (label, value, total = false) => `
    <tr>
      <td style="padding:${total ? "14px 0 0" : "5px 0"};color:${total ? BRAND.green : BRAND.muted};font-size:${total ? "16px" : "13px"};font-weight:${total ? "700" : "400"};${total ? `border-top:1px solid ${BRAND.border};` : ""}">${label}</td>
      <td align="right" style="padding:${total ? "14px 0 0" : "5px 0"};color:${total ? BRAND.green : BRAND.text};font-size:${total ? "21px" : "13px"};font-weight:${total ? "700" : "600"};${total ? `border-top:1px solid ${BRAND.border};` : ""}">${money(value)}</td>
    </tr>`;
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
      ${row("Subtotal", order.subtotal_in_cents)}
      ${row("Envío", order.shipping_in_cents)}
      ${row("Total", order.total_in_cents, true)}
    </table>`;
}

function progress(step) {
  const labels = ["Confirmado", "En preparación", "Despachado", "Entregado"];
  const cells = labels.map((label, index) => {
    const current = index === step;
    const completed = index < step || (step === labels.length - 1 && index === step);
    const background = current ? BRAND.goldSoft : completed ? BRAND.greenSoft : BRAND.white;
    const color = current || completed ? BRAND.green : BRAND.muted;
    const marker = completed ? "✓" : current ? "●" : "○";
    return `<td align="center" width="25%" style="width:25%;padding:10px 4px;background:${background};border:1px solid ${current ? BRAND.gold : BRAND.border};color:${color};font-size:11px;line-height:16px;font-weight:${current ? "700" : "600"};"><span style="display:block;font-size:15px;line-height:18px;">${marker}</span>${label}</td>`;
  }).join("");
  return `
    <tr><td style="padding:0 32px 28px;">
      <p style="margin:0 0 10px;color:${BRAND.green};font-size:12px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;">Seguimiento del pedido</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;"><tr>${cells}</tr></table>
    </td></tr>`;
}

function cancelledStatus() {
  return `
    <tr><td style="padding:0 32px 28px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${BRAND.dangerSoft};border:1px solid #e9b8b1;border-collapse:separate;border-radius:8px;">
        <tr><td align="center" style="padding:16px;color:${BRAND.danger};font-size:14px;font-weight:700;">Estado: Cancelado</td></tr>
      </table>
    </td></tr>`;
}

function deliveryCard(order) {
  const detail = order.shipping_address_detail
    ? `<p style="margin:4px 0 0;color:${BRAND.muted};font-size:13px;line-height:20px;">${escapeHtml(order.shipping_address_detail)}</p>`
    : "";
  return `
    <tr><td style="padding:0 32px 28px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${BRAND.ivory};border:1px solid ${BRAND.border};border-collapse:separate;border-radius:10px;">
        <tr><td style="padding:20px;">
          <p style="margin:0 0 10px;color:${BRAND.green};font-size:12px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;">Información de entrega</p>
          <p style="margin:0;color:${BRAND.text};font-size:14px;line-height:21px;font-weight:600;">${escapeHtml(order.shipping_address)}</p>
          ${detail}
          <p style="margin:4px 0 0;color:${BRAND.muted};font-size:13px;line-height:20px;">${escapeHtml(order.shipping_city)}, ${escapeHtml(order.shipping_region)}</p>
        </td></tr>
      </table>
    </td></tr>`;
}

function footer() {
  const linkStyle = `display:block;color:${BRAND.green};font-size:12px;font-weight:700;line-height:18px;text-decoration:none;white-space:nowrap;`;
  const buttonStyle = `width:140px;padding:8px 10px;background:${BRAND.white};border-radius:18px;`;
  const iconStyle = "display:inline-block;width:16px;height:16px;margin:0 6px 0 0;border:0;vertical-align:-3px;";
  return `
    <tr><td align="center" style="padding:28px 24px;background:${BRAND.green};">
      <p style="margin:0;color:${BRAND.white};font-size:18px;font-weight:700;">Nutoria</p>
      <p style="margin:7px 0 18px;color:#dfe9e3;font-size:13px;">Pequeños hábitos, grandes cambios. 🌱</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="center" style="${buttonStyle}"><a href="${CUSTOMER_EMAIL_LINKS.website}" style="${linkStyle}"><img src="${CUSTOMER_EMAIL_LINKS.websiteIcon}" width="16" height="16" alt="Sitio web" style="${iconStyle}">Sitio web</a></td>
          <td width="8"></td>
          <td align="center" style="${buttonStyle}"><a href="${CUSTOMER_EMAIL_LINKS.whatsapp}" style="${linkStyle}"><img src="${CUSTOMER_EMAIL_LINKS.whatsappIcon}" width="16" height="16" alt="WhatsApp" style="${iconStyle}">WhatsApp</a></td>
        </tr>
        <tr><td height="8" colspan="3"></td></tr>
        <tr>
          <td align="center" style="${buttonStyle}"><a href="${CUSTOMER_EMAIL_LINKS.instagram}" style="${linkStyle}"><img src="${CUSTOMER_EMAIL_LINKS.instagramIcon}" width="16" height="16" alt="Instagram" style="${iconStyle}">Instagram</a></td>
          <td width="8"></td>
          <td align="center" style="${buttonStyle}"><a href="${CUSTOMER_EMAIL_LINKS.facebook}" style="${linkStyle}"><img src="${CUSTOMER_EMAIL_LINKS.facebookIcon}" width="16" height="16" alt="Facebook" style="${iconStyle}">Facebook</a></td>
        </tr>
      </table>
      <p style="margin:20px 0 0;color:#aebfb5;font-size:10px;line-height:16px;">Este es un correo automático relacionado con tu compra en Nutoria.</p>
    </td></tr>`;
}

function plainText(order, content) {
  const items = order.items.map((item) => [
    `- ${item.product_name}${item.presentation ? ` (${item.presentation})` : ""}`,
    `  Cantidad: ${safeQuantity(item.quantity)} | Precio: ${money(item.unit_price_in_cents)} | Total: ${money(item.line_total_in_cents)}`,
  ].join("\n")).join("\n");
  const address = [order.shipping_address, order.shipping_address_detail]
    .filter(Boolean).join(", ");
  const status = content.cancelled
    ? "Estado: Cancelado"
    : `Seguimiento: ${["Confirmado", "En preparación", "Despachado", "Entregado"].slice(0, content.step + 1).join(" → ")}`;
  return `${content.heading}

Hola ${order.customer_name}.
${content.message}

Referencia: ${order.reference}
${status}

Resumen del pedido
${items}

Subtotal: ${money(order.subtotal_in_cents)}
Envío: ${money(order.shipping_in_cents)}
Total: ${money(order.total_in_cents)}

Información de entrega
${address}
${order.shipping_city}, ${order.shipping_region}

Nutoria
Pequeños hábitos, grandes cambios. 🌱
Sitio web: ${CUSTOMER_EMAIL_LINKS.website}
WhatsApp: +57 311 741 1563 (${CUSTOMER_EMAIL_LINKS.whatsapp})
Instagram: @nutorianatural (${CUSTOMER_EMAIL_LINKS.instagram})
Facebook: Nutoria (${CUSTOMER_EMAIL_LINKS.facebook})

Este es un correo automático relacionado con tu compra en Nutoria.`;
}

export function customerOrderEmail(order, notificationType) {
  const content = CONTENT[notificationType];
  if (!content) throw new TypeError("Tipo de notificacion al cliente invalido.");
  const reference = escapeHtml(order.reference);
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(content.subject)}</title>
<style>@media only screen and (max-width:620px){.email-shell{width:100%!important}.email-pad{padding-left:20px!important;padding-right:20px!important}.email-title{font-size:27px!important}.email-logo{width:88px!important;height:88px!important}}</style>
</head><body style="margin:0;padding:0;background:${BRAND.ivory};font-family:Arial,Helvetica,sans-serif;color:${BRAND.text};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.message)} Referencia ${reference}.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${BRAND.ivory};"><tr><td align="center" style="padding:24px 10px;">
  <table role="presentation" width="620" cellspacing="0" cellpadding="0" border="0" class="email-shell" style="width:620px;max-width:620px;background:${BRAND.white};border:1px solid ${BRAND.border};border-collapse:separate;border-radius:14px;overflow:hidden;">
    <tr><td align="center" style="padding:30px 24px 24px;border-top:5px solid ${BRAND.gold};">
      <a href="${CUSTOMER_EMAIL_LINKS.website}" style="text-decoration:none;"><img src="${CUSTOMER_EMAIL_LINKS.logo}" width="110" height="110" class="email-logo" alt="Nutoria" style="display:block;width:110px;height:110px;border:0;border-radius:12px;object-fit:contain;"></a>
    </td></tr>
    <tr><td align="center" class="email-pad" style="padding:0 32px 28px;">
      <p style="margin:0 0 9px;color:${content.cancelled ? BRAND.danger : BRAND.gold};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(content.eyebrow)}</p>
      <h1 class="email-title" style="margin:0;color:${content.cancelled ? BRAND.danger : BRAND.green};font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:40px;font-weight:700;">${escapeHtml(content.heading)}</h1>
      <p style="margin:16px auto 0;max-width:480px;color:${BRAND.muted};font-size:15px;line-height:24px;">Hola ${escapeHtml(order.customer_name)}.<br>${escapeHtml(content.message)}</p>
    </td></tr>
    <tr><td class="email-pad" style="padding:0 32px 28px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${content.cancelled ? BRAND.dangerSoft : BRAND.greenSoft};border-collapse:separate;border-radius:10px;"><tr>
        <td style="padding:16px 18px;color:${BRAND.muted};font-size:12px;text-transform:uppercase;letter-spacing:.7px;">Referencia del pedido</td>
        <td align="right" style="padding:16px 18px;color:${content.cancelled ? BRAND.danger : BRAND.green};font-size:13px;font-weight:700;overflow-wrap:anywhere;">${reference}</td>
      </tr></table>
    </td></tr>
    ${content.cancelled ? cancelledStatus() : progress(content.step)}
    <tr><td class="email-pad" style="padding:0 32px 28px;">
      <p style="margin:0 0 12px;color:${BRAND.green};font-size:12px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;">Resumen del pedido</p>
      ${productsTable(order)}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td width="45%"></td><td style="padding-top:18px;">${totalsTable(order)}</td></tr></table>
    </td></tr>
    ${deliveryCard(order)}
    ${footer()}
  </table>
</td></tr></table></body></html>`;
  return {
    subject: `${content.subject} | ${order.reference}`,
    html,
    text: plainText(order, content),
  };
}
