import test from "node:test";
import assert from "node:assert/strict";
import { validateCustomer } from "../lib/orders.mjs";

const validCustomer = {
  name: "Cliente Nutoria",
  email: "cliente@example.com",
  phone: "300 123 4567",
  documentNumber: "  AB  123456  ",
  address: "Dirección de entrega",
  addressDetail: "",
  city: "Envigado",
  region: "Antioquia",
};

test("exige y normaliza el número de documento", () => {
  const customer = validateCustomer(validCustomer);
  assert.equal(customer.documentNumber, "AB 123456");
  assert.throws(
    () => validateCustomer({ ...validCustomer, documentNumber: "" }),
    /datos de entrega/,
  );
  assert.throws(
    () => validateCustomer({ ...validCustomer, documentNumber: "AB\n123456" }),
    /datos de entrega/,
  );
  assert.throws(
    () => validateCustomer({ ...validCustomer, documentNumber: "X".repeat(41) }),
    /datos de entrega/,
  );
});
