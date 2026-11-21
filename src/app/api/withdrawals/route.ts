import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { formatUsdt, shortAddr } from "@/lib/tron-proofs";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("withdrawal_proof_txns")
    .select("*")
    .order("block_timestamp", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by UTC date
  const byDate: Record<string, any[]> = {};
  for (const row of data ?? []) {
    const date = new Date(row.block_timestamp).toISOString().split("T")[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push({
      txHash:    row.tx_hash,
      from:      shortAddr(row.from_address),
      fromFull:  row.from_address,
      to:        shortAddr(row.to_address),
      toFull:    row.to_address,
      amount:    formatUsdt(Number(row.amount_raw)),
      amountRaw: Number(row.amount_raw),
      timestamp: row.block_timestamp,
      block:     row.block_number,
    });
  }

  const days = Object.entries(byDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, txns]) => ({ date, txns }));

  return NextResponse.json({ days, total: data?.length ?? 0 });
}
