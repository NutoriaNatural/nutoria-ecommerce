import test from "node:test";
import assert from "node:assert/strict";
import { createIntegritySignature, paymentReturnUrl } from "../api/wompi/checkout.js";

test("Wompi regresa al mismo deployment en Preview", () => {
  assert.equal(
    paymentReturnUrl({ VERCEL_ENV: "preview", VERCEL_URL: "preview.example.vercel.app" }),
    "https://preview.example.vercel.app/?payment=return",
  );
});

test("Wompi conserva el dominio oficial en Production", () => {
  assert.equal(
    paymentReturnUrl({ VERCEL_ENV: "production" }),
    "https://nutoria.com.co/?payment=return",
  );
});

test("genera la firma oficial y descarta espacios invisibles del secreto", () => {
  assert.equal(
    createIntegritySignature(
      "ORDER-TEST-123",
      2490000,
      "COP",
      "  test_integrity_example_not_a_credential\r\n",
    ),
    "a82c57388adce09f64b1965dc17263020550c54c95f4ea453574eab0f8764091",
  );
});
