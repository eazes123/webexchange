import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isDepositProcessed } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";
import { fetchBep20Deposits } from "@/lib/bsc";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user  = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.bscDepositAddress) return NextResponse.json({ pending: [], unprocessed: [] });

  const confirmed = await fetchBep20Deposits(user.bscDepositAddress);

  const unprocessedChecks = await Promise.all(
    confirmed.map(async (tx) => {
      const processed = await isDepositProcessed(tx.txHash);
      return processed ? null : tx;
    })
  );
  const unprocessed = unprocessedChecks.filter(Boolean);

  return NextResponse.json({ pending: [], unprocessed });
}
