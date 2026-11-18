"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Shield, Zap, Globe, Users,
  CheckCircle, ChevronDown, ChevronUp, TrendingUp,
  Lock, Award, Clock, Star
} from "lucide-react";
import { COINS, CAMPAIGN_STATS } from "@/lib/mock-data";
import { formatPrice, formatChange, getChangeColor } from "@/lib/utils";
import { useStore } from "@/lib/store";

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number; }

const STEPS = [
  { icon: Users,      title: "Create Account",   desc: "Register with your email and basic details to get your unique deposit address." },
  { icon: Shield,     title: "Complete KYC",     desc: "Submit your ID, selfie, and proof of address for full identity verification." },
  { icon: Lock,       title: "Stake 500 USDT",   desc: "Deposit and stake 500 USDT to activate your loan slot in the New Year Campaign." },
  { icon: Award,      title: "Loan Disbursed",   desc: "Receive $50,000 USDT as a 10-year interest-free loan. Withdraw or trade freely." },
];

const FEATURES = [
  { icon: Shield,  title: "Bank-Level Security",  desc: "256-bit SSL encryption, 2FA, and cold storage for all assets." },
  { icon: Zap,     title: "Lightning Fast",        desc: "Up to 1.4M transactions per second on our matching engine." },
  { icon: Globe,   title: "100+ Countries",        desc: "Available in over 100 countries with multi-language support." },
  { icon: Lock,    title: "KYC Protected",         desc: "Full identity verification ensures a safe trading environment." },
  { icon: Award,   title: "0% Interest Loan",       desc: "Stake 500 USDT and receive $50,000 USDT as a 10-year interest-free loan." },
  { icon: Users,   title: "1M+ Users",             desc: "Join our growing community of traders worldwide." },
];

const FAQS = [
  {
    q: "How do I qualify for the $50,000 USDT loan?",
    a: "Register an account, complete full KYC verification, and stake 500 USDT before December 31st, 2026. The first 1,000 users who complete all three steps receive the $50,000 USDT interest-free loan disbursed directly to their account."
  },
  {
    q: "Is the loan really interest-free?",
    a: "Yes, 0% interest for the full 10-year term. The 500 USDT stake acts as a collateral deposit and is returned to you at the end of the loan period along with any profits you made trading."
  },
  {
    q: "Can I withdraw or trade with the loan funds?",
    a: "Yes, once the $50,000 USDT loan is credited you can trade any spot pairs on the platform or withdraw the funds to your external TRC20 wallet at any time during the 10-year period."
  },
  {
    q: "What documents are required for KYC?",
    a: "You need: (1) Valid government ID: passport, national ID, or driver's license, (2) A selfie/liveness check for face matching, and (3) Proof of address: utility bill or bank statement dated within 3 months."
  },
  {
    q: "How long does KYC verification take?",
    a: "KYC verification typically takes 24-48 hours. You'll receive an email notification when your status is updated."
  },
  {
    q: "When does the New Year Campaign end?",
    a: "The campaign runs until December 31st, 2026. Spots are limited to 1,000 users on a first-come-first-served basis. After staking, the loan is disbursed to your account within 24 hours."
  },
];

