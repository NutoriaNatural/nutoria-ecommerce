const json = (response, status, body) => {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return json(response, 405, { error: "Método no permitido." });
  }

  const transactionId = typeof request.query?.id === "string" ? request.query.id.trim() : "";
  if (!transactionId || transactionId.length > 160) {
    return json(response, 400, { error: "Identificador de transacción inválido." });
  }

  const privateKey = process.env.WOMPI_PRIVATE_KEY || process.env.WOMPI_PRIVATE_KEY_PROD;
  if (!privateKey) {
    return json(response, 503, { error: "La consulta de pagos aún no está configurada." });
  }

  const apiBase = privateKey.startsWith("prv_test_")
    ? "https://sandbox.wompi.co"
    : "https://production.wompi.co";

  const wompiResponse = await fetch(
    `${apiBase}/v1/transactions/${encodeURIComponent(transactionId)}`,
    { headers: { Accept: "application/json", Authorization: `Bearer ${privateKey}` } },
  );

  if (!wompiResponse.ok) {
    return json(response, wompiResponse.status === 404 ? 404 : 502, {
      error: "No fue posible verificar la transacción.",
    });
  }

  const payload = await wompiResponse.json();
  const transaction = payload.data;
  return json(response, 200, {
    id: transaction.id,
    reference: transaction.reference,
    status: transaction.status,
    amountInCents: transaction.amount_in_cents,
    currency: transaction.currency,
  });
}
