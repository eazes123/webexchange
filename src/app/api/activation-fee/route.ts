import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, getSessionUser, DbTransaction } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";

const FEE_AMOUNT = 500;

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, address } = await request.json();
  const db = readDb();
  const userIdx = db.users.findIndex((u) => u.id === user.id);
  if (userIdx === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const usdtIdx = db.walletBalances.findIndex(
    (b) => b.userId === user.id && b.symbol === "USDT"
  );

  if (action === "pay") {
    if (db.users[userIdx].activationFeePaid) {
      return NextResponse.json({ error: "Fee already paid" }, { status: 400 });
    }
    if (usdtIdx === -1 || db.walletBalances[usdtIdx].available < FEE_AMOUNT) {
      return NextResponse.json({ error: "Insufficient USDT balance" }, { status: 400 });
    }

    db.walletBalances[usdtIdx].available -= FEE_AMOUNT;
    db.users[userIdx].activationFeePaid = true;

    const tx: DbTransaction = {
      id: crypto.randomUUID(),
      userId: user.id,
      type: "fee",
      asset: "USDT",
      amount: FEE_AMOUNT,
      status: "completed",
      date: new Date().toISOString().split("T")[0],
      desc: "Loan Activation Fee — Platform Processing Charge",
      txHash: `0x${crypto.randomUUID().replace(/-/g, "")}`,
    };
    db.transactions.push(tx);
    writeDb(db);
    return NextResponse.json({ success: true });
  }

  if (action === "refund") {
    if (!db.users[userIdx].activationFeePaid) {
      return NextResponse.json({ error: "No fee to refund" }, { status: 400 });
    }
    if (db.users[userIdx].activationFeeRefundRequested) {
      return NextResponse.json({ error: "Refund already processed" }, { status: 400 });
    }

    if (usdtIdx !== -1) db.walletBalances[usdtIdx].available += FEE_AMOUNT;
    db.users[userIdx].activationFeePaid = false;
    db.users[userIdx].activationFeeRefundRequested = true;

    const tx: DbTransaction = {
      id: crypto.randomUUID(),
      userId: user.id,
      type: "refund",
      asset: "USDT",
      amount: FEE_AMOUNT,
      status: "completed",
      date: new Date().toISOString().split("T")[0],
      desc: "Activation Fee Refund — Pre-Campaign Cancellation",
    };
    db.transactions.push(tx);
    writeDb(db);
    return NextResponse.json({ success: true });
  }

  if (action === "withdraw") {
    if (!db.users[userIdx].activationFeePaid) {
      return NextResponse.json({ error: "Activation fee not paid" }, { status: 400 });
    }
    if (db.users[userIdx].loanWithdrawnToExternal) {
      return NextResponse.json({ error: "Already withdrawn" }, { status: 400 });
    }

    db.users[userIdx].loanWithdrawnToExternal = true;
    if (usdtIdx !== -1) {
      db.walletBalances[usdtIdx].available = 0;
      db.walletBalances[usdtIdx].locked = 50_000;
    }

    const tx: DbTransaction = {
      id: crypto.randomUUID(),
      userId: user.id,
      type: "withdrawal",
      asset: "USDT",
      amount: 50_000,
      fee: 1,
      status: "processing",
      date: new Date().toISOString().split("T")[0],
      desc: "Loan Withdrawal to External Wallet",
      address,
    };
    db.transactions.push(tx);
    writeDb(db);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
