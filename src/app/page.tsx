"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Shield, Zap, Globe, Users,
  ChevronDown, ChevronUp, TrendingUp,
  Lock, Award, Clock
} from "lucide-react";
import { COINS, CAMPAIGN_STATS } from "@/lib/mock-data";
import { formatPrice, formatChange, getChangeColor } from "@/lib/utils";
import { useStore } from "@/lib/store";

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number; }

const STEPS = [
  { icon: Users,  title: "Create Account", desc: "Register with your email and basic details to get your unique deposit address." },
  { icon: Shield, title: "Complete KYC",   desc: "Submit your ID, selfie, and proof of address for full identity verification." },
  { icon: Lock,   title: "Stake 500 USDT", desc: "Deposit and stake 500 USDT to activate your loan slot in the New Year Campaign." },
  { icon: Award,  title: "Loan Disbursed", desc: "Receive $50,000 USDT as a 10-year interest-free loan. Withdraw or trade freely." },
];

const FEATURES = [
  { icon: Shield, title: "Bank-Level Security",  desc: "256-bit SSL encryption, 2FA, and cold storage for all assets." },
  { icon: Zap,    title: "Lightning Fast",        desc: "Up to 1.4M transactions per second on our matching engine." },
  { icon: Globe,  title: "100+ Countries",        desc: "Available in over 100 countries with multi-language support." },
  { icon: Lock,   title: "KYC Protected",         desc: "Full identity verification ensures a safe trading environment." },
  { icon: Award,  title: "0% Interest Loan",       desc: "Stake 500 USDT and receive $50,000 USDT as a 10-year interest-free loan." },
  { icon: Users,  title: "1M+ Users",             desc: "Join our growing community of traders worldwide." },
];

const FAQS = [
  { q: "How do I qualify for the $50,000 USDT loan?", a: "Register an account, complete full KYC verification, and stake 500 USDT before December 31st, 2026. The first 1,000 users who complete all three steps receive the $50,000 USDT interest-free loan disbursed directly to their account." },
  { q: "Is the loan really interest-free?", a: "Yes, 0% interest for the full 10-year term. The 500 USDT stake acts as a collateral deposit and is returned to you at the end of the loan period along with any profits you made trading." },
  { q: "Can I withdraw or trade with the loan funds?", a: "Yes, once the $50,000 USDT loan is credited you can trade any spot pairs on the platform or withdraw the funds to your external TRC20 wallet at any time during the 10-year period." },
  { q: "What documents are required for KYC?", a: "You need: (1) Valid government ID: passport, national ID, or driver's license, (2) A selfie/liveness check for face matching, and (3) Proof of address: utility bill or bank statement dated within 3 months." },
  { q: "How long does KYC verification take?", a: "KYC verification typically takes 24-48 hours. You'll receive an email notification when your status is updated." },
  { q: "When does the New Year Campaign end?", a: "The campaign runs until December 31st, 2026. Spots are limited to 1,000 users on a first-come-first-served basis. After staking, the loan is disbursed to your account within 24 hours." },
];

function PartnerLogo({ name, src }: { name: string; src: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", cursor: "default", minWidth: "80px" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        width={40}
        height={40}
        style={{
          objectFit: "contain",
          filter: hov ? "none" : "grayscale(1) invert(1) opacity(0.25)",
          transition: "filter 0.3s ease",
        }}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
      <span style={{
        fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: hov ? "#888" : "#2a2a2a",
        transition: "color 0.3s ease",
      }}>
        {name}
      </span>
    </div>
  );
}

const PARTNERS = [
  { name: "Binance",       src: "/partners/binance.svg" },
  { name: "Coinbase",      src: "/partners/coinbase.svg" },
  { name: "TradingView",   src: "/partners/tradingview.svg" },
  { name: "CoinMarketCap", src: "/partners/coinmarketcap.svg" },
  { name: "Tron",          src: "/partners/tron.png" },
  { name: "Grok",          src: "/partners/grok.png" },
];

