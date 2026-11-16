import { NextResponse } from "next/server";

const COINGECKO_IDS: Record<string, string> = {
  BTC:  "bitcoin",
  ETH:  "ethereum",
  BNB:  "binancecoin",
  SOL:  "solana",
  XRP:  "ripple",
  USDT: "tether",
  USDC: "usd-coin",
  ADA:  "cardano",
  AVAX: "avalanche-2",
  DOGE: "dogecoin",
};

const SYMBOL_BY_ID: Record<string, string> = Object.fromEntries(
  Object.entries(COINGECKO_IDS).map(([sym, id]) => [id, sym])
);

export const revalidate = 30;

export async function GET() {
  try {
    const ids = Object.values(COINGECKO_IDS).join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    });

    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const raw = await res.json();

    const formatted: Record<string, {
      usd: number;
      usd_24h_change: number;
      usd_market_cap: number;
      usd_24h_vol: number;
    }> = {};

    for (const [id, data] of Object.entries(raw) as [string, any][]) {
      const symbol = SYMBOL_BY_ID[id];
      if (symbol) {
        formatted[symbol] = {
          usd: data.usd,
          usd_24h_change: data.usd_24h_change ?? 0,
          usd_market_cap: data.usd_market_cap ?? 0,
          usd_24h_vol: data.usd_24h_vol ?? 0,
        };
      }
    }

    return NextResponse.json(formatted);
  } catch (err) {
    // Fallback mock prices so the app doesn't break if CoinGecko is down
    return NextResponse.json({
      BTC:  { usd: 97500,  usd_24h_change: 1.2,  usd_market_cap: 1920000000000, usd_24h_vol: 42000000000 },
      ETH:  { usd: 3400,   usd_24h_change: 0.8,  usd_market_cap: 408000000000,  usd_24h_vol: 18000000000 },
      BNB:  { usd: 680,    usd_24h_change: -0.3, usd_market_cap: 98000000000,   usd_24h_vol: 2200000000 },
      SOL:  { usd: 190,    usd_24h_change: 2.1,  usd_market_cap: 87000000000,   usd_24h_vol: 5100000000 },
      XRP:  { usd: 2.4,    usd_24h_change: 1.5,  usd_market_cap: 138000000000,  usd_24h_vol: 7800000000 },
      USDT: { usd: 1.0,    usd_24h_change: 0.01, usd_market_cap: 136000000000,  usd_24h_vol: 95000000000 },
      USDC: { usd: 1.0,    usd_24h_change: 0.0,  usd_market_cap: 44000000000,   usd_24h_vol: 9000000000 },
      ADA:  { usd: 1.05,   usd_24h_change: 0.9,  usd_market_cap: 37000000000,   usd_24h_vol: 1200000000 },
      AVAX: { usd: 42,     usd_24h_change: -1.2, usd_market_cap: 17500000000,   usd_24h_vol: 850000000 },
      DOGE: { usd: 0.38,   usd_24h_change: 3.4,  usd_market_cap: 56000000000,   usd_24h_vol: 3800000000 },
    });
  }
}
