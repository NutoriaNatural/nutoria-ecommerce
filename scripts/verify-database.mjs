import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { closeDatabase, getDatabase } from "../db/client.mjs";

const schemaUrl = new URL("../db/schema.sql", import.meta.url);
const schema = await readFile(fileURLToPath(schemaUrl), "utf8");
const database = getDatabase();
const client = await database.connect();

try {
  await client.query("BEGIN");
  await client.query(schema);

  const inserted = await client.query(
    `INSERT INTO consultas (nombre, telefono, mensaje, estado)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    ["prueba", "prueba", "prueba", "prueba"],
  );

  const recovered = await client.query(
    `SELECT nombre, telefono, mensaje, estado
     FROM consultas
     WHERE id = $1`,
    [inserted.rows[0].id],
  );

  if (recovered.rowCount !== 1) {
    throw new Error("No fue posible recuperar el registro de prueba.");
  }

  console.log("PostgreSQL: el registro de prueba se guardó y recuperó correctamente.");
} finally {
  await client.query("ROLLBACK");
  client.release();
  await closeDatabase();
}
