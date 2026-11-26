// TOTP (RFC 6238) implementation using @noble/hashes
// Compatible with Google Authenticator and all standard TOTP apps.

import { hmac } from "@noble/hashes/hmac.js";
import { sha1 } from "@noble/hashes/legacy.js";

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string): Uint8Array {
  const str = input.toUpperCase().replace(/=/g, "").replace(/\s/g, "");
  let bits = 0, value = 0;
  const output: number[] = [];
  for (const ch of str) {
    const idx = BASE32_CHARS.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

export function generateTotpSecret(length = 20): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map(b => BASE32_CHARS[b % 32]).join("");
}

function hotp(key: Uint8Array, counter: bigint): number {
  const buf = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    buf[i] = Number(counter & 0xffn);
    counter >>= 8n;
  }
  const h = hmac(sha1, key, buf);
  const offset = h[19] & 0x0f;
  return (
    ((h[offset] & 0x7f) << 24) |
    ((h[offset + 1] & 0xff) << 16) |
    ((h[offset + 2] & 0xff) << 8) |
    (h[offset + 3] & 0xff)
  ) % 1_000_000;
}

/** Verify a 6-digit TOTP code, allowing ±1 time-step (30s) clock skew. */
export function totpVerify(secret: string, token: string, windowSteps = 1): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  const key = base32Decode(secret);
  const counter = BigInt(Math.floor(Date.now() / 30_000));
  const code = parseInt(token, 10);
  for (let i = -windowSteps; i <= windowSteps; i++) {
    if (hotp(key, counter + BigInt(i)) === code) return true;
  }
  return false;
}

/** Generate the otpauth:// URI for a QR code shown in Google Authenticator. */
export function totpUri(email: string, secret: string, issuer = "GROXchange"): string {
  const account = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${account}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// In-memory store for pending TOTP setup (secret shown to user, not yet confirmed)
const pendingSecrets = new Map<string, { secret: string; expiresAt: number }>();

export function storePendingSecret(userId: string, secret: string): void {
  pendingSecrets.set(userId, { secret, expiresAt: Date.now() + 10 * 60 * 1000 });
}

export function getPendingSecret(userId: string): string | null {
  const entry = pendingSecrets.get(userId);
  if (!entry || Date.now() > entry.expiresAt) { pendingSecrets.delete(userId); return null; }
  return entry.secret;
}

export function clearPendingSecret(userId: string): void {
  pendingSecrets.delete(userId);
}

// In-memory store for pending logins (email verified but TOTP not yet entered)
const pendingLogins = new Map<string, { userId: string; expiresAt: number }>();

export function storePendingLogin(token: string, userId: string): void {
  pendingLogins.set(token, { userId, expiresAt: Date.now() + 5 * 60 * 1000 });
}

export function popPendingLogin(token: string): string | null {
  const entry = pendingLogins.get(token);
  if (!entry || Date.now() > entry.expiresAt) { pendingLogins.delete(token); return null; }
  pendingLogins.delete(token);
  return entry.userId;
}
