import { getOrderByTransactionId } from "../../lib/orders.mjs";

const json = (response, status, body) => {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return json(response, 405, { error: "MÃ©todo no permitido." });
  }

  const transactionId = typeof request.query?.id === "string" ? request.query.id.trim() : "";
  if (!transactionId || transactionId.length > 160) {
    return json(response, 400, { error: "Identificador de transacciÃ³n invÃ¡lido." });
  }

  try {
    const order = await getOrderByTransactionId(transactionId);
    if (!order) return json(response, 200, { id: transactionId, status: "PENDING" });
    return json(response, 200, {
      id: order.wompi_transaction_id,
      reference: order.reference,
      status: order.payment_status.toUpperCase(),
      orderStatus: order.order_status,
      amountInCents: Number(order.total_in_cents),
      currency: order.currency,
    });
  } catch (error) {
    console.error("No fue posible consultar el estado guardado del pago.", { code: error.code });
    return json(response, 500, { error: "No fue posible consultar el pago." });
  }
}
