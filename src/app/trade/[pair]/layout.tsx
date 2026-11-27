import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair } = await params;
  const [base = "BTC", quote = "USDT"] = (pair ?? "BTC-USDT").split("-");
  return {
    title: `${base}/${quote} Live Chart`,
    description: `Trade ${base}/${quote} on GROXchange. Live candlestick chart, real-time price, 24h volume and order book for ${base} ${quote} spot market.`,
    alternates: { canonical: `https://groxchange.com/trade/${pair}` },
    openGraph: {
      title: `${base}/${quote} Live Chart — GROXchange`,
      url: `https://groxchange.com/trade/${pair}`,
    },
  };
}

export default function TradeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
