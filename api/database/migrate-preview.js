import { timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { getDatabase } from "../../db/client.mjs";

const EXPECTED_BRANCH_ID = "br-dry-wildflower-awds0no3";
const migrations = [
  ["001_orders.sql", new URL("../../db/migrations/001_orders.sql", import.meta.url)],
  ["002_payment_event_idempotency.sql", new URL("../../db/migrations/002_payment_event_idempotency.sql", import.meta.url)],
];

const sameSecret = (received, expected) => {
  if (!received || !expected || received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "MÃ©todo no permitido." });
  }
  if (process.env.VERCEL_ENV !== "preview") {
    return response.status(403).json({ error: "MigraciÃ³n permitida Ãºnicamente en Preview." });
  }
  if (!sameSecret(request.headers["x-preview-migration-secret"], process.env.VERCEL_AUTOMATION_BYPASS_SECRET)) {
    return response.status(401).json({ error: "AutorizaciÃ³n invÃ¡lida." });
  }

  const client = await getDatabase().connect();
  try {
    await client.query("BEGIN");
    const identity = await client.query(
      "SELECT current_setting('neon.branch_id', true) AS branch_id",
    );
    if (identity.rows[0]?.branch_id !== EXPECTED_BRANCH_ID) {
      throw Object.assign(new Error("La rama Neon no coincide con Preview."), { code: "WRONG_BRANCH" });
    }

    await client.query("SELECT pg_advisory_xact_lock($1)", [73117411563]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const applied = [];
    for (const [name, url] of migrations) {
      const exists = await client.query("SELECT 1 FROM schema_migrations WHERE name = $1", [name]);
      if (exists.rowCount) continue;
      await client.query(await readFile(url, "utf8"));
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
      applied.push(name);
    }
    await client.query("COMMIT");
    return response.status(200).json({ migrated: true, branchId: EXPECTED_BRANCH_ID, applied });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("FallÃ³ la migraciÃ³n protegida de Preview.", { code: error.code });
    return response.status(500).json({ migrated: false, errorCode: error.code || "migration_failed" });
  } finally {
    client.release();
  }
}
