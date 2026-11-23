import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdminSession } from "@/lib/admin-auth";
import { fetchUsdtBalance } from "@/lib/tron";
import { fetchBep20Balance } from "@/lib/bsc";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, deposit_address, bsc_deposit_address")
    .or("deposit_address.not.is.null,bsc_deposit_address.not.is.null");

  const results = await Promise.allSettled(
    (users ?? []).map(async (u: any) => {
      const [trc20Res, bscRes] = await Promise.allSettled([
        u.deposit_address     ? fetchUsdtBalance(u.deposit_address)       : Promise.resolve(0),
        u.bsc_deposit_address ? fetchBep20Balance(u.bsc_deposit_address)  : Promise.resolve(0),
      ]);
      return {
        userId: u.id as string,
        trc20:  trc20Res.status === "fulfilled" ? trc20Res.value : 0,
        bsc:    bscRes.status   === "fulfilled" ? bscRes.value   : 0,
      };
    })
  );

  const balances = results
    .filter((r): r is PromiseFulfilledResult<{ userId: string; trc20: number; bsc: number }> =>
      r.status === "fulfilled"
    )
    .map(r => r.value);

  return NextResponse.json({ balances });
}
