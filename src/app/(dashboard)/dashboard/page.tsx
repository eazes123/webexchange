"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Trophy, Clock, CheckCircle, ArrowUpRight, Shield,
  Wallet, TrendingUp, Gift, ChevronRight, Circle,
  Users, AlertCircle, Zap, RefreshCw, PartyPopper
} from "lucide-react";
import { useStore } from "@/lib/store";
import { CAMPAIGN_STATS } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

// ── Stepper ────────────────────────────────────────────────────────────────
type StepStatus = "done" | "active" | "pending";

function Step({ n, label, sub, status }: { n: number; label: string; sub: string; status: StepStatus }) {
  return (
    <div className="flex items-start gap-3 flex-1 min-w-0">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm border-2 transition-all ${
        status === "done"
          ? "bg-ex-green border-ex-green text-black"
          : status === "active"
            ? "bg-ex-yellow border-ex-yellow text-black"
            : "bg-ex-card2 border-ex-border text-gray-500"
      }`}>
        {status === "done" ? <CheckCircle className="w-5 h-5" /> : n}
      </div>
      <div className="hidden md:block pt-1">
        <div className={`text-sm font-semibold ${status === "pending" ? "text-gray-500" : "text-white"}`}>{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function StepConnector({ done }: { done: boolean }) {
  return (
    <div className={`flex-1 h-0.5 mt-4 mx-1 rounded-full transition-colors ${done ? "bg-ex-green" : "bg-ex-border"}`} />
  );
}

export default function DashboardPage() {
  const { demoUser, coins, walletBalances } = useStore();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const deadline = new Date("2026-12-31T23:59:59");
    const timer = setInterval(() => {
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) { clearInterval(timer); return; }
      setTimeLeft({
        days:    Math.floor(diff / 86_400_000),
        hours:   Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000)  / 60_000),
        seconds: Math.floor((diff % 60_000)     / 1_000),
      });
    }, 1_000);
    return () => clearInterval(timer);
  }, []);

  const kycDone   = demoUser.kycStatus === "approved";
  const kycPend   = demoUser.kycStatus === "under_review" || demoUser.kycStatus === "pending";
  const kycNone   = demoUser.kycStatus === "none" || demoUser.kycStatus === "rejected";
  const loanDone  = demoUser.loanStatus === "approved" || demoUser.loanStatus === "disbursed";
  const usdtBal   = walletBalances.USDT?.available ?? 0;

  // Determine overall progress step
  const currentStep = !kycDone && !kycPend ? 1 : kycPend ? 2 : !loanDone ? 3 : 4;

  const stepStatus = (n: number): StepStatus => {
    if (n < currentStep) return "done";
    if (n === currentStep) return "active";
    return "pending";
  };

  return (
    <div className="p-6 max-w-5xl">

      {/* Welcome / status banner */}
      {loanDone ? (
        <div className="bg-gradient-to-r from-ex-green/10 to-ex-card border border-ex-green/30 rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-ex-green/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-start gap-3">
            <PartyPopper className="w-8 h-8 text-ex-green shrink-0 mt-0.5" />
            <div>
              <h1 className="text-2xl font-black text-ex-green">Congratulations, {demoUser.name}! 🎉</h1>
              <p className="text-gray-300 mt-1">
                Your $50,000 USDT interest-free loan has been approved and credited to your wallet.
                You are one of the first {CAMPAIGN_STATS.spotsUsed} qualifying participants.
              </p>
            </div>
          </div>
        </div>
      ) : kycPend ? (
        <div className="bg-ex-card2 border border-ex-yellow/30 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <Clock className="w-7 h-7 text-ex-yellow shrink-0 mt-0.5" />
            <div>
              <h1 className="text-xl font-black">KYC Under Review</h1>
              <p className="text-gray-400 mt-1">
                Your documents have been submitted. Our compliance team will review within <strong className="text-white">24–48 hours</strong>.
                You will be notified once your identity is verified.
              </p>
            </div>
          </div>
        </div>
      ) : kycDone && !loanDone ? (
        <div className="bg-ex-card2 border border-ex-blue/30 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <Zap className="w-7 h-7 text-ex-blue shrink-0 mt-0.5" />
            <div>
              <h1 className="text-xl font-black">KYC Verified — Loan Processing</h1>
              <p className="text-gray-400 mt-1">
                Your identity has been verified. Your $50,000 USDT loan application is currently being processed
                by our team. This typically takes <strong className="text-white">1–2 business days</strong>.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-ex-card2 to-ex-card border border-ex-border rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-ex-yellow/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <h1 className="text-2xl font-black">Welcome, {demoUser.name}! 👋</h1>
            <p className="text-gray-400 mt-1">
              You are <strong className="text-ex-yellow">#{demoUser.queuePosition}</strong> in the campaign queue.
              Complete identity verification to unlock your <strong className="text-white">$50,000 USDT</strong> interest-free loan.
            </p>
          </div>
        </div>
      )}

      {/* Progress stepper */}
      <div className="bg-ex-card border border-ex-border rounded-2xl p-5 mb-6">
        <h2 className="font-bold mb-4 text-sm text-gray-400 uppercase tracking-wide">Your Journey</h2>
        <div className="flex items-start gap-0">
          <Step n={1} label="Register" sub="Account created" status={stepStatus(1)} />
          <StepConnector done={currentStep > 1} />
          <Step n={2} label="KYC" sub="Identity verified" status={stepStatus(2)} />
          <StepConnector done={currentStep > 2} />
          <Step n={3} label="Approval" sub="Loan approved" status={stepStatus(3)} />
          <StepConnector done={currentStep > 3} />
          <Step n={4} label="Funds" sub="$50K credited" status={stepStatus(4)} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            icon: Trophy,
            label: "Queue Position",
            value: `#${demoUser.queuePosition}`,
            sub: "of 1,000 slots",
            color: "text-ex-yellow",
          },
          {
            icon: Gift,
            label: "Loan Amount",
            value: loanDone ? "$50,000" : "Pending",
            sub: "USDT Interest-Free",
            color: loanDone ? "text-ex-green" : "text-gray-400",
          },
          {
            icon: Shield,
            label: "KYC Status",
            value: kycDone ? "Verified" : kycPend ? "In Review" : "Pending",
            sub: kycDone ? "✓ Identity confirmed" : kycPend ? "24-48h remaining" : "Action required",
            color: kycDone ? "text-ex-green" : kycPend ? "text-ex-yellow" : "text-gray-400",
          },
          {
            icon: Wallet,
            label: "USDT Balance",
            value: usdtBal > 0 ? `$${usdtBal.toLocaleString()}` : "$0",
            sub: "Available balance",
            color: usdtBal > 0 ? "text-ex-green" : "text-gray-400",
          },
        ].map((s, i) => (
          <div key={i} className="bg-ex-card border border-ex-border rounded-2xl p-4">
            <s.icon className={`w-6 h-6 mb-2 ${s.color}`} />
            <div className={`text-lg font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            <div className="text-xs text-gray-600 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Action card — changes per step */}
        <div className="bg-ex-card border border-ex-border rounded-2xl p-5">
          {kycNone && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-ex-yellow" />
                <h2 className="font-bold">Step 1 — Verify Your Identity</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                KYC verification is required to participate in the loan campaign.
                It takes about 5 minutes to complete.
              </p>
              <div className="space-y-2 mb-4">
                {["Government-issued photo ID","Selfie / liveness check","Proof of address"].map(r => (
                  <div key={r} className="flex items-center gap-2 text-sm text-gray-400">
                    <Circle className="w-3 h-3 text-gray-600" /> {r}
                  </div>
                ))}
              </div>
              <Link href="/kyc" className="btn-primary w-full py-3 text-center block">
                Start KYC Verification →
              </Link>
            </>
          )}

          {kycPend && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-5 h-5 text-ex-yellow animate-spin" />
                <h2 className="font-bold">Documents Under Review</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Our compliance team is reviewing your submitted documents.
                This process typically takes 24–48 hours.
              </p>
              <div className="bg-ex-card2 border border-ex-border rounded-xl p-3 space-y-2 text-sm">
                {["Personal Information","ID Document","Selfie","Proof of Address"].map(d => (
                  <div key={d} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-ex-green" />
                    <span className="text-gray-300">{d}</span>
                    <span className="ml-auto text-xs text-ex-yellow bg-ex-yellow/10 px-2 py-0.5 rounded-full">Submitted</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {kycDone && !loanDone && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-ex-green" />
                <h2 className="font-bold">Identity Verified ✓</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Your KYC has been approved. Your $50,000 USDT loan application is in the
                final processing stage. Funds will be credited to your wallet shortly.
              </p>
              <div className="bg-ex-green/5 border border-ex-green/20 rounded-xl p-3 flex items-center gap-2 text-sm text-ex-green">
                <CheckCircle className="w-4 h-4 shrink-0" />
                KYC verified — awaiting loan disbursement
              </div>
            </>
          )}

          {loanDone && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-ex-green" />
                <h2 className="font-bold">Loan Ready to Withdraw</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Your $50,000 USDT is in your wallet. You can now withdraw it to your
                personal external wallet.
              </p>
              <div className="space-y-2">
                <Link href="/wallet" className="btn-outline w-full py-2.5 text-sm text-center block">
                  View Wallet →
                </Link>
                <Link href="/withdraw" className="btn-primary w-full py-2.5 text-sm text-center block">
                  Withdraw to External Wallet →
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Countdown */}
        <div className="bg-ex-card border border-ex-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-ex-yellow" />
            <h2 className="font-bold">Campaign Deadline</h2>
          </div>
          <div className="flex gap-3 mb-4">
            {[
              { l: "Days",  v: timeLeft.days },
              { l: "Hours", v: timeLeft.hours },
              { l: "Mins",  v: timeLeft.minutes },
              { l: "Secs",  v: timeLeft.seconds },
            ].map((t, i) => (
              <div key={i} className="text-center flex-1">
                <div className="bg-ex-card2 border border-ex-border rounded-xl py-2 font-black text-2xl font-num text-ex-yellow">
                  {String(t.v).padStart(2, "0")}
                </div>
                <div className="text-xs text-gray-500 mt-1">{t.l}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>{CAMPAIGN_STATS.spotsUsed} registered</span>
              <span>{CAMPAIGN_STATS.spotsRemaining} spots left</span>
            </div>
            <div className="h-2.5 bg-ex-card2 rounded-full overflow-hidden border border-ex-border">
              <div
                className="h-full bg-gradient-to-r from-ex-yellow to-orange-400 rounded-full transition-all"
                style={{ width: `${(CAMPAIGN_STATS.spotsUsed / CAMPAIGN_STATS.totalSpots) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {CAMPAIGN_STATS.spotsRemaining} of {CAMPAIGN_STATS.totalSpots} spots remaining.
              Complete KYC before the deadline to secure your loan.
            </p>
          </div>
        </div>
      </div>

      {/* Wallet balances (only shown when has funds) */}
      {(usdtBal > 0 || (walletBalances.BTC?.available ?? 0) > 0) && (
        <div className="bg-ex-card border border-ex-border rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-ex-green" />
              <h2 className="font-bold">Wallet Balances</h2>
            </div>
            <Link href="/wallet" className="text-xs text-ex-yellow hover:underline flex items-center gap-1">
              Manage <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["USDT","BTC","ETH"].map(sym => {
              const bal   = walletBalances[sym]?.available ?? 0;
              const price = sym === "USDT" ? 1 : coins.find(c => c.symbol === sym)?.price ?? 0;
              const usd   = bal * price;
              const coin  = coins.find(c => c.symbol === sym);
              return (
                <div key={sym} className="bg-ex-card2 border border-ex-border rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {coin && (
                      <img src={coin.image} alt={sym} className="w-5 h-5 rounded-full"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )}
                    <span className="text-sm font-semibold text-gray-300">{sym}</span>
                  </div>
                  <div className="font-black font-num">{bal.toLocaleString("en-US", { maximumFractionDigits: 6 })}</div>
                  <div className="text-xs text-gray-500">${usd.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Market overview */}
      <div className="bg-ex-card border border-ex-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-ex-blue" />
            <h2 className="font-bold">Market Overview</h2>
          </div>
          <Link href="/markets" className="text-xs text-ex-yellow hover:underline flex items-center gap-1">
            All Markets <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {coins.slice(0, 4).map(c => (
            <Link href={`/trade/${c.symbol}-USDT`} key={c.id}
              className="bg-ex-card2 border border-ex-border rounded-xl p-3 hover:border-gray-500 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <img src={c.image} alt={c.symbol} className="w-6 h-6 rounded-full"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <span className="text-sm font-semibold">{c.symbol}</span>
              </div>
              <div className="font-num text-sm font-bold">{formatPrice(c.price)}</div>
              <div className={`text-xs font-semibold ${c.change24h >= 0 ? "text-ex-green" : "text-ex-red"}`}>
                {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
