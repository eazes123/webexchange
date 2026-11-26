import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createSession, getUserWallet, getUserTransactions } from "@/lib/db";
import { verifyPassword, generateToken, SESSION_COOKIE } from "@/lib/auth-utils";
import { storePendingLogin } from "@/lib/totp";

// Brute-force protection: max 5 failed attempts per email per 15 minutes
const loginFailMap = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 15 * 60 * 1000;

function checkLoginRate(email: string): { allowed: boolean; retryAfter?: number } {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const entry = loginFailMap.get(key);
  if (!entry || now > entry.resetAt) return { allowed: true };
  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true };
}

function recordLoginFail(email: string) {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const entry = loginFailMap.get(key);
  if (!entry || now > entry.resetAt) {
    loginFailMap.set(key, { count: 1, resetAt: now + LOCKOUT_MS });
  } else {
    entry.count++;
  }
}

function clearLoginFail(email: string) {
  loginFailMap.delete(email.toLowerCase().trim());
}

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const rateCheck = checkLoginRate(email);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } }
    );
  }

  const user = await findUserByEmail(email);
  if (user?.passwordHash === "GOOGLE_OAUTH") {
    return NextResponse.json(
      { error: "This account uses Google Sign-In. Please use the \"Continue with Google\" button." },
      { status: 401 }
    );
  }
  if (user?.passwordHash === "TWITTER_OAUTH") {
    return NextResponse.json(
      { error: "This account uses X (Twitter) Sign-In. Please use the \"Continue with X\" button." },
      { status: 401 }
    );
  }
  if (!user || !verifyPassword(password, user.passwordHash)) {
    recordLoginFail(email);
    // Same message for both "not found" and "wrong password" — prevents email enumeration
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  clearLoginFail(email);

  // If user has TOTP (Google Authenticator) enabled, require 2FA
  if (user.totpEnabled) {
    const pendingToken = generateToken();
    storePendingLogin(pendingToken, user.id);
    return NextResponse.json({ needs2fa: true, pendingToken });
  }

  const token = generateToken();
  await createSession(user.id, token);

  const wallets = await getUserWallet(user.id);
  const transactions = await getUserTransactions(user.id);

  const res = NextResponse.json({
    success: true,
    user: {
      id: user.id, fullName: user.fullName, email: user.email,
      queuePosition: user.queuePosition, kycStatus: user.kycStatus,
      loanStatus: user.loanStatus, loanAmount: user.loanAmount,
      activationFeePaid: user.activationFeePaid,
      activationFeeRefundRequested: user.activationFeeRefundRequested,
      loanWithdrawnToExternal: user.loanWithdrawnToExternal,
    },
    wallets,
    transactions,
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}