export default function LandingPage() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [spotsLeft, setSpotsLeft] = useState(CAMPAIGN_STATS.spotsRemaining);
  const [spotsUsed, setSpotsUsed] = useState(CAMPAIGN_STATS.spotsUsed);
  const { coins, updatePrices } = useStore();

  const BASE_OFFSET = 15;

  useEffect(() => {
    const deadline = new Date("2026-12-31T23:59:59");
    const timer = setInterval(() => {
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) { clearInterval(timer); return; }
      setTimeLeft({
        days:    Math.floor(diff / 86_400_000),
        hours:   Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      updatePrices();
    }, 3000);
    return () => clearInterval(interval);
  }, [updatePrices]);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(d => {
        const taken = (d.stakedCount ?? 0) + BASE_OFFSET;
        setSpotsUsed(taken);
        setSpotsLeft(Math.max(10, CAMPAIGN_STATS.totalSpots - taken));
      })
      .catch(() => {});
  }, [BASE_OFFSET]);

  // Simulate spot count slowly decreasing
  useEffect(() => {
    const t = setInterval(() => {
      setSpotsLeft((s) => s > 0 ? s - 1 : 0);
    }, 45_000);
    return () => clearInterval(t);
  }, []);

  const topCoins = coins.slice(0, 5);

  return (
    <div className="bg-ex-bg">
      {/* ─── TICKER ─── */}
      <div className="bg-ex-card border-b border-ex-border overflow-hidden">
        <div className="ticker-wrap py-2">
          <div className="ticker-inner animate-ticker-scroll">
            {[...topCoins, ...topCoins].map((c, i) => (
              <span key={i} className="inline-flex items-center gap-2 mr-10 text-sm">
                <span className="font-semibold">{c.symbol}/USDT</span>
                <span className="font-num">{formatPrice(c.price)}</span>
                <span className={getChangeColor(c.change24h)}>
                  {formatChange(c.change24h)}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden py-20 px-4" id="hero">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-ex-yellow/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-ex-blue/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-ex-yellow/10 border border-ex-yellow/30 rounded-full px-4 py-1.5 text-ex-yellow text-sm font-semibold mb-6">
              <span className="w-2 h-2 bg-ex-yellow rounded-full animate-pulse" />
              Limited Time Campaign: {spotsLeft} spots remaining
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight">
              Get{" "}
              <span className="gradient-text">$50,000 USDT</span>
              <br />
              Interest-Free Loan
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              First <strong className="text-white">1,000 users</strong> who stake 500 USDT after KYC receive a{" "}
              <strong className="text-ex-green">$50,000 USDT interest-free loan</strong> for 10 years.
              Trade freely or withdraw anytime.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
              <Link href="/register"
                className="inline-flex items-center gap-2 bg-ex-yellow text-black font-bold px-8 py-4 rounded-xl text-lg hover:bg-yellow-400 transition-all glow-yellow">
                Sign Up Now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/#how-it-works"
                className="inline-flex items-center gap-2 border border-ex-border text-gray-300 px-8 py-4 rounded-xl text-lg hover:border-gray-500 hover:text-white transition-all">
                How It Works
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              {[
                { label: "Loan Amount",   value: "$50,000 USDT", color: "text-ex-green" },
                { label: "Interest Rate", value: "0%",           color: "text-ex-yellow" },
                { label: "Loan Term",     value: "10 Years",     color: "text-white" },
                { label: "Stake Required",value: "500 USDT",     color: "text-ex-red" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className={`text-2xl font-black font-num ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ─── COUNTDOWN ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-ex-card border border-ex-border rounded-2xl p-6 max-w-lg mx-auto"
          >
            <p className="text-sm text-gray-400 mb-4 font-semibold tracking-widest uppercase">Campaign Ends In</p>
            <div className="flex justify-center gap-4">
              {[
                { label: "Days",    value: timeLeft.days },
                { label: "Hours",   value: timeLeft.hours },
                { label: "Minutes", value: timeLeft.minutes },
                { label: "Seconds", value: timeLeft.seconds },
              ].map((t, i) => (
                <div key={i} className="text-center">
                  <div className="bg-ex-card2 border border-ex-border rounded-xl px-4 py-3 min-w-[64px]">
                    <span className="text-3xl font-black font-num text-ex-yellow">
                      {String(t.value).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{t.label}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{spotsUsed} registered</span>
                <span>{spotsLeft} spots left</span>
              </div>
              <div className="h-2.5 bg-ex-card2 rounded-full overflow-hidden border border-ex-border">
                <div
                  className="h-full bg-gradient-to-r from-ex-yellow to-orange-400 rounded-full transition-all duration-1000"
                  style={{ width: `${(spotsUsed / CAMPAIGN_STATS.totalSpots) * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── LIVE MARKET PREVIEW ─── */}
      <section className="py-16 px-4 max-w-7xl mx-auto" id="markets">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Live Markets</h2>
          <Link href="/markets" className="text-ex-yellow text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {topCoins.map((coin) => (
            <Link href={`/trade/${coin.symbol}-USDT`} key={coin.id}
              className="bg-ex-card border border-ex-border rounded-xl p-4 card-hover group">
              <div className="flex items-center gap-2 mb-3">
                <img src={coin.image} alt={coin.symbol} className="w-8 h-8 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div>
                  <div className="font-semibold text-sm">{coin.symbol}</div>
                  <div className="text-xs text-gray-500">{coin.name}</div>
                </div>
              </div>
              <div className="font-bold font-num">{formatPrice(coin.price)}</div>
              <div className={`text-sm font-semibold mt-0.5 ${getChangeColor(coin.change24h)}`}>
                {formatChange(coin.change24h)}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 px-4 bg-ex-card/30" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-3">How It Works</h2>
            <p className="text-gray-400">4 simple steps to get your $50,000 USDT interest-free loan</p>
          </div>
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-ex-border to-transparent" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {STEPS.map((step, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
                  className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-2xl bg-ex-card border border-ex-border flex items-center justify-center">
                      <step.icon className="w-8 h-8 text-ex-yellow" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ex-yellow text-black text-xs font-black flex items-center justify-center">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="text-center mt-12">
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-ex-yellow text-black font-bold px-8 py-4 rounded-xl text-lg hover:bg-yellow-400 transition-all">
              Sign Up Now ({spotsLeft} Spots Left) <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-3">Why NovaBit?</h2>
          <p className="text-gray-400">Built for security, speed, and your financial growth</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }} viewport={{ once: true }}
              className="bg-ex-card border border-ex-border rounded-2xl p-6 card-hover">
              <div className="w-12 h-12 rounded-xl bg-ex-yellow/10 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-ex-yellow" />
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 px-4 bg-ex-card/30" id="faq">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-3">Frequently Asked Questions</h2>
            <p className="text-gray-400">Everything you need to know about the campaign</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-ex-card border border-ex-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold pr-4">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-5 h-5 text-ex-yellow shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed border-t border-ex-border pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-20 px-4" id="campaign">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-ex-card to-ex-card2 border border-ex-border rounded-3xl p-10">
            <div className="w-16 h-16 bg-ex-yellow/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Award className="w-8 h-8 text-ex-yellow" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Claim Your <span className="gradient-text">$50,000 USDT</span>
            </h2>
            <p className="text-gray-400 mb-6 text-lg">
              Only <strong className="text-white">{spotsLeft} spots</strong> remaining.
              Complete KYC + stake 500 USDT before December 31st, 2026 to unlock your 10-year interest-free loan.
            </p>
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-ex-yellow text-black font-bold px-10 py-4 rounded-xl text-xl hover:bg-yellow-400 transition-all glow-yellow">
              Sign Up Now <ArrowRight className="w-6 h-6" />
            </Link>
            <p className="text-xs text-gray-600 mt-4">
              By signing up you agree to our Terms & Conditions and Privacy Policy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
