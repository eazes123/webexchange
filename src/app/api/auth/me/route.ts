import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, getUserWallet, getUserTransactions } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = getSessionUser(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wallets = getUserWallet(user.id);
  const transactions = getUserTransactions(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      queuePosition: user.queuePosition,
      kycStatus: user.kycStatus,
      loanStatus: user.loanStatus,
      loanAmount: user.loanAmount,
      activationFeePaid: user.activationFeePaid,
      activationFeeRefundRequested: user.activationFeeRefundRequested,
      loanWithdrawnToExternal: user.loanWithdrawnToExternal,
    },
    wallets,
    transactions,
  });
}
