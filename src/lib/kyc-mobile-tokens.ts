import crypto from "crypto";

// Uses SUPABASE_SECRET_KEY as the HMAC signing secret (already server-side only).
// Falls back to CRON_SECRET, then a dev placeholder.
const SECRET =
  process.env.SUPABASE_SECRET_KEY ??
  process.env.CRON_SECRET ??
  "kyc-mobile-dev-secret-change-in-prod";

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Creates a stateless, HMAC-signed handoff token that encodes the session token
 * and expiry directly. No server-side storage required — works across serverless
 * instances and survives process restarts.
 *
 * Format: base64url(sessionToken:expiresAtMs).hmac_sha256_hex
 */
export function createMobileToken(sessionToken: string): string {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${sessionToken}:${expiresAt}`;
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(payloadB64)
    .digest("hex")
    .slice(0, 32);
  return `${payloadB64}.${sig}`;
}

/**
 * Verifies the token signature and expiry.
 * Returns the embedded sessionToken on success, null on failure.
 */
export function verifyMobileToken(token: string): string | null {
  try {
    const dot = token.indexOf(".");
    if (dot === -1) return null;
    const payloadB64 = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expectedSig = crypto
      .createHmac("sha256", SECRET)
      .update(payloadB64)
      .digest("hex")
      .slice(0, 32);
    // Constant-time comparison (requires equal lengths — 32 hex chars each)
    if (sig.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
    const payload = Buffer.from(payloadB64, "base64url").toString();
    const colonIdx = payload.lastIndexOf(":");
    if (colonIdx === -1) return null;
    const sessionToken = payload.slice(0, colonIdx);
    const expiresAt = parseInt(payload.slice(colonIdx + 1), 10);
    if (!sessionToken || isNaN(expiresAt) || Date.now() > expiresAt) return null;
    return sessionToken;
  } catch {
    return null;
  }
}
