// TRONSCAN API utility — server-side only
const USDT_CONTRACT  = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const TRONSCAN_BASE  = "https://apilist.tronscanapi.com";
const USDT_DECIMALS  = 6;

// 40,000–60,000 USDT in raw units (6 decimals)
const AMOUNT_MIN = 40_000 * 10 ** USDT_DECIMALS;   // 40,000,000,000
const AMOUNT_MAX = 60_000 * 10 ** USDT_DECIMALS;   // 60,000,000,000
const TARGET     = 50_000 * 10 ** USDT_DECIMALS;   // 50,000,000,000

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

/** Fetch one page of TRC-20 USDT transfers in a time window. */
async function fetchPage(
  startMs: number,
  endMs: number,
  offset: number,
  limit = 200
): Promise<TronProof[]> {
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
    if (!res.ok) return [];
    const data = await res.json();

    return (data.token_transfers ?? []).map((t: any) => ({
      txHash:         t.transaction_id ?? "",
      fromAddress:    t.from_address   ?? "",
      toAddress:      t.to_address     ?? "",
      amountRaw:      Number(t.quant   ?? "0"),
      blockTimestamp: Number(t.block_ts ?? 0),
      blockNumber:    Number(t.block   ?? 0),
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch 5–7 TRC-20 USDT transfers close to 50,000 USDT for a given day.
 * Fetches up to 2 pages (400 txns) and picks those nearest to TARGET.
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

  const [page1, page2] = await Promise.all([
    fetchPage(startMs, endMs, 0, 200),
    fetchPage(startMs, endMs, 200, 200),
  ]);

  const all = [...page1, ...page2];

  // Filter to 40k–60k USDT range
  const filtered = all.filter(
    (t) => t.amountRaw >= AMOUNT_MIN && t.amountRaw <= AMOUNT_MAX
  );

  // Sort by closeness to 50,000 USDT
  filtered.sort((a, b) => Math.abs(a.amountRaw - TARGET) - Math.abs(b.amountRaw - TARGET));

  return filtered.slice(0, perDay);
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
