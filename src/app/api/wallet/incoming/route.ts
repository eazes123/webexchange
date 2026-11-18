import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";
import { fetchPendingUsdtDeposits, fetchUsdtDeposits } from "@/lib/tron";
import { isDepositProcessed } from "@/lib/db";

export const dynamic = "force-dynamic";

// Returns unconfirmed (pending) + recent confirmed-but-not-yet-credited deposits
// Used by the wallet page for real-time incoming deposit display
export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user  = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.depositAddress) return NextResponse.json({ pending: [], unprocessed: [] });

  const [unconfirmed, confirmed] = await Promise.all([
    fetchPendingUsdtDeposits(user.depositAddress),
    fetchUsdtDeposits(user.depositAddress),
  ]);

  // Filter confirmed to only those not yet credited (so user sees "click check deposits")
  const unprocessedChecks = await Promise.all(
    confirmed.map(async (tx) => {
      const processed = await isDepositProcessed(tx.txHash);
      return processed ? null : tx;
    })
  );
  const unprocessed = unprocessedChecks.filter(Boolean);

  return NextResponse.json({ pending: unconfirmed, unprocessed });
}
