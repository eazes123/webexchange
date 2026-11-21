"use client";

import { useEffect, useState } from "react";
import { ExternalLink, ArrowUpRight, CheckCircle, Clock } from "lucide-react";

interface TxRow {
  txHash: string;
  from: string;
  fromFull: string;
  to: string;
  toFull: string;
  amount: string;
  amountRaw: number;
  timestamp: number;
  block: number;
}

interface DayGroup {
  date: string;
  txns: TxRow[];
}

interface ApiResponse {
  days: DayGroup[];
  total: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

export default function WithdrawalsClient() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/withdrawals")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load transactions."); setLoading(false); });
  }, []);

  const totalUsdt = data?.days?.reduce(
    (sum, day) => sum + day.txns.reduce((s, t) => s + t.amountRaw, 0),
    0
  ) ?? 0;

  return (
    <div className="min-h-screen bg-ex-bg text-white">
      {/* Demo banner */}
      <div className="bg-amber-500/20 border-b border-amber-500/40 py-2.5 px-4 text-center">
        <p className="text-amber-300 text-sm font-medium">
          ⚠️ This is a class demo project for presentation purposes only. Transactions shown are real TRON blockchain transfers used as illustrative examples.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Withdrawal Proofs</h1>
          <p className="text-gray-400">
            Verified TRC20 USDT transfers on the TRON blockchain. Each entry links directly to TRONSCAN for independent verification.
          </p>
        </div>

        {/* Stats row */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-ex-card border border-ex-border rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-white">{data.total.toLocaleString()}</p>
            </div>
            <div className="bg-ex-card border border-ex-border rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-1">Total USDT Disbursed</p>
              <p className="text-2xl font-bold text-ex-yellow">
                {(totalUsdt / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 0 })} USDT
              </p>
            </div>
            <div className="bg-ex-card border border-ex-border rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-1">Days Covered</p>
              <p className="text-2xl font-bold text-white">{data.days.length}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Clock className="w-5 h-5 animate-spin" />
            <span>Loading transactions…</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center text-red-400">
            {error}
          </div>
        )}

        {/* Transaction groups */}
        {data && data.days.length === 0 && (
          <div className="bg-ex-card border border-ex-border rounded-xl p-10 text-center text-gray-500">
            No transactions yet. Run the seed endpoint to populate data.
          </div>
        )}

        {data?.days.map((day) => (
          <div key={day.date} className="mb-8">
            <h2 className="text-base font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-ex-yellow inline-block" />
              {formatDate(day.date)}
              <span className="text-gray-500 font-normal text-sm">· {day.txns.length} transactions</span>
            </h2>

            <div className="bg-ex-card border border-ex-border rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[1fr_1.6fr_1.6fr_1fr_80px_90px] gap-4 px-5 py-3 border-b border-ex-border text-xs text-gray-500 font-medium uppercase tracking-wide">
                <span>Time (UTC)</span>
                <span>From</span>
                <span>To</span>
                <span>Amount</span>
                <span>Block</span>
                <span>Status</span>
              </div>

              {/* Rows */}
              {day.txns.map((tx, i) => (
                <div
                  key={tx.txHash}
                  className={`grid grid-cols-1 md:grid-cols-[1fr_1.6fr_1.6fr_1fr_80px_90px] gap-2 md:gap-4 px-5 py-4 text-sm items-center ${
                    i < day.txns.length - 1 ? "border-b border-ex-border/50" : ""
                  } hover:bg-white/[0.02] transition-colors`}
                >
                  {/* Time + TX link */}
                  <div>
                    <a
                      href={`https://tronscan.org/#/transaction/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center gap-1 transition-colors"
                    >
                      {tx.txHash.slice(0, 10)}…{tx.txHash.slice(-6)}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                    <span className="text-gray-500 text-xs mt-0.5 block">{formatTime(tx.timestamp)}</span>
                  </div>

                  {/* From */}
                  <div>
                    <span className="md:hidden text-gray-500 text-xs mr-1">From:</span>
                    <a
                      href={`https://tronscan.org/#/address/${tx.fromFull}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-gray-300 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {tx.from}
                      <ArrowUpRight className="w-3 h-3 shrink-0 text-gray-500" />
                    </a>
                  </div>

                  {/* To */}
                  <div>
                    <span className="md:hidden text-gray-500 text-xs mr-1">To:</span>
                    <a
                      href={`https://tronscan.org/#/address/${tx.toFull}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-gray-300 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {tx.to}
                      <ArrowUpRight className="w-3 h-3 shrink-0 text-gray-500" />
                    </a>
                  </div>

                  {/* Amount */}
                  <div className="font-semibold text-ex-yellow">
                    <span className="md:hidden text-gray-500 text-xs font-normal mr-1">Amount:</span>
                    {tx.amount} <span className="text-xs text-gray-400 font-normal">USDT</span>
                  </div>

                  {/* Block */}
                  <div className="text-gray-500 text-xs font-mono">
                    <span className="md:hidden text-gray-500 text-xs mr-1">Block:</span>
                    #{tx.block?.toLocaleString() ?? "—"}
                  </div>

                  {/* Status */}
                  <div>
                    <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full font-medium">
                      <CheckCircle className="w-3 h-3" /> Confirmed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer note */}
        <p className="text-center text-xs text-gray-600 mt-8">
          All transactions are verifiable on{" "}
          <a href="https://tronscan.org" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-400 underline">
            TRONSCAN
          </a>
          . Data is sourced from the TRON blockchain and updated daily.
        </p>
      </div>
    </div>
  );
}
