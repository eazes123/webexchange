// One-time seed script — node --env-file=.env.local scripts/seed-withdrawals.mjs
import { createClient } from "@supabase/supabase-js";

const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const TRONSCAN_BASE = "https://apilist.tronscanapi.com";
const EXACT_AMOUNT  = 50_000 * 10 ** 6; // 50,000,000,000

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function fetchPage(startMs, endMs, offset) {
  const url = new URL(`${TRONSCAN_BASE}/api/token_trc20/transfers`);
  url.searchParams.set("contract_address", USDT_CONTRACT);
  url.searchParams.set("limit", "50");
  url.searchParams.set("start", String(offset));
  url.searchParams.set("sort", "-timestamp");
  url.searchParams.set("start_timestamp", String(startMs));
  url.searchParams.set("end_timestamp", String(endMs));
  url.searchParams.set("confirmed", "1");

  try {
    const res = await fetch(url.toString(), {
      headers: { "TRON-PRO-API-KEY": process.env.TRONSCAN_API_KEY ?? "" },
    });
    if (!res.ok) return { txns: [], total: 0 };
    const data = await res.json();
    const txns = (data.token_transfers ?? []).map((t) => ({
      txHash:         t.transaction_id ?? "",
      fromAddress:    t.from_address   ?? "",
      toAddress:      t.to_address     ?? "",
      amountRaw:      Number(t.quant   ?? "0"),
      blockTimestamp: Number(t.block_ts ?? 0),
      blockNumber:    Number(t.block   ?? 0),
    }));
    return { txns, total: Number(data.total ?? 0) };
  } catch {
    return { txns: [], total: 0 };
  }
}

async function fetchDailyProofs(dateMs, perDay = 7) {
  const d = new Date(dateMs);
  d.setUTCHours(0, 0, 0, 0);
  const startMs = d.getTime();
  d.setUTCHours(23, 59, 59, 999);
  const endMs = d.getTime();

  const results = [];
  let offset = 0;
  const PAGE_SIZE = 50;
  const MAX_PAGES = 200; // scan up to 10,000 txns per day

  for (let page = 0; page < MAX_PAGES; page++) {
    const { txns, total } = await fetchPage(startMs, endMs, offset);

    for (const t of txns) {
      if (t.amountRaw === EXACT_AMOUNT) {
        results.push(t);
        if (results.length >= perDay) return results;
      }
    }

    offset += PAGE_SIZE;
    if (offset >= total || txns.length < PAGE_SIZE) break;

    await new Promise((r) => setTimeout(r, 100));
  }

  return results;
}

async function main() {
  const DAYS = 30;
  const now = Date.now();
  let totalInserted = 0;

  console.log(`Seeding last ${DAYS} days (exact 50,000 USDT)...\n`);

  for (let i = 0; i < DAYS; i++) {
    const dayMs = now - i * 86_400_000;
    const dateStr = new Date(dayMs).toISOString().split("T")[0];

    const { count } = await supabase
      .from("withdrawal_proof_txns")
      .select("*", { count: "exact", head: true })
      .gte("block_timestamp", new Date(dateStr + "T00:00:00Z").getTime())
      .lte("block_timestamp", new Date(dateStr + "T23:59:59Z").getTime());

    if ((count ?? 0) >= 5) {
      console.log(`[${dateStr}] already ${count} rows — skip`);
      continue;
    }

    process.stdout.write(`[${dateStr}] scanning...`);
    const proofs = await fetchDailyProofs(dayMs, 7);

    if (proofs.length === 0) {
      console.log(" 0 found");
      await new Promise((r) => setTimeout(r, 200));
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

    const { error } = await supabase
      .from("withdrawal_proof_txns")
      .upsert(rows, { onConflict: "tx_hash", ignoreDuplicates: true });

    if (error) {
      console.log(` DB ERROR: ${error.message}`);
    } else {
      totalInserted += rows.length;
      console.log(` inserted ${rows.length}`);
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone. Total inserted: ${totalInserted}`);
}

main().catch(console.error);
