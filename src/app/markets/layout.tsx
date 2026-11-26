import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Crypto Markets",
  description:
    "Track live prices for Bitcoin, Ethereum, BNB, Solana, XRP and 50+ cryptocurrencies. Real-time 24h volume, market cap, and price change data on GROXchange.",
  alternates: { canonical: "https://groxchange.com/markets" },
  openGraph: {
    title: "Live Crypto Markets — GROXchange",
    description: "Real-time prices and 24h stats for all major cryptocurrencies.",
    url: "https://groxchange.com/markets",
    type: "website",
  },
};

export default function MarketsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
