import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";
import {
  findUserByEmail, updateUserSecurity, createSession,
  getUserWallet, getUserTransactions,
} from "@/lib/db";
import { generateToken, SESSION_COOKIE } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  const { email, code } = await request.json();
  if (!email || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const result = verifyOtp(normalizedEmail, code.trim());

  if (result === "expired") {
    return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
  }
  if (result === "invalid") {
    return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
  }

  // OTP valid — mark email as verified and create session
  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  await updateUserSecurity(user.id, { emailVerified: true });

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
