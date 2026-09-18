import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { getDatabase, closeDatabase } from "../db/client.mjs";

const migrationsUrl = new URL("../db/migrations/", import.meta.url);
const names = (await readdir(fileURLToPath(migrationsUrl)))
  .filter((name) => /^\d+.*\.sql$/.test(name))
  .sort();
const database = getDatabase();
const client = await database.connect();

try {
  await client.query("BEGIN");
  for (const name of names) {
    await client.query(await readFile(new URL(name, migrationsUrl), "utf8"));
  }
  await client.query("ROLLBACK");
  console.log("SQL de migraciones validado; todos los cambios fueron revertidos.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  client.release();
  await closeDatabase();
}
