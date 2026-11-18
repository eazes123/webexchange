import { NextRequest, NextResponse } from "next/server";
import {
  getWithdrawalRequests, approveWithdrawal, rejectWithdrawal,
  getAllUsers, distributeReward, getUserById, getSetting, setSetting,
} from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const [withdrawals, withdrawalsEnabledSetting] = await Promise.all([
    getWithdrawalRequests(status),
    getSetting("withdrawals_enabled"),
  ]);
  const withdrawalsEnabled = withdrawalsEnabledSetting !== "false";
  return NextResponse.json({ withdrawals, withdrawalsEnabled });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const { action, id, adminNote, userId } = await request.json();

  if (action === "approve") {
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await approveWithdrawal(id);
    return NextResponse.json({ success: true, message: "Withdrawal approved" });
  }

  if (action === "reject") {
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await rejectWithdrawal(id, adminNote);
    return NextResponse.json({ success: true, message: "Withdrawal rejected" });
  }

  if (action === "distribute_reward") {
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    const user = await getUserById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.stakeStatus !== "active") {
      return NextResponse.json({ error: "User has no active stake" }, { status: 400 });
    }
    await distributeReward(userId, user.stakeAmount);
    return NextResponse.json({ success: true, message: `50,000 USDT loan disbursed to ${user.fullName}` });
  }

  if (action === "distribute_all_rewards") {
    const users = await getAllUsers();
    const eligible = users.filter((u) => u.stakeStatus === "active" && !u.rewardDistributed);
    for (const u of eligible) {
      await distributeReward(u.id, u.stakeAmount);
    }
    return NextResponse.json({ success: true, message: `Loans disbursed to ${eligible.length} users`, distributed: eligible.length });
  }

  if (action === "toggle_withdrawals") {
    const current = await getSetting("withdrawals_enabled");
    const next = current === "false" ? "true" : "false";
    await setSetting("withdrawals_enabled", next);
    return NextResponse.json({ success: true, withdrawalsEnabled: next === "true", message: `Withdrawals ${next === "true" ? "enabled" : "disabled"}` });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
