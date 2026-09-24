const $ = (selector) => document.querySelector(selector);
const loginView = $("#login-view");
const ordersView = $("#orders-view");
const list = $("#orders-list");
const detail = $("#order-detail");
const logout = $("#logout");
let selectedId = null;

const labels = {
  awaiting_payment: "Esperando pago", ready_to_prepare: "Por preparar",
  preparing: "En preparación", dispatched: "Despachado",
  delivered: "Entregado", cancelled: "Cancelado",
};
const normalFulfillmentStatuses = ["ready_to_prepare", "preparing", "dispatched", "delivered"];
const notificationLabels = {
  email: "Correo administrativo",
  customer_email: "Correo al cliente",
  whatsapp: "WhatsApp administrativo",
};
const money = (cents) => new Intl.NumberFormat("es-CO", { style:"currency", currency:"COP", maximumFractionDigits:0 }).format(Number(cents) / 100);
const date = (value) => value ? new Intl.DateTimeFormat("es-CO", { dateStyle:"medium", timeStyle:"short" }).format(new Date(value)) : "—";

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers:{ "Content-Type":"application/json", ...options.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body.error || "Error de comunicación."), { status:response.status });
  return body;
}
const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text != null) element.textContent = text;
  if (className) element.className = className;
  return element;
};

function showAuthenticated(authenticated) {
  loginView.hidden = authenticated;
  ordersView.hidden = !authenticated;
  logout.hidden = !authenticated;
}

async function loadOrders() {
  $("#orders-message").textContent = "Consultando pedidos…";
  try {
    const status = $("#status-filter").value;
    const { orders } = await api(`/api/admin/orders${status ? `?status=${encodeURIComponent(status)}` : ""}`);
    list.replaceChildren();
    if (!orders.length) list.append(node("p", "No hay pedidos con este filtro."));
    for (const order of orders) {
      const button = node("button", null, "order-card");
      button.type = "button";
      button.dataset.id = order.id;
      button.setAttribute("aria-current", order.id === selectedId ? "true" : "false");
      button.append(node("strong", order.reference), node("span", order.customer_name));
      const badge = node("span", labels[order.fulfillment_status] || order.fulfillment_status, "badge");
      const summary = node("small");
      summary.append(node("span", money(order.total_in_cents)), node("span", date(order.created_at)));
      button.append(badge, summary);
      button.addEventListener("click", () => loadDetail(order.id));
      list.append(button);
    }
    $("#orders-message").textContent = `${orders.length} pedido${orders.length === 1 ? "" : "s"}.`;
  } catch (error) {
    if (error.status === 401) return showAuthenticated(false);
    $("#orders-message").textContent = error.message;
  }
}

function addField(container, label, value) {
  const field = node("p");
  field.append(node("strong", `${label}: `), document.createTextNode(value || "—"));
  container.append(field);
}

