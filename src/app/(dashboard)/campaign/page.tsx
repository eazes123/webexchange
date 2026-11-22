"use client";
import { useState, useEffect, useRef } from "react";
import {
  Trophy, Clock, CheckCircle, Shield, Wallet,
  Gift, AlertTriangle, Lock, Unlock, Star,
  Calendar, Users, Zap, TrendingUp, ChevronDown,
  ChevronUp, Info, ArrowRight, Sparkles, BadgeCheck,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import Link from "next/link";

// -- Animated countdown block ---------------------------------------------------
function CountdownBlock({ value, label, prev }: { value: number; label: string; prev: number }) {
  const [flip, setFlip] = useState(false);
  useEffect(() => {
    if (value !== prev) { setFlip(true); setTimeout(() => setFlip(false), 300); }
  }, [value, prev]);
  return (
    <div className="flex flex-col items-center">
      <div className={`relative w-16 sm:w-20 h-16 sm:h-20 bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl flex items-center justify-center overflow-hidden transition-transform ${flip ? "scale-95" : "scale-100"}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#f0b90b]/5 to-transparent pointer-events-none" />
        <span className="text-2xl sm:text-3xl font-black font-mono text-[#f0b90b] tabular-nums select-none">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[10px] text-gray-500 mt-1.5 uppercase tracking-widest font-semibold">{label}</span>
    </div>
  );
}

// -- Campaign stat tile ---------------------------------------------------------
function StatTile({ icon: Icon, label, value, sub, color = "text-white" }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wide">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className={`text-xl sm:text-2xl font-black font-mono ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-gray-500">{sub}</div>}
    </div>
  );
}

// -- Step row ------------------------------------------------------------------
function StepRow({ n, done, active, label, sub, action }: {
  n: number; done: boolean; active: boolean; label: string; sub: string; action?: React.ReactNode;
}) {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
      done    ? "bg-[#0ecb81]/5 border-[#0ecb81]/20"
      : active ? "bg-[#f0b90b]/5 border-[#f0b90b]/30 ring-1 ring-[#f0b90b]/20"
      : "bg-[#0d0d0d] border-[#1e1e1e] opacity-60"
    }`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition-all ${
        done    ? "bg-[#0ecb81] text-black"
        : active ? "bg-[#f0b90b] text-black"
        : "bg-[#111] border border-[#1e1e1e] text-gray-500"
      }`}>
        {done ? <CheckCircle className="w-5 h-5" /> : active ? <Zap className="w-4 h-4" /> : n}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${done ? "text-[#0ecb81]" : active ? "text-[#f0b90b]" : "text-white"}`}>
          {label}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{sub}</div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

// -- FAQ item ------------------------------------------------------------------
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#1e1e1e] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[#0d0d0d]/60 transition-colors">
        <span className="text-sm font-semibold text-white pr-4">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-400 leading-relaxed border-t border-[#1e1e1e]/50">
          <div className="pt-3">{a}</div>
        </div>
      )}
    </div>
  );
}

// -- Main page -----------------------------------------------------------------
export default function CampaignPage() {
  const { demoUser, walletBalances, hydrate } = useStore();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const prevTime = useRef({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading]   = useState(false);
  const [unstakeConfirm, setUnstakeConfirm] = useState(false);
  const [campaignData, setCampaignData] = useState<any>(null);

  useEffect(() => {
    const deadline = new Date("2026-12-31T23:59:59");
    const tick = () => {
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) return;
      prevTime.current = { ...timeLeft };
      setTimeLeft({
        days:    Math.floor(diff / 86_400_000),
        hours:   Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000)  / 60_000),
        seconds: Math.floor((diff % 60_000)      / 1_000),
      });
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch("/api/campaign")
      .then(r => r.json())
      .then(d => setCampaignData(d))
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

  const totalParticipants = campaignData?.totalParticipants ?? 0;
  const displayFilled     = campaignData?.displayFilled ?? totalParticipants;
  const maxSpots          = campaignData?.maxSpots ?? 1000;
  const spotsLeft         = campaignData?.spotsLeft ?? maxSpots;
  const queuePosition     = campaignData?.queuePosition ?? demoUser.queuePosition ?? 0;
  const baseFilled        = displayFilled - totalParticipants;
  const displayedQueue    = queuePosition > 0 ? baseFilled + queuePosition : 0;
  const fillPct           = Math.min(100, (displayFilled / maxSpots) * 100);

  const handleStake = async () => {
    if (!kycApproved) { toast.error("Complete KYC first"); return; }
    if (!hasEnough)   { toast.error("Deposit at least 500 USDT to stake"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/campaign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stake" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Staking failed"); return; }
      toast.success("🎉 500 USDT staked! You're now eligible for the $50,000 loan.");
      await hydrate();
      fetch("/api/campaign").then(r => r.json()).then(d => setCampaignData(d)).catch(() => {});
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  };

  const handleUnstake = async () => {
    setUnstakeConfirm(false);
    setLoading(true);
    try {
      const res  = await fetch("/api/campaign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unstake" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Unstake failed"); return; }
      toast.success("Unstaked. 500 USDT returned to your wallet.");
      await hydrate();
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  };

  // -- Rewarded state --------------------------------------------------------
  if (isRewarded) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0ecb81]/10 via-[#0d0d0d] to-[#f0b90b]/5 border border-[#0ecb81]/30 rounded-3xl p-8 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0ecb81_0%,_transparent_60%)] opacity-5 pointer-events-none" />
          <div className="text-5xl mb-4">🎉</div>
          <div className="inline-flex items-center gap-2 bg-[#0ecb81]/10 border border-[#0ecb81]/30 rounded-full px-3 py-1 text-xs font-bold text-[#0ecb81] mb-4">
            <BadgeCheck className="w-3.5 h-3.5" /> Loan Disbursed
          </div>
          <h2 className="text-3xl font-black mb-2">Congratulations!</h2>
          <p className="text-gray-400 mb-6 text-sm">Your interest-free loan has been credited to your wallet.</p>
          <div className="bg-[#0ecb81]/10 border border-[#0ecb81]/30 rounded-2xl p-6 mb-6">
            <div className="text-4xl font-black text-[#0ecb81] font-mono">+50,000 USDT</div>
            <div className="text-sm text-gray-400 mt-1">Interest-free · 10 Years · Monthly installments apply</div>
          </div>
          <Link href="/wallet"
            className="inline-flex items-center gap-2 bg-[#f0b90b] hover:bg-[#f0b90b]/90 text-black font-bold px-6 py-3 rounded-xl transition-colors">
            <Wallet className="w-4 h-4" /> View Wallet
          </Link>
        </div>
      </div>
    );
  }

  // -- Main view -------------------------------------------------------------
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-6">

      {/* -- Hero -- */}
      <div className="relative overflow-hidden rounded-3xl border border-[#1e1e1e] bg-gradient-to-br from-[#080808] via-[#0d0d0d] to-[#080808]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,_#f0b90b22_0%,_transparent_60%)] pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f0b90b]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#f0b90b]/10 border border-[#f0b90b]/30 rounded-full px-3 py-1 text-xs font-bold text-[#f0b90b] mb-3">
                <Sparkles className="w-3 h-3" /> New Year 2026 Campaign · Limited Spots
              </div>
              <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-2">
                Get <span className="text-[#f0b90b]">$50,000</span> USDT<br />Interest-Free Loan
              </h1>
              <p className="text-gray-400 text-sm max-w-sm">
                Stake just 500 USDT, complete KYC, and receive a $50,000 USDT loan on December 31, 2026.
                Trade freely or withdraw. Zero interest.
              </p>
            </div>

            {/* Queue badge */}
            {displayedQueue > 0 && (
              <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl px-4 py-3 text-center min-w-[100px]">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Queue #</div>
                <div className="text-2xl font-black text-[#f0b90b] font-mono">{displayedQueue.toLocaleString()}</div>
                <div className="text-[10px] text-gray-500">of {maxSpots.toLocaleString()}</div>
              </div>
            )}
          </div>

          {/* Countdown */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              Campaign ends December 31, 2026
            </div>
            <div className="flex items-end gap-2 sm:gap-3">
              <CountdownBlock value={timeLeft.days}    label="Days"    prev={prevTime.current.days}    />
              <span className="text-2xl font-black text-gray-600 pb-6">:</span>
              <CountdownBlock value={timeLeft.hours}   label="Hours"   prev={prevTime.current.hours}   />
              <span className="text-2xl font-black text-gray-600 pb-6">:</span>
              <CountdownBlock value={timeLeft.minutes} label="Min"     prev={prevTime.current.minutes} />
              <span className="text-2xl font-black text-gray-600 pb-6">:</span>
              <CountdownBlock value={timeLeft.seconds} label="Sec"     prev={prevTime.current.seconds} />
            </div>
          </div>

          {/* Spots progress */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500 font-semibold">Campaign Spots Filled</span>
              <span className="text-[#f0b90b] font-bold">{displayFilled} / {maxSpots.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-[#111] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#f0b90b] to-[#f0b90b]/70 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(2, fillPct)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[11px] text-gray-600">
              <span>{spotsLeft} spots remaining</span>
              <span>First come, first served</span>
            </div>
          </div>
        </div>
      </div>

      {/* -- Stats row -- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile icon={Users}     label="Participants"    value={displayFilled.toLocaleString()}      sub="Staked & active"          color="text-white" />
        <StatTile icon={Trophy}    label="Loan Reward"     value="$50,000"      sub="Per eligible user"        color="text-[#f0b90b]" />
        <StatTile icon={Shield}    label="Interest Rate"   value="0%"           sub="Zero interest, 10 years"  color="text-[#0ecb81]" />
        <StatTile icon={Calendar}  label="Disbursement"    value="Dec 31"       sub="2026, 23:59 UTC"          color="text-white" />
      </div>

      {/* -- Status alert -- */}
      {!kycApproved && (
        <div className="flex items-start gap-3 bg-[#f0b90b]/8 border border-[#f0b90b]/25 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-[#f0b90b] shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-[#f0b90b] text-sm">KYC Verification Required</div>
            <div className="text-xs text-gray-400 mt-0.5 mb-2">Complete identity verification before you can stake in this campaign.</div>
            <Link href="/kyc" className="inline-flex items-center gap-1 text-xs font-bold text-[#f0b90b] hover:underline">
              Complete KYC <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {isStaked && (
        <div className="flex items-start gap-3 bg-[#0ecb81]/8 border border-[#0ecb81]/25 rounded-2xl p-4">
          <BadgeCheck className="w-5 h-5 text-[#0ecb81] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-[#0ecb81] text-sm">You Are Eligible for the $50,000 Loan</div>
            <div className="text-xs text-gray-400 mt-0.5">Your stake is active. Loan will be disbursed to your wallet on December 31, 2026.</div>
          </div>
        </div>
      )}

      {isUnstaked && (
        <div className="flex items-start gap-3 bg-[#f6465d]/8 border border-[#f6465d]/25 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-[#f6465d] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-[#f6465d] text-sm">You Left the Campaign</div>
            <div className="text-xs text-gray-400 mt-0.5">Your 500 USDT was returned to your wallet. Loan eligibility was forfeited.</div>
          </div>
        </div>
      )}

      {/* -- Main action card -- */}
      <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-3xl p-5 sm:p-6">
        <h2 className="font-black text-lg mb-5 flex items-center gap-2">
          <Star className="w-5 h-5 text-[#f0b90b]" />
          {isStaked ? "Your Campaign Status" : "Stake & Join Campaign"}
        </h2>

        {isStaked ? (
          <div className="space-y-5">
            {/* Active stake info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Staked",        val: `${stakeAmount} USDT`,    color: "text-white" },
                { label: "Loan Amount",   val: "50,000 USDT",             color: "text-[#f0b90b]" },
                { label: "Status",        val: "Active ✓",                color: "text-[#0ecb81]" },
                { label: "Interest",      val: "0% (10 Years)",           color: "text-white" },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-[#080808] border border-[#1e1e1e] rounded-xl p-3">
                  <div className="text-[11px] text-gray-500 font-semibold mb-1">{label}</div>
                  <div className={`text-sm font-bold font-mono ${color}`}>{val}</div>
                </div>
              ))}
            </div>

            {/* Progress to loan */}
            <div className="bg-[#080808] border border-[#0ecb81]/20 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[#0ecb81]">Loan Disbursement Progress</span>
                <span className="text-xs text-gray-500">Dec 31, 2026</span>
              </div>
              <div className="h-1.5 bg-[#111] rounded-full overflow-hidden mb-2">
                <div className="h-full bg-[#0ecb81] rounded-full" style={{ width: "100%" }} />
              </div>
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>✓ KYC Approved</span>
                <span>✓ 500 USDT Staked</span>
                <span className="text-[#f0b90b]">⏳ Awaiting Dec 31</span>
              </div>
            </div>

            {unstakeConfirm ? (
              <div className="space-y-3 p-4 bg-[#f6465d]/5 border border-[#f6465d]/20 rounded-xl">
                <p className="text-xs text-[#f6465d] font-semibold text-center">
                  Exiting permanently forfeits your $50,000 loan. Your 500 USDT will be returned. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setUnstakeConfirm(false)}
                    className="flex-1 py-2.5 bg-[#111] border border-[#1e1e1e] rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors">
                    Keep Stake
                  </button>
                  <button onClick={handleUnstake} disabled={loading}
                    className="flex-1 py-2.5 bg-[#f6465d]/10 border border-[#f6465d]/30 rounded-xl text-xs font-semibold text-[#f6465d] hover:bg-[#f6465d]/20 transition-colors disabled:opacity-40">
                    {loading ? "Processing..." : "Exit Campaign"}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setUnstakeConfirm(true)} disabled={loading}
                className="w-full py-3 bg-[#111] border border-[#1e1e1e] rounded-xl text-sm font-semibold text-gray-400 hover:text-[#f6465d] hover:border-[#f6465d]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40">
                <Unlock className="w-4 h-4" />
                {loading ? "Processing..." : "Exit Campaign (Returns 500 USDT, Forfeits Loan)"}
              </button>
            )}
            <p className="text-[11px] text-gray-600 text-center leading-relaxed">
              Exiting the campaign permanently forfeits your $50,000 loan eligibility. Your staked 500 USDT will be returned immediately.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Eligibility checklist */}
            <div className="space-y-2">
              {[
                {
                  done: kycApproved,
                  label: "KYC Verification",
                  sub: kycApproved ? "Identity verified, full access unlocked" : "Complete identity verification",
                  link: !kycApproved ? "/kyc" : undefined,
                  linkLabel: "Verify Now",
                },
                {
                  done: usdtAvailable + usdtLocked >= 500,
                  label: "500+ USDT Balance",
                  sub: `Available: ${usdtAvailable.toFixed(2)} USDT`,
                  link: (usdtAvailable + usdtLocked) < 500 ? "/wallet" : undefined,
                  linkLabel: "Deposit Now",
                },
              ].map(({ done, label, sub, link, linkLabel }) => (
                <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border ${
                  done ? "bg-[#0ecb81]/5 border-[#0ecb81]/20" : "bg-[#111] border-[#1e1e1e]"
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    done ? "bg-[#0ecb81] text-black" : "bg-[#1e1e1e] text-gray-500"
                  }`}>
                    {done ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="text-xs font-bold">!</span>}
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm font-semibold ${done ? "text-[#0ecb81]" : "text-white"}`}>{label}</span>
                    <span className="text-xs text-gray-500 ml-2">{sub}</span>
                  </div>
                  {link && (
                    <Link href={link} className="text-xs text-[#f0b90b] font-bold hover:underline flex items-center gap-1 shrink-0">
                      {linkLabel} <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Stake summary */}
            <div className="bg-[#080808] border border-[#1e1e1e] rounded-2xl p-4">
              <div className="flex items-center justify-between text-sm mb-3 pb-3 border-b border-[#1e1e1e]">
                <span className="text-gray-500">You stake</span>
                <span className="font-bold font-mono">500 USDT</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">You receive on Dec 31</span>
                <span className="font-black font-mono text-[#f0b90b] text-lg">50,000 USDT</span>
              </div>
              <div className="text-[11px] text-gray-600 text-right mt-0.5">Interest-free · 10 Years · Monthly installments apply</div>
            </div>

            <button onClick={handleStake}
              disabled={loading || !kycApproved || !hasEnough}
              className="relative w-full py-4 rounded-2xl text-base font-black flex items-center justify-center gap-2 overflow-hidden transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: (!kycApproved || !hasEnough) ? "#111" : "linear-gradient(135deg, #f0b90b 0%, #d4a017 100%)", color: (!kycApproved || !hasEnough) ? "#6b7280" : "#000" }}
            >
              {(!kycApproved || !hasEnough) ? null : (
                <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
              )}
              <Lock className="w-5 h-5 relative z-10" />
              <span className="relative z-10">
                {loading ? "Staking..." : "Stake 500 USDT & Claim $50,000 Loan"}
              </span>
            </button>
            <p className="text-[11px] text-gray-500 text-center">
              500 USDT locked until Dec 31, 2026 · Loan disbursed automatically
            </p>
          </div>
        )}
      </div>

      {/* -- Steps -- */}
      <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-3xl p-5 sm:p-6">
        <h2 className="font-black text-lg mb-5 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#f0b90b]" /> How It Works
        </h2>
        <div className="space-y-3">
          <StepRow n={1} done={kycApproved}
            active={!kycApproved}
            label="Complete KYC Verification"
            sub="Upload government-issued ID + selfie. Reviewed within 24–48 hours."
            action={!kycApproved ? (
              <Link href="/kyc" className="inline-flex items-center gap-1 text-xs font-bold bg-[#f0b90b] text-black px-3 py-1.5 rounded-lg hover:bg-[#f0b90b]/90 transition-colors">
                Go to KYC <ArrowRight className="w-3 h-3" />
              </Link>
            ) : undefined}
          />
          <StepRow n={2} done={usdtAvailable + usdtLocked >= 500}
            active={kycApproved && (usdtAvailable + usdtLocked) < 500}
            label="Deposit 500+ USDT (TRC20)"
            sub={`Send USDT TRC20 to your personal deposit address on the Wallet page. Current: ${(usdtAvailable + usdtLocked).toFixed(2)} USDT`}
            action={kycApproved && (usdtAvailable + usdtLocked) < 500 ? (
              <Link href="/wallet" className="inline-flex items-center gap-1 text-xs font-bold bg-[#f0b90b] text-black px-3 py-1.5 rounded-lg hover:bg-[#f0b90b]/90 transition-colors">
                Deposit Now <ArrowRight className="w-3 h-3" />
              </Link>
            ) : undefined}
          />
          <StepRow n={3} done={isStaked || isRewarded}
            active={kycApproved && hasEnough && !isStaked && !isRewarded}
            label="Stake 500 USDT in Campaign"
            sub="One click to lock your stake and secure your spot. Keep staked until Dec 31 to receive the loan."
          />
          <StepRow n={4} done={isRewarded}
            active={false}
            label="Receive $50,000 USDT Loan"
            sub="Automatically credited to your wallet on December 31, 2026. Trade freely or withdraw anytime."
          />
        </div>
      </div>

      {/* -- Benefit cards -- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: TrendingUp,
            title: "Trade with $50K",
            desc: "Use the full loan balance to trade on NovaBit Exchange when live trading launches.",
            color: "#f0b90b",
            bg: "bg-[#f0b90b]/5 border-[#f0b90b]/15",
          },
          {
            icon: Wallet,
            title: "Withdraw Anytime",
            desc: "After disbursement on Dec 31, withdraw the loan to any TRON wallet. No lock-up.",
            color: "#0ecb81",
            bg: "bg-[#0ecb81]/5 border-[#0ecb81]/15",
          },
          {
            icon: Shield,
            title: "Zero Interest",
            desc: "No interest, no hidden fees. The $50,000 loan is completely free for 10 years.",
            color: "#2196f3",
            bg: "bg-[#2196f3]/5 border-[#2196f3]/15",
          },
        ].map(({ icon: Icon, title, desc, color, bg }) => (
          <div key={title} className={`border rounded-2xl p-5 ${bg}`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${color}1a`, color }}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-white mb-1">{title}</div>
            <div className="text-xs text-gray-400 leading-relaxed">{desc}</div>
          </div>
        ))}
      </div>

      {/* -- Loan terms table -- */}
      <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-3xl p-5 sm:p-6">
        <h2 className="font-black text-lg mb-5 flex items-center gap-2">
          <Gift className="w-5 h-5 text-[#f0b90b]" /> Loan Terms & Details
        </h2>
        <div className="divide-y divide-[#1e1e1e]/60 text-sm">
          {[
            ["Minimum Stake",        "500 USDT"],
            ["Maximum Stake",        "50,000 USDT"],
            ["Loan Amount",          "$50,000 USDT (fixed for all users)"],
            ["Interest Rate",        "0%, no interest, no hidden fees"],
            ["Loan Term",            "10 Years from disbursement"],
            ["Disbursement Date",    "December 31, 2026 at 23:59 UTC"],
            ["Network",              "USDT TRC20 (TRON only)"],
            ["KYC Required",         "Yes, approved before Dec 31"],
            ["Early Exit Allowed",   "Yes, but forfeits loan permanently"],
            ["Campaign Spots",       "1,000 total (first come, first served)"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-3 gap-4">
              <span className="text-gray-500 shrink-0">{k}</span>
              <span className="font-semibold text-right">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* -- FAQ -- */}
      <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-3xl p-5 sm:p-6">
        <h2 className="font-black text-lg mb-5 flex items-center gap-2">
          <Info className="w-5 h-5 text-[#f0b90b]" /> Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {[
            {
              q: "Is the $50,000 loan real?",
              a: "Yes. Every eligible user who maintains an active stake and passes KYC receives exactly $50,000 USDT credited to their NovaBit wallet on December 31, 2026.",
            },
            {
              q: "Can I withdraw my staked 500 USDT before Dec 31?",
              a: "Yes, you can exit the campaign at any time. Your 500 USDT is immediately returned to your wallet. However, unstaking permanently forfeits your $50,000 loan eligibility. You will not receive the loan.",
            },
            {
              q: "Can I stake more than 500 USDT?",
              a: "Yes, the maximum stake is 50,000 USDT. However, the loan amount is fixed at $50,000 USDT regardless of how much you stake. All eligible participants receive the same loan.",
            },
            {
              q: "What if I don't complete KYC before Dec 31?",
              a: "KYC must be approved before December 31, 2026 to receive the loan. Even if you've staked, the loan will not be disbursed without an approved KYC.",
            },
            {
              q: "How do I withdraw the loan after disbursement?",
              a: "After December 31, the $50,000 appears in your available balance. Go to Wallet → Withdraw, enter your TRON wallet address, and submit a withdrawal request. Standard 1 USDT network fee applies.",
            },
            {
              q: "What is USDT TRC20? Can I send ERC20?",
              a: "USDT TRC20 is Tether on the TRON blockchain. You MUST use TRC20. Sending ERC20 or BEP20 will result in permanent loss of funds. Always double-check the network before sending.",
            },
          ].map(({ q, a }) => (
            <FaqItem key={q} q={q} a={a} />
          ))}
        </div>
      </div>

    </div>
  );
}

