import { NextRequest, NextResponse } from "next/server";
import {
  getWithdrawalRequests, approveWithdrawal, rejectWithdrawal,
  getAllUsers, distributeReward, updateUser, getUserById, getSetting, setSetting,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const withdrawals = await getWithdrawalRequests(status);
  return NextResponse.json({ withdrawals });
}

export async function POST(request: NextRequest) {
  const { action, id, adminNote, userId } = await request.json();

  if (action === "approve") {
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await approveWithdrawal(id);
    return NextResponse.json({ success: true });
  }

  if (action === "reject") {
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await rejectWithdrawal(id, adminNote);
    return NextResponse.json({ success: true });
  }

  if (action === "distribute_reward") {
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    const user = await getUserById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.stakeStatus !== "active") {
      return NextResponse.json({ error: "User has no active stake" }, { status: 400 });
    }
    await distributeReward(userId, user.stakeAmount);
    return NextResponse.json({ success: true, message: `50,000 USDT reward distributed to ${user.fullName}` });
  }

  if (action === "distribute_all_rewards") {
    const users = await getAllUsers();
    const eligible = users.filter((u) => u.stakeStatus === "active" && !u.rewardDistributed);
    for (const u of eligible) {
      await distributeReward(u.id, u.stakeAmount);
    }
    return NextResponse.json({ success: true, distributed: eligible.length });
  }

  if (action === "toggle_withdrawals") {
    const current = await getSetting("withdrawals_enabled");
    const next = current === "true" ? "false" : "true";
    await setSetting("withdrawals_enabled", next);
    return NextResponse.json({ success: true, withdrawalsEnabled: next === "true" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
