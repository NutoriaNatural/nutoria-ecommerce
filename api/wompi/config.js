const environmentFor = (value, testPrefix, productionPrefix) => {
  if (!value) return "missing";
  if (value.startsWith(testPrefix)) return "test";
  if (value.startsWith(productionPrefix)) return "prod";
  return "unknown";
};

export default function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "MÃ©todo no permitido." });
  }

  const publicKey = process.env.WOMPI_PUBLIC_KEY || process.env.WOMPI_PUBLIC_KEY_PROD;
  const integritySecret =
    process.env.WOMPI_INTEGRITY_SECRET ||
    process.env.WOMPI_INTEGRITY_SECRET_PROD ||
    process.env.WOMPI_INTEGRITY_KEY;
  const eventsSecret =
    process.env.WOMPI_EVENTS_SECRET ||
    process.env.WOMPI_EVENT_SECRET ||
    process.env.WOMPI_SECRET_EVENTS;

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
