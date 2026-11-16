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
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&sparkline=false&price_change_percentage=24h`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    });

    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const raw: any[] = await res.json();

    const formatted: Record<string, {
      usd: number;
      usd_24h_change: number;
      usd_market_cap: number;
      usd_24h_vol: number;
      high24h: number;
      low24h: number;
    }> = {};

    for (const item of raw) {
      const symbol = SYMBOL_BY_ID[item.id];
      if (symbol) {
        formatted[symbol] = {
          usd: item.current_price,
          usd_24h_change: item.price_change_percentage_24h ?? 0,
          usd_market_cap: item.market_cap ?? 0,
          usd_24h_vol: item.total_volume ?? 0,
          high24h: item.high_24h ?? item.current_price * 1.025,
          low24h: item.low_24h ?? item.current_price * 0.975,
        };
      }
    }

    return NextResponse.json(formatted);
  } catch (err) {
    // Fallback mock prices so the app doesn't break if CoinGecko is down
    return NextResponse.json({
      BTC:  { usd: 97500,  usd_24h_change: 1.2,  usd_market_cap: 1920000000000, usd_24h_vol: 42000000000, high24h: 99000, low24h: 95000 },
      ETH:  { usd: 3400,   usd_24h_change: 0.8,  usd_market_cap: 408000000000,  usd_24h_vol: 18000000000, high24h: 3480, low24h: 3320 },
      BNB:  { usd: 680,    usd_24h_change: -0.3, usd_market_cap: 98000000000,   usd_24h_vol: 2200000000,  high24h: 695, low24h: 668 },
      SOL:  { usd: 190,    usd_24h_change: 2.1,  usd_market_cap: 87000000000,   usd_24h_vol: 5100000000,  high24h: 196, low24h: 184 },
      XRP:  { usd: 2.4,    usd_24h_change: 1.5,  usd_market_cap: 138000000000,  usd_24h_vol: 7800000000,  high24h: 2.46, low24h: 2.33 },
      USDT: { usd: 1.0,    usd_24h_change: 0.01, usd_market_cap: 136000000000,  usd_24h_vol: 95000000000, high24h: 1.001, low24h: 0.999 },
      USDC: { usd: 1.0,    usd_24h_change: 0.0,  usd_market_cap: 44000000000,   usd_24h_vol: 9000000000,  high24h: 1.001, low24h: 0.999 },
      ADA:  { usd: 1.05,   usd_24h_change: 0.9,  usd_market_cap: 37000000000,   usd_24h_vol: 1200000000,  high24h: 1.08, low24h: 1.02 },
      AVAX: { usd: 42,     usd_24h_change: -1.2, usd_market_cap: 17500000000,   usd_24h_vol: 850000000,   high24h: 43.5, low24h: 41 },
      DOGE: { usd: 0.38,   usd_24h_change: 3.4,  usd_market_cap: 56000000000,   usd_24h_vol: 3800000000,  high24h: 0.395, low24h: 0.365 },
    });
  }
}
