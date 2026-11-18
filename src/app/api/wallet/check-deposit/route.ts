import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isDepositProcessed, markDepositProcessed, updateWalletBalance, createTransaction } from "@/lib/db";
import { fetchUsdtDeposits, derivePrivateKey, getExchangeWallet, sendUsdt } from "@/lib/tron";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user  = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!user.depositAddress) {
    return NextResponse.json({ credited: 0, newDeposits: [] });
  }

  const deposits = await fetchUsdtDeposits(user.depositAddress);
  let credited = 0;
  const newDeposits: Array<{ txHash: string; amount: number; sweepTxHash?: string }> = [];

  const mnemonic = process.env.TRON_MASTER_MNEMONIC;

  for (const dep of deposits) {
    if (dep.amount <= 0) continue;
    const already = await isDepositProcessed(dep.txHash);
    if (already) continue;

    await markDepositProcessed(dep.txHash, user.id, dep.amount);
    await updateWalletBalance(user.id, "USDT", { available: dep.amount });
    await createTransaction({
      userId: user.id, type: "deposit", asset: "USDT", amount: dep.amount,
      status: "completed", date: new Date().toISOString().split("T")[0],
      desc: `USDT TRC20 Deposit: On-chain confirmed`,
      txHash: dep.txHash,
    });

    credited += dep.amount;
    const entry: { txHash: string; amount: number; sweepTxHash?: string } = { txHash: dep.txHash, amount: dep.amount };

    // Auto-sweep: move USDT from user's deposit address to hot wallet
    // so withdrawals can be funded without manual hot-wallet top-ups
    if (mnemonic && user.addressIndex !== null && user.addressIndex !== undefined) {
      try {
        const userPrivKey = derivePrivateKey(mnemonic, user.addressIndex);
        const { address: hotWalletAddress } = getExchangeWallet(mnemonic);
        const sweepTxHash = await sendUsdt(userPrivKey, user.depositAddress, hotWalletAddress, dep.amount);
        entry.sweepTxHash = sweepTxHash;
      } catch {
        // Sweep failure is non-fatal — user balance is already credited.
        // Hot wallet will just need manual funding if sweep fails (e.g. insufficient bandwidth/TRX).
      }
    }

    newDeposits.push(entry);
  }

  return NextResponse.json({ credited, newDeposits });
}
