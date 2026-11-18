import { NextRequest, NextResponse } from "next/server";
import { getAllUsers } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const all = await getAllUsers();
  const users = all.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    country: u.country,
    queuePosition: u.queuePosition,
    kycStatus: u.kycStatus,
    depositAddress: u.depositAddress,
    stakeStatus: u.stakeStatus,
    stakeAmount: u.stakeAmount,
    rewardDistributed: u.rewardDistributed,
    createdAt: u.createdAt,
  }));
  return NextResponse.json({ users });
}
