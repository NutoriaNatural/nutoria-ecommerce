import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "nutoria_admin_session";
const SESSION_SECONDS = 8 * 60 * 60;

const configured = () => {
  const password = process.env.ADMIN_PASSWORD?.trim();
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  return password && password.length >= 12 && secret && secret.length >= 32
    ? { password, secret }
    : null;
};

const safeEqual = (left, right) => {
  const a = Buffer.from(left || "", "utf8");
  const b = Buffer.from(right || "", "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
};

const signatureFor = (payload, secret) =>
  createHmac("sha256", secret).update(payload, "utf8").digest("base64url");

export function adminAuthConfigured() {
  return Boolean(configured());
}

export function verifyAdminPassword(candidate) {
  const settings = configured();
  return Boolean(settings && safeEqual(candidate, settings.password));
}

export function createAdminSession(now = Date.now()) {
  const settings = configured();
  if (!settings) throw new Error("La autenticacion administrativa no esta configurada.");
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(now / 1000) + SESSION_SECONDS }))
    .toString("base64url");
  return `${payload}.${signatureFor(payload, settings.secret)}`;
}

export function verifyAdminSession(token, now = Date.now()) {
  const settings = configured();
  if (!settings || typeof token !== "string") return false;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || !safeEqual(signature, signatureFor(payload, settings.secret))) {
    return false;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number.isInteger(data.exp) && data.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

export function sessionFromRequest(request) {
  const cookies = String(request.headers?.cookie || "").split(";");
  const entry = cookies.find((cookie) => cookie.trim().startsWith(`${ADMIN_COOKIE}=`));
  return entry ? decodeURIComponent(entry.trim().slice(ADMIN_COOKIE.length + 1)) : "";
}

export function isAdminRequest(request) {
  return verifyAdminSession(sessionFromRequest(request));
}

export function adminCookie(token) {
  return `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}

export function clearAdminCookie() {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
