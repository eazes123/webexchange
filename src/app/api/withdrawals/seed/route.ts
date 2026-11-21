import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchDailyProofs } from "@/lib/tron-proofs";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min — seeding 30 days is slow

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { days = 30 } = await request.json().catch(() => ({}));

  const results: { date: string; found: number; inserted: number }[] = [];
  const now = Date.now();

  for (let i = 0; i < days; i++) {
    const dayMs = now - i * 86_400_000;
    const dateStr = new Date(dayMs).toISOString().split("T")[0];

    // Skip if we already have >= 5 entries for this day
    const { count } = await supabaseAdmin
      .from("withdrawal_proof_txns")
      .select("*", { count: "exact", head: true })
      .gte("block_timestamp", new Date(dateStr + "T00:00:00Z").getTime())
      .lte("block_timestamp", new Date(dateStr + "T23:59:59Z").getTime());

    if ((count ?? 0) >= 5) {
      results.push({ date: dateStr, found: count ?? 0, inserted: 0 });
      continue;
    }

    const proofs = await fetchDailyProofs(dayMs, 7);

    if (proofs.length === 0) {
      results.push({ date: dateStr, found: 0, inserted: 0 });
      // small delay to stay within rate limits
      await new Promise((r) => setTimeout(r, 300));
      continue;
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

    results.push({ date: dateStr, found: proofs.length, inserted: error ? 0 : rows.length });

    await new Promise((r) => setTimeout(r, 300));
  }

  return NextResponse.json({ success: true, seeded: days, results });
}
