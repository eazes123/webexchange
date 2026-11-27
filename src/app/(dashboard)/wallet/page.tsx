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
import { gtmEvent } from "@/lib/gtm";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { useTranslations } from "next-intl";

type ModalType = "deposit" | "withdraw" | null;

const ASSETS = ["USDT", "BTC", "ETH", "BNB", "SOL", "XRP"];
const TRON_SCAN = "https://tronscan.org/#/transaction";
const BSC_SCAN  = "https://bscscan.com/tx";
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
  const t = useTranslations("wallet");
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
  const [incomingBsc, setIncomingBsc]   = useState<IncomingDeposit[]>([]);
  const [network, setNetwork]           = useState<"TRC20" | "BEP20">("TRC20");
  const [withdrawNetwork, setWithdrawNetwork] = useState<"TRC20" | "BSC">("TRC20");
  const [adminFees, setAdminFees]       = useState({ trc20: 1, bsc: 1 });
  const [, setTick]                     = useState(0); // force re-render for timeAgo
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const intervalRefBsc = useRef<ReturnType<typeof setInterval> | null>(null);

  const livePrices: Record<string, number> = { USDT: 1, USDC: 1 };
  coins.forEach(c => { livePrices[c.symbol] = c.price; });

  const totalUSD = ASSETS.reduce((acc, sym) => {
    const bal    = walletBalances[sym]?.available ?? 0;
    const locked = walletBalances[sym]?.locked    ?? 0;
    return acc + (bal + locked) * (livePrices[sym] ?? COIN_PRICES[sym] ?? 0);
  }, 0);

  const depositAddress    = demoUser.depositAddress;
  const bscDepositAddress = demoUser.bscDepositAddress;
  const activeAddress     = network === "TRC20" ? depositAddress : bscDepositAddress;

  // Fetch admin-configured withdrawal fees once on mount
  useEffect(() => {
    fetch("/api/wallet").then(r => r.json()).then(d => {
      if (d.withdrawalFees) setAdminFees(d.withdrawalFees);
    }).catch(() => {});
  }, []);

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
        gtmEvent("deposit_credited", { asset: "USDT", amount: data.credited, network: "TRC20" });
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

  // TRC20 auto-polling
  useEffect(() => {
    if (!depositAddress) return;
    runDepositCheck(true);
    intervalRef.current = setInterval(() => runDepositCheck(true), POLL_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [depositAddress, runDepositCheck]);

  // BSC incoming deposits fetch
  const fetchIncomingBsc = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/incoming-bsc");
      if (!res.ok) return;
      const { unprocessed = [] } = await res.json();
      setIncomingBsc(unprocessed.map((t: any) => ({ ...t, confirmed: true })));
    } catch {}
  }, []);

  // BSC deposit check
  const runDepositCheckBsc = useCallback(async (silent = true) => {
    if (!bscDepositAddress) return;
    if (!silent) setCheckingDeposit(true);
    try {
      const res  = await fetch("/api/wallet/check-deposit-bsc", { method: "POST" });
      const data = await res.json();
      setLastChecked(Date.now());
      if (data.credited > 0) {
        gtmEvent("deposit_credited", { asset: "USDT", amount: data.credited, network: "BEP20" });
        toast.success(`${data.credited} USDT (BEP20) deposited to your wallet!`);
        await hydrate();
      }
      await fetchIncomingBsc();
    } catch {
      if (!silent) toast.error("Failed to check BSC deposits");
    } finally {
      if (!silent) setCheckingDeposit(false);
    }
  }, [bscDepositAddress, hydrate, fetchIncomingBsc]);

  // BSC auto-polling
  useEffect(() => {
    if (!bscDepositAddress) return;
    runDepositCheckBsc(true);
    intervalRefBsc.current = setInterval(() => runDepositCheckBsc(true), POLL_INTERVAL_MS);
    return () => { if (intervalRefBsc.current) clearInterval(intervalRefBsc.current); };
  }, [bscDepositAddress, runDepositCheckBsc]);

  const handleCopyAddress = () => {
    if (!activeAddress) return;
    navigator.clipboard.writeText(activeAddress);
    gtmEvent("deposit_address_copied", { network });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleManualCheck = () => network === "TRC20" ? runDepositCheck(false) : runDepositCheckBsc(false);

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
        body: JSON.stringify({
          action: "withdraw", asset: selectedAsset, amount: amt, address: withdrawAddress,
          ...(selectedAsset === "USDT" && { network: withdrawNetwork }),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Withdrawal failed"); return; }
      gtmEvent("withdrawal_submitted", {
        asset:   selectedAsset,
        amount:  amt,
        network: selectedAsset === "USDT" ? withdrawNetwork : undefined,
      });
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
    setSelectedAsset(asset); setWithdrawAmount(""); setWithdrawAddress(""); setWithdrawNetwork("TRC20"); setModal("withdraw");
  };

  const avail = walletBalances[selectedAsset]?.available ?? 0;
  const wdFee = selectedAsset === "USDT"
    ? { fee: withdrawNetwork === "TRC20" ? adminFees.trc20 : adminFees.bsc, min: 10, network: withdrawNetwork === "TRC20" ? "TRON (TRC20)" : "BSC (BEP20)" }
    : WITHDRAWAL_FEES[selectedAsset];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black mb-1">{t("title")}</h1>
          <p className="text-gray-400">{t("subtitle")}</p>
        </div>
        <button onClick={() => setHideBalance(!hideBalance)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white px-3 py-2 bg-ex-card border border-ex-border rounded-xl transition-colors">
          {hideBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {hideBalance ? t("show_balance") : t("hide_balance")}
        </button>
      </div>

      {/* Total portfolio */}
      <div className="bg-gradient-to-r from-ex-card2 to-ex-card border border-ex-border rounded-2xl p-6 mb-6">
        <p className="text-sm text-gray-400 mb-1">{t("total_portfolio_value")}</p>
        <div className="text-4xl font-black font-num mb-1">
          {hideBalance ? "••••••" : `$${totalUSD.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
        </div>
        <p className="text-sm text-gray-500">
          {t("active_assets", { count: ASSETS.filter(a => (walletBalances[a]?.available ?? 0) + (walletBalances[a]?.locked ?? 0) > 0).length })}
        </p>
      </div>

      {/* USDT Deposit Address card */}
      <div className="bg-ex-card border border-ex-border rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-ex-blue" />
            <h2 className="font-bold">{t("usdt_deposit_address_title")}</h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ex-green">
            <span className="w-2 h-2 rounded-full bg-ex-green animate-pulse" />
            <span className="hidden sm:inline">
              {lastChecked ? `Checked ${timeAgo(lastChecked)}` : "Starting..."}
            </span>
          </div>
        </div>

        {/* Network selector */}
        <div className="flex gap-2 mb-4">
          {(["TRC20", "BEP20"] as const).map((n) => (
            <button key={n} onClick={() => setNetwork(n)}
              className={`px-4 py-1.5 rounded-xl text-sm font-bold border transition-colors ${
                network === n
                  ? n === "TRC20"
                    ? "bg-red-500/20 text-red-400 border-red-500/40"
                    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                  : "bg-ex-card2 text-gray-400 border-ex-border hover:text-white"
              }`}>
              {n === "TRC20" ? "🔴 TRC20 (TRON)" : "🟡 BEP20 (BSC)"}
            </button>
          ))}
        </div>

        {activeAddress ? (
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-3">
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="p-3 bg-white rounded-2xl">
                  <QRCodeSVG value={activeAddress} size={120} bgColor="#ffffff" fgColor="#000000" level="M" />
                </div>
                <span className="text-[10px] text-gray-600 font-semibold">{t("scan_to_get_address")}</span>
              </div>
              <div className="flex-1 font-mono text-sm text-gray-200 break-all bg-ex-bg rounded-xl p-4 select-all border border-ex-border flex items-center">
                {activeAddress}
              </div>
            </div>

            {/* Incoming deposits section */}
            {(network === "TRC20" ? incoming : incomingBsc).length > 0 && (
              <div className="mb-3 space-y-2">
                {(network === "TRC20" ? incoming : incomingBsc).map((tx) => (
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
                          {tx.confirmed ? t("deposit_detected_label") : t("incoming_on_network_label")}
                        </div>
                        <div className="text-gray-400 font-mono">{tx.txHash.slice(0, 20)}…</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold font-num text-ex-green">+{tx.amount} USDT</div>
                      <div className={`mt-0.5 font-semibold ${tx.confirmed ? "text-ex-yellow" : "text-ex-blue"}`}>
                        {tx.confirmed ? t("crediting_label") : t("confirming_label")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={handleCopyAddress}
                className="flex items-center gap-2 text-sm text-ex-yellow hover:text-yellow-400 transition-colors font-semibold">
                {copied ? <><CheckCircle className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> {t("copy_address_btn")}</>}
              </button>
              <button onClick={handleManualCheck} disabled={checkingDeposit}
                className="flex items-center gap-2 text-sm text-ex-blue hover:text-blue-400 transition-colors font-semibold disabled:opacity-50">
                {checkingDeposit
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("checking")}</>
                  : <><RefreshCw className="w-4 h-4" /> {t("check_now_btn")}</>}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {(network === "TRC20" ? [
                { label: "Network", value: "TRON (TRC20)" },
                { label: "Asset", value: "USDT (TRC20)" },
                { label: "Min Deposit", value: "1 USDT" },
                { label: "Confirmations", value: "20 blocks" },
                { label: "Credit Time", value: "~1-5 min" },
                { label: "Auto-detect", value: "Every 30s" },
              ] : [
                { label: "Network", value: "BSC (BEP20)" },
                { label: "Asset", value: "USDT (BEP20)" },
                { label: "Min Deposit", value: "1 USDT" },
                { label: "Confirmations", value: "15 blocks" },
                { label: "Credit Time", value: "~1-3 min" },
                { label: "Auto-detect", value: "Every 30s" },
              ]).map(r => (
                <div key={r.label} className="bg-ex-card2 border border-ex-border rounded-xl p-2.5">
                  <div className="text-gray-500">{r.label}</div>
                  <div className="font-semibold mt-0.5">{r.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 bg-ex-yellow/10 border border-ex-yellow/30 rounded-xl p-3 text-xs text-ex-yellow">
              {network === "TRC20" ? t("tron_trc20_warning") : t("bep20_warning")}
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-500 py-2">{t("address_not_assigned")}</div>
        )}
      </div>

      {/* Asset table */}
      <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-ex-border flex items-center justify-between">
          <h2 className="font-bold">{t("your_assets_title")}</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-ex-border">
              <th className="text-left px-5 py-3 font-medium">{t("th_asset")}</th>
              <th className="text-right px-5 py-3 font-medium">{t("th_available")}</th>
              <th className="text-right px-5 py-3 font-medium hidden md:table-cell">{t("th_locked_staked")}</th>
              <th className="text-right px-5 py-3 font-medium hidden md:table-cell">{t("th_usd_value")}</th>
              <th className="text-center px-5 py-3 font-medium">{t("th_actions")}</th>
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
                        <ArrowDownLeft className="w-3.5 h-3.5" /> {t("deposit_btn")}
                      </button>
                      <button onClick={() => openWithdraw(sym)} disabled={bal <= 0}
                        className="flex items-center gap-1 px-3 py-1.5 bg-ex-card2 text-gray-300 text-xs font-semibold rounded-lg hover:bg-ex-border border border-ex-border transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <ArrowUpRight className="w-3.5 h-3.5" /> {t("withdraw_btn")}
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
          <h2 className="font-bold">{t("transaction_history")}</h2>
        </div>
        <div className="divide-y divide-ex-border/50">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">{t("no_history")}</div>
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
                        href={tx.desc?.includes("BEP20")
                          ? `${BSC_SCAN}/${tx.txHash}`
                          : `${TRON_SCAN}/${tx.txHash}`}
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
              <h3 className="text-xl font-black">{t("deposit_modal_title", { asset: selectedAsset })}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedAsset === "USDT" ? (
              <>
                {/* Network tabs in modal */}
                <div className="flex gap-2 mb-4">
                  {(["TRC20", "BEP20"] as const).map((n) => (
                    <button key={n} onClick={() => setNetwork(n)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${
                        network === n
                          ? n === "TRC20"
                            ? "bg-red-500/20 text-red-400 border-red-500/40"
                            : "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                          : "bg-ex-card2 text-gray-400 border-ex-border hover:text-white"
                      }`}>
                      {n === "TRC20" ? "🔴 TRC20" : "🟡 BEP20"}
                    </button>
                  ))}
                </div>
                <div className="bg-ex-card2 border border-ex-border rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-ex-blue" />
                      <span className="text-sm font-semibold">
                        {network === "TRC20" ? "Network: TRON (TRC20)" : "Network: BSC (BEP20)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-ex-green">
                      <span className="w-1.5 h-1.5 rounded-full bg-ex-green animate-pulse" />
                      {t("auto_detecting_label")}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">{t("usdt_deposit_address_title")}</div>
                  <div className="font-mono text-sm text-gray-200 break-all mb-3 bg-ex-bg rounded-lg p-3 select-all">
                    {activeAddress ?? "Not assigned"}
                  </div>
                  {activeAddress && (
                    <button onClick={handleCopyAddress}
                      className="flex items-center gap-2 text-sm text-ex-yellow hover:text-yellow-400 transition-colors">
                      {copied ? <><CheckCircle className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Address</>}
                    </button>
                  )}
                </div>
                {(network === "TRC20" ? incoming : incomingBsc).length > 0 && (
                  <div className="mb-4 space-y-2">
                    {(network === "TRC20" ? incoming : incomingBsc).map(tx => (
                      <div key={tx.txHash}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                          tx.confirmed ? "bg-ex-yellow/10 border-ex-yellow/30" : "bg-ex-blue/10 border-ex-blue/30"
                        }`}>
                        <div className="flex items-center gap-2">
                          {tx.confirmed
                            ? <Zap className="w-3.5 h-3.5 text-ex-yellow" />
                            : <Radio className="w-3.5 h-3.5 text-ex-blue animate-pulse" />}
                          <span className={tx.confirmed ? "text-ex-yellow font-semibold" : "text-ex-blue font-semibold"}>
                            {tx.confirmed ? t("deposit_detected_label") : t("incoming_on_network_label")}
                          </span>
                        </div>
                        <span className="font-semibold font-num text-ex-green">+{tx.amount} USDT</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-ex-yellow/10 border border-ex-yellow/30 rounded-xl p-3 text-xs text-ex-yellow mb-4">
                  {network === "TRC20" ? t("tron_trc20_modal_warning") : t("bep20_modal_warning")}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-ex-green animate-pulse" />
                  {t("checking_every_30s")}
                  {lastChecked && <span>· last {timeAgo(lastChecked)}</span>}
                </div>
              </>
            ) : (
              <div className="bg-ex-card2 border border-ex-border rounded-xl p-5 text-center">
                <Info className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                <div className="text-sm font-semibold mb-1">{t("other_assets_title")}</div>
                <div className="text-xs text-gray-500">{t("contact_support_deposit", { asset: selectedAsset })}</div>
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
              <h3 className="text-xl font-black">{t("withdraw_modal_title", { asset: selectedAsset })}</h3>
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
              <>
                {/* Network selector */}
                <div className="mb-4">
                  <label className="text-sm text-gray-400 block mb-2">{t("network_label")}</label>
                  <div className="flex gap-2">
                    {(["TRC20", "BSC"] as const).map(n => (
                      <button key={n} type="button" onClick={() => { setWithdrawNetwork(n); setWithdrawAddress(""); }}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${
                          withdrawNetwork === n
                            ? n === "TRC20"
                              ? "bg-red-500/20 text-red-400 border-red-500/40"
                              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                            : "bg-ex-card2 text-gray-400 border-ex-border hover:text-white"
                        }`}>
                        {n === "TRC20" ? "🔴 TRC20 (TRON)" : "🟡 BEP20 (BSC)"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-[#f6465d]/10 border border-[#f6465d]/30 rounded-xl p-3 text-xs text-[#f6465d] mb-4 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{t("irreversible_warning")}</span>
                </div>
              </>
            ) : (
              <div className="bg-ex-blue/10 border border-ex-blue/30 rounded-xl p-3 text-xs text-ex-blue mb-4">
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                {t("admin_approval_notice")}
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="bg-ex-card2 border border-ex-border rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm text-gray-400">{t("available_balance_label")}</span>
                <span className="font-num font-bold">{avail.toLocaleString("en-US", { maximumFractionDigits: 6 })} {selectedAsset}</span>
              </div>
              {wdFee && selectedAsset !== "USDT" && (
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">{t("network_label")}</label>
                  <div className="ex-input text-sm text-gray-300">{wdFee.network}</div>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-400 block mb-1.5">{t("destination_address_label")}</label>
                <input className="ex-input font-mono text-sm" type="text" required
                  placeholder={selectedAsset === "USDT"
                    ? withdrawNetwork === "TRC20" ? "T... (TRON address)" : "0x... (BSC address)"
                    : `Enter ${selectedAsset} address`}
                  value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm text-gray-400">{t("amount_wd_label")}</label>
                  <button type="button" onClick={() => setWithdrawAmount(String(avail))}
                    className="text-xs text-ex-yellow hover:underline">{t("max_btn")}</button>
                </div>
                <input className="ex-input font-num" type="number" required step="any"
                  min={wdFee?.min} max={avail}
                  placeholder={`Min: ${wdFee?.min ?? 0} ${selectedAsset}`}
                  value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
              </div>
              {wdFee && withdrawAmount && (
                <div className="bg-ex-card2 border border-ex-border rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("network_fee_label")}</span>
                    <span>{wdFee.fee} {selectedAsset}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-500">{t("you_receive_label")}</span>
                    <span>{Math.max(0, parseFloat(withdrawAmount) - wdFee.fee).toFixed(6)} {selectedAsset}</span>
                  </div>
                </div>
              )}
              <button type="submit" className="btn-primary w-full py-3" disabled={withdrawLoading}>
                {withdrawLoading ? t("submitting") : t("request_withdrawal_btn")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
