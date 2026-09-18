import test from "node:test";
import assert from "node:assert/strict";
import { paymentReturnUrl } from "../api/wompi/checkout.js";

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
