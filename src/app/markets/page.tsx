"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, TrendingUp, TrendingDown, ChevronUp, ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatPrice, formatLargeNumber, formatChange, getChangeColor } from "@/lib/utils";
import type { Coin } from "@/lib/mock-data";

type SortKey = "rank" | "price" | "change24h" | "volume24h" | "marketCap";
type SortDir = "asc" | "desc";
type Category = "All" | "Layer 1" | "Layer 2" | "DeFi" | "Meme" | "Stablecoin" | "Payments";

const CATEGORIES: Category[] = ["All", "Layer 1", "Layer 2", "DeFi", "Meme", "Stablecoin", "Payments"];

function Sparkline({ data, change }: { data: number[]; change: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 80, H = 30;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(" ");
  const color = change >= 0 ? "#0ecb81" : "#f6465d";

  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function MarketsPage() {
  const { coins, updatePrices } = useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    const interval = setInterval(updatePrices, 3000);
    return () => clearInterval(interval);
  }, [updatePrices]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = coins
    .filter(c => {
      const q = search.toLowerCase();
      return (
        (c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)) &&
        (category === "All" || c.category === category)
      );
    })
    .sort((a, b) => {
      const mult = sortDir === "asc" ? 1 : -1;
      return (a[sortKey] - b[sortKey]) * mult;
    });

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <span className="ml-1 opacity-30 text-xs">↕</span>;
    return sortDir === "asc"
      ? <ChevronUp className="inline ml-1 w-3 h-3 text-ex-yellow" />
      : <ChevronDown className="inline ml-1 w-3 h-3 text-ex-yellow" />;
  };

  const gainers = [...coins].sort((a, b) => b.change24h - a.change24h).slice(0, 3);
  const losers  = [...coins].sort((a, b) => a.change24h - b.change24h).slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">Markets</h1>
        <p className="text-gray-400">Live cryptocurrency prices and market data</p>
      </div>

      {/* Top Gainers / Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-ex-card border border-ex-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4 text-ex-green font-semibold">
            <TrendingUp className="w-4 h-4" /> Top Gainers (24h)
          </div>
          <div className="space-y-3">
            {gainers.map(c => (
              <Link href={`/trade/${c.symbol}-USDT`} key={c.id} className="flex items-center justify-between hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-2">
                  <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <span className="font-semibold text-sm">{c.symbol}</span>
                  <span className="text-xs text-gray-500">{c.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-num text-sm font-semibold">{formatPrice(c.price)}</div>
                  <div className="text-ex-green text-xs font-semibold">{formatChange(c.change24h)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-ex-card border border-ex-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4 text-ex-red font-semibold">
            <TrendingDown className="w-4 h-4" /> Top Losers (24h)
          </div>
          <div className="space-y-3">
            {losers.map(c => (
              <Link href={`/trade/${c.symbol}-USDT`} key={c.id} className="flex items-center justify-between hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-2">
                  <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <span className="font-semibold text-sm">{c.symbol}</span>
                  <span className="text-xs text-gray-500">{c.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-num text-sm font-semibold">{formatPrice(c.price)}</div>
                  <div className="text-ex-red text-xs font-semibold">{formatChange(c.change24h)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-ex-card border border-ex-border rounded-2xl p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              className="ex-input pl-9 h-9 text-sm"
              placeholder="Search coins..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  category === cat
                    ? "bg-ex-yellow text-black"
                    : "bg-ex-card2 text-gray-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full exchange-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("rank")} className="cursor-pointer text-left w-12">
                  # <SortIcon k="rank" />
                </th>
                <th className="text-left">Name</th>
                <th onClick={() => handleSort("price")} className="cursor-pointer text-right">
                  Price <SortIcon k="price" />
                </th>
                <th onClick={() => handleSort("change24h")} className="cursor-pointer text-right">
                  24h % <SortIcon k="change24h" />
                </th>
                <th onClick={() => handleSort("volume24h")} className="cursor-pointer text-right hidden md:table-cell">
                  Volume <SortIcon k="volume24h" />
                </th>
                <th onClick={() => handleSort("marketCap")} className="cursor-pointer text-right hidden lg:table-cell">
                  Market Cap <SortIcon k="marketCap" />
                </th>
                <th className="text-right hidden md:table-cell">7D Chart</th>
                <th className="text-center">Trade</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(coin => (
                <tr key={coin.id} className="cursor-pointer transition-colors">
                  <td className="font-num text-gray-500 text-sm">{coin.rank}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <img src={coin.image} alt={coin.symbol} className="w-8 h-8 rounded-full shrink-0"
                        onError={e => {
                          const t = e.target as HTMLImageElement;
                          t.style.display = "none";
                        }} />
                      <div>
                        <div className="font-semibold">{coin.name}</div>
                        <div className="text-xs text-gray-500">{coin.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right font-num font-semibold">{formatPrice(coin.price)}</td>
                  <td className={`text-right font-semibold font-num ${getChangeColor(coin.change24h)}`}>
                    {formatChange(coin.change24h)}
                  </td>
                  <td className="text-right text-gray-400 font-num hidden md:table-cell">
                    {formatLargeNumber(coin.volume24h)}
                  </td>
                  <td className="text-right text-gray-400 font-num hidden lg:table-cell">
                    {formatLargeNumber(coin.marketCap)}
                  </td>
                  <td className="hidden md:table-cell">
                    <div className="flex justify-end">
                      <Sparkline data={coin.sparkline} change={coin.change24h} />
                    </div>
                  </td>
                  <td className="text-center">
                    <Link href={`/trade/${coin.symbol}-USDT`}
                      className="inline-flex items-center px-3 py-1.5 bg-ex-yellow/10 text-ex-yellow text-xs font-semibold rounded-lg hover:bg-ex-yellow/20 transition-colors">
                      Trade
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              No coins found for &quot;{search}&quot;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