export default function LandingPage() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [openFaq, setOpenFaq]   = useState<number | null>(null);
  const [spotsLeft, setSpotsLeft] = useState(CAMPAIGN_STATS.spotsRemaining);
  const [spotsUsed, setSpotsUsed] = useState(CAMPAIGN_STATS.spotsUsed);
  const { coins, updatePrices, fetchLivePrices } = useStore();

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
    fetchLivePrices();
    const bigPoll  = setInterval(fetchLivePrices, 30_000);
    const miniTick = setInterval(updatePrices, 3_000);
    return () => { clearInterval(bigPoll); clearInterval(miniTick); };
  }, [fetchLivePrices, updatePrices]);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(d => {
        setSpotsUsed(d.displayFilled ?? d.stakedCount ?? 0);
        setSpotsLeft(d.spotsLeft ?? Math.max(0, CAMPAIGN_STATS.totalSpots - (d.displayFilled ?? d.stakedCount ?? 0)));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => { setSpotsLeft(s => s > 0 ? s - 1 : 0); }, 45_000);
    return () => clearInterval(t);
  }, []);

  const topCoins = coins.slice(0, 5);
  const fillPct  = Math.min(100, (spotsUsed / CAMPAIGN_STATS.totalSpots) * 100);

  return (
    <div style={{ background: "#070707" }}>

      {/* ─── TICKER ─── */}
      <div style={{ background: "#0a0a0a", borderBottom: "1px solid #141414", overflow: "hidden" }}>
        <div className="ticker-wrap py-2">
          <div className="ticker-inner animate-ticker-scroll">
            {[...topCoins, ...topCoins].map((c, i) => (
              <span key={i} className="inline-flex items-center gap-2 mr-10 text-xs" style={{ color: "#555" }}>
                <span className="font-semibold" style={{ color: "#888" }}>{c.symbol}/USDT</span>
                <span className="font-num" style={{ color: "#aaa" }}>{formatPrice(c.price)}</span>
                <span className={getChangeColor(c.change24h)}>{formatChange(c.change24h)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden" style={{ padding: "88px 16px 80px" }}>
        {/* Background radial glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{
            position: "absolute", top: "-120px", left: "50%", transform: "translateX(-50%)",
            width: "600px", height: "600px",
            background: "radial-gradient(ellipse, rgba(240,185,11,0.06) 0%, transparent 65%)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: "-80px", right: "-100px",
            width: "400px", height: "400px",
            background: "radial-gradient(ellipse, rgba(14,203,129,0.04) 0%, transparent 65%)",
            pointerEvents: "none",
          }} />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-8"
              style={{
                background: "rgba(240,185,11,0.07)",
                border: "1px solid rgba(240,185,11,0.2)",
                color: "#f0b90b",
                letterSpacing: "0.04em",
              }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#f0b90b" }} />
              LIMITED: {spotsLeft} SPOTS REMAINING
            </div>

            {/* Headline */}
            <h1 style={{ fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em", marginBottom: "20px", color: "#fff" }}>
              Get{" "}
              <span className="gradient-text">$50,000 USDT</span>
              <br />
              Interest-Free
            </h1>
            <p style={{ fontSize: "16px", color: "#888", marginBottom: "36px", maxWidth: "480px", margin: "0 auto 36px", lineHeight: 1.7 }}>
              First <strong style={{ color: "#aaa", fontWeight: 600 }}>1,000 verified users</strong> who stake 500 USDT receive a{" "}
              <strong style={{ color: "#0ecb81", fontWeight: 600 }}>$50,000 USDT loan</strong> for 10 years, zero interest.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center" style={{ marginBottom: "60px" }}>
              <Link href="/register"
                className="inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-xl text-base transition-all glow-yellow"
                style={{ background: "#f0b90b", color: "#000", letterSpacing: "-0.01em" }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#ffc929")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#f0b90b")}
              >
                Sign Up Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base transition-all"
                style={{ border: "1px solid #1e1e1e", color: "#555" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"; (e.currentTarget as HTMLElement).style.color = "#aaa"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1e1e1e"; (e.currentTarget as HTMLElement).style.color = "#555"; }}
              >
                How It Works
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap justify-center gap-8" style={{ marginBottom: "60px" }}>
              {[
                { label: "Loan Amount",    value: "$50,000 USDT", color: "#0ecb81" },
                { label: "Interest Rate",  value: "0%",           color: "#f0b90b" },
                { label: "Loan Term",      value: "10 Years",     color: "#fff" },
                { label: "Stake Required", value: "500 USDT",     color: "#f6465d" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.03em", color: s.color, fontVariantNumeric: "tabular-nums" }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: "11px", color: "#555", marginTop: "2px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ─── COUNTDOWN ─── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7 }}
            className="max-w-md mx-auto"
            style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "16px", padding: "24px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", marginBottom: "16px" }}>
              <Clock className="w-3.5 h-3.5" style={{ color: "#f0b90b" }} />
              <span style={{ fontSize: "10px", color: "#444", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
                Campaign Ends In
              </span>
            </div>
            <div className="flex justify-center gap-3" style={{ marginBottom: "20px" }}>
              {[
                { label: "Days",    value: timeLeft.days },
                { label: "Hours",   value: timeLeft.hours },
                { label: "Min",     value: timeLeft.minutes },
                { label: "Sec",     value: timeLeft.seconds },
              ].map((t, i) => (
                <div key={i} className="text-center">
                  <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "10px 14px", minWidth: "58px" }}>
                    <span style={{ fontSize: "28px", fontWeight: 900, color: "#f0b90b", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
                      {String(t.value).padStart(2, "0")}
                    </span>
                  </div>
                  <div style={{ fontSize: "10px", color: "#444", marginTop: "6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {t.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#888", marginBottom: "8px" }}>
                <span>{spotsUsed} registered</span>
                <span style={{ color: "#f0b90b" }}>{spotsLeft} spots left</span>
              </div>
              <div style={{ height: "3px", background: "#111", borderRadius: "4px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${fillPct}%`,
                    background: "linear-gradient(90deg, #f0b90b, #ffd966)",
                    borderRadius: "4px",
                    transition: "width 1s ease",
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── TRUSTED PARTNERS ─── */}
      <section style={{ background: "#080808", borderTop: "1px solid #111", borderBottom: "1px solid #111", padding: "32px 16px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: "10px", color: "#2a2a2a", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: "28px" }}>
            Trusted Partners
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "12px 52px" }}>
            {PARTNERS.map(p => (
              <PartnerLogo key={p.name} name={p.name} src={p.src} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── LIVE MARKET PREVIEW ─── */}
      <section style={{ padding: "60px 16px", maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#e8e8e8", letterSpacing: "-0.02em" }}>Live Markets</h2>
            <p style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>Real-time prices · Updates every 3s</p>
          </div>
          <Link href="/markets"
            className="inline-flex items-center gap-1 text-sm font-semibold transition-all"
            style={{ color: "#f0b90b", fontSize: "12px" }}
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {topCoins.map((coin) => (
            <Link href={`/trade/${coin.symbol}-USDT`} key={coin.id}
              className="group"
              style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "16px", transition: "border-color 0.15s, background 0.15s", display: "block" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"; (e.currentTarget as HTMLElement).style.background = "#111"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1a1a1a"; (e.currentTarget as HTMLElement).style.background = "#0d0d0d"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <img src={coin.image} alt={coin.symbol} style={{ width: "28px", height: "28px", borderRadius: "50%" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#e8e8e8" }}>{coin.symbol}</div>
                  <div style={{ fontSize: "10px", color: "#555" }}>{coin.name}</div>
                </div>
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
                {formatPrice(coin.price)}
              </div>
              <div style={{ fontSize: "12px", fontWeight: 600, marginTop: "2px" }} className={getChangeColor(coin.change24h)}>
                {formatChange(coin.change24h)}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <hr className="section-divider" style={{ margin: "0 5%" }} />

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ padding: "80px 16px" }} id="how-it-works">
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span style={{ fontSize: "10px", color: "#f0b90b", letterSpacing: "0.12em", fontWeight: 700, textTransform: "uppercase" }}>Process</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#fff", marginTop: "8px", marginBottom: "12px" }}>
              How It Works
            </h2>
            <p style={{ color: "#444", fontSize: "14px" }}>4 simple steps to get your $50,000 USDT interest-free loan</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STEPS.map((step, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
                style={{ textAlign: "center" }}
              >
                <div style={{ position: "relative", display: "inline-block", marginBottom: "16px" }}>
                  <div style={{
                    width: "60px", height: "60px", borderRadius: "16px",
                    background: "#0d0d0d", border: "1px solid #1e1e1e",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto",
                  }}>
                    <step.icon className="w-6 h-6" style={{ color: "#f0b90b" }} />
                  </div>
                  <div style={{
                    position: "absolute", top: "-6px", right: "-6px",
                    width: "20px", height: "20px", borderRadius: "50%",
                    background: "#f0b90b", color: "#000",
                    fontSize: "9px", fontWeight: 900,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {i + 1}
                  </div>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "13px", color: "#e8e8e8", marginBottom: "8px" }}>{step.title}</h3>
                <p style={{ fontSize: "12px", color: "#777", lineHeight: 1.6 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "48px" }}>
            <Link href="/register"
              className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-xl text-base transition-all glow-yellow"
              style={{ background: "#f0b90b", color: "#000" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#ffc929")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#f0b90b")}
            >
              Sign Up Now ({spotsLeft} Spots Left) <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <hr className="section-divider" style={{ margin: "0 5%" }} />

      {/* ─── FEATURES ─── */}
      <section style={{ padding: "80px 16px", maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span style={{ fontSize: "10px", color: "#f0b90b", letterSpacing: "0.12em", fontWeight: 700, textTransform: "uppercase" }}>Why NovaBit</span>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#fff", marginTop: "8px", marginBottom: "12px" }}>
            Built Different
          </h2>
          <p style={{ color: "#444", fontSize: "14px" }}>Security, speed, and your financial growth. All in one platform.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }} viewport={{ once: true }}
              style={{
                background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "14px",
                padding: "24px", transition: "border-color 0.15s",
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = "#1a1a1a")}
            >
              <div style={{
                width: "40px", height: "40px", borderRadius: "10px",
                background: "rgba(240,185,11,0.08)", border: "1px solid rgba(240,185,11,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px",
              }}>
                <f.icon className="w-5 h-5" style={{ color: "#f0b90b" }} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: "14px", color: "#e8e8e8", marginBottom: "8px" }}>{f.title}</h3>
              <p style={{ fontSize: "12px", color: "#777", lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <hr className="section-divider" style={{ margin: "0 5%" }} />

      {/* ─── FAQ ─── */}
      <section style={{ padding: "80px 16px" }} id="faq">
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span style={{ fontSize: "10px", color: "#f0b90b", letterSpacing: "0.12em", fontWeight: 700, textTransform: "uppercase" }}>FAQ</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#fff", marginTop: "8px", marginBottom: "12px" }}>
              Questions
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{
                background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "12px",
                overflow: "hidden", transition: "border-color 0.15s",
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 20px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 600, color: openFaq === i ? "#fff" : "#aaa", paddingRight: "16px", lineHeight: 1.4 }}>
                    {faq.q}
                  </span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: "#f0b90b" }} />
                    : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "#555" }} />
                  }
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 20px 16px", fontSize: "13px", color: "#888", lineHeight: 1.7, borderTop: "1px solid #141414", paddingTop: "16px" }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{ padding: "60px 16px 80px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <div style={{
            background: "#0d0d0d",
            border: "1px solid #1e1e1e",
            borderRadius: "20px",
            padding: "48px 32px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* subtle glow behind */}
            <div style={{
              position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)",
              width: "300px", height: "200px",
              background: "radial-gradient(ellipse, rgba(240,185,11,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <div style={{ position: "relative" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "14px",
                background: "rgba(240,185,11,0.1)", border: "1px solid rgba(240,185,11,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
              }}>
                <Award className="w-7 h-7" style={{ color: "#f0b90b" }} />
              </div>
              <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#fff", marginBottom: "12px" }}>
                Claim Your <span className="gradient-text">$50,000 USDT</span>
              </h2>
              <p style={{ color: "#888", marginBottom: "28px", fontSize: "14px", lineHeight: 1.7 }}>
                Only <strong style={{ color: "#aaa" }}>{spotsLeft} spots</strong> remaining.
                Complete KYC + stake 500 USDT before December 31st, 2026.
              </p>
              <Link href="/register"
                className="inline-flex items-center gap-2 font-bold px-10 py-4 rounded-xl text-lg transition-all glow-yellow"
                style={{ background: "#f0b90b", color: "#000", letterSpacing: "-0.01em" }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#ffc929")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#f0b90b")}
              >
                Sign Up Now <ArrowRight className="w-5 h-5" />
              </Link>
              <p style={{ fontSize: "11px", color: "#444", marginTop: "16px" }}>
                By signing up you agree to our Terms & Conditions and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
