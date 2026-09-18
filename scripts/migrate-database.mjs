import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { getDatabase, closeDatabase } from "../db/client.mjs";

const migrationsUrl = new URL("../db/migrations/", import.meta.url);
const migrationsPath = fileURLToPath(migrationsUrl);
const migrations = (await readdir(migrationsPath))
  .filter((name) => /^\d+.*\.sql$/.test(name))
  .sort();

const database = getDatabase();
const client = await database.connect();

try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock($1)", [73117411563]);
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const name of migrations) {
    const exists = await client.query("SELECT 1 FROM schema_migrations WHERE name = $1", [name]);
    if (exists.rowCount) continue;

    const sql = await readFile(new URL(name, migrationsUrl), "utf8");
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
    console.log(`MigraciÃ³n aplicada: ${name}`);
  }

  await client.query("COMMIT");
  console.log("Migraciones completadas correctamente.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  client.release();
  await closeDatabase();
}
