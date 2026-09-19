const environmentFor = (value, testPrefix, productionPrefix) => {
  if (!value) return "missing";
  if (value.startsWith(testPrefix)) return "test";
  if (value.startsWith(productionPrefix)) return "prod";
  return "unknown";
};

const environmentValue = (...values) =>
  values.find((value) => typeof value === "string" && value.trim())?.trim();

export default function handler(request, response) {
  if (process.env.VERCEL_ENV !== "preview") {
    return response.status(404).json({ error: "No encontrado." });
  }

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Método no permitido." });
  }

  const publicKey = environmentValue(process.env.WOMPI_PUBLIC_KEY, process.env.WOMPI_PUBLIC_KEY_PROD);
  const integritySecret = environmentValue(
    process.env.WOMPI_INTEGRITY_SECRET,
    process.env.WOMPI_INTEGRITY_SECRET_PROD,
    process.env.WOMPI_INTEGRITY_KEY,
  );
  const eventsSecret = environmentValue(
    process.env.WOMPI_EVENTS_SECRET,
    process.env.WOMPI_EVENT_SECRET,
    process.env.WOMPI_SECRET_EVENTS,
  );

  const environments = {
    publicKey: environmentFor(publicKey, "pub_test_", "pub_prod_"),
    integrity: environmentFor(integritySecret, "test_integrity_", "prod_integrity_"),
    events: environmentFor(eventsSecret, "test_events_", "prod_events_"),
  };
  const values = Object.values(environments);

  return response.status(200).json({
    service: "wompi-config",
    safeForTestPayments: values.every((value) => value === "test"),
    environments,
  });
}
