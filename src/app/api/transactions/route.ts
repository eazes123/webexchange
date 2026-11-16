import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, getUserTransactions } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transactions = await getUserTransactions(user.id);
  return NextResponse.json({ transactions });
}
