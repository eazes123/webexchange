"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  TrendingUp, TrendingDown, ChevronDown, Search, Info,
  BarChart2, Clock, List, Settings2, ArrowUpDown, Zap,
  RefreshCw, ChevronUp, AlertCircle,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { formatPrice, formatChange, getChangeColor } from "@/lib/utils";
import { toast } from "sonner";

// ── Helpers ────────────────────────────────────────────────────────────────────
function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function fmtVol(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  return n.toFixed(0);
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function genBook(price: number, rows = 14) {
  const asks = Array.from({ length: rows }, (_, i) => ({
    price: price * (1 + (rows - i) * 0.00025 * (1 + i * 0.1)),
    amount: parseFloat(rand(0.05, 3.5).toFixed(4)),
    total: 0,
  }));
  const bids = Array.from({ length: rows }, (_, i) => ({
    price: price * (1 - (i + 1) * 0.00025 * (1 + i * 0.1)),
    amount: parseFloat(rand(0.05, 3.5).toFixed(4)),
    total: 0,
  }));
  asks.sort((a, b) => b.price - a.price);
  let cum = 0;
  asks.forEach(a => { cum += a.amount; a.total = cum; });
  cum = 0;
  bids.forEach(b => { cum += b.amount; b.total = cum; });
  const maxTotal = Math.max(...asks.map(a => a.total), ...bids.map(b => b.total));
  return { asks, bids, maxTotal };
}

function genTrades(price: number, count = 20) {
  return Array.from({ length: count }, (_, i) => ({
    price: price * (1 + (Math.random() - 0.5) * 0.0008),
    amount: parseFloat(rand(0.001, 2.5).toFixed(4)),
    side: Math.random() > 0.5 ? "buy" : "sell",
    time: new Date(Date.now() - i * rand(2000, 8000)),
  }));
}

function calcLiqPrice(entry: number, leverage: number, side: "long" | "short") {
  const mmr = 0.004;
  if (side === "long") return entry * (1 - 1 / leverage + mmr);
  return entry * (1 + 1 / leverage - mmr);
}

// ── Coming Soon toast ──────────────────────────────────────────────────────────
function comingSoon() {
  toast("Trading Coming Soon", {
    description: "Live order execution launches soon. Complete your KYC & staking to be ready.",
    icon: <Zap className="w-4 h-4 text-[#f0b90b]" />,
    duration: 4000,
  });
}

// ── Pair selector data ─────────────────────────────────────────────────────────
const PAIRS = ["BTC-USDT","ETH-USDT","BNB-USDT","SOL-USDT","XRP-USDT","ADA-USDT","AVAX-USDT","DOGE-USDT"];
const FUTURES_PAIRS = ["BTC-USDT PERP","ETH-USDT PERP","BNB-USDT PERP","SOL-USDT PERP"];

// ── Sub-components ─────────────────────────────────────────────────────────────

function OrderBookPanel({ price, base, quote }: { price: number; base: string; quote: string }) {
  const [book, setBook] = useState<ReturnType<typeof genBook> | null>(null);
  const [view, setView] = useState<"both" | "asks" | "bids">("both");

  useEffect(() => { setBook(genBook(price)); }, []);

  useEffect(() => {
    const id = setInterval(() => setBook(genBook(price)), 1200);
    return () => clearInterval(id);
  }, [price]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-300">Order Book</span>
        <div className="flex gap-1">
          {(["both","bids","asks"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                view === v ? "bg-[#2d3548] text-white" : "text-gray-500 hover:text-gray-300"
              }`}>
              {v === "both" ? "⬛" : v === "bids" ? "🟩" : "🟥"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between text-[10px] text-gray-500 mb-1 px-0.5">
        <span>Price ({quote})</span>
        <span>Amount ({base})</span>
        <span>Total</span>
      </div>

      {/* Asks */}
      {view !== "bids" && book && (
        <div className="space-y-[1px] mb-1">
          {book.asks.slice(0, view === "both" ? 10 : 18).map((a, i) => (
            <div key={i} className="relative flex justify-between items-center px-0.5 py-[1px] text-[11px] cursor-pointer hover:bg-white/5 rounded"
              onClick={comingSoon}>
              <div className="absolute inset-y-0 right-0 bg-[#f6465d]/12 rounded"
                style={{ width: `${(a.total / book.maxTotal) * 100}%` }} />
              <span className="text-[#f6465d] font-mono relative z-10">{formatPrice(a.price)}</span>
              <span className="text-gray-400 font-mono relative z-10">{a.amount.toFixed(4)}</span>
              <span className="text-gray-500 font-mono relative z-10">{a.total.toFixed(3)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Mid spread */}
      <div className="flex items-center justify-between px-0.5 py-1.5 border-y border-[#2d3548]/60 my-0.5">
        <span className={`font-bold text-sm font-mono ${price > 0 ? "text-[#0ecb81]" : "text-[#f6465d]"}`}>
          {formatPrice(price)}
        </span>
        <span className="text-[10px] text-gray-500">Spread</span>
        <span className="text-[10px] text-gray-400 font-mono">
          {book ? ((book.asks[book.asks.length - 1]?.price ?? price) - (book.bids[0]?.price ?? price)).toFixed(2) : "—"}
        </span>
      </div>

      {/* Bids */}
      {view !== "asks" && book && (
        <div className="space-y-[1px]">
          {book.bids.slice(0, view === "both" ? 10 : 18).map((b, i) => (
            <div key={i} className="relative flex justify-between items-center px-0.5 py-[1px] text-[11px] cursor-pointer hover:bg-white/5 rounded"
              onClick={comingSoon}>
              <div className="absolute inset-y-0 left-0 bg-[#0ecb81]/12 rounded"
                style={{ width: `${(b.total / book.maxTotal) * 100}%` }} />
              <span className="text-[#0ecb81] font-mono relative z-10">{formatPrice(b.price)}</span>
              <span className="text-gray-400 font-mono relative z-10">{b.amount.toFixed(4)}</span>
              <span className="text-gray-500 font-mono relative z-10">{b.total.toFixed(3)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentTradesPanel({ price, base, quote }: { price: number; base: string; quote: string }) {
  const [trades, setTrades] = useState<ReturnType<typeof genTrades>>([]);
  useEffect(() => { setTrades(genTrades(price)); }, []);
  useEffect(() => {
    const id = setInterval(() => {
      setTrades(prev => {
        const newTrade = {
          price: price * (1 + (Math.random() - 0.5) * 0.0008),
          amount: parseFloat(rand(0.001, 2.5).toFixed(4)),
          side: Math.random() > 0.5 ? "buy" : "sell",
          time: new Date(),
        };
        return [newTrade, ...prev.slice(0, 24)];
      });
    }, 800);
    return () => clearInterval(id);
  }, [price]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between text-[10px] text-gray-500 mb-1 px-0.5">
        <span>Price ({quote})</span>
        <span>Amount ({base})</span>
        <span>Time</span>
      </div>
      <div className="space-y-[1px] overflow-hidden">
        {trades.slice(0, 22).map((t, i) => (
          <div key={i} className="flex justify-between items-center px-0.5 py-[1px] text-[11px]">
            <span className={`font-mono ${t.side === "buy" ? "text-[#0ecb81]" : "text-[#f6465d]"}`}>
              {formatPrice(t.price)}
            </span>
            <span className="text-gray-400 font-mono">{t.amount.toFixed(4)}</span>
            <span className="text-gray-500 font-mono">{fmtTime(t.time)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpotOrderForm({ base, quote, price }: { base: string; quote: string; price: number }) {
  const { walletBalances } = useStore();
  const [orderType, setOrderType] = useState<"limit" | "market" | "stop-limit" | "oco">("limit");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [limitPrice, setLimitPrice] = useState(price.toFixed(2));
  const [stopPrice, setStopPrice] = useState((price * 0.99).toFixed(2));
  const [amount, setAmount] = useState("");
  const [tpsl, setTpsl] = useState(false);
  const [tp, setTp] = useState("");
  const [sl, setSl] = useState("");
  const [pct, setPct] = useState(0);

  useEffect(() => { setLimitPrice(price.toFixed(2)); }, [price]);

  const avail = side === "buy"
    ? (walletBalances[quote]?.available ?? 0)
    : (walletBalances[base]?.available ?? 0);

  const entryPrice = orderType === "market" ? price : parseFloat(limitPrice) || price;
  const qty = parseFloat(amount) || 0;
  const total = qty * entryPrice;
  const fee = total * 0.001;

  const handlePct = (p: number) => {
    setPct(p);
    if (side === "buy") {
      const spendable = avail * (p / 100);
      setAmount((spendable / entryPrice).toFixed(6));
    } else {
      setAmount(((walletBalances[base]?.available ?? 0) * (p / 100)).toFixed(6));
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-0.5">
      {/* Order type */}
      <div className="flex gap-0.5 bg-[#0b0e1a] rounded-lg p-0.5">
        {(["limit","market","stop-limit","oco"] as const).map(t => (
          <button key={t} onClick={() => setOrderType(t)}
            className={`flex-1 py-1.5 text-[11px] font-semibold capitalize rounded-md transition-colors ${
              orderType === t ? "bg-[#1a2035] text-white" : "text-gray-500 hover:text-gray-300"
            }`}>
            {t === "stop-limit" ? "Stop" : t === "oco" ? "OCO" : t}
          </button>
        ))}
      </div>

      {/* Buy/Sell */}
      <div className="grid grid-cols-2 gap-1.5">
        <button onClick={() => setSide("buy")}
          className={`py-2 text-sm font-bold rounded-lg transition-colors ${
            side === "buy" ? "bg-[#0ecb81] text-black" : "bg-[#0ecb81]/10 text-[#0ecb81] hover:bg-[#0ecb81]/20"
          }`}>
          Buy / Long
        </button>
        <button onClick={() => setSide("sell")}
          className={`py-2 text-sm font-bold rounded-lg transition-colors ${
            side === "sell" ? "bg-[#f6465d] text-white" : "bg-[#f6465d]/10 text-[#f6465d] hover:bg-[#f6465d]/20"
          }`}>
          Sell / Short
        </button>
      </div>

      {/* Available */}
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Available</span>
        <span className="text-gray-200 font-mono">
          {side === "buy"
            ? `${avail.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${quote}`
            : `${(walletBalances[base]?.available ?? 0).toFixed(6)} ${base}`}
        </span>
      </div>

      {/* Stop price (stop-limit/OCO only) */}
      {(orderType === "stop-limit" || orderType === "oco") && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Stop ({quote})</span>
          </div>
          <input type="number" value={stopPrice} onChange={e => setStopPrice(e.target.value)}
            className="w-full bg-[#0b0e1a] border border-[#2d3548] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#f0b90b]/50 outline-none" />
        </div>
      )}

      {/* Limit price */}
      {orderType !== "market" && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Price ({quote})</span>
            <span className="text-[#f0b90b] cursor-pointer" onClick={() => setLimitPrice(price.toFixed(2))}>Last</span>
          </div>
          <input type="number" value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
            className="w-full bg-[#0b0e1a] border border-[#2d3548] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#f0b90b]/50 outline-none" />
        </div>
      )}
      {orderType === "market" && (
        <div className="bg-[#0b0e1a] border border-[#2d3548] rounded-lg px-3 py-2 flex justify-between text-sm">
          <span className="text-gray-500">Market Price</span>
          <span className="font-mono text-white">{formatPrice(price)}</span>
        </div>
      )}

      {/* Amount */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Amount ({base})</span>
          <span className="font-mono">{qty > 0 ? `≈ $${total.toFixed(2)}` : ""}</span>
        </div>
        <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setPct(0); }}
          placeholder="0.00000"
          className="w-full bg-[#0b0e1a] border border-[#2d3548] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#f0b90b]/50 outline-none" />
      </div>

      {/* % slider */}
      <div>
        <input type="range" min="0" max="100" step="25" value={pct} onChange={e => handlePct(Number(e.target.value))}
          className="w-full h-1 accent-[#f0b90b] cursor-pointer" />
        <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
          {["0%","25%","50%","75%","100%"].map(p => (
            <button key={p} onClick={() => handlePct(parseInt(p))}
              className={`${pct === parseInt(p) ? "text-[#f0b90b]" : ""}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* TP/SL toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Take Profit / Stop Loss</span>
        <button onClick={() => setTpsl(!tpsl)}
          className={`w-9 h-5 rounded-full transition-colors relative ${tpsl ? "bg-[#f0b90b]" : "bg-[#2d3548]"}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${tpsl ? "right-0.5" : "left-0.5"}`} />
        </button>
      </div>
      {tpsl && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-[#0ecb81] mb-1">Take Profit</div>
            <input type="number" value={tp} onChange={e => setTp(e.target.value)} placeholder={`> ${price.toFixed(2)}`}
              className="w-full bg-[#0b0e1a] border border-[#0ecb81]/30 rounded-lg px-2 py-1.5 text-xs font-mono text-white focus:border-[#0ecb81]/60 outline-none" />
          </div>
          <div>
            <div className="text-[10px] text-[#f6465d] mb-1">Stop Loss</div>
            <input type="number" value={sl} onChange={e => setSl(e.target.value)} placeholder={`< ${price.toFixed(2)}`}
              className="w-full bg-[#0b0e1a] border border-[#f6465d]/30 rounded-lg px-2 py-1.5 text-xs font-mono text-white focus:border-[#f6465d]/60 outline-none" />
          </div>
        </div>
      )}

      {/* Fee summary */}
      <div className="bg-[#0b0e1a] rounded-lg p-2.5 space-y-1 text-xs">
        <div className="flex justify-between text-gray-500">
          <span>Total ({quote})</span>
          <span className="font-mono text-white">{total > 0 ? total.toFixed(2) : "—"}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Fee (0.10%)</span>
          <span className="font-mono text-gray-400">{fee > 0 ? fee.toFixed(4) : "—"}</span>
        </div>
      </div>

      {/* Submit */}
      <button onClick={comingSoon}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
          side === "buy"
            ? "bg-[#0ecb81] text-black hover:bg-[#0ecb81]/90"
            : "bg-[#f6465d] text-white hover:bg-[#f6465d]/90"
        }`}>
        {side === "buy" ? `Buy ${base}` : `Sell ${base}`}
      </button>
    </div>
  );
}

function FuturesOrderForm({ base, quote, price }: { base: string; quote: string; price: number }) {
  const [leverage, setLeverage] = useState(10);
  const [marginType, setMarginType] = useState<"isolated" | "cross">("isolated");
  const [orderType, setOrderType] = useState<"limit" | "market" | "stop-market" | "stop-limit" | "trailing">("limit");
  const [side, setSide] = useState<"long" | "short">("long");
  const [limitPrice, setLimitPrice] = useState(price.toFixed(2));
  const [amount, setAmount] = useState("");
  const [tpsl, setTpsl] = useState(false);
  const [tp, setTp] = useState("");
  const [sl, setSl] = useState("");
  const [reduceOnly, setReduceOnly] = useState(false);

  useEffect(() => { setLimitPrice(price.toFixed(2)); }, [price]);

  const entryPrice = orderType === "market" ? price : parseFloat(limitPrice) || price;
  const qty = parseFloat(amount) || 0;
  const notional = qty * entryPrice;
  const margin = notional / leverage;
  const liqPrice = qty > 0 ? calcLiqPrice(entryPrice, leverage, side) : 0;
  const fee = notional * 0.0004;

  return (
    <div className="flex flex-col gap-2.5 h-full overflow-y-auto pr-0.5">
      {/* Margin type + leverage */}
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5 bg-[#0b0e1a] rounded-lg p-0.5">
          {(["isolated","cross"] as const).map(m => (
            <button key={m} onClick={() => setMarginType(m)}
              className={`px-2.5 py-1 text-[11px] font-semibold capitalize rounded-md transition-colors ${
                marginType === m ? "bg-[#1a2035] text-white" : "text-gray-500 hover:text-gray-300"
              }`}>{m}</button>
          ))}
        </div>
        <button onClick={comingSoon}
          className="ml-auto flex items-center gap-1 px-3 py-1 bg-[#0b0e1a] border border-[#2d3548] rounded-lg text-xs font-bold text-[#f0b90b] hover:border-[#f0b90b]/40 transition-colors">
          {leverage}x <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Leverage slider */}
      <div>
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>Leverage: <span className="text-[#f0b90b] font-bold">{leverage}x</span></span>
          <span className="text-gray-600">Max: 125x</span>
        </div>
        <input type="range" min="1" max="125" value={leverage} onChange={e => setLeverage(Number(e.target.value))}
          className="w-full h-1 accent-[#f0b90b] cursor-pointer" />
        <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
          {[1,10,25,50,100,125].map(l => (
            <button key={l} onClick={() => setLeverage(l)}
              className={`${leverage === l ? "text-[#f0b90b]" : ""}`}>{l}x</button>
          ))}
        </div>
      </div>

      {/* Order type */}
      <div className="flex gap-0.5 bg-[#0b0e1a] rounded-lg p-0.5 overflow-x-auto">
        {(["limit","market","stop-market","stop-limit","trailing"] as const).map(t => (
          <button key={t} onClick={() => setOrderType(t)}
            className={`flex-shrink-0 px-2 py-1 text-[10px] font-semibold capitalize rounded-md transition-colors whitespace-nowrap ${
              orderType === t ? "bg-[#1a2035] text-white" : "text-gray-500 hover:text-gray-300"
            }`}>
            {t === "stop-market" ? "Stop Mkt" : t === "stop-limit" ? "Stop Lmt" : t === "trailing" ? "Trail" : t}
          </button>
        ))}
      </div>

      {/* Long/Short */}
      <div className="grid grid-cols-2 gap-1.5">
        <button onClick={() => setSide("long")}
          className={`py-2 text-sm font-bold rounded-lg transition-colors ${
            side === "long" ? "bg-[#0ecb81] text-black" : "bg-[#0ecb81]/10 text-[#0ecb81] hover:bg-[#0ecb81]/20"
          }`}>
          Long
        </button>
        <button onClick={() => setSide("short")}
          className={`py-2 text-sm font-bold rounded-lg transition-colors ${
            side === "short" ? "bg-[#f6465d] text-white" : "bg-[#f6465d]/10 text-[#f6465d] hover:bg-[#f6465d]/20"
          }`}>
          Short
        </button>
      </div>

      {/* Price */}
      {orderType === "market" || orderType === "stop-market" ? (
        <div className="bg-[#0b0e1a] border border-[#2d3548] rounded-lg px-3 py-2 flex justify-between text-sm">
          <span className="text-gray-500">Market Price</span>
          <span className="font-mono text-white">{formatPrice(price)}</span>
        </div>
      ) : (
        <div>
          <div className="text-xs text-gray-500 mb-1">Price (USDT)</div>
          <input type="number" value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
            className="w-full bg-[#0b0e1a] border border-[#2d3548] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#f0b90b]/50 outline-none" />
        </div>
      )}

      {/* Size */}
      <div>
        <div className="text-xs text-gray-500 mb-1">Size ({base})</div>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.000"
          className="w-full bg-[#0b0e1a] border border-[#2d3548] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#f0b90b]/50 outline-none" />
      </div>

      {/* % */}
      <div className="flex gap-1">
        {[10,25,50,75,100].map(p => (
          <button key={p} onClick={comingSoon}
            className="flex-1 py-1 text-[10px] text-gray-500 bg-[#0b0e1a] border border-[#2d3548] hover:border-[#f0b90b]/30 hover:text-gray-300 rounded transition-colors">
            {p}%
          </button>
        ))}
      </div>

      {/* TP/SL */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">TP / SL</span>
        <button onClick={() => setTpsl(!tpsl)}
          className={`w-9 h-5 rounded-full transition-colors relative ${tpsl ? "bg-[#f0b90b]" : "bg-[#2d3548]"}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${tpsl ? "right-0.5" : "left-0.5"}`} />
        </button>
      </div>
      {tpsl && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-[#0ecb81] mb-1">Take Profit</div>
            <input type="number" value={tp} onChange={e => setTp(e.target.value)} placeholder="Price"
              className="w-full bg-[#0b0e1a] border border-[#0ecb81]/30 rounded-lg px-2 py-1.5 text-xs font-mono text-white outline-none focus:border-[#0ecb81]/60" />
          </div>
          <div>
            <div className="text-[10px] text-[#f6465d] mb-1">Stop Loss</div>
            <input type="number" value={sl} onChange={e => setSl(e.target.value)} placeholder="Price"
              className="w-full bg-[#0b0e1a] border border-[#f6465d]/30 rounded-lg px-2 py-1.5 text-xs font-mono text-white outline-none focus:border-[#f6465d]/60" />
          </div>
        </div>
      )}

      {/* Reduce Only */}
      <label className="flex items-center gap-2 cursor-pointer" onClick={comingSoon}>
        <div className={`w-3.5 h-3.5 rounded border ${reduceOnly ? "bg-[#f0b90b] border-[#f0b90b]" : "border-[#2d3548]"}`} />
        <span className="text-xs text-gray-400">Reduce Only</span>
      </label>

      {/* Stats */}
      {qty > 0 && (
        <div className="bg-[#0b0e1a] rounded-lg p-2.5 space-y-1 text-xs">
          {[
            { label: "Notional Value", value: `$${notional.toFixed(2)}` },
            { label: `Margin (${leverage}x)`, value: `$${margin.toFixed(2)}` },
            { label: "Est. Liq. Price", value: formatPrice(liqPrice), color: "#f6465d" },
            { label: "Fee (0.04%)", value: `$${fee.toFixed(4)}` },
          ].map(s => (
            <div key={s.label} className="flex justify-between text-gray-500">
              <span>{s.label}</span>
              <span className="font-mono" style={{ color: s.color ?? "#fff" }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={comingSoon}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
          side === "long"
            ? "bg-[#0ecb81] text-black hover:bg-[#0ecb81]/90"
            : "bg-[#f6465d] text-white hover:bg-[#f6465d]/90"
        }`}>
        {side === "long" ? `Open Long ${leverage}x` : `Open Short ${leverage}x`}
      </button>
    </div>
  );
}

function BottomPanel({ base, quote }: { base: string; quote: string }) {
  const [tab, setTab] = useState<"positions" | "orders" | "history" | "pnl">("positions");
  const TABS = [
    { id: "positions", label: "Positions (0)" },
    { id: "orders",    label: "Open Orders (0)" },
    { id: "history",   label: "Order History" },
    { id: "pnl",       label: "Trade History" },
  ] as const;

  return (
    <div className="bg-[#111827] border border-[#2d3548] rounded-2xl overflow-hidden">
      <div className="flex items-center border-b border-[#2d3548] px-4 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`py-3 px-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? "border-[#f0b90b] text-[#f0b90b]"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}>
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex gap-3 py-2 flex-shrink-0">
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
            <input type="checkbox" className="accent-[#f0b90b]" />
            Hide other pairs
          </label>
          <button onClick={comingSoon} className="text-xs text-[#f0b90b] hover:underline">Export</button>
        </div>
      </div>

      <div className="px-4 py-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#1a2035] flex items-center justify-center mx-auto mb-3">
          <BarChart2 className="w-6 h-6 text-gray-600" />
        </div>
        <p className="text-sm text-gray-500">
          {tab === "positions" ? "No open positions" :
           tab === "orders"    ? "No open orders" :
           "No trade history yet"}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          {tab === "positions"
            ? `Your ${base}/USDT positions will appear here`
            : "Your trading activity will appear here"}
        </p>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function TradePage() {
  const params  = useParams();
  const router  = useRouter();
  const pairParam = (params?.pair as string) || "BTC-USDT";
  const [base, quote] = pairParam.split("-").map(s => s.replace(" PERP",""));
  const { coins, updatePrices } = useStore();

  const coin = coins.find(c => c.symbol === base) || coins[0];

  const [mode, setMode]           = useState<"spot" | "futures">("spot");
  const [leftTab, setLeftTab]     = useState<"book" | "trades">("book");
  const [pairSearch, setPairSearch] = useState("");
  const [showPairs, setShowPairs]   = useState(false);

  const { fetchLivePrices } = useStore();

  // Fetch live prices immediately on mount, then every 15s
  useEffect(() => {
    fetchLivePrices();
    const id = setInterval(() => fetchLivePrices(), 15_000);
    return () => clearInterval(id);
  }, [fetchLivePrices]);

  // Small fluctuations between API refreshes
  useEffect(() => {
    const id = setInterval(() => updatePrices(), 3000);
    return () => clearInterval(id);
  }, [updatePrices]);

  const filteredPairs = [...PAIRS, ...FUTURES_PAIRS].filter(p =>
    p.toLowerCase().includes(pairSearch.toLowerCase())
  );

  const fundingRate = 0.0001;
  const nextFunding = "02:14:33";

  const tvSymbol  = `BINANCE:${base}USDT`;
  const iframeUrl = `https://s.tradingview.com/widgetembed/?frameid=tradingview_chart&symbol=${tvSymbol}&interval=60&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=111827&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en`;

  return (
    <div className="bg-[#0b0e1a] min-h-screen">

      {/* ── Top bar ── */}
      <div className="relative z-[50] border-b border-[#2d3548] px-4 py-2 flex items-center gap-6">

        {/* Mode tabs */}
        <div className="flex gap-0.5 bg-[#111827] rounded-lg p-0.5 flex-shrink-0">
          {(["spot","futures"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-1.5 text-sm font-semibold capitalize rounded-md transition-colors ${
                mode === m ? "bg-[#1a2035] text-white" : "text-gray-500 hover:text-gray-300"
              }`}>{m}</button>
          ))}
        </div>

        {/* Pair selector */}
        <div className="relative flex-shrink-0">
          <button onClick={() => setShowPairs(!showPairs)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#111827] border border-[#2d3548] rounded-xl hover:border-[#f0b90b]/40 transition-colors">
            <img src={coin.image} alt={base} className="w-5 h-5 rounded-full"
              onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
            <span className="font-black text-base">{base}/{quote}</span>
            {mode === "futures" && <span className="text-[10px] text-[#f0b90b] font-bold bg-[#f0b90b]/10 px-1.5 py-0.5 rounded">PERP</span>}
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showPairs && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-[#111827] border border-[#2d3548] rounded-xl shadow-2xl z-[200] overflow-hidden">
              <div className="p-2 border-b border-[#2d3548]">
                <div className="flex items-center gap-2 bg-[#0b0e1a] rounded-lg px-3 py-1.5">
                  <Search className="w-3.5 h-3.5 text-gray-500" />
                  <input autoFocus value={pairSearch} onChange={e => setPairSearch(e.target.value)}
                    placeholder="Search pair..." className="bg-transparent text-xs text-white outline-none flex-1 placeholder-gray-600" />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredPairs.map(p => {
                  const sym = p.split("-")[0];
                  const c = coins.find(x => x.symbol === sym);
                  return (
                    <button key={p} onClick={() => { router.push(`/trade/${p.replace(" ","-")}`); setShowPairs(false); setPairSearch(""); }}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#1a2035] transition-colors text-xs">
                      <div className="flex items-center gap-2">
                        {p.includes("PERP") && <span className="text-[9px] text-[#f0b90b] bg-[#f0b90b]/10 px-1 rounded">PERP</span>}
                        <span className="font-semibold text-white">{p}</span>
                      </div>
                      {c && <span className={`font-mono ${getChangeColor(c.change24h)}`}>{formatChange(c.change24h)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-6 overflow-x-auto">
          <div>
            <div className={`text-xl font-black font-mono ${getChangeColor(coin.change24h)}`}>
              {formatPrice(coin.price)}
            </div>
            <div className={`text-xs font-semibold ${getChangeColor(coin.change24h)}`}>
              {formatChange(coin.change24h)}
            </div>
          </div>
          {[
            { label: "24h Change", value: formatChange(coin.change24h), color: getChangeColor(coin.change24h) },
            { label: "24h High",   value: formatPrice(coin.high24h ?? coin.price * 1.025) },
            { label: "24h Low",    value: formatPrice(coin.low24h ?? coin.price * 0.975) },
            { label: "24h Volume", value: fmtVol(coin.volume24h) + " " + base },
            { label: "24h Vol (USDT)", value: "$" + fmtVol(coin.volume24h * coin.price) },
          ].map(s => (
            <div key={s.label} className="hidden lg:block flex-shrink-0">
              <div className="text-[10px] text-gray-500">{s.label}</div>
              <div className={`text-xs font-semibold font-mono ${s.color ?? "text-white"}`}>{s.value}</div>
            </div>
          ))}
          {mode === "futures" && (
            <>
              <div className="hidden xl:block flex-shrink-0">
                <div className="text-[10px] text-gray-500">Funding Rate</div>
                <div className="text-xs font-mono text-[#0ecb81]">+{(fundingRate * 100).toFixed(4)}%</div>
              </div>
              <div className="hidden xl:block flex-shrink-0">
                <div className="text-[10px] text-gray-500">Next Funding</div>
                <div className="text-xs font-mono text-white">{nextFunding}</div>
              </div>
              <div className="hidden xl:block flex-shrink-0">
                <div className="text-[10px] text-gray-500">Index Price</div>
                <div className="text-xs font-mono text-white">{formatPrice(coin.price * 0.9998)}</div>
              </div>
            </>
          )}
        </div>

        {/* Quick pair chips */}
        <div className="ml-auto flex gap-1 flex-shrink-0">
          {coins.slice(0, 5).map(c => (
            <Link key={c.id} href={`/trade/${c.symbol}-USDT`}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
                c.symbol === base
                  ? "bg-[#f0b90b] text-black"
                  : "bg-[#111827] text-gray-400 hover:text-white border border-[#2d3548]"
              }`}>
              {c.symbol}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main 3-column layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr_260px] gap-0 h-[calc(100vh-180px)] overflow-hidden">

        {/* Left col: order book / trades */}
        <div className="border-r border-[#2d3548] flex flex-col hidden xl:flex">
          <div className="flex border-b border-[#2d3548]">
            {(["book","trades"] as const).map(t => (
              <button key={t} onClick={() => setLeftTab(t)}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  leftTab === t ? "text-white border-b-2 border-[#f0b90b]" : "text-gray-500 hover:text-gray-300"
                }`}>
                {t === "book" ? "Order Book" : "Trades"}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {leftTab === "book"
              ? <OrderBookPanel price={coin.price} base={base} quote={quote} />
              : <RecentTradesPanel price={coin.price} base={base} quote={quote} />}
          </div>
        </div>

        {/* Center col: chart */}
        <div className="flex flex-col border-r border-[#2d3548]">
          <iframe src={iframeUrl}
            style={{ width: "100%", flex: 1, border: "none", minHeight: 400 }}
            title={`${base} Chart`} allow="clipboard-write" />
        </div>

        {/* Right col: order form */}
        <div className="flex flex-col border-t xl:border-t-0 border-[#2d3548]">
          <div className="p-3 border-b border-[#2d3548]">
            <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
              <span>Avbl Balance</span>
              <Link href="/wallet" className="text-[#f0b90b] hover:underline">Deposit</Link>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {mode === "spot"
              ? <SpotOrderForm base={base} quote={quote} price={coin.price} />
              : <FuturesOrderForm base={base} quote={quote} price={coin.price} />}
          </div>
        </div>
      </div>

      {/* ── Bottom: positions / orders ── */}
      <div className="px-4 pb-4 mt-2">
        <BottomPanel base={base} quote={quote} />
      </div>

      {/* Mobile: order book below chart */}
      <div className="xl:hidden px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111827] border border-[#2d3548] rounded-2xl p-3">
            <OrderBookPanel price={coin.price} base={base} quote={quote} />
          </div>
          <div className="bg-[#111827] border border-[#2d3548] rounded-2xl p-3">
            <RecentTradesPanel price={coin.price} base={base} quote={quote} />
          </div>
        </div>
      </div>
    </div>
  );
}
