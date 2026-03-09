// ============================================================
// PAYMENTS - STRIPE WEBHOOK VERIFICATION
// ============================================================

import { hmacSHA256Hex, safeEq } from './crypto.js';
import { getSecret } from '../utils/secrets.js';

// Verify Stripe webhook signature (HMAC SHA-256)
export async function verifyStripeWebhook(env, request) {
  const sigHeader = request.headers.get("Stripe-Signature") || "";
  const secret = await getSecret(env.STRIPE_WEBHOOK_SECRET);
  if (!secret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");

  const payload = await request.text();

  // Stripe-Signature example:
  // t=1492774577,v1=5257a869e7...,v1=anotherSig...,v0=...
  let t = null;
  const v1s = [];
  for (const part of sigHeader.split(",")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k === "t") t = v;
    else if (k === "v1" && v) v1s.push(v);
  }

  if (!t || v1s.length === 0) throw new Error("Invalid Stripe-Signature header");

  // Replay protection: reject if timestamp is too old/far in the future.
  // Stripe recommends a tolerance window (commonly 5 minutes).
  const ts = Number(t);
  if (!Number.isFinite(ts)) throw new Error("Invalid Stripe-Signature timestamp");
  const now = Math.floor(Date.now() / 1000);
  const toleranceSeconds = 5 * 60;
  if (Math.abs(now - ts) > toleranceSeconds) throw new Error("Stripe signature timestamp outside tolerance");

  const signed = `${t}.${payload}`;
  const expected = await hmacSHA256Hex(secret, signed);
  const ok = v1s.some((sig) => safeEq(expected, sig));
  if (!ok) throw new Error("Invalid Stripe signature");

  const event = JSON.parse(payload);
  return event;
}