async function loadDetail(id) {
  selectedId = id;
  detail.replaceChildren(node("p", "Consultando detalle…"));
  document.querySelectorAll(".order-card").forEach((card) => card.setAttribute("aria-current", card.dataset.id === id ? "true" : "false"));
  try {
    const { order } = await api(`/api/admin/order?id=${encodeURIComponent(id)}`);
    detail.replaceChildren(node("h2", order.reference));
    const grid = node("div", null, "detail-grid");
    addField(grid, "Pago", order.payment_status);
    addField(grid, "Preparación", labels[order.fulfillment_status] || order.fulfillment_status);
    addField(grid, "Cliente", order.customer_name);
    addField(grid, "Teléfono", order.customer_phone);
    addField(grid, "Correo", order.customer_email);
    addField(grid, "Fecha", date(order.created_at));
    addField(grid, "Dirección", [order.shipping_address, order.shipping_address_detail].filter(Boolean).join(", "));
    addField(grid, "Ciudad", `${order.shipping_city}, ${order.shipping_region}`);
    detail.append(grid);
    const itemsTitle = node("h3", "Productos");
    const items = node("ul", null, "items");
    order.items.forEach((item) => items.append(node("li", `${item.product_name} ${item.presentation} × ${item.quantity} — ${money(item.line_total_in_cents)}`)));
    const totals = node("table", null, "totals");
    for (const [label, value] of [["Subtotal", order.subtotal_in_cents], ["Envío", order.shipping_in_cents], ["Total", order.total_in_cents]]) {
      const row = totals.insertRow(); row.append(node("th", label), node("td", money(value)));
    }
    detail.append(itemsTitle, items, totals);
    const notificationsTitle = node("h3", "Notificaciones");
    detail.append(notificationsTitle);
    if (!order.notifications.length) detail.append(node("p", "Aún no hay notificaciones asociadas."));
    order.notifications.forEach((notification) => {
      const item = node("div", null, "notification");
      item.append(node("strong", `${notificationLabels[notification.channel] || notification.channel}: ${notification.status}`));
      if (notification.sent_at) item.append(node("span", ` — ${date(notification.sent_at)}`));
      if (notification.last_error) item.append(node("p", notification.last_error, "error"));
      detail.append(item);
    });
    if (order.notifications.some((item) => ["pending", "failed"].includes(item.status) && item.attempts < 5)) {
      const retry = node("button", "Enviar o reintentar notificaciones", "secondary");
      retry.addEventListener("click", async () => {
        retry.disabled = true;
        try { await api("/api/admin/notifications", { method:"POST", body:JSON.stringify({ id }) }); await loadDetail(id); }
        catch (error) { alert(error.message); retry.disabled = false; }
      });
      detail.append(retry);
    }
    const form = node("form", null, "status-form");
    const statusLabel = node("label", "Estado normal del despacho");
    const select = node("select"); select.name = "status";
    if (!normalFulfillmentStatuses.includes(order.fulfillment_status)) {
      const placeholder = node("option", labels[order.fulfillment_status] || "Selecciona un estado");
      placeholder.value = ""; placeholder.selected = true; placeholder.disabled = true;
      select.append(placeholder);
    }
    normalFulfillmentStatuses.forEach((value) => {
      const option=node("option",labels[value]); option.value=value;
      option.selected=value===order.fulfillment_status; select.append(option);
    });
    statusLabel.append(select);
    const notesLabel = node("label", "Notas internas");
    const notes = node("textarea"); notes.name="notes"; notes.maxLength=500; notes.value=order.fulfillment_notes || ""; notesLabel.append(notes);
    const save = node("button", "Guardar estado"); save.type="submit";
    const message = node("p", "", "message");
    form.append(statusLabel, notesLabel, save, message);
    form.addEventListener("submit", async (event) => {
      event.preventDefault(); save.disabled=true; message.textContent="Guardando…";
      try { await api(`/api/admin/order?id=${encodeURIComponent(id)}`, { method:"PATCH", body:JSON.stringify({ id, status:select.value, notes:notes.value }) }); message.textContent="Estado actualizado."; await loadOrders(); await loadDetail(id); }
      catch (error) { message.textContent=error.message; save.disabled=false; }
    });
    detail.append(form);
    if (!["delivered", "cancelled"].includes(order.fulfillment_status)) {
      const cancelSection = node("section", null, "cancel-section");
      cancelSection.append(
        node("h3", "Cancelar pedido"),
        node("p", "Esta acción cambia el seguimiento, pero no genera un reembolso automático en Wompi."),
      );
      const cancelButton = node("button", "Cancelar pedido", "danger");
      cancelButton.type = "button";
      cancelButton.addEventListener("click", async () => {
        const reason = notes.value.trim();
        if (!reason) { message.textContent="Escribe primero el motivo en Notas internas."; notes.focus(); return; }
        if (!window.confirm("¿Confirmas la cancelación? Esta acción no reembolsa automaticamente el pago en Wompi.")) return;
        cancelButton.disabled = true; message.textContent="Cancelando pedido…";
        try {
          await api(`/api/admin/order?id=${encodeURIComponent(id)}`, {
            method:"PATCH", body:JSON.stringify({ id, status:"cancelled", notes:reason }),
          });
          await loadOrders(); await loadDetail(id);
        } catch (error) { message.textContent=error.message; cancelButton.disabled=false; }
      });
      cancelSection.append(cancelButton);
      detail.append(cancelSection);
    }
  } catch (error) { detail.replaceChildren(node("p", error.message, "error")); }
}

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message=$("#login-message"); message.textContent="Ingresando…";
  try { await api("/api/admin/session", { method:"POST", body:JSON.stringify({ password:$("#password").value }) }); $("#password").value=""; showAuthenticated(true); await loadOrders(); }
  catch (error) { message.textContent=error.message; }
});
logout.addEventListener("click", async () => { await api("/api/admin/session", { method:"DELETE" }); selectedId=null; showAuthenticated(false); });
$("#refresh").addEventListener("click", loadOrders);
$("#status-filter").addEventListener("change", loadOrders);

try {
  const session = await api("/api/admin/session");
  showAuthenticated(session.authenticated);
  if (session.authenticated) await loadOrders();
  else if (!session.configured) $("#login-message").textContent="El panel aún no tiene sus variables de acceso configuradas.";
} catch { showAuthenticated(false); }
