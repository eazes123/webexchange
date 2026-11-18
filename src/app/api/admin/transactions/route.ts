import { NextRequest, NextResponse } from "next/server";
import { getAllTransactions } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const transactions = await getAllTransactions(300);
  return NextResponse.json({ transactions });
}
