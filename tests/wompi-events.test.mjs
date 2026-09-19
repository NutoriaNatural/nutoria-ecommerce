import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { verifyWompiEvent } from "../api/wompi/events.js";
import { expectedWompiEnvironment } from "../lib/wompi-events.mjs";

const secret = "test_events_example";
const event = {
  event: "transaction.updated",
  environment: "test",
  timestamp: 1700000000,
  data: { transaction: { id: "tx-1", status: "APPROVED", amount_in_cents: 3000000 } },
  signature: {
    properties: ["transaction.id", "transaction.status", "transaction.amount_in_cents"],
  },
};
event.signature.checksum = createHash("sha256")
  .update(`tx-1APPROVED3000000${event.timestamp}${secret}`)
  .digest("hex");

test("verifica la firma dinámica de Wompi", () => {
  assert.equal(verifyWompiEvent(event, null, secret), true);
  assert.equal(verifyWompiEvent(event, null, `${secret}-incorrecto`), false);
});

test("deduce y separa el ambiente por el secreto", () => {
  assert.equal(expectedWompiEnvironment("test_events_x"), "test");
  assert.equal(expectedWompiEnvironment("prod_events_x"), "prod");
  assert.equal(expectedWompiEnvironment("otro"), null);
});
