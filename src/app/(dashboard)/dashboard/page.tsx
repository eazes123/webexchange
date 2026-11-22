"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Trophy, Clock, CheckCircle, Shield,
  Wallet, TrendingUp, Gift, ChevronRight,
  Lock, AlertCircle, Zap, PartyPopper, Star
} from "lucide-react";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";

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

  const kycDone     = demoUser.kycStatus === "approved";
  const kycPend     = demoUser.kycStatus === "under_review" || demoUser.kycStatus === "pending";
  const kycRejected = demoUser.kycStatus === "rejected";
  const kycNone     = !kycDone && !kycPend && !kycRejected;
  const usdtAvail   = walletBalances.USDT?.available ?? 0;
  const usdtLocked  = walletBalances.USDT?.locked    ?? 0;
  const hasDeposit  = usdtAvail + usdtLocked >= 500;
  const isStaked    = demoUser.stakeStatus === "active";
  const isRewarded  = demoUser.stakeStatus === "rewarded";

  // Step logic: 1=Register, 2=KYC, 3=Deposit+Stake, 4=Collect
  const currentStep = kycNone ? 2 : kycPend ? 2 : !hasDeposit || !isStaked ? 3 : isRewarded ? 4 : 3;
  const stepStatus = (n: number): StepStatus => {
    if (n === 1) return "done"; // always done (registered)
    if (isRewarded) return n <= 4 ? "done" : "pending";
    if (n < currentStep) return "done";
    if (n === currentStep) return "active";
    return "pending";
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full">

      {/* Welcome / status banner */}
      {isRewarded ? (
        <div className="bg-gradient-to-r from-ex-green/10 to-ex-card border border-ex-green/30 rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-ex-green/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-start gap-3">
            <PartyPopper className="w-8 h-8 text-ex-green shrink-0 mt-0.5" />
            <div>
              <h1 className="text-2xl font-black text-ex-green">Congratulations, {demoUser.name}! 🎉</h1>
              <p className="text-gray-300 mt-1">
                Your $50,000 USDT interest-free loan has been disbursed to your wallet.
                You can now withdraw or trade with it freely.
              </p>
            </div>
          </div>
        </div>
      ) : isStaked ? (
        <div className="bg-ex-card2 border border-ex-green/30 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <Lock className="w-7 h-7 text-ex-green shrink-0 mt-0.5" />
            <div>
              <h1 className="text-xl font-black text-ex-green">Staking Active, Loan Eligible ✓</h1>
              <p className="text-gray-400 mt-1">
                Your 500 USDT is staked. Keep it staked until <strong className="text-white">December 31, 2026</strong> to
                receive your <strong className="text-ex-yellow">$50,000 USDT interest-free loan</strong>.
              </p>
            </div>
          </div>
        </div>
      ) : kycRejected ? (
        <div className="bg-ex-card2 border border-red-500/30 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-7 h-7 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h1 className="text-xl font-black text-red-400">KYC Rejected</h1>
              <p className="text-gray-400 mt-1">
                Your KYC submission was not approved. Please review your documents and resubmit.
              </p>
              <Link href="/kyc"
                className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold rounded-xl transition-colors">
                Resubmit KYC <ChevronRight className="w-4 h-4" />
              </Link>
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
                Your documents have been submitted. Our compliance team will review within{" "}
                <strong className="text-white">24–48 hours</strong>.
              </p>
            </div>
          </div>
        </div>
      ) : kycDone && !hasDeposit ? (
        <div className="bg-ex-card2 border border-ex-blue/30 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <Wallet className="w-7 h-7 text-ex-blue shrink-0 mt-0.5" />
            <div>
              <h1 className="text-xl font-black">KYC Verified: Deposit 500 USDT to Continue</h1>
              <p className="text-gray-400 mt-1">
                Send at least <strong className="text-white">500 USDT (TRC20)</strong> to your personal deposit
                address. Then stake in the New Year Campaign to get your <strong className="text-ex-yellow">$50,000 USDT interest-free loan</strong>.
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
              Complete KYC verification to unlock the{" "}
              <strong className="text-ex-yellow">New Year Campaign</strong> and get your{" "}
              <strong className="text-white">$50,000 USDT interest-free loan</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Progress stepper */}
      <div className="bg-ex-card border border-ex-border rounded-2xl p-5 mb-6">
        <h2 className="font-bold mb-4 text-sm text-gray-400 uppercase tracking-wide">Your Journey</h2>
        <div className="flex items-start gap-0">
          <Step n={1} label="Register"     sub="Account created"           status={stepStatus(1)} />
          <StepConnector done={currentStep > 1} />
          <Step n={2} label="KYC"          sub="Identity verified"         status={stepStatus(2)} />
          <StepConnector done={currentStep > 2} />
          <Step n={3} label="Stake 500 USDT" sub="New Year Campaign"       status={stepStatus(3)} />
          <StepConnector done={isRewarded} />
          <Step n={4} label="Loan Disbursed" sub="$50K interest-free"       status={stepStatus(4)} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            icon: Shield,
            label: "KYC Status",
            value: kycDone ? "Verified" : kycPend ? "In Review" : kycRejected ? "Rejected" : "Pending",
            sub:   kycDone ? "✓ Identity confirmed" : kycPend ? "24–48h remaining" : kycRejected ? "Resubmit required" : "Action required",
            color: kycDone ? "text-ex-green" : kycPend ? "text-ex-yellow" : kycRejected ? "text-red-400" : "text-gray-400",
          },
          {
            icon: Wallet,
            label: "USDT Balance",
            value: `${(usdtAvail).toFixed(2)} USDT`,
            sub: usdtLocked > 0 ? `+${usdtLocked.toFixed(2)} staked` : "Available balance",
            color: usdtAvail > 0 ? "text-ex-green" : "text-gray-400",
          },
          {
            icon: Lock,
            label: "Stake Status",
            value: isRewarded ? "Rewarded ✓" : isStaked ? "Active" : demoUser.stakeStatus === "unstaked" ? "Unstaked" : "None",
            sub:   isRewarded ? "Loan disbursed" : isStaked ? "500 USDT locked" : "Stake to get $50K loan",
            color: isRewarded ? "text-ex-yellow" : isStaked ? "text-ex-green" : "text-gray-400",
          },
          {
            icon: Gift,
            label: "Loan Amount",
            value: isRewarded ? "$50,000" : "Eligible",
            sub:   "50,000 USDT, 0% interest",
            color: isRewarded ? "text-ex-green" : "text-ex-yellow",
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
                <h2 className="font-bold">Step 2: Verify Your Identity</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                KYC is required to participate in the campaign. It takes about 5 minutes.
              </p>
              <div className="space-y-2 mb-4">
                {["Government-issued photo ID", "Selfie / liveness check", "Proof of address"].map(r => (
                  <div key={r} className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600" /> {r}
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
                <Clock className="w-5 h-5 text-ex-yellow animate-pulse" />
                <h2 className="font-bold">Documents Under Review</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Our team is reviewing your documents. Typically done within 24–48 hours.
              </p>
              <div className="bg-ex-card2 border border-ex-border rounded-xl p-3 space-y-2 text-sm">
                {["Personal Information", "ID Document", "Selfie", "Proof of Address"].map(d => (
                  <div key={d} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-ex-green" />
                    <span className="text-gray-300">{d}</span>
                    <span className="ml-auto text-xs text-ex-yellow bg-ex-yellow/10 px-2 py-0.5 rounded-full">Submitted</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {kycDone && !isStaked && !isRewarded && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-ex-yellow" />
                <h2 className="font-bold">Step 3: Stake 500 USDT</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                {!hasDeposit
                  ? `Deposit at least 500 USDT to your personal TRC20 address first, then stake in the New Year Campaign.`
                  : `You have ${usdtAvail.toFixed(2)} USDT available. Stake 500 USDT to activate your $50,000 USDT interest-free loan.`}
              </p>
              <div className="space-y-2">
                {!hasDeposit && (
                  <Link href="/wallet" className="btn-outline w-full py-2.5 text-sm text-center block">
                    Deposit USDT →
                  </Link>
                )}
                <Link href="/campaign" className="btn-primary w-full py-2.5 text-sm text-center block">
                  Go to New Year Campaign →
                </Link>
              </div>
            </>
          )}

          {isStaked && !isRewarded && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-ex-green" />
                <h2 className="font-bold">Staking Active: Loan Pending Disbursement</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Your 500 USDT is staked. Keep it locked until December 31, 2026 to
                receive your <strong className="text-ex-yellow">$50,000 USDT interest-free loan</strong>.
              </p>
              <div className="bg-ex-green/5 border border-ex-green/20 rounded-xl p-3 text-sm text-ex-green flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" /> Stake confirmed, loan eligible
              </div>
              <Link href="/campaign" className="btn-outline w-full py-2.5 text-sm text-center block mt-3">
                View Campaign Status →
              </Link>
            </>
          )}

          {isRewarded && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-ex-green" />
                <h2 className="font-bold">Loan Disbursed! 🎉</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Your $50,000 USDT interest-free loan has been credited. Withdraw or trade freely. 0% interest for 10 years.
              </p>
              <div className="space-y-2">
                <Link href="/wallet" className="btn-primary w-full py-2.5 text-sm text-center block">
                  Withdraw to External Wallet →
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Campaign countdown */}
        <div className="bg-ex-card border border-ex-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-ex-yellow" />
            <h2 className="font-bold">Campaign Countdown</h2>
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
          <div className="bg-ex-card2 border border-ex-border rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Campaign</span>
              <span className="font-semibold">New Year 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Stake Required</span>
              <span className="font-semibold font-num">500 USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Loan Amount</span>
              <span className="font-semibold font-num text-ex-yellow">50,000 USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Interest Rate</span>
              <span className="font-semibold text-ex-green">0% (10 Years)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Deadline</span>
              <span className="font-semibold">Dec 31, 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Network</span>
              <span className="font-semibold">TRON (TRC20)</span>
            </div>
          </div>
          <Link href="/campaign" className="btn-primary w-full py-2.5 text-sm text-center block mt-4">
            View Campaign Details →
          </Link>
        </div>
      </div>

      {/* Wallet balances (shown when has funds) */}
      {(usdtAvail > 0 || usdtLocked > 0 || (walletBalances.BTC?.available ?? 0) > 0) && (
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
            {["USDT", "BTC", "ETH"].map(sym => {
              const bal   = walletBalances[sym]?.available ?? 0;
              const lkd   = walletBalances[sym]?.locked ?? 0;
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
                  {lkd > 0 && <div className="text-xs text-purple-400 mt-0.5">{lkd.toFixed(2)} locked</div>}
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
