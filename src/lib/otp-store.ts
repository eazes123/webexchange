// In-memory OTP store for email verification and login email codes.
// Resets on server restart — acceptable for temporary verification codes.

interface OtpEntry {
  code: string;
  expiresAt: number;       // ms timestamp
  resendCount: number;     // how many resends used (max 3)
  resendLockedUntil: number; // ms timestamp when next resend is allowed
}

const store = new Map<string, OtpEntry>();

function generate6(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Create or refresh an OTP for `key` (usually email). Returns the code. */
export function createOtp(key: string): string {
  const code = generate6();
  const existing = store.get(key);
  store.set(key, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min TTL
    resendCount: existing?.resendCount ?? 0,
    resendLockedUntil: existing?.resendLockedUntil ?? 0,
  });
  return code;
}

/** Verify `code` for `key`. Invalidates on success. */
export function verifyOtp(key: string, code: string): "ok" | "invalid" | "expired" {
  const entry = store.get(key);
  if (!entry) return "invalid";
  if (Date.now() > entry.expiresAt) { store.delete(key); return "expired"; }
  if (entry.code !== code) return "invalid";
  store.delete(key);
  return "ok";
}

/** Check whether a resend is allowed. Returns error or null. */
export function canResend(key: string): string | null {
  const entry = store.get(key);
  if (!entry) return null; // no OTP yet, allow
  if (entry.resendCount >= 3) return "max_resend";
  if (Date.now() < entry.resendLockedUntil) {
    const secs = Math.ceil((entry.resendLockedUntil - Date.now()) / 1000);
    return `cooldown:${secs}`;
  }
  return null;
}

/** Record a resend and return new code. Must call `canResend` first. */
export function recordResend(key: string): string {
  const code = generate6();
  const existing = store.get(key);
  store.set(key, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
    resendCount: (existing?.resendCount ?? 0) + 1,
    resendLockedUntil: Date.now() + 30 * 1000, // 30s cooldown
  });
  return code;
}

/** Get remaining resend info for the client UI. */
export function getResendInfo(key: string): { remaining: number; lockedUntil: number } {
  const entry = store.get(key);
  if (!entry) return { remaining: 3, lockedUntil: 0 };
  return {
    remaining: Math.max(0, 3 - entry.resendCount),
    lockedUntil: entry.resendLockedUntil,
  };
}
