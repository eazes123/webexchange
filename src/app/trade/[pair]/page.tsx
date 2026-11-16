"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowUpDown, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { COINS } from "@/lib/mock-data";
import { formatPrice, formatChange, getChangeColor } from "@/lib/utils";
import { toast } from "sonner";

function generateOrderBook(price: number) {
  const asks = Array.from({ length: 10 }, (_, i) => ({
    price: price + (10 - i) * price * 0.0003 * (i + 1),
    amount: parseFloat((Math.random() * 2 + 0.1).toFixed(4)),
  }));
  const bids = Array.from({ length: 10 }, (_, i) => ({
    price: price - (i + 1) * price * 0.0003 * (i + 1),
    amount: parseFloat((Math.random() * 2 + 0.1).toFixed(4)),
  }));
  return { asks: asks.reverse(), bids };
}

function generateRecentTrades(price: number) {
  return Array.from({ length: 15 }, (_, i) => ({
    price: price * (1 + (Math.random() - 0.5) * 0.001),
    amount: parseFloat((Math.random() * 1.5 + 0.01).toFixed(4)),
    side: Math.random() > 0.5 ? "buy" : "sell",
    time: new Date(Date.now() - i * 8000),
  }));
}

export default function TradePage() {
  const params = useParams();
  const pairParam = (params?.pair as string) || "BTC-USDT";
  const [base, quote] = pairParam.split("-");
  const { coins, updatePrices } = useStore();

  const coin = coins.find(c => c.symbol === base) || coins[0];
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [limitPrice, setLimitPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [orderBook, setOrderBook] = useState(() => generateOrderBook(coin.price));
  const [trades, setTrades] = useState(() => generateRecentTrades(coin.price));

  useEffect(() => {
    setLimitPrice(coin.price.toFixed(2));
  }, [coin.price]);

  useEffect(() => {
    const interval = setInterval(() => {
      updatePrices();
      setOrderBook(generateOrderBook(coin.price));
      setTrades(generateRecentTrades(coin.price));
    }, 3000);
    return () => clearInterval(interval);
  }, [updatePrices, coin.price]);

  const handleOrder = () => {
    if (!amount) { toast.error("Please enter an amount"); return; }
    const price = orderType === "market" ? coin.price : parseFloat(limitPrice);
    const total = (parseFloat(amount) * price).toFixed(2);
    toast.success(
      `Demo ${side.toUpperCase()} order placed: ${amount} ${base} @ $${price.toFixed(2)} = $${total}`,
      { description: "⚠️ DEMO MODE — No real funds used" }
    );
    setAmount("");
  };

  const total = amount && limitPrice
    ? (parseFloat(amount) * parseFloat(limitPrice)).toFixed(2)
    : "0.00";

  const tvSymbol = `BINANCE:${base}USDT`;
  const iframeUrl = `https://s.tradingview.com/widgetembed/?frameid=tradingview_chart&symbol=${tvSymbol}&interval=60&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=111827&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=demo&utm_medium=widget&utm_campaign=chart`;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <img src={coin.image} alt={coin.symbol} className="w-9 h-9 rounded-full"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div>
            <div className="font-black text-xl">{base}/{quote}</div>
            <div className="text-xs text-gray-500">{coin.name}</div>
          </div>
        </div>
        <div className="flex gap-6 flex-wrap">
          <div>
            <div className="text-2xl font-black font-num">{formatPrice(coin.price)}</div>
            <div className={`text-sm font-semibold ${getChangeColor(coin.change24h)}`}>
              {formatChange(coin.change24h)}
            </div>
          </div>
          {[
            { label: "24h High", value: formatPrice(coin.price * 1.025) },
            { label: "24h Low",  value: formatPrice(coin.price * 0.975) },
            { label: "Volume",   value: `${(coin.volume24h / 1e9).toFixed(2)}B` },
          ].map(s => (
            <div key={s.label} className="hidden md:block">
              <div className="text-xs text-gray-500">{s.label}</div>
              <div className="text-sm font-semibold font-num">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Pair switcher */}
        <div className="ml-auto flex gap-2 flex-wrap">
          {coins.slice(0, 6).map(c => (
            <Link key={c.id} href={`/trade/${c.symbol}-USDT`}
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                c.symbol === base
                  ? "bg-ex-yellow text-black"
                  : "bg-ex-card text-gray-400 hover:text-white border border-ex-border"
              }`}>
              {c.symbol}
            </Link>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px_280px] gap-4">
        {/* Chart */}
        <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden">
          <iframe
            src={iframeUrl}
            style={{ width: "100%", height: "500px", border: "none" }}
            title={`${base} Chart`}
            allow="clipboard-write"
          />
        </div>

        {/* Order Book */}
        <div className="bg-ex-card border border-ex-border rounded-2xl p-4">
          <h3 className="font-semibold text-sm mb-3 text-gray-300">Order Book</h3>
          <div className="text-xs text-gray-500 flex justify-between mb-2 px-1">
            <span>Price ({quote})</span>
            <span>Amount ({base})</span>
          </div>

          {/* Asks */}
          <div className="space-y-0.5 mb-2">
            {orderBook.asks.map((ask, i) => (
              <div key={i} className="relative flex justify-between items-center px-1 py-0.5 rounded text-xs">
                <div className="absolute inset-0 right-0 bg-ex-red/8 rounded"
                  style={{ width: `${Math.min(100, ask.amount * 25)}%`, right: 0, left: "auto" }} />
                <span className="text-ex-red font-num relative z-10">{formatPrice(ask.price)}</span>
                <span className="text-gray-400 font-num relative z-10">{ask.amount.toFixed(4)}</span>
              </div>
            ))}
          </div>

          {/* Mid price */}
          <div className="flex items-center justify-between px-1 py-2 border-y border-ex-border my-1">
            <span className={`font-bold text-sm font-num ${getChangeColor(coin.change24h)}`}>
              {formatPrice(coin.price)}
            </span>
            <span className="text-xs text-gray-500">Last Price</span>
          </div>

          {/* Bids */}
          <div className="space-y-0.5">
            {orderBook.bids.map((bid, i) => (
              <div key={i} className="relative flex justify-between items-center px-1 py-0.5 rounded text-xs">
                <div className="absolute inset-0 bg-ex-green/8 rounded"
                  style={{ width: `${Math.min(100, bid.amount * 25)}%` }} />
                <span className="text-ex-green font-num relative z-10">{formatPrice(bid.price)}</span>
                <span className="text-gray-400 font-num relative z-10">{bid.amount.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Buy / Sell Panel */}
        <div className="bg-ex-card border border-ex-border rounded-2xl p-4 flex flex-col gap-4">
          {/* Order type tabs */}
          <div className="flex border border-ex-border rounded-lg overflow-hidden">
            {(["limit", "market"] as const).map(t => (
              <button key={t} onClick={() => setOrderType(t)}
                className={`flex-1 py-2 text-sm font-semibold capitalize transition-colors ${
                  orderType === t ? "bg-ex-card2 text-white" : "text-gray-500 hover:text-gray-300"
                }`}>
                {t}
              </button>
            ))}
          </div>

          {/* Buy/Sell switch */}
          <div className="flex border border-ex-border rounded-xl overflow-hidden">
            <button onClick={() => setSide("buy")}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                side === "buy" ? "bg-ex-green text-black" : "text-gray-500 hover:text-gray-300"
              }`}>
              Buy
            </button>
            <button onClick={() => setSide("sell")}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                side === "sell" ? "bg-ex-red text-white" : "text-gray-500 hover:text-gray-300"
              }`}>
              Sell
            </button>
          </div>

          {/* Available balance (mock) */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>Available</span>
            <span className="text-white font-num">{side === "buy" ? "10,000.00 USDT" : "0.0000 " + base}</span>
          </div>

          {/* Price input */}
          {orderType === "limit" && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Price ({quote})</label>
              <input className="ex-input text-sm font-num" type="number" value={limitPrice}
                onChange={e => setLimitPrice(e.target.value)} placeholder="0.00" />
            </div>
          )}
          {orderType === "market" && (
            <div className="ex-input text-sm text-gray-500 flex items-center justify-between">
              <span>Market Price</span>
              <span className="text-white font-num">{formatPrice(coin.price)}</span>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Amount ({base})</label>
            <input className="ex-input text-sm font-num" type="number" value={amount}
              onChange={e => setAmount(e.target.value)} placeholder="0.0000" />
          </div>

          {/* Quick % buttons */}
          <div className="flex gap-1">
            {["25%", "50%", "75%", "100%"].map(p => (
              <button key={p} className="flex-1 py-1 text-xs text-gray-500 bg-ex-card2 hover:bg-ex-border rounded transition-colors">
                {p}
              </button>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between text-xs text-gray-500 border-t border-ex-border pt-3">
            <span>Total ({quote})</span>
            <span className="text-white font-num font-semibold">{total} USDT</span>
          </div>

          {/* Submit */}
          <button onClick={handleOrder}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
              side === "buy"
                ? "bg-ex-green text-black hover:bg-green-400"
                : "bg-ex-red text-white hover:bg-red-400"
            }`}>
            {side === "buy" ? `Buy ${base}` : `Sell ${base}`}
          </button>

          <p className="text-xs text-gray-600 text-center">
            ⚠️ Demo only — no real funds used
          </p>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="mt-4 bg-ex-card border border-ex-border rounded-2xl p-4">
        <h3 className="font-semibold text-sm mb-3 text-gray-300">Recent Trades</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left pb-2 font-medium">Price ({quote})</th>
                <th className="text-right pb-2 font-medium">Amount ({base})</th>
                <th className="text-right pb-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t, i) => (
                <tr key={i} className="border-t border-ex-border/50">
                  <td className={`py-1 font-num ${t.side === "buy" ? "text-ex-green" : "text-ex-red"}`}>
                    {formatPrice(t.price)}
                  </td>
                  <td className="py-1 text-right text-gray-400 font-num">{t.amount}</td>
                  <td className="py-1 text-right text-gray-500">
                    {t.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
