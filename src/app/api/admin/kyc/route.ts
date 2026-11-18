import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser, updateKycStatus } from "@/lib/db";
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
    return NextResponse.json({
      success: true,
      message: `KYC approved for ${user.fullName}. Loan will be disbursed via campaign on Dec 31, 2026.`,
    });
  }

  if (action === "reject") {
    await updateUser(userId, { kycStatus: "rejected" });
    await updateKycStatus(userId, "rejected");
    return NextResponse.json({ success: true, message: "KYC rejected" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
