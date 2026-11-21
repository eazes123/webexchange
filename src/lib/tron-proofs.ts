// TRONSCAN API utility — server-side only
const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const TRONSCAN_BASE = "https://apilist.tronscanapi.com";
const USDT_DECIMALS = 6;

// Exact 50,000 USDT in raw units
const EXACT_AMOUNT = 50_000 * 10 ** USDT_DECIMALS; // 50,000,000,000

export interface TronProof {
  txHash:         string;
  fromAddress:    string;
  toAddress:      string;
  amountRaw:      number;   // raw units (÷ 10^6 = USDT)
  blockTimestamp: number;   // unix ms
  blockNumber:    number;
}

function apiKey(): string {
  return process.env.TRONSCAN_API_KEY ?? "";
}

async function fetchPage(
  startMs: number,
  endMs: number,
  offset: number,
  limit = 200
): Promise<{ txns: TronProof[]; total: number }> {
  const url = new URL(`${TRONSCAN_BASE}/api/token_trc20/transfers`);
  url.searchParams.set("contract_address", USDT_CONTRACT);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("start", String(offset));
  url.searchParams.set("sort", "-timestamp");
  url.searchParams.set("start_timestamp", String(startMs));
  url.searchParams.set("end_timestamp", String(endMs));
  url.searchParams.set("confirmed", "1");

  try {
    const res = await fetch(url.toString(), {
      headers: { "TRON-PRO-API-KEY": apiKey() },
      cache: "no-store",
    });
    if (!res.ok) return { txns: [], total: 0 };
    const data = await res.json();

    const txns = (data.token_transfers ?? []).map((t: any) => ({
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

/**
 * Fetch exactly 5–7 TRC-20 USDT transfers of EXACTLY 50,000 USDT for a given day.
 * Pages through results (200 per page) until enough are found or all pages exhausted.
 */
export async function fetchDailyProofs(
  dateMs: number,
  perDay = 7
): Promise<TronProof[]> {
  const d = new Date(dateMs);
  d.setUTCHours(0, 0, 0, 0);
  const startMs = d.getTime();
  d.setUTCHours(23, 59, 59, 999);
  const endMs = d.getTime();

  const results: TronProof[] = [];
  let offset = 0;
  const PAGE_SIZE = 200;
  const MAX_PAGES = 20; // up to 4,000 txns scanned per day

  for (let page = 0; page < MAX_PAGES; page++) {
    const { txns, total } = await fetchPage(startMs, endMs, offset, PAGE_SIZE);

    for (const t of txns) {
      if (t.amountRaw === EXACT_AMOUNT) {
        results.push(t);
        if (results.length >= perDay) return results;
      }
    }

    offset += PAGE_SIZE;
    // Stop if we've fetched everything
    if (offset >= total || txns.length < PAGE_SIZE) break;

    // Small delay to respect rate limits
    await new Promise((r) => setTimeout(r, 150));
  }

  return results;
}

export function formatUsdt(raw: number): string {
  return (raw / 10 ** USDT_DECIMALS).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function shortAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}
