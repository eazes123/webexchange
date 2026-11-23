import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isDepositProcessed, markDepositProcessed, updateWalletBalance, createTransaction } from "@/lib/db";
import { fetchUsdtDeposits } from "@/lib/tron";
import { SESSION_COOKIE } from "@/lib/auth-utils";
import { sendDepositConfirmedEmail } from "@/lib/email";

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
  const newDeposits: Array<{ txHash: string; amount: number }> = [];

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
    newDeposits.push({ txHash: dep.txHash, amount: dep.amount });
    sendDepositConfirmedEmail(user.email, user.fullName, dep.amount, dep.txHash).catch(() => {});
  }

  return NextResponse.json({ credited, newDeposits });
}
