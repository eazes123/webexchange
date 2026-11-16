import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, DbUser, DbWalletBalance } from "@/lib/db";
import { hashPassword, generateToken, SESSION_COOKIE, ASSETS } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { fullName, email, phone, country, password } = body;

  if (!fullName || !email || !phone || !country || !password) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const db = readDb();

  if (db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  const userId = crypto.randomUUID();
  const queuePosition = db.nextQueuePosition++;

  const user: DbUser = {
    id: userId,
    fullName,
    email: email.toLowerCase().trim(),
    phone,
    country,
    passwordHash: hashPassword(password),
    queuePosition,
    kycStatus: "none",    // Must complete KYC first
    loanStatus: "none",   // Loan comes after KYC approval
    loanAmount: 50_000,
    activationFeePaid: false,
    activationFeeRefundRequested: false,
    loanWithdrawnToExternal: false,
    createdAt: new Date().toISOString(),
  };

  // All balances start at ZERO — $50K credited only after admin approves loan
  const balances: DbWalletBalance[] = ASSETS.map((symbol) => ({
    userId,
    symbol,
    available: 0,
    locked: 0,
  }));

  const token = generateToken();
  db.users.push(user);
  db.walletBalances.push(...balances);
  // No initial transaction — nothing to show yet
  db.sessions.push({
    token,
    userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  writeDb(db);

  const res = NextResponse.json({
    success: true,
    user: {
      id: userId, fullName, email: email.toLowerCase(),
      queuePosition, kycStatus: "none", loanStatus: "none",
    },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, secure: false, sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, path: "/",
  });
  return res;
}
