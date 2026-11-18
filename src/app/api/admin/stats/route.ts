import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, getWithdrawalRequests, getSetting } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const [users, withdrawals, maxSpotsSetting, loanAmountSetting] = await Promise.all([
    getAllUsers(),
    getWithdrawalRequests(),
    getSetting("campaign_max_spots"),
    getSetting("campaign_loan_amount"),
  ]);

  const maxSpots   = Number(maxSpotsSetting ?? 1000);
  const loanAmount = Number(loanAmountSetting ?? 50000);

  const kycApproved   = users.filter(u => u.kycStatus === "approved").length;
  const kycPending    = users.filter(u => u.kycStatus === "under_review" || u.kycStatus === "pending").length;
  const activeStakers = users.filter(u => u.stakeStatus === "active").length;
  const rewarded      = users.filter(u => u.stakeStatus === "rewarded").length;
  const pendingWd     = withdrawals.filter(w => w.status === "pending").length;
  const totalStaked   = users.reduce((s, u) => s + (u.stakeAmount ?? 0), 0);
  const avgStake      = activeStakers > 0
    ? totalStaked / (activeStakers + rewarded)
    : 0;

  return NextResponse.json({
    totalUsers: users.length,
    kycApproved,
    kycPending,
    activeStakers,
    loansDisbursed: rewarded,
    pendingWithdrawals: pendingWd,
    totalWithdrawals: withdrawals.length,
    totalStakedVolume: totalStaked,
    avgStake: parseFloat(avgStake.toFixed(2)),
    totalLoanPool: (activeStakers + rewarded) * loanAmount,
    campaignSpots: activeStakers + rewarded,
    campaignMaxSpots: maxSpots,
  });
}
