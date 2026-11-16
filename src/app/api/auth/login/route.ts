import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createSession, getUserWallet, getUserTransactions } from "@/lib/db";
import { verifyPassword, generateToken, SESSION_COOKIE } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
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
