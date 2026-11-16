import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
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
