import { getDatabase, closeDatabase } from "../db/client.mjs";

const database = getDatabase();
const client = await database.connect();

try {
  await client.query("BEGIN READ ONLY");
  const tables = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'orders', 'order_items', 'payment_events', 'schema_migrations',
        'order_status_history', 'notification_jobs'
      )
    ORDER BY table_name
  `);
  const migrations = await client.query("SELECT name FROM schema_migrations ORDER BY name");
  const testOrders = await client.query(
    "SELECT COUNT(*)::int AS count FROM orders WHERE customer_email LIKE '%@example.com'",
  );
  console.log(JSON.stringify({
    tables: tables.rows.map((row) => row.table_name),
    migrations: migrations.rows.map((row) => row.name),
    syntheticOrdersRemaining: testOrders.rows[0].count,
  }, null, 2));
  await client.query("ROLLBACK");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  client.release();
  await closeDatabase();
}
