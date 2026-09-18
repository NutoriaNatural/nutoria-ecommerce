import { getDatabase, closeDatabase } from "../db/client.mjs";

const database = getDatabase();
const client = await database.connect();

try {
  await client.query("BEGIN READ ONLY");
  const result = await client.query(`
    SELECT
      current_database() AS database,
      current_user AS role,
      version() AS version,
      current_setting('neon.project_id', true) AS project_id,
      current_setting('neon.branch_id', true) AS branch_id,
      current_setting('neon.endpoint_id', true) AS endpoint_id,
      current_setting('transaction_read_only') AS read_only
  `);

  console.log(JSON.stringify(result.rows[0], null, 2));
  await client.query("ROLLBACK");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  client.release();
  await closeDatabase();
}
