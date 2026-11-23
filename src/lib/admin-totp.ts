import { createHmac, timingSafeEqual } from "crypto";

// ── TOTP (RFC 6238) — pure Node.js, no deps ───────────────────────────────────

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function b32decode(s: string): Buffer {
  const str = s.replace(/=+$/, "").toUpperCase();
  let bits = 0, val = 0;
  const out: number[] = [];
  for (const c of str) {
    const idx = B32.indexOf(c);
    if (idx === -1) continue;
    val = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) { out.push((val >> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(out);
}

function hotp(secret: string, counter: number): string {
  const key = b32decode(secret);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", key).update(msg).digest();
  const off = h[19] & 0x0f;
  const code = ((h[off] & 0x7f) << 24 | h[off + 1] << 16 | h[off + 2] << 8 | h[off + 3]) % 1_000_000;
  return String(code).padStart(6, "0");
}

export function verifyTotp(secret: string, token: string): boolean {
  const t = Math.floor(Date.now() / 30_000);
  // allow ±1 window for clock drift
  for (const delta of [-1, 0, 1]) {
    const expected = Buffer.from(hotp(secret, t + delta));
    const received = Buffer.from(token.trim().padStart(6, "0"));
    if (expected.length === received.length && timingSafeEqual(expected, received)) return true;
  }
  return false;
}

export function totpUri(secret: string): string {
  const issuer = "GROXchange Admin";
  const account = process.env.ADMIN_EMAIL ?? "admin";
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// ── Signed admin session token (no DB needed) ─────────────────────────────────
// Format: "{expiresAt}.{hmac-sha256}"

const ADMIN_SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
export const ADMIN_2FA_COOKIE = "nb_admin_2fa";

export function issueAdminToken(): string {
  const secret = process.env.ADMIN_TOTP_SECRET;
  if (!secret) throw new Error("ADMIN_TOTP_SECRET not configured");
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
  const sig = createHmac("sha256", secret).update(String(expiresAt)).digest("hex");
  return `${expiresAt}.${sig}`;
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const secret = process.env.ADMIN_TOTP_SECRET;
  if (!secret) return false;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;
  const expiresAt = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (Number(expiresAt) < Date.now()) return false;
  const expected = createHmac("sha256", secret).update(expiresAt).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
