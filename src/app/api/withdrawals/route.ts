import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { formatUsdt, shortAddr } from "@/lib/tron-proofs";

export const dynamic = "force-dynamic";

export async function GET() {
  noStore(); // bypass Next.js data cache for Supabase fetch calls

  const { data, error } = await supabaseAdmin
    .from("withdrawal_proof_txns")
    .select("tx_hash, from_address, to_address, amount_raw, block_timestamp, block_number")
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

  return NextResponse.json(
    { days, total: data?.length ?? 0, _db: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(-20) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
