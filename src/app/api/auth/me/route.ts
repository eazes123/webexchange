import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, getUserWallet, getUserTransactions, getUserWithdrawalRequests } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user  = await getSessionUser(token);

  if (!user) {
    return NextResponse.json({ user: null });
  }

  const [wallets, transactions, withdrawals] = await Promise.all([
    getUserWallet(user.id),
    getUserTransactions(user.id),
    getUserWithdrawalRequests(user.id),
  ]);

  return NextResponse.json({
    user: {
      id: user.id, fullName: user.fullName, email: user.email,
      phone: user.phone, country: user.country,
      queuePosition: user.queuePosition, kycStatus: user.kycStatus,
      loanStatus: user.loanStatus, loanAmount: user.loanAmount,
      activationFeePaid: user.activationFeePaid,
      activationFeeRefundRequested: user.activationFeeRefundRequested,
      loanWithdrawnToExternal: user.loanWithdrawnToExternal,
      depositAddress: user.depositAddress,
      bscDepositAddress: user.bscDepositAddress,
      stakeAmount: user.stakeAmount,
      stakeStatus: user.stakeStatus,
      stakedAt: user.stakedAt,
      rewardDistributed: user.rewardDistributed,
      totpEnabled: user.totpEnabled,
    },
    wallets,
    transactions,
    withdrawals,
  });
}
