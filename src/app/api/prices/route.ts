import { NextResponse } from "next/server";

const CG_IDS = [
  "bitcoin", "ethereum", "binancecoin", "solana",
  "ripple", "cardano", "avalanche-2", "dogecoin",
];

const CG_TO_PAIR: Record<string, string> = {
  bitcoin: "BTCUSDT",
  ethereum: "ETHUSDT",
  binancecoin: "BNBUSDT",
  solana: "SOLUSDT",
  ripple: "XRPUSDT",
  cardano: "ADAUSDT",
  "avalanche-2": "AVAXUSDT",
  dogecoin: "DOGEUSDT",
};

export const revalidate = 30;

export async function GET() {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CG_IDS.join(",")}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`;
    const res = await fetch(url, {
      next: { revalidate: 30 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data: any[] = await res.json();

    const tickers = data.map((coin) => ({
      symbol: CG_TO_PAIR[coin.id] ?? coin.id.toUpperCase() + "USDT",
      lastPrice: String(coin.current_price ?? 0),
      priceChangePercent: String(coin.price_change_percentage_24h ?? 0),
      quoteVolume: String(coin.total_volume ?? 0),
      highPrice: String(coin.high_24h ?? 0),
      lowPrice: String(coin.low_24h ?? 0),
    }));

    return NextResponse.json(tickers, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    return NextResponse.json({ error: "Price fetch failed" }, { status: 502 });
  }
}
