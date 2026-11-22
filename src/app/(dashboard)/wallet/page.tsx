"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Copy, CheckCircle,
  X, Clock, TrendingUp, Eye, EyeOff, RefreshCw, Shield,
  Info, ArrowRightLeft, Loader2, ExternalLink, AlertTriangle,
  Lock, Zap, Radio
} from "lucide-react";
import { useStore, type Transaction } from "@/lib/store";
import { COINS, WITHDRAWAL_FEES } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

type ModalType = "deposit" | "withdraw" | null;

const ASSETS = ["USDT", "BTC", "ETH", "BNB", "SOL", "XRP"];
const TRON_SCAN = "https://tronscan.org/#/transaction";
const POLL_INTERVAL_MS = 30_000; // auto-check every 30 seconds

const COIN_PRICES: Record<string, number> = Object.fromEntries(
  COINS.map(c => [c.symbol, c.price])
);
COIN_PRICES["USDT"] = 1;
COIN_PRICES["USDC"] = 1;

interface IncomingDeposit {
  txHash: string;
  amount: number;
  timestamp: number;
  confirmed: boolean;
}

function getUsdValue(symbol: string, amount: number, livePrices: Record<string, number>): number {
  return amount * (livePrices[symbol] ?? COIN_PRICES[symbol] ?? 0);
}

function timeAgo(ms: number): string {
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function TxIcon({ type }: { type: string }) {
  const cfg: Record<string, { icon: React.ReactNode; cls: string }> = {
    deposit:    { icon: <ArrowDownLeft className="w-4 h-4" />, cls: "bg-ex-green/10 text-ex-green" },
    withdrawal: { icon: <ArrowUpRight  className="w-4 h-4" />, cls: "bg-ex-red/10 text-ex-red" },
    loan_credit:{ icon: <TrendingUp    className="w-4 h-4" />, cls: "bg-ex-yellow/10 text-ex-yellow" },
    reward:     { icon: <TrendingUp    className="w-4 h-4" />, cls: "bg-ex-yellow/10 text-ex-yellow" },
    trade:      { icon: <ArrowRightLeft className="w-4 h-4"/>, cls: "bg-ex-blue/10 text-ex-blue" },
    stake:      { icon: <Lock          className="w-4 h-4" />, cls: "bg-purple-900/30 text-purple-400" },
    unstake:    { icon: <RefreshCw     className="w-4 h-4" />, cls: "bg-ex-green/10 text-ex-green" },
    fee:        { icon: <Info          className="w-4 h-4" />, cls: "bg-gray-700 text-gray-400" },
    refund:     { icon: <RefreshCw     className="w-4 h-4" />, cls: "bg-ex-green/10 text-ex-green" },
  };
  const c = cfg[type] ?? cfg["fee"];
  return <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.cls}`}>{c.icon}</div>;
}

function StatusChip({ status }: { status: string }) {
  const m: Record<string, string> = {
    completed:  "bg-ex-green/10 text-ex-green",
    pending:    "bg-ex-yellow/10 text-ex-yellow",
    processing: "bg-ex-blue/10 text-ex-blue",
    failed:     "bg-ex-red/10 text-ex-red",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${m[status] ?? m.pending}`}>
      {status}
    </span>
  );
}

