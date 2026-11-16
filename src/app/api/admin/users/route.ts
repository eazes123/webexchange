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
    loanStatus: u.loanStatus,
    loanAmount: u.loanAmount,
    activationFeePaid: u.activationFeePaid,
    loanWithdrawnToExternal: u.loanWithdrawnToExternal,
    createdAt: u.createdAt,
  }));
  return NextResponse.json({ users });
}
