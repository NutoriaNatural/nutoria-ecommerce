import { getDatabase } from "../../db/client.mjs";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "MÃ©todo no permitido." });
  }

  if (!process.env.POSTGRES_URL) {
    return response.status(503).json({
      service: "postgres",
      configured: false,
      connected: false,
    });
  }

  try {
    const result = await getDatabase().query(`
      SELECT
        current_database() AS database,
        current_setting('neon.branch_id', true) AS branch_id,
        current_setting('neon.endpoint_id', true) AS endpoint_id,
        to_regclass('public.orders') IS NOT NULL AS orders,
        to_regclass('public.order_items') IS NOT NULL AS order_items,
        to_regclass('public.payment_events') IS NOT NULL AS payment_events
    `);
    const row = result.rows[0];
    return response.status(200).json({
      service: "postgres",
      configured: true,
      connected: true,
      database: row.database,
      branchId: row.branch_id,
      endpointId: row.endpoint_id,
      tables: {
        orders: row.orders,
        orderItems: row.order_items,
        paymentEvents: row.payment_events,
      },
    });
  } catch (error) {
    console.error("FallÃ³ el diagnÃ³stico seguro de PostgreSQL.", { code: error.code });
    return response.status(503).json({
      service: "postgres",
      configured: true,
      connected: false,
      errorCode: error.code || "connection_failed",
    });
  }
}
