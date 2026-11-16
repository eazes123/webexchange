import { NextRequest, NextResponse } from "next/server";
import {
  getSessionUser, getUserWallet,
  stakeForCampaign, unstakeFromCampaign, distributeReward,
  getSetting,
} from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const STAKE_AMOUNT = 500;

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user  = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wallets = await getUserWallet(user.id);
  const usdt    = wallets.find((w) => w.symbol === "USDT");
  const campaignActive = (await getSetting("campaign_active")) === "true";
  const deadline = new Date("2026-12-31T23:59:59");

  return NextResponse.json({
    stakeAmount:        user.stakeAmount,
    stakeStatus:        user.stakeStatus,
    stakedAt:           user.stakedAt,
    rewardDistributed:  user.rewardDistributed,
    usdtAvailable:      usdt?.available ?? 0,
    usdtLocked:         usdt?.locked ?? 0,
    minStake:           STAKE_AMOUNT,
    reward:             50_000,
    deadline:           deadline.toISOString(),
    campaignActive,
    kycApproved:        user.kycStatus === "approved",
  });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user  = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await request.json();

  if (action === "stake") {
    if (user.kycStatus !== "approved") {
      return NextResponse.json({ error: "KYC must be approved before staking" }, { status: 400 });
    }
    if (user.stakeStatus === "active") {
      return NextResponse.json({ error: "Already staked" }, { status: 400 });
    }
    if (user.stakeStatus === "rewarded") {
      return NextResponse.json({ error: "Campaign reward already distributed" }, { status: 400 });
    }

    const wallets = await getUserWallet(user.id);
    const usdt    = wallets.find((w) => w.symbol === "USDT");
    if (!usdt || usdt.available < STAKE_AMOUNT) {
      return NextResponse.json({ error: `Insufficient USDT balance. Need ${STAKE_AMOUNT} USDT to stake.` }, { status: 400 });
    }

    await stakeForCampaign(user.id, STAKE_AMOUNT);
    return NextResponse.json({ success: true, message: "500 USDT staked in New Year Campaign" });
  }

  if (action === "unstake") {
    if (user.stakeStatus !== "active") {
      return NextResponse.json({ error: "No active stake to withdraw" }, { status: 400 });
    }

    await unstakeFromCampaign(user.id, user.stakeAmount);
    return NextResponse.json({ success: true, message: "Unstaked successfully. Reward eligibility forfeited." });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
