export const WHATSAPP_NUMBER = "573117411563";

const GENERAL_MESSAGE =
  "Hola, vengo de la página de Nutoria y quisiera información sobre un producto.";

export function createWhatsAppUrl(message) {
  const query = new URLSearchParams({ text: message });
  return `https://wa.me/${WHATSAPP_NUMBER}?${query.toString()}`;
}

export function createProductWhatsAppUrl(productName) {
  return createWhatsAppUrl(
    `Hola, estoy viendo ${productName} en Nutoria y quisiera más información.`,
  );
}

const generalLink = typeof document !== "undefined"
  ? document.querySelector("[data-whatsapp-general]")
  : null;
if (generalLink) generalLink.href = createWhatsAppUrl(GENERAL_MESSAGE);
