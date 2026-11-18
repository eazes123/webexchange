import { NextRequest, NextResponse } from "next/server";
import {
  getWithdrawalById, getWithdrawalRequests,
  processWithdrawal, finalizeWithdrawal, failWithdrawal, approveWithdrawal,
  rejectWithdrawal, getAllUsers, distributeReward, getUserById,
  getSetting, setSetting,
} from "@/lib/db";
import { getExchangeWallet, derivePrivateKey, fetchUsdtBalance, sendUsdt } from "@/lib/tron";
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
      const mnemonic = process.env.TRON_MASTER_MNEMONIC;
      if (!mnemonic) {
        return NextResponse.json({ error: "TRON_MASTER_MNEMONIC not configured" }, { status: 500 });
      }

      const sendAmount = withdrawal.amount - withdrawal.fee;

      // Determine best source address:
      // 1. User's own deposit address (zero extra fee — exchange already controls key)
      // 2. Exchange hot wallet (fallback for loan credits with no on-chain backing)
      const withdrawalUser = await getUserById(withdrawal.userId);
      let fromPrivateKey: Uint8Array;
      let fromAddress: string;
      let sourceLabel: string;

      const userHasDepositAddr =
        withdrawalUser?.depositAddress &&
        withdrawalUser.addressIndex !== null &&
        withdrawalUser.addressIndex !== undefined;

      if (userHasDepositAddr) {
        const onChainBalance = await fetchUsdtBalance(withdrawalUser!.depositAddress!);
        if (onChainBalance >= sendAmount) {
          // Send directly from user's deposit address — no extra sweep needed
          fromPrivateKey = derivePrivateKey(mnemonic, withdrawalUser!.addressIndex!);
          fromAddress    = withdrawalUser!.depositAddress!;
          sourceLabel    = "user deposit address";
        } else {
          // On-chain balance insufficient (e.g. loan credit) — use hot wallet
          const hw = getExchangeWallet(mnemonic);
          fromPrivateKey = hw.privateKey;
          fromAddress    = hw.address;
          sourceLabel    = "exchange hot wallet";
        }
      } else {
        const hw = getExchangeWallet(mnemonic);
        fromPrivateKey = hw.privateKey;
        fromAddress    = hw.address;
        sourceLabel    = "exchange hot wallet";
      }

      await processWithdrawal(id);

      try {
        const txHash = await sendUsdt(fromPrivateKey, fromAddress, withdrawal.destinationAddress, sendAmount);
        await finalizeWithdrawal(id, txHash);
        return NextResponse.json({
          success: true,
          message: `${sendAmount} USDT sent on-chain via ${sourceLabel}`,
          txHash,
          source: sourceLabel,
        });
      } catch (err: any) {
        await failWithdrawal(id, err.message);
        return NextResponse.json(
          { error: `On-chain send failed (${sourceLabel}): ${err.message}. Withdrawal reset to pending.` },
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
