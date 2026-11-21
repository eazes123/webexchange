import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchDailyProofs } from "@/lib/tron-proofs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends Authorization header)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const proofs = await fetchDailyProofs(now, 7);

  if (proofs.length === 0) {
    return NextResponse.json({ success: true, inserted: 0, message: "No qualifying transactions found today" });
  }

  const rows = proofs.map((p) => ({
    tx_hash:         p.txHash,
    from_address:    p.fromAddress,
    to_address:      p.toAddress,
    amount_raw:      p.amountRaw,
    block_timestamp: p.blockTimestamp,
    block_number:    p.blockNumber,
  }));

  const { error } = await supabaseAdmin
    .from("withdrawal_proof_txns")
    .upsert(rows, { onConflict: "tx_hash", ignoreDuplicates: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, inserted: rows.length, date: new Date(now).toISOString().split("T")[0] });
}
