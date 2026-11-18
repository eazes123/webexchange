import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser, updateKycStatus, updateWalletBalance, createTransaction } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const { userId, action } = await request.json();
  if (!userId || !action) {
    return NextResponse.json({ error: "userId and action required" }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (action === "approve") {
    await updateUser(userId, { kycStatus: "approved", loanStatus: "approved" });
    await updateKycStatus(userId, "approved");
    await updateWalletBalance(userId, "USDT", { available: 50_000 });
    await createTransaction({
      userId,
      type: "loan_credit",
      asset: "USDT",
      amount: 50_000,
      status: "completed",
      date: new Date().toISOString().split("T")[0],
      desc: "Interest-Free Loan Credit: Campaign Disbursement",
      txHash: `0x${crypto.randomUUID().replace(/-/g, "")}`,
    });
    return NextResponse.json({
      success: true,
      message: `KYC approved, loan approved, $50,000 USDT credited to ${user.fullName}`,
    });
  }

  if (action === "reject") {
    await updateUser(userId, { kycStatus: "rejected" });
    await updateKycStatus(userId, "rejected");
    return NextResponse.json({ success: true, message: "KYC rejected" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
