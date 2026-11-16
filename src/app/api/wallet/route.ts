import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, getSessionUser, getUserWallet, getUserTransactions, DbTransaction } from "@/lib/db";
import { SESSION_COOKIE, ASSETS } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ wallets: getUserWallet(user.id) });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, asset, amount, address } = await request.json();

  if (!ASSETS.includes(asset)) {
    return NextResponse.json({ error: "Invalid asset" }, { status: 400 });
  }

  const db = readDb();
  const balIdx = db.walletBalances.findIndex(
    (b) => b.userId === user.id && b.symbol === asset
  );
  if (balIdx === -1) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

  if (action === "deposit") {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    db.walletBalances[balIdx].available += amt;
    const tx: DbTransaction = {
      id: crypto.randomUUID(),
      userId: user.id,
      type: "deposit",
      asset,
      amount: amt,
      status: "completed",
      date: new Date().toISOString().split("T")[0],
      desc: `${asset} Deposit`,
      txHash: `0x${crypto.randomUUID().replace(/-/g, "")}`,
    };
    db.transactions.push(tx);
    writeDb(db);
    return NextResponse.json({ success: true });
  }

  if (action === "withdraw") {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    if (db.walletBalances[balIdx].available < amt) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    db.walletBalances[balIdx].available -= amt;
    const tx: DbTransaction = {
      id: crypto.randomUUID(),
      userId: user.id,
      type: "withdrawal",
      asset,
      amount: amt,
      fee: 0.1,
      status: "pending",
      date: new Date().toISOString().split("T")[0],
      desc: `${asset} Withdrawal`,
      address,
    };
    db.transactions.push(tx);
    writeDb(db);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
