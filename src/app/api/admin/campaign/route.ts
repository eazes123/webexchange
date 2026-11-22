import { NextRequest, NextResponse } from "next/server";
import {
  getAllUsers, getSetting, setSetting,
  distributeReward, getUserById,
} from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  campaign_deadline:       "2026-12-31",
  campaign_max_spots:      "1000",
  campaign_loan_amount:    "50000",
  campaign_min_stake:      "500",
  campaign_max_stake:      "50000",
  campaign_enabled:        "true",
  campaign_display_filled: "0",
  chat_model:              "gemini-3.5-flash-lite",
};

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const [users, ...settingValues] = await Promise.all([
    getAllUsers(),
    getSetting("campaign_deadline"),
    getSetting("campaign_max_spots"),
    getSetting("campaign_loan_amount"),
    getSetting("campaign_min_stake"),
    getSetting("campaign_max_stake"),
    getSetting("campaign_enabled"),
    getSetting("campaign_display_filled"),
    getSetting("chat_model"),
  ]);

  const [deadline, maxSpots, loanAmount, minStake, maxStake, enabled, displayFilledRaw, chatModel] = settingValues;

  const participants = users
    .filter(u => u.stakeStatus === "active" || u.stakeStatus === "rewarded")
    .map(u => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      country: u.country,
      kycStatus: u.kycStatus,
      stakeStatus: u.stakeStatus,
      stakeAmount: u.stakeAmount,
      stakedAt: u.stakedAt,
      rewardDistributed: u.rewardDistributed,
      depositAddress: u.depositAddress,
    }));

  return NextResponse.json({
    settings: {
      deadline:      deadline   ?? DEFAULTS.campaign_deadline,
      maxSpots:      Number(maxSpots   ?? DEFAULTS.campaign_max_spots),
      loanAmount:    Number(loanAmount ?? DEFAULTS.campaign_loan_amount),
      minStake:      Number(minStake   ?? DEFAULTS.campaign_min_stake),
      maxStake:      Number(maxStake   ?? DEFAULTS.campaign_max_stake),
      enabled:       (enabled ?? DEFAULTS.campaign_enabled) !== "false",
      displayFilled: Number(displayFilledRaw ?? DEFAULTS.campaign_display_filled),
      chatModel:     chatModel ?? DEFAULTS.chat_model,
    },
    participants,
    stats: {
      totalParticipants: participants.length,
      activeStakers:     participants.filter(p => p.stakeStatus === "active").length,
      loansDisbursed:    participants.filter(p => p.stakeStatus === "rewarded").length,
      totalStaked:       participants.reduce((s, p) => s + (p.stakeAmount ?? 0), 0),
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { action } = body;

  if (action === "update_settings") {
    const { deadline, maxSpots, loanAmount, minStake, maxStake, enabled, displayFilled, chatModel } = body;
    await Promise.all([
      deadline      !== undefined && setSetting("campaign_deadline",        deadline),
      maxSpots      !== undefined && setSetting("campaign_max_spots",       String(maxSpots)),
      loanAmount    !== undefined && setSetting("campaign_loan_amount",     String(loanAmount)),
      minStake      !== undefined && setSetting("campaign_min_stake",       String(minStake)),
      maxStake      !== undefined && setSetting("campaign_max_stake",       String(maxStake)),
      enabled       !== undefined && setSetting("campaign_enabled",         enabled ? "true" : "false"),
      displayFilled !== undefined && setSetting("campaign_display_filled",  String(displayFilled)),
      chatModel     !== undefined && setSetting("chat_model",               chatModel),
    ].filter(Boolean));
    return NextResponse.json({ success: true, message: "Campaign settings updated" });
  }

  if (action === "distribute_reward") {
    const { userId } = body;
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    const user = await getUserById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.stakeStatus !== "active") {
      return NextResponse.json({ error: "User has no active stake" }, { status: 400 });
    }
    const loanAmt = Number(await getSetting("campaign_loan_amount") ?? 50000);
    await distributeReward(userId, user.stakeAmount);
    return NextResponse.json({ success: true, message: `${loanAmt.toLocaleString()} USDT loan disbursed to ${user.fullName}` });
  }

  if (action === "distribute_all_rewards") {
    const users = await getAllUsers();
    const eligible = users.filter(u => u.stakeStatus === "active" && !u.rewardDistributed);
    for (const u of eligible) {
      await distributeReward(u.id, u.stakeAmount);
    }
    return NextResponse.json({
      success: true,
      message: `Loans disbursed to ${eligible.length} users`,
      distributed: eligible.length,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
