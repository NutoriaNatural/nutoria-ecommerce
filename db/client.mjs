import pg from "pg";

const { Pool } = pg;

let pool;

export function getDatabase() {
  if (!process.env.POSTGRES_URL) {
    throw new Error("Falta la variable de entorno POSTGRES_URL.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return pool;
}
export async function closeDatabase() {
  if (!pool) return;
  await pool.end();
  pool = undefined;
}
