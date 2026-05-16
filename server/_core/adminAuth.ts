// ─── Admin Panel Auth — HMAC-signed cookie (no DB session table needed) ─────
// The cookie payload is just an expiry timestamp; the signature ensures it
// can't be forged. The secret comes from ADMIN_SESSION_SECRET env var.
import crypto from "node:crypto";
import { ENV } from "./env";

export const ADMIN_COOKIE_NAME = "tanjo_admin";
const TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function hmac(payload: string): string {
  return crypto.createHmac("sha256", ENV.adminSessionSecret).update(payload).digest("hex");
}

/**
 * Sign an admin session cookie. The cookie value is `<expiryMs>.<hmac>`.
 */
export function signAdminCookie(): { value: string; maxAge: number } {
  const expiry = Date.now() + TTL_MS;
  const payload = String(expiry);
  const signature = hmac(payload);
  return { value: `${payload}.${signature}`, maxAge: TTL_MS };
}

/**
 * Verify an admin cookie value. Returns true if valid + unexpired.
 */
export function verifyAdminCookie(value: string | undefined): boolean {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;
  const expected = hmac(payload);
  // Constant-time comparison to avoid timing attacks
  if (!safeCompare(expected, signature)) return false;
  const expiry = parseInt(payload, 10);
  if (!Number.isFinite(expiry)) return false;
  return expiry > Date.now();
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Check the supplied password against the configured admin password.
 * Returns false if either side is empty (so an unconfigured admin password
 * can't be bypassed with an empty submit).
 */
export function checkAdminPassword(submitted: string): boolean {
  if (!submitted || !ENV.adminPassword) return false;
  if (submitted.length !== ENV.adminPassword.length) {
    // Different lengths — still do a constant-time check on a same-length pair
    // to keep timing flat, then fail.
    safeCompare(submitted.padEnd(64), "x".padEnd(64));
    return false;
  }
  return safeCompare(submitted, ENV.adminPassword);
}
