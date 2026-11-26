import { NextRequest, NextResponse } from "next/server";
import {
  getWithdrawalById, getWithdrawalRequests,
  processWithdrawal, finalizeWithdrawal, failWithdrawal, approveWithdrawal,
  rejectWithdrawal, getAllUsers, distributeReward, getUserById,
  getSetting, setSetting,
} from "@/lib/db";
import { getExchangeWallet, derivePrivateKey, fetchUsdtBalance, sendUsdt } from "@/lib/tron";
import {
  deriveEvmPrivateKey, getEvmExchangeWallet, sendBep20Usdt, fetchBep20Balance,
} from "@/lib/bsc";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const [withdrawals, withdrawalsEnabledSetting, trc20FeeSetting, bscFeeSetting] = await Promise.all([
    getWithdrawalRequests(status),
    getSetting("withdrawals_enabled"),
    getSetting("withdrawal_fee_trc20"),
    getSetting("withdrawal_fee_bsc"),
  ]);
  const withdrawalsEnabled = withdrawalsEnabledSetting !== "false";
  return NextResponse.json({
    withdrawals,
    withdrawalsEnabled,
    trc20Fee: parseFloat(trc20FeeSetting ?? "1"),
    bscFee: parseFloat(bscFeeSetting ?? "1"),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const { action, id, adminNote, userId, trc20Fee, bscFee } = await request.json();

  if (action === "approve") {
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const withdrawal = await getWithdrawalById(id);
    if (!withdrawal) return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });

    if (withdrawal.asset === "USDT") {
      const sendAmount = withdrawal.amount - withdrawal.fee;
      const isBsc = withdrawal.destinationAddress.startsWith("0x");

      if (isBsc) {
        // ── BSC (BEP20) withdrawal ─────────────────────────────────────────
        const mnemonic = process.env.BSC_MASTER_MNEMONIC ?? process.env.TRON_MASTER_MNEMONIC;
        if (!mnemonic) {
          return NextResponse.json({ error: "BSC mnemonic not configured" }, { status: 500 });
        }

        const withdrawalUser = await getUserById(withdrawal.userId);
        let fromPrivateKey: Uint8Array;
        let fromAddress: string;
        let sourceLabel: string;

        const userHasBscAddr =
          withdrawalUser?.bscDepositAddress &&
          withdrawalUser.bscWalletIndex !== null &&
          withdrawalUser.bscWalletIndex !== undefined;

        if (userHasBscAddr) {
          const onChainBalance = await fetchBep20Balance(withdrawalUser!.bscDepositAddress!);
          if (onChainBalance >= sendAmount) {
            fromPrivateKey = deriveEvmPrivateKey(mnemonic, withdrawalUser!.bscWalletIndex!);
            fromAddress    = withdrawalUser!.bscDepositAddress!;
            sourceLabel    = "user BSC deposit address";
          } else {
            const hw = getEvmExchangeWallet(mnemonic);
            fromPrivateKey = hw.privateKey;
            fromAddress    = hw.address;
            sourceLabel    = "BSC exchange hot wallet";
          }
        } else {
          const hw = getEvmExchangeWallet(mnemonic);
          fromPrivateKey = hw.privateKey;
          fromAddress    = hw.address;
          sourceLabel    = "BSC exchange hot wallet";
        }

        await processWithdrawal(id);

        try {
          const txHash = await sendBep20Usdt(fromPrivateKey, fromAddress, withdrawal.destinationAddress, sendAmount);
          await finalizeWithdrawal(id, txHash);
          return NextResponse.json({
            success: true,
            message: `${sendAmount} USDT (BEP20) sent on-chain via ${sourceLabel}`,
            txHash,
            source: sourceLabel,
          });
        } catch (err: any) {
          await failWithdrawal(id, err.message);
          return NextResponse.json(
            { error: `BSC send failed (${sourceLabel}): ${err.message}. Withdrawal reset to pending.` },
            { status: 500 }
          );
        }
      } else {
        // ── TRC20 withdrawal ───────────────────────────────────────────────
        const mnemonic = process.env.TRON_MASTER_MNEMONIC;
        if (!mnemonic) {
          return NextResponse.json({ error: "TRON_MASTER_MNEMONIC not configured" }, { status: 500 });
        }

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
            fromPrivateKey = derivePrivateKey(mnemonic, withdrawalUser!.addressIndex!);
            fromAddress    = withdrawalUser!.depositAddress!;
            sourceLabel    = "user deposit address";
          } else {
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

  if (action === "update_withdrawal_fees") {
    const trc20Val = parseFloat(trc20Fee);
    const bscVal   = parseFloat(bscFee);
    if (isNaN(trc20Val) || trc20Val < 0) return NextResponse.json({ error: "Invalid TRC20 fee" }, { status: 400 });
    if (isNaN(bscVal)   || bscVal   < 0) return NextResponse.json({ error: "Invalid BSC fee" },   { status: 400 });
    await Promise.all([
      setSetting("withdrawal_fee_trc20", String(trc20Val)),
      setSetting("withdrawal_fee_bsc",   String(bscVal)),
    ]);
    return NextResponse.json({ success: true, message: "Withdrawal fees updated", trc20Fee: trc20Val, bscFee: bscVal });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
