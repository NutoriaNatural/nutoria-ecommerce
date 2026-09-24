import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("el panel privado no se indexa y no incrusta datos con HTML inseguro", async () => {
  const [html, script] = await Promise.all([
    readFile(new URL("../admin/index.html", import.meta.url), "utf8"),
    readFile(new URL("../admin/admin.mjs", import.meta.url), "utf8"),
  ]);
  assert.match(html, /name="robots" content="noindex,nofollow"/);
  assert.doesNotMatch(script, /innerHTML|insertAdjacentHTML|document\.write/);
  assert.match(script, /customer_email/);
  assert.match(script, /Enviar o reintentar notificaciones/);
});
