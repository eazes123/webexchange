"use client";
import { useState } from "react";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Copy, CheckCircle,
  X, Clock, TrendingUp, Eye, EyeOff, RefreshCw, ChevronRight,
  Info, Shield, ArrowRightLeft
} from "lucide-react";
import { useStore, type Transaction } from "@/lib/store";
import { COINS, DEPOSIT_ADDRESSES, WITHDRAWAL_FEES } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

type ModalType = "deposit" | "withdraw" | null;

const COIN_PRICES: Record<string, number> = Object.fromEntries(
  COINS.map(c => [c.symbol, c.price])
);
COIN_PRICES["USDT"] = 1;
COIN_PRICES["USDC"] = 1;

const ASSETS = ["USDT", "BTC", "ETH", "BNB", "SOL", "XRP"];

function getUsdValue(symbol: string, amount: number): number {
  return amount * (COIN_PRICES[symbol] ?? 0);
}

function TxIcon({ type }: { type: Transaction["type"] }) {
  const cfg: Record<string, { icon: React.ReactNode; cls: string }> = {
    deposit:      { icon: <ArrowDownLeft className="w-4 h-4" />, cls: "bg-ex-green/10 text-ex-green" },
    withdrawal:   { icon: <ArrowUpRight  className="w-4 h-4" />, cls: "bg-ex-red/10 text-ex-red" },
    loan_credit:  { icon: <TrendingUp    className="w-4 h-4" />, cls: "bg-ex-yellow/10 text-ex-yellow" },
    trade:        { icon: <ArrowRightLeft className="w-4 h-4" />, cls: "bg-ex-blue/10 text-ex-blue" },
    fee:          { icon: <Info          className="w-4 h-4" />, cls: "bg-gray-700 text-gray-400" },
    refund:       { icon: <RefreshCw     className="w-4 h-4" />, cls: "bg-ex-green/10 text-ex-green" },
  };
  const c = cfg[type] || cfg["fee"];
  return <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.cls}`}>{c.icon}</div>;
}

function StatusChip({ status }: { status: Transaction["status"] }) {
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
  const { walletBalances, transactions, deposit, withdraw, coins } = useStore();
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedAsset, setSelectedAsset] = useState("USDT");
  const [copied, setCopied] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [simDeposit, setSimDeposit] = useState("");

  // Get live prices from store
  const livePrices: Record<string, number> = { USDT: 1, USDC: 1 };
  coins.forEach(c => { livePrices[c.symbol] = c.price; });

  const totalUSD = ASSETS.reduce((acc, sym) => {
    const bal = walletBalances[sym]?.available ?? 0;
    const locked = walletBalances[sym]?.locked ?? 0;
    return acc + (bal + locked) * (livePrices[sym] ?? 0);
  }, 0);

  const openDeposit = (asset: string) => { setSelectedAsset(asset); setSimDeposit(""); setModal("deposit"); };
  const openWithdraw = (asset: string) => { setSelectedAsset(asset); setWithdrawAmount(""); setWithdrawAddress(""); setModal("withdraw"); };

  const handleCopy = () => {
    const info = DEPOSIT_ADDRESSES[selectedAsset];
    if (info) {
      navigator.clipboard.writeText(info.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSimDeposit = () => {
    const amt = parseFloat(simDeposit);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    deposit(selectedAsset, amt);
    toast.success(`${amt} ${selectedAsset} deposited successfully (Demo)`);
    setModal(null);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    const bal = walletBalances[selectedAsset]?.available ?? 0;
    const fee = WITHDRAWAL_FEES[selectedAsset];
    if (!amt || amt <= 0)         { toast.error("Enter a valid amount"); return; }
    if (amt < (fee?.min ?? 0))    { toast.error(`Minimum withdrawal: ${fee?.min} ${selectedAsset}`); return; }
    if (amt > bal)                { toast.error("Insufficient balance"); return; }
    if (!withdrawAddress)         { toast.error("Enter destination address"); return; }
    setWithdrawLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    withdraw(selectedAsset, amt, withdrawAddress);
    setWithdrawLoading(false);
    toast.success(`Withdrawal of ${amt} ${selectedAsset} submitted — processing in 24-48h`);
    setModal(null);
  };

  const depInfo = DEPOSIT_ADDRESSES[selectedAsset];
  const wdFee  = WITHDRAWAL_FEES[selectedAsset];
  const avail  = walletBalances[selectedAsset]?.available ?? 0;

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black mb-1">Wallet</h1>
          <p className="text-gray-400">Manage your assets, deposits and withdrawals</p>
        </div>
        <button onClick={() => setHideBalance(!hideBalance)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 bg-ex-card border border-ex-border rounded-xl">
          {hideBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {hideBalance ? "Show" : "Hide"} Balance
        </button>
      </div>

      {/* Total portfolio */}
      <div className="bg-gradient-to-r from-ex-card2 to-ex-card border border-ex-border rounded-2xl p-6 mb-6">
        <p className="text-sm text-gray-400 mb-1">Total Portfolio Value</p>
        <div className="text-4xl font-black font-num mb-1">
          {hideBalance ? "••••••" : `$${totalUSD.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
        </div>
        <p className="text-sm text-gray-500">
          Across {ASSETS.filter(a => (walletBalances[a]?.available ?? 0) + (walletBalances[a]?.locked ?? 0) > 0).length} assets
        </p>
      </div>

      {/* Asset table */}
      <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-ex-border flex items-center justify-between">
          <h2 className="font-bold">Your Assets</h2>
          <span className="text-xs text-gray-500">{ASSETS.length} assets</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-ex-border">
              <th className="text-left px-5 py-3 font-medium">Asset</th>
              <th className="text-right px-5 py-3 font-medium">Available</th>
              <th className="text-right px-5 py-3 font-medium hidden md:table-cell">Locked</th>
              <th className="text-right px-5 py-3 font-medium hidden md:table-cell">USD Value</th>
              <th className="text-right px-5 py-3 font-medium">Price</th>
              <th className="text-center px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ASSETS.map(sym => {
              const bal    = walletBalances[sym]?.available ?? 0;
              const locked = walletBalances[sym]?.locked ?? 0;
              const price  = livePrices[sym] ?? 0;
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
                  <td className="px-5 py-4 text-right">
                    <div className="font-num font-semibold">
                      {hideBalance ? "••••" : bal.toLocaleString("en-US", { maximumFractionDigits: 6 })}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-500 font-num hidden md:table-cell">
                    {hideBalance ? "••••" : locked > 0 ? locked.toLocaleString("en-US", { maximumFractionDigits: 6 }) : "—"}
                  </td>
                  <td className="px-5 py-4 text-right font-num hidden md:table-cell">
                    {hideBalance ? "••••" : `$${usd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
                  </td>
                  <td className="px-5 py-4 text-right font-num text-gray-400">
                    {sym === "USDT" || sym === "USDC" ? "$1.00" : formatPrice(price)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openDeposit(sym)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-ex-green/10 text-ex-green text-xs font-semibold rounded-lg hover:bg-ex-green/20 border border-ex-green/30 transition-colors">
                        <ArrowDownLeft className="w-3.5 h-3.5" /> Deposit
                      </button>
                      <button onClick={() => openWithdraw(sym)}
                        disabled={bal <= 0}
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
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                    <span>{tx.date}</span>
                    {tx.txHash && (
                      <span className="font-mono text-gray-600 truncate max-w-[120px]">
                        {tx.txHash}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-semibold font-num ${
                    tx.type === "deposit" || tx.type === "loan_credit" || tx.type === "refund"
                      ? "text-ex-green"
                      : tx.type === "withdrawal" || tx.type === "fee"
                        ? "text-ex-red"
                        : "text-white"
                  }`}>
                    {(tx.type === "deposit" || tx.type === "loan_credit" || tx.type === "refund") ? "+" : "-"}
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

            {/* Asset selector */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {ASSETS.map(a => (
                <button key={a} onClick={() => setSelectedAsset(a)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    selectedAsset === a ? "bg-ex-yellow text-black" : "bg-ex-card2 text-gray-400 hover:text-white border border-ex-border"
                  }`}>
                  {a}
                </button>
              ))}
            </div>

            {depInfo && (
              <>
                {/* Network */}
                <div className="bg-ex-card2 border border-ex-border rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-ex-blue" />
                    <span className="text-sm font-semibold">Network: {depInfo.network}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">Deposit Address</div>
                  <div className="font-mono text-sm text-gray-200 break-all mb-3 bg-ex-bg rounded-lg p-3 select-all">
                    {depInfo.address}
                  </div>
                  <button onClick={handleCopy}
                    className="flex items-center gap-2 text-sm text-ex-yellow hover:text-yellow-400 transition-colors">
                    {copied ? <><CheckCircle className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Address</>}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
                  {[
                    { label: "Min Deposit",    value: depInfo.minDeposit },
                    { label: "Confirmations",  value: `${depInfo.confirmations} blocks` },
                  ].map(r => (
                    <div key={r.label} className="bg-ex-card2 border border-ex-border rounded-xl p-3">
                      <div className="text-gray-500">{r.label}</div>
                      <div className="font-semibold mt-0.5">{r.value}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-ex-yellow/10 border border-ex-yellow/30 rounded-xl p-3 text-xs text-ex-yellow mb-5">
                  ⚠️ Only send {selectedAsset} on the {depInfo.network} network to this address. Sending other assets may result in permanent loss.
                </div>
              </>
            )}

            {/* Demo simulation */}
            <div className="border-t border-ex-border pt-5">
              <p className="text-xs text-gray-500 mb-3 font-semibold">DEMO SIMULATION — Instantly credit deposit</p>
              <div className="flex gap-2">
                <input className="ex-input flex-1 text-sm" type="number" placeholder={`Amount in ${selectedAsset}`}
                  value={simDeposit} onChange={e => setSimDeposit(e.target.value)} />
                <button onClick={handleSimDeposit}
                  className="btn-primary px-4 py-2 text-sm whitespace-nowrap">
                  Credit Now
                </button>
              </div>
            </div>
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

            {/* Asset selector */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {ASSETS.filter(a => (walletBalances[a]?.available ?? 0) > 0).map(a => (
                <button key={a} onClick={() => setSelectedAsset(a)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    selectedAsset === a ? "bg-ex-yellow text-black" : "bg-ex-card2 text-gray-400 hover:text-white border border-ex-border"
                  }`}>
                  {a}
                </button>
              ))}
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              {/* Balance */}
              <div className="bg-ex-card2 border border-ex-border rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm text-gray-400">Available Balance</span>
                <span className="font-num font-bold">{avail.toLocaleString("en-US", { maximumFractionDigits: 6 })} {selectedAsset}</span>
              </div>

              {/* Network */}
              {wdFee && (
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">Network</label>
                  <div className="ex-input text-sm text-gray-300">{wdFee.network}</div>
                </div>
              )}

              {/* Address */}
              <div>
                <label className="text-sm text-gray-400 block mb-1.5">Destination Address *</label>
                <input className="ex-input font-mono text-sm" type="text" required
                  placeholder={`Enter ${selectedAsset} address`}
                  value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} />
              </div>

              {/* Amount */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm text-gray-400">Amount *</label>
                  <button type="button" onClick={() => setWithdrawAmount(String(avail - (wdFee?.fee ?? 0)))}
                    className="text-xs text-ex-yellow hover:underline">
                    Max
                  </button>
                </div>
                <input className="ex-input font-num" type="number" required step="any"
                  min={wdFee?.min} max={avail}
                  placeholder={`Min: ${wdFee?.min ?? 0} ${selectedAsset}`}
                  value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
              </div>

              {/* Fee info */}
              {wdFee && (
                <div className="bg-ex-card2 border border-ex-border rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Network Fee</span>
                    <span>{wdFee.fee} {selectedAsset} (≈${wdFee.feeUSD.toFixed(2)})</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-500">You Receive</span>
                    <span>
                      {withdrawAmount
                        ? Math.max(0, parseFloat(withdrawAmount) - wdFee.fee).toFixed(6)
                        : "—"} {selectedAsset}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                Processing time: 24-48 hours
              </div>

              <button type="submit" className="btn-primary w-full py-3" disabled={withdrawLoading}>
                {withdrawLoading ? "Submitting..." : `Withdraw ${selectedAsset} →`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
