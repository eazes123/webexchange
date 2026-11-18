import { NextRequest, NextResponse } from "next/server";
import {
  getWithdrawalById, getWithdrawalRequests,
  processWithdrawal, finalizeWithdrawal, failWithdrawal, approveWithdrawal,
  rejectWithdrawal, getAllUsers, distributeReward, getUserById,
  getSetting, setSetting,
} from "@/lib/db";
import { getExchangeWallet, sendUsdt } from "@/lib/tron";
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

    const withdrawal = await getWithdrawalById(id);
    if (!withdrawal) return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });

    if (withdrawal.asset === "USDT") {
      // Auto-send on-chain via exchange hot wallet
      const mnemonic = process.env.TRON_MASTER_MNEMONIC;
      if (!mnemonic) {
        return NextResponse.json({ error: "TRON_MASTER_MNEMONIC not configured" }, { status: 500 });
      }

      const { address: fromAddress, privateKey } = getExchangeWallet(mnemonic);
      const sendAmount = withdrawal.amount - withdrawal.fee;

      // Mark as processing before attempting blockchain send
      await processWithdrawal(id);

      try {
        const txHash = await sendUsdt(privateKey, fromAddress, withdrawal.destinationAddress, sendAmount);
        await finalizeWithdrawal(id, txHash);
        return NextResponse.json({
          success: true,
          message: `${sendAmount} USDT sent on-chain`,
          txHash,
        });
      } catch (err: any) {
        // Reset to pending so admin can retry or handle manually
        await failWithdrawal(id, err.message);
        return NextResponse.json(
          { error: `On-chain send failed: ${err.message}. Withdrawal reset to pending — fund the exchange wallet and retry.` },
          { status: 500 }
        );
      }
    }

    // Non-USDT: manual approve (no auto-send)
    await approveWithdrawal(id);
    return NextResponse.json({ success: true, message: `${withdrawal.asset} withdrawal approved (send manually from exchange wallet)` });
  }

  if (action === "reject") {
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await rejectWithdrawal(id, adminNote);
    return NextResponse.json({ success: true, message: "Withdrawal rejected" });
  }

  if (action === "get_exchange_wallet") {
    const mnemonic = process.env.TRON_MASTER_MNEMONIC;
    if (!mnemonic) return NextResponse.json({ error: "TRON_MASTER_MNEMONIC not configured" }, { status: 500 });
    const { address } = getExchangeWallet(mnemonic);
    return NextResponse.json({ exchangeWalletAddress: address });
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
