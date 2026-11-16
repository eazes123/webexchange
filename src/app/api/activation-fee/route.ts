import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, getUserWallet, updateWalletBalance, updateUser, createTransaction } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";

const FEE_AMOUNT = 500;

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, address } = await request.json();
  const wallets = await getUserWallet(user.id);
  const usdt = wallets.find((w) => w.symbol === "USDT");

  if (action === "pay") {
    if (user.activationFeePaid) {
      return NextResponse.json({ error: "Fee already paid" }, { status: 400 });
    }
    if (!usdt || usdt.available < FEE_AMOUNT) {
      return NextResponse.json({ error: "Insufficient USDT balance" }, { status: 400 });
    }

    await updateWalletBalance(user.id, "USDT", { available: -FEE_AMOUNT });
    await updateUser(user.id, { activationFeePaid: true });
    await createTransaction({
      userId: user.id, type: "fee", asset: "USDT", amount: FEE_AMOUNT,
      status: "completed", date: new Date().toISOString().split("T")[0],
      desc: "Loan Activation Fee — Platform Processing Charge",
      txHash: `0x${crypto.randomUUID().replace(/-/g, "")}`,
    });
    return NextResponse.json({ success: true });
  }

  if (action === "refund") {
    if (!user.activationFeePaid) {
      return NextResponse.json({ error: "No fee to refund" }, { status: 400 });
    }
    if (user.activationFeeRefundRequested) {
      return NextResponse.json({ error: "Refund already processed" }, { status: 400 });
    }

    await updateWalletBalance(user.id, "USDT", { available: FEE_AMOUNT });
    await updateUser(user.id, { activationFeePaid: false, activationFeeRefundRequested: true });
    await createTransaction({
      userId: user.id, type: "refund", asset: "USDT", amount: FEE_AMOUNT,
      status: "completed", date: new Date().toISOString().split("T")[0],
      desc: "Activation Fee Refund — Pre-Campaign Cancellation",
    });
    return NextResponse.json({ success: true });
  }

  if (action === "withdraw") {
    if (!user.activationFeePaid) {
      return NextResponse.json({ error: "Activation fee not paid" }, { status: 400 });
    }
    if (user.loanWithdrawnToExternal) {
      return NextResponse.json({ error: "Already withdrawn" }, { status: 400 });
    }

    await updateUser(user.id, { loanWithdrawnToExternal: true });
    if (usdt) {
      await updateWalletBalance(user.id, "USDT", { setAvailable: 0, setLocked: 50_000 });
    }
    await createTransaction({
      userId: user.id, type: "withdrawal", asset: "USDT", amount: 50_000, fee: 1,
      status: "processing", date: new Date().toISOString().split("T")[0],
      desc: "Loan Withdrawal to External Wallet", address,
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
