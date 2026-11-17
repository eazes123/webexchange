"use client";
import { useState, useEffect } from "react";
import {
  Trophy, Clock, CheckCircle, Shield, Wallet,
  Gift, ChevronRight, AlertTriangle, Lock, Unlock,
  Star, TrendingUp, Calendar, Users, Zap, PartyPopper
} from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import Link from "next/link";

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-ex-card2 border border-ex-border rounded-2xl p-4 text-center min-w-[72px]">
      <div className="text-3xl font-black font-num text-ex-yellow">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );
}

export default function CampaignPage() {
  const { demoUser, walletBalances, hydrate } = useStore();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading]   = useState(false);
  const [campaignData, setCampaignData] = useState<any>(null);

  useEffect(() => {
    const deadline = new Date("2026-12-31T23:59:59");
    const timer = setInterval(() => {
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) { clearInterval(timer); return; }
      setTimeLeft({
        days:    Math.floor(diff / 86_400_000),
        hours:   Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000)  / 60_000),
        seconds: Math.floor((diff % 60_000)      / 1_000),
      });
    }, 1_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/campaign")
      .then(r => r.json())
      .then(data => setCampaignData(data))
      .catch(() => {});
  }, []);

  const kycApproved   = demoUser.kycStatus === "approved";
  const stakeStatus   = demoUser.stakeStatus ?? "none";
  const stakeAmount   = demoUser.stakeAmount ?? 0;
  const usdtAvailable = walletBalances.USDT?.available ?? 0;
  const usdtLocked    = walletBalances.USDT?.locked    ?? 0;
  const hasEnough     = usdtAvailable >= 500;
  const isStaked      = stakeStatus === "active";
  const isRewarded    = stakeStatus === "rewarded";
  const isUnstaked    = stakeStatus === "unstaked";

  const handleStake = async () => {
    if (!kycApproved)  { toast.error("Complete KYC first"); return; }
    if (!hasEnough)    { toast.error("Deposit at least 500 USDT to stake"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stake" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Staking failed"); return; }
      toast.success("🎉 500 USDT staked! You are now eligible for the $50,000 interest-free loan.");
      await hydrate();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!confirm("Are you sure? Unstaking forfeits your $50,000 loan eligibility. Your 500 USDT will be returned.")) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unstake" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Unstake failed"); return; }
      toast.success("Unstaked. 500 USDT returned to your wallet.");
      await hydrate();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (isRewarded) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="bg-ex-card border border-ex-border rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-black mb-2 text-ex-yellow">Congratulations!</h2>
          <p className="text-gray-400 mb-6">Your $50,000 USDT interest-free loan has been disbursed to your wallet.</p>
          <div className="bg-ex-green/10 border border-ex-green/30 rounded-xl p-5 mb-6">
            <div className="text-4xl font-black text-ex-green font-num">+50,000 USDT</div>
            <div className="text-sm text-gray-400 mt-1">New Year Loan — Disbursed (0% Interest, 1 Year)</div>
          </div>
          <Link href="/wallet" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
            <Wallet className="w-4 h-4" /> View Wallet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs bg-ex-yellow/10 text-ex-yellow border border-ex-yellow/30 px-2 py-0.5 rounded-full font-semibold">
            🎊 New Year Campaign 2026
          </span>
        </div>
        <h1 className="text-3xl font-black mb-1">Get $50,000 USDT Interest-Free Loan</h1>
        <p className="text-gray-400">Stake 500 USDT and receive a $50,000 USDT interest-free loan — trade freely or withdraw anytime</p>
      </div>

      {/* Countdown */}
      <div className="bg-gradient-to-r from-ex-card2 to-ex-card border border-ex-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-ex-yellow" />
          <span className="text-sm font-semibold text-gray-300">Campaign ends December 31, 2026</span>
        </div>
        <div className="flex items-center gap-3">
          <CountdownBlock value={timeLeft.days}    label="Days" />
          <div className="text-2xl font-black text-gray-500">:</div>
          <CountdownBlock value={timeLeft.hours}   label="Hours" />
          <div className="text-2xl font-black text-gray-500">:</div>
          <CountdownBlock value={timeLeft.minutes} label="Min" />
          <div className="text-2xl font-black text-gray-500">:</div>
          <CountdownBlock value={timeLeft.seconds} label="Sec" />
        </div>
      </div>

      {/* How it works */}
      <div className="bg-ex-card border border-ex-border rounded-2xl p-5 mb-6">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-ex-yellow" /> How It Works
        </h2>
        <div className="space-y-3">
          {[
            { n: 1, done: kycApproved,                    label: "Complete KYC verification",     sub: "Identity verified — full access unlocked" },
            { n: 2, done: usdtAvailable + usdtLocked >= 500, label: "Deposit 500+ USDT to your wallet", sub: `Your USDT TRC20 address is on the Wallet page` },
            { n: 3, done: isStaked || isRewarded,         label: "Stake 500 USDT in campaign",   sub: "Locked until Dec 31, 2026 for maximum reward" },
            { n: 4, done: isRewarded,                     label: "Loan Disbursed to Your Wallet", sub: "Interest-free — trade freely or withdraw anytime" },
          ].map(s => (
            <div key={s.n} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
              s.done ? "bg-ex-green/5 border-ex-green/20" : "bg-ex-card2 border-ex-border"
            }`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                s.done ? "bg-ex-green text-black" : "bg-ex-card border border-ex-border text-gray-500"
              }`}>
                {s.done ? <CheckCircle className="w-5 h-5" /> : s.n}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-semibold ${s.done ? "text-ex-green" : "text-white"}`}>{s.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current status + action */}
      <div className="bg-ex-card border border-ex-border rounded-2xl p-5 mb-6">
        <h2 className="font-bold mb-4">Your Campaign Status</h2>

        {!kycApproved && (
          <div className="bg-ex-yellow/10 border border-ex-yellow/30 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-ex-yellow shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-ex-yellow text-sm">KYC Required</div>
              <div className="text-xs text-gray-400 mt-0.5">Complete identity verification to participate in the campaign.</div>
              <Link href="/kyc" className="text-xs text-ex-yellow underline mt-1 inline-block">Complete KYC →</Link>
            </div>
          </div>
        )}

        {isStaked ? (
          <div className="space-y-4">
            <div className="bg-ex-green/10 border border-ex-green/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-ex-green" />
                <span className="font-semibold text-ex-green">Active Stake — Loan Eligible</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                <div><span className="text-gray-500">Staked</span><div className="font-bold font-num">{stakeAmount} USDT</div></div>
                <div><span className="text-gray-500">Loan Amount</span><div className="font-bold font-num text-ex-yellow">50,000 USDT</div></div>
                <div><span className="text-gray-500">Status</span><div className="font-bold text-ex-green">Staking Active ✓</div></div>
                <div><span className="text-gray-500">Interest Rate</span><div className="font-bold">0% (1 Year)</div></div>
              </div>
            </div>

            <button onClick={handleUnstake} disabled={loading}
              className="w-full py-3 bg-ex-card2 border border-ex-border rounded-xl text-sm font-semibold text-gray-300 hover:text-ex-red hover:border-ex-red/30 transition-colors flex items-center justify-center gap-2">
              <Unlock className="w-4 h-4" />
              {loading ? "Processing..." : "Unstake & Withdraw (Forfeit Loan)"}
            </button>
            <p className="text-xs text-gray-500 text-center">
              ⚠️ Unstaking returns your 500 USDT but permanently forfeits the $50,000 loan eligibility
            </p>
          </div>
        ) : isUnstaked ? (
          <div className="bg-ex-card2 border border-ex-border rounded-xl p-5 text-center">
            <div className="text-gray-400 text-sm mb-1">You unstaked from this campaign.</div>
            <div className="text-xs text-gray-500">Your 500 USDT has been returned to your wallet balance.</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm mb-2">
              <div className="bg-ex-card2 border border-ex-border rounded-xl p-3">
                <div className="text-gray-500 text-xs">Your USDT Available</div>
                <div className="font-bold font-num mt-1">{usdtAvailable.toFixed(2)} USDT</div>
              </div>
              <div className="bg-ex-card2 border border-ex-border rounded-xl p-3">
                <div className="text-gray-500 text-xs">Required to Stake</div>
                <div className="font-bold font-num mt-1 text-ex-yellow">500 USDT</div>
              </div>
            </div>

            {!hasEnough && kycApproved && (
              <div className="bg-ex-card2 border border-ex-border rounded-xl p-3 text-xs text-gray-400 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span>Deposit at least 500 USDT to your wallet first. </span>
                <Link href="/wallet" className="text-ex-yellow underline">Go to Wallet →</Link>
              </div>
            )}

            <button onClick={handleStake}
              disabled={loading || !kycApproved || !hasEnough}
              className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              <Lock className="w-5 h-5" />
              {loading ? "Staking..." : "Stake 500 USDT → Get $50,000 Loan"}
            </button>
            <p className="text-xs text-gray-500 text-center">
              500 USDT locked until Dec 31, 2026. Loan disbursed after stake activation.
            </p>
          </div>
        )}
      </div>

      {/* Campaign details */}
      <div className="bg-ex-card border border-ex-border rounded-2xl p-5">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Gift className="w-4 h-4 text-ex-yellow" /> Loan Details
        </h2>
        <div className="space-y-3 text-sm text-gray-300">
          {[
            ["Stake Required", "500 USDT (locked for campaign duration)"],
            ["Loan Amount", "$50,000 USDT (interest-free)"],
            ["Interest Rate", "0% — no interest, no fees"],
            ["Loan Term", "1 Year (from disbursement)"],
            ["Campaign Deadline", "December 31, 2026 — 23:59 UTC"],
            ["Network", "USDT TRC20 (TRON)"],
            ["Eligibility", "KYC approved + 500 USDT staked"],
            ["Loan Disbursement", "Within 24h of staking approval"],
            ["Early Exit", "Allowed anytime (forfeits loan)"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-ex-border/50 last:border-0">
              <span className="text-gray-500">{k}</span>
              <span className="font-semibold text-right max-w-[55%]">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
