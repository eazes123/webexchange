import { NextRequest, NextResponse } from "next/server";
import { popPendingLogin } from "@/lib/totp";
import { totpVerify } from "@/lib/totp";
import { getUserById, createSession, getUserWallet, getUserTransactions } from "@/lib/db";
import { generateToken, SESSION_COOKIE } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  const { pendingToken, code } = await request.json();
  if (!pendingToken || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const userId = popPendingLogin(pendingToken);
  if (!userId) {
    return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
  }

  const user = await getUserById(userId);
  if (!user || !user.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ error: "TOTP not configured." }, { status: 400 });
  }

  if (!totpVerify(user.totpSecret, code.trim())) {
    return NextResponse.json({ error: "Invalid authenticator code." }, { status: 401 });
  }

  const token = generateToken();
  await createSession(user.id, token);

  const [wallets, transactions] = await Promise.all([
    getUserWallet(user.id),
    getUserTransactions(user.id),
  ]);

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
