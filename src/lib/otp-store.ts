// Email OTP store — uses globalThis so the same Map is shared across all
// Next.js route module instances (dev HMR) and within a single serverless worker.

interface OtpEntry {
  code: string;
  expiresAt: number;
  resendCount: number;
  resendLockedUntil: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __otpStore: Map<string, OtpEntry> | undefined;
}

function store(): Map<string, OtpEntry> {
  if (!globalThis.__otpStore) globalThis.__otpStore = new Map();
  return globalThis.__otpStore;
}

function generate6(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Create or refresh an OTP for `key` (usually email). Returns the code. */
export function createOtp(key: string): string {
  const code = generate6();
  const existing = store().get(key);
  store().set(key, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
    resendCount: existing?.resendCount ?? 0,
    resendLockedUntil: existing?.resendLockedUntil ?? 0,
  });
  return code;
}

/** Verify `code` for `key`. Invalidates on success. */
export function verifyOtp(key: string, code: string): "ok" | "invalid" | "expired" {
  const entry = store().get(key);
  if (!entry) return "invalid";
  if (Date.now() > entry.expiresAt) { store().delete(key); return "expired"; }
  if (entry.code !== code) return "invalid";
  store().delete(key);
  return "ok";
}

/** Check whether a resend is allowed. Returns error string or null. */
export function canResend(key: string): string | null {
  const entry = store().get(key);
  if (!entry) return null;
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
  const existing = store().get(key);
  store().set(key, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
    resendCount: (existing?.resendCount ?? 0) + 1,
    resendLockedUntil: Date.now() + 30 * 1000,
  });
  return code;
}

/** Get remaining resend info for the client UI. */
export function getResendInfo(key: string): { remaining: number; lockedUntil: number } {
  const entry = store().get(key);
  if (!entry) return { remaining: 3, lockedUntil: 0 };
  return {
    remaining: Math.max(0, 3 - entry.resendCount),
    lockedUntil: entry.resendLockedUntil,
  };
}
