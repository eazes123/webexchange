import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, DbTransaction } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { userId, action } = await request.json();
  if (!userId || !action) {
    return NextResponse.json({ error: "userId and action required" }, { status: 400 });
  }

  const db = readDb();
  const userIdx = db.users.findIndex((u) => u.id === userId);
  if (userIdx === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const kycIdx = db.kyc.findIndex((k) => k.userId === userId);

  if (action === "approve") {
    // Approve KYC
    db.users[userIdx].kycStatus = "approved";
    if (kycIdx !== -1) db.kyc[kycIdx].status = "approved";

    // Auto-approve loan and credit $50K
    db.users[userIdx].loanStatus = "approved";

    const usdtIdx = db.walletBalances.findIndex(
      (b) => b.userId === userId && b.symbol === "USDT"
    );
    if (usdtIdx !== -1) {
      db.walletBalances[usdtIdx].available += 50_000;
    } else {
      db.walletBalances.push({ userId, symbol: "USDT", available: 50_000, locked: 0 });
    }

    const tx: DbTransaction = {
      id: crypto.randomUUID(),
      userId,
      type: "loan_credit",
      asset: "USDT",
      amount: 50_000,
      status: "completed",
      date: new Date().toISOString().split("T")[0],
      desc: "Interest-Free Loan Credit — Campaign Reward",
      txHash: `0x${crypto.randomUUID().replace(/-/g, "")}`,
    };
    db.transactions.push(tx);
    writeDb(db);

    return NextResponse.json({
      success: true,
      message: `KYC approved, loan approved, $50,000 USDT credited to ${db.users[userIdx].fullName}`,
    });
  }

  if (action === "reject") {
    db.users[userIdx].kycStatus = "rejected";
    if (kycIdx !== -1) db.kyc[kycIdx].status = "rejected";
    writeDb(db);
    return NextResponse.json({ success: true, message: "KYC rejected" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