export default function WalletPage() {
  const { walletBalances, transactions, withdraw, coins, demoUser, hydrate } = useStore();
  const [modal, setModal]               = useState<ModalType>(null);
  const [selectedAsset, setSelectedAsset] = useState("USDT");
  const [copied, setCopied]             = useState(false);
  const [hideBalance, setHideBalance]   = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [checkingDeposit, setCheckingDeposit] = useState(false);
  const [lastChecked, setLastChecked]   = useState<number | null>(null);
  const [incoming, setIncoming]         = useState<IncomingDeposit[]>([]);
  const [, setTick]                     = useState(0); // force re-render for timeAgo
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const livePrices: Record<string, number> = { USDT: 1, USDC: 1 };
  coins.forEach(c => { livePrices[c.symbol] = c.price; });

  const totalUSD = ASSETS.reduce((acc, sym) => {
    const bal    = walletBalances[sym]?.available ?? 0;
    const locked = walletBalances[sym]?.locked    ?? 0;
    return acc + (bal + locked) * (livePrices[sym] ?? COIN_PRICES[sym] ?? 0);
  }, 0);

  const depositAddress = demoUser.depositAddress;

  // Auto-refresh "X seconds ago" every 10s
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 10_000);
    return () => clearInterval(t);
  }, []);

  // Fetch incoming (unconfirmed + uncredited confirmed) deposits for display
  const fetchIncoming = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/incoming");
      if (!res.ok) return;
      const { pending = [], unprocessed = [] } = await res.json();
      const all: IncomingDeposit[] = [
        ...pending.map((t: any) => ({ ...t, confirmed: false })),
        ...unprocessed.map((t: any) => ({ ...t, confirmed: true })),
      ];
      setIncoming(all);
    } catch {}
  }, []);

  // Poll confirmed deposits and auto-credit
  const runDepositCheck = useCallback(async (silent = true) => {
    if (!depositAddress) return;
    if (!silent) setCheckingDeposit(true);
    try {
      const res  = await fetch("/api/wallet/check-deposit", { method: "POST" });
      const data = await res.json();
      setLastChecked(Date.now());
      if (data.credited > 0) {
        toast.success(`${data.credited} USDT deposited to your wallet!`);
        await hydrate(); // refresh balances without full page reload
      }
      await fetchIncoming();
    } catch {
      if (!silent) toast.error("Failed to check deposits");
    } finally {
      if (!silent) setCheckingDeposit(false);
    }
  }, [depositAddress, hydrate, fetchIncoming]);

  // Start auto-polling when page loads
  useEffect(() => {
    if (!depositAddress) return;
    // Initial check on mount
    runDepositCheck(true);
    // Poll every 30s
    intervalRef.current = setInterval(() => runDepositCheck(true), POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [depositAddress, runDepositCheck]);

  const handleCopyAddress = () => {
    if (!depositAddress) return;
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleManualCheck = () => runDepositCheck(false);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    const bal = walletBalances[selectedAsset]?.available ?? 0;
    if (!amt || amt <= 0)   { toast.error("Enter a valid amount"); return; }
    if (amt > bal)          { toast.error("Insufficient balance"); return; }
    if (!withdrawAddress)   { toast.error("Enter destination address"); return; }

    setWithdrawLoading(true);
    try {
      const res  = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw", asset: selectedAsset, amount: amt, address: withdrawAddress }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Withdrawal failed"); return; }
      toast.success(data.message ?? "Withdrawal request submitted");
      withdraw(selectedAsset, amt, withdrawAddress);
      setModal(null);
    } catch {
      toast.error("Network error");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const openDeposit  = (asset: string) => { setSelectedAsset(asset); setModal("deposit"); };
  const openWithdraw = (asset: string) => {
    setSelectedAsset(asset); setWithdrawAmount(""); setWithdrawAddress(""); setModal("withdraw");
  };

  const avail   = walletBalances[selectedAsset]?.available ?? 0;
  const wdFee   = WITHDRAWAL_FEES[selectedAsset];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black mb-1">Wallet</h1>
          <p className="text-gray-400">Your assets, deposits and withdrawals</p>
        </div>
        <button onClick={() => setHideBalance(!hideBalance)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white px-3 py-2 bg-ex-card border border-ex-border rounded-xl transition-colors">
          {hideBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {hideBalance ? "Show" : "Hide"}
        </button>
      </div>

      {/* Total portfolio */}
      <div className="bg-gradient-to-r from-ex-card2 to-ex-card border border-ex-border rounded-2xl p-6 mb-6">
        <p className="text-sm text-gray-400 mb-1">Total Portfolio Value</p>
        <div className="text-4xl font-black font-num mb-1">
          {hideBalance ? "••••••" : `$${totalUSD.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
        </div>
        <p className="text-sm text-gray-500">
          {ASSETS.filter(a => (walletBalances[a]?.available ?? 0) + (walletBalances[a]?.locked ?? 0) > 0).length} active assets
        </p>
      </div>

      {/* USDT Deposit Address card */}
      <div className="bg-ex-card border border-ex-border rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-ex-blue" />
            <h2 className="font-bold">Your USDT Deposit Address</h2>
            <span className="text-xs bg-ex-blue/10 text-ex-blue border border-ex-blue/30 px-2 py-0.5 rounded-full font-semibold">TRC20</span>
          </div>
          {/* Live polling indicator */}
          <div className="flex items-center gap-1.5 text-xs text-ex-green">
            <span className="w-2 h-2 rounded-full bg-ex-green animate-pulse" />
            <span className="hidden sm:inline">
              {lastChecked ? `Checked ${timeAgo(lastChecked)}` : "Starting..."}
            </span>
          </div>
        </div>

        {depositAddress ? (
          <>
            <div className="font-mono text-sm text-gray-200 break-all bg-ex-bg rounded-xl p-4 mb-3 select-all border border-ex-border">
              {depositAddress}
            </div>

            {/* Incoming deposits section */}
            {incoming.length > 0 && (
              <div className="mb-3 space-y-2">
                {incoming.map((tx) => (
                  <div key={tx.txHash}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                      tx.confirmed
                        ? "bg-ex-yellow/10 border-ex-yellow/30"
                        : "bg-ex-blue/10 border-ex-blue/30"
                    }`}>
                    <div className="flex items-center gap-2">
                      {tx.confirmed
                        ? <Zap className="w-3.5 h-3.5 text-ex-yellow" />
                        : <Radio className="w-3.5 h-3.5 text-ex-blue animate-pulse" />}
                      <div>
                        <div className={`font-semibold ${tx.confirmed ? "text-ex-yellow" : "text-ex-blue"}`}>
                          {tx.confirmed ? "Deposit detected" : "Incoming on network"}
                        </div>
                        <div className="text-gray-400 font-mono">{tx.txHash.slice(0, 20)}…</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold font-num text-ex-green">+{tx.amount} USDT</div>
                      <div className={`mt-0.5 font-semibold ${tx.confirmed ? "text-ex-yellow" : "text-ex-blue"}`}>
                        {tx.confirmed ? "Crediting..." : "Confirming..."}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={handleCopyAddress}
                className="flex items-center gap-2 text-sm text-ex-yellow hover:text-yellow-400 transition-colors font-semibold">
                {copied ? <><CheckCircle className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Address</>}
              </button>
              <button onClick={handleManualCheck} disabled={checkingDeposit}
                className="flex items-center gap-2 text-sm text-ex-blue hover:text-blue-400 transition-colors font-semibold disabled:opacity-50">
                {checkingDeposit
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</>
                  : <><RefreshCw className="w-4 h-4" /> Check Now</>}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {[
                { label: "Network", value: "TRON (TRC20)" },
                { label: "Asset", value: "USDT (TRC20)" },
                { label: "Min Deposit", value: "1 USDT" },
                { label: "Confirmations", value: "20 blocks" },
                { label: "Credit Time", value: "~1-5 min" },
                { label: "Auto-detect", value: "Every 30s" },
              ].map(r => (
                <div key={r.label} className="bg-ex-card2 border border-ex-border rounded-xl p-2.5">
                  <div className="text-gray-500">{r.label}</div>
                  <div className="font-semibold mt-0.5">{r.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 bg-ex-yellow/10 border border-ex-yellow/30 rounded-xl p-3 text-xs text-ex-yellow">
              Only send USDT (TRC20) to this address. Sending other assets or networks may result in permanent loss.
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-500 py-2">Deposit address not assigned yet. Please contact support.</div>
        )}
      </div>

      {/* Asset table */}
      <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-ex-border flex items-center justify-between">
          <h2 className="font-bold">Your Assets</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-ex-border">
              <th className="text-left px-5 py-3 font-medium">Asset</th>
              <th className="text-right px-5 py-3 font-medium">Available</th>
              <th className="text-right px-5 py-3 font-medium hidden md:table-cell">Locked / Staked</th>
              <th className="text-right px-5 py-3 font-medium hidden md:table-cell">USD Value</th>
              <th className="text-center px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ASSETS.map(sym => {
              const bal    = walletBalances[sym]?.available ?? 0;
              const locked = walletBalances[sym]?.locked    ?? 0;
              const price  = livePrices[sym] ?? COIN_PRICES[sym] ?? 0;
              const usd    = (bal + locked) * price;
              const coin   = coins.find(c => c.symbol === sym);

              return (
                <tr key={sym} className="border-b border-ex-border/50 last:border-0 hover:bg-ex-card2/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {coin && (
                        <img src={coin.image} alt={sym} className="w-8 h-8 rounded-full"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      )}
                      <div>
                        <div className="font-semibold">{sym}</div>
                        <div className="text-xs text-gray-500">{coin?.name ?? sym}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-num font-semibold">
                    {hideBalance ? "••••" : bal.toLocaleString("en-US", { maximumFractionDigits: 6 })}
                  </td>
                  <td className="px-5 py-4 text-right text-gray-500 font-num hidden md:table-cell">
                    {hideBalance ? "••••" : locked > 0
                      ? <span className="text-purple-400 font-semibold">{locked.toLocaleString("en-US", { maximumFractionDigits: 6 })}</span>
                      : "-"}
                  </td>
                  <td className="px-5 py-4 text-right font-num hidden md:table-cell">
                    {hideBalance ? "••••" : `$${usd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openDeposit(sym)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-ex-green/10 text-ex-green text-xs font-semibold rounded-lg hover:bg-ex-green/20 border border-ex-green/30 transition-colors">
                        <ArrowDownLeft className="w-3.5 h-3.5" /> Deposit
                      </button>
                      <button onClick={() => openWithdraw(sym)} disabled={bal <= 0}
                        className="flex items-center gap-1 px-3 py-1.5 bg-ex-card2 text-gray-300 text-xs font-semibold rounded-lg hover:bg-ex-border border border-ex-border transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Transaction history */}
      <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-ex-border">
          <h2 className="font-bold">Transaction History</h2>
        </div>
        <div className="divide-y divide-ex-border/50">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No transactions yet</div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-4 hover:bg-ex-card2/30 transition-colors">
                <TxIcon type={tx.type} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{tx.desc}</div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{tx.date}</span>
                    {tx.txHash && (
                      <a
                        href={`${TRON_SCAN}/${tx.txHash}`}
                        target="_blank" rel="noopener noreferrer"
                        className="font-mono text-ex-blue hover:underline flex items-center gap-0.5 truncate max-w-[140px]"
                        onClick={e => e.stopPropagation()}>
                        {tx.txHash.slice(0, 16)}…
                        <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-semibold font-num ${
                    ["deposit","loan_credit","refund","reward","unstake"].includes(tx.type)
                      ? "text-ex-green"
                      : ["withdrawal","fee","stake"].includes(tx.type)
                        ? "text-ex-red"
                        : "text-white"
                  }`}>
                    {["deposit","loan_credit","refund","reward","unstake"].includes(tx.type) ? "+" : "-"}
                    {tx.amount.toLocaleString("en-US", { maximumFractionDigits: 6 })} {tx.asset}
                  </div>
                  <div className="mt-1"><StatusChip status={tx.status} /></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── DEPOSIT MODAL ─── */}
      {modal === "deposit" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-ex-card border border-ex-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black">Deposit {selectedAsset}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedAsset === "USDT" ? (
              <>
                <div className="bg-ex-card2 border border-ex-border rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-ex-blue" />
                      <span className="text-sm font-semibold">Network: TRON (TRC20)</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-ex-green">
                      <span className="w-1.5 h-1.5 rounded-full bg-ex-green animate-pulse" />
                      Auto-detecting
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">Your Unique Deposit Address</div>
                  <div className="font-mono text-sm text-gray-200 break-all mb-3 bg-ex-bg rounded-lg p-3 select-all">
                    {depositAddress ?? "Not assigned"}
                  </div>
                  {depositAddress && (
                    <button onClick={handleCopyAddress}
                      className="flex items-center gap-2 text-sm text-ex-yellow hover:text-yellow-400 transition-colors">
                      {copied ? <><CheckCircle className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Address</>}
                    </button>
                  )}
                </div>
                {incoming.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {incoming.map(tx => (
                      <div key={tx.txHash}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                          tx.confirmed ? "bg-ex-yellow/10 border-ex-yellow/30" : "bg-ex-blue/10 border-ex-blue/30"
                        }`}>
                        <div className="flex items-center gap-2">
                          {tx.confirmed
                            ? <Zap className="w-3.5 h-3.5 text-ex-yellow" />
                            : <Radio className="w-3.5 h-3.5 text-ex-blue animate-pulse" />}
                          <span className={tx.confirmed ? "text-ex-yellow font-semibold" : "text-ex-blue font-semibold"}>
                            {tx.confirmed ? "Deposit detected" : "Incoming on network"}
                          </span>
                        </div>
                        <span className="font-semibold font-num text-ex-green">+{tx.amount} USDT</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-ex-yellow/10 border border-ex-yellow/30 rounded-xl p-3 text-xs text-ex-yellow mb-4">
                  Only send USDT (TRC20) to this address. Other assets will be lost permanently.
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-ex-green animate-pulse" />
                  Automatically checking every 30 seconds
                  {lastChecked && <span>· last {timeAgo(lastChecked)}</span>}
                </div>
              </>
            ) : (
              <div className="bg-ex-card2 border border-ex-border rounded-xl p-5 text-center">
                <Info className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                <div className="text-sm font-semibold mb-1">Other Assets: Contact Support</div>
                <div className="text-xs text-gray-500">
                  For {selectedAsset} deposits, please contact our support team to get your deposit address.
                  USDT (TRC20) is our primary supported deposit method for the campaign.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── WITHDRAW MODAL ─── */}
      {modal === "withdraw" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-ex-card border border-ex-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black">Withdraw {selectedAsset}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-5 flex-wrap">
              {ASSETS.filter(a => (walletBalances[a]?.available ?? 0) > 0).map(a => (
                <button key={a} onClick={() => setSelectedAsset(a)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    selectedAsset === a ? "bg-ex-yellow text-black" : "bg-ex-card2 text-gray-400 hover:text-white border border-ex-border"
                  }`}>{a}</button>
              ))}
            </div>

            {selectedAsset === "USDT" ? (
              <div className="bg-[#f6465d]/10 border border-[#f6465d]/30 rounded-xl p-3 text-xs text-[#f6465d] mb-4 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Double-check your withdrawal address. On-chain transfers are <strong>irreversible</strong>. Funds sent to a wrong address cannot be recovered.</span>
              </div>
            ) : (
              <div className="bg-ex-blue/10 border border-ex-blue/30 rounded-xl p-3 text-xs text-ex-blue mb-4">
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                Withdrawals require admin approval. Processing time: 24-48 hours.
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="bg-ex-card2 border border-ex-border rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm text-gray-400">Available Balance</span>
                <span className="font-num font-bold">{avail.toLocaleString("en-US", { maximumFractionDigits: 6 })} {selectedAsset}</span>
              </div>
              {wdFee && (
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">Network</label>
                  <div className="ex-input text-sm text-gray-300">{wdFee.network}</div>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-400 block mb-1.5">Destination Address *</label>
                <input className="ex-input font-mono text-sm" type="text" required
                  placeholder={`Enter ${selectedAsset} address`}
                  value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm text-gray-400">Amount *</label>
                  <button type="button" onClick={() => setWithdrawAmount(String(avail - (wdFee?.fee ?? 0)))}
                    className="text-xs text-ex-yellow hover:underline">Max</button>
                </div>
                <input className="ex-input font-num" type="number" required step="any"
                  min={wdFee?.min} max={avail}
                  placeholder={`Min: ${wdFee?.min ?? 0} ${selectedAsset}`}
                  value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
              </div>
              {wdFee && withdrawAmount && (
                <div className="bg-ex-card2 border border-ex-border rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Network Fee</span>
                    <span>{wdFee.fee} {selectedAsset}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-500">You Receive</span>
                    <span>{Math.max(0, parseFloat(withdrawAmount) - wdFee.fee).toFixed(6)} {selectedAsset}</span>
                  </div>
                </div>
              )}
              <button type="submit" className="btn-primary w-full py-3" disabled={withdrawLoading}>
                {withdrawLoading ? "Submitting..." : `Request Withdrawal`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
