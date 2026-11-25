"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Trophy, Clock, CheckCircle, Shield,
  Wallet, TrendingUp, Gift, ChevronRight,
  Lock, AlertCircle, Zap, PartyPopper, Star, UserCircle
} from "lucide-react";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("dashboard");
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

  const profileIncomplete = !demoUser.phone || !demoUser.country;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full">

      {/* Profile incomplete banner (Google users) */}
      {profileIncomplete && (
        <Link href="/profile" className="flex items-center gap-3 bg-amber-500/8 border border-amber-500/25 rounded-xl px-4 py-3 mb-5 hover:bg-amber-500/12 transition-colors group">
          <UserCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-300">{t("complete_profile")}</p>
            <p className="text-xs text-gray-500 truncate">{t("complete_profile_desc")}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>
      )}

      {/* Welcome / status banner */}
      {isRewarded ? (
        <div className="bg-gradient-to-r from-ex-green/10 to-ex-card border border-ex-green/30 rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-ex-green/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-start gap-3">
            <PartyPopper className="w-8 h-8 text-ex-green shrink-0 mt-0.5" />
            <div>
              <h1 className="text-2xl font-black text-ex-green">{t("rewarded_title", { name: demoUser.name })}</h1>
              <p className="text-gray-300 mt-1">{t("rewarded_desc")}</p>
            </div>
          </div>
        </div>
      ) : isStaked ? (
        <div className="bg-ex-card2 border border-ex-green/30 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <Lock className="w-7 h-7 text-ex-green shrink-0 mt-0.5" />
            <div>
              <h1 className="text-xl font-black text-ex-green">{t("staking_active_title")}</h1>
              <p className="text-gray-400 mt-1">{t("staking_active_desc")}</p>
            </div>
          </div>
        </div>
      ) : kycRejected ? (
        <div className="bg-ex-card2 border border-red-500/30 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-7 h-7 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h1 className="text-xl font-black text-red-400">{t("kyc_rejected_banner_title")}</h1>
              <p className="text-gray-400 mt-1">{t("kyc_rejected_banner_desc")}</p>
              <Link href="/kyc"
                className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold rounded-xl transition-colors">
                {t("resubmit_kyc_btn")} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : kycPend ? (
        <div className="bg-ex-card2 border border-ex-yellow/30 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <Clock className="w-7 h-7 text-ex-yellow shrink-0 mt-0.5" />
            <div>
              <h1 className="text-xl font-black">{t("kyc_pending_title_banner")}</h1>
              <p className="text-gray-400 mt-1">{t("kyc_pending_long_desc")}</p>
            </div>
          </div>
        </div>
      ) : kycDone && !hasDeposit ? (
        <div className="bg-ex-card2 border border-ex-blue/30 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <Wallet className="w-7 h-7 text-ex-blue shrink-0 mt-0.5" />
            <div>
              <h1 className="text-xl font-black">{t("deposit_step_title")}</h1>
              <p className="text-gray-400 mt-1">{t("deposit_step_desc")}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-ex-card2 to-ex-card border border-ex-border rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-ex-yellow/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <h1 className="text-2xl font-black">{t("welcome_default", { name: demoUser.name })}</h1>
            <p className="text-gray-400 mt-1">{t("welcome_default_desc")}</p>
          </div>
        </div>
      )}

      {/* Progress stepper */}
      <div className="bg-ex-card border border-ex-border rounded-2xl p-5 mb-6">
        <h2 className="font-bold mb-4 text-sm text-gray-400 uppercase tracking-wide">{t("journey")}</h2>
        <div className="flex items-start gap-0">
          <Step n={1} label={t("step_register")}     sub={t("step_register_sub")}           status={stepStatus(1)} />
          <StepConnector done={currentStep > 1} />
          <Step n={2} label={t("step_kyc")}          sub={kycDone ? t("step_kyc_verified") : kycRejected ? t("step_kyc_rejected") : kycPend ? t("step_kyc_pending") : t("step_kyc_sub")} status={kycRejected ? "active" : stepStatus(2)} />
          <StepConnector done={currentStep > 2} />
          <Step n={3} label={t("step_stake")} sub={t("step_stake_simple")}       status={stepStatus(3)} />
          <StepConnector done={isRewarded} />
          <Step n={4} label={t("step_loan")} sub={t("step_loan_simple")}       status={stepStatus(4)} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            icon: Shield,
            label: t("kyc_status_label"),
            value: kycDone ? t("kyc_verified") : kycPend ? t("kyc_in_review") : kycRejected ? t("step_kyc_rejected") : t("kyc_in_review"),
            sub:   kycDone ? t("kyc_identity_confirmed") : kycPend ? t("kyc_24h_remaining") : kycRejected ? t("kyc_resubmit_required") : t("kyc_action_required"),
            color: kycDone ? "text-ex-green" : kycPend ? "text-ex-yellow" : kycRejected ? "text-red-400" : "text-gray-400",
          },
          {
            icon: Wallet,
            label: t("usdt_balance_label"),
            value: `${(usdtAvail).toFixed(2)} USDT`,
            sub: usdtLocked > 0 ? t("staked_amount_sub", { amount: usdtLocked.toFixed(2) }) : t("available_balance_label"),
            color: usdtAvail > 0 ? "text-ex-green" : "text-gray-400",
          },
          {
            icon: Lock,
            label: t("stake_status"),
            value: isRewarded ? t("stake_rewarded_val") : isStaked ? t("stake_active") : demoUser.stakeStatus === "unstaked" ? t("stake_unstaked") : t("stake_for_loan_sub"),
            sub:   isRewarded ? t("loan_disbursed_sub_label") : isStaked ? t("stake_500_locked") : t("stake_for_loan_sub"),
            color: isRewarded ? "text-ex-yellow" : isStaked ? "text-ex-green" : "text-gray-400",
          },
          {
            icon: Gift,
            label: t("loan_amount"),
            value: isRewarded ? "$50,000" : t("loan_eligible_val"),
            sub:   t("loan_zero_interest_sub"),
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
          {(kycNone || kycRejected) && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Shield className={`w-5 h-5 ${kycRejected ? "text-red-400" : "text-ex-yellow"}`} />
                <h2 className="font-bold">{kycRejected ? t("step2_resubmit") : t("step2_title_kyc")}</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                {kycRejected ? t("step2_desc_rejected") : t("step2_desc_new")}
              </p>
              <div className="space-y-2 mb-4">
                {[t("kyc_req1"), t("kyc_req2"), t("kyc_req3")].map(r => (
                  <div key={r} className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600" /> {r}
                  </div>
                ))}
              </div>
              <Link href="/kyc" className={`w-full py-3 text-center block rounded-xl font-bold text-sm transition-colors ${kycRejected ? "bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400" : "btn-primary"}`}>
                {kycRejected ? t("resubmit_kyc_btn") : t("start_kyc_btn")}
              </Link>
            </>
          )}

          {kycPend && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-ex-yellow animate-pulse" />
                <h2 className="font-bold">{t("docs_under_review")}</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">{t("docs_review_desc")}</p>
              <div className="bg-ex-card2 border border-ex-border rounded-xl p-3 space-y-2 text-sm">
                {[t("doc_personal_info"), t("doc_id"), t("doc_selfie"), t("doc_address")].map(d => (
                  <div key={d} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-ex-green" />
                    <span className="text-gray-300">{d}</span>
                    <span className="ml-auto text-xs text-ex-yellow bg-ex-yellow/10 px-2 py-0.5 rounded-full">{t("submitted_label")}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {kycDone && !isStaked && !isRewarded && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-ex-yellow" />
                <h2 className="font-bold">{t("step3_title_stake")}</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                {!hasDeposit ? t("deposit_first") : t("stake_desc_has_funds", { amount: usdtAvail.toFixed(2) })}
              </p>
              <div className="space-y-2">
                {!hasDeposit && (
                  <Link href="/wallet" className="btn-outline w-full py-2.5 text-sm text-center block">
                    {t("deposit_usdt_btn")}
                  </Link>
                )}
                <Link href="/campaign" className="btn-primary w-full py-2.5 text-sm text-center block">
                  {t("go_to_campaign_btn")}
                </Link>
              </div>
            </>
          )}

          {isStaked && !isRewarded && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-ex-green" />
                <h2 className="font-bold">{t("staking_active_card_title")}</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">{t("staking_active_card_desc")}</p>
              <div className="bg-ex-green/5 border border-ex-green/20 rounded-xl p-3 text-sm text-ex-green flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" /> {t("stake_confirmed")}
              </div>
              <Link href="/campaign" className="btn-outline w-full py-2.5 text-sm text-center block mt-3">
                {t("view_campaign_status")}
              </Link>
            </>
          )}

          {isRewarded && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-ex-green" />
                <h2 className="font-bold">{t("loan_disbursed_card_title")}</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">{t("loan_disbursed_card_desc")}</p>
              <div className="space-y-2">
                <Link href="/wallet" className="btn-primary w-full py-2.5 text-sm text-center block">
                  {t("withdraw_external_btn")}
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Campaign countdown */}
        <div className="bg-ex-card border border-ex-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-ex-yellow" />
            <h2 className="font-bold">{t("campaign_countdown")}</h2>
          </div>
          <div className="flex gap-3 mb-4">
            {[
              { l: t("days"),    v: timeLeft.days },
              { l: t("hours"),   v: timeLeft.hours },
              { l: t("minutes"), v: timeLeft.minutes },
              { l: t("seconds"), v: timeLeft.seconds },
            ].map((unit, i) => (
              <div key={i} className="text-center flex-1">
                <div className="bg-ex-card2 border border-ex-border rounded-xl py-2 font-black text-2xl font-num text-ex-yellow">
                  {String(unit.v).padStart(2, "0")}
                </div>
                <div className="text-xs text-gray-500 mt-1">{unit.l}</div>
              </div>
            ))}
          </div>
          <div className="bg-ex-card2 border border-ex-border rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">{t("campaign_label")}</span>
              <span className="font-semibold">{t("campaign_name")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("campaign_stake_req")}</span>
              <span className="font-semibold font-num">500 USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("loan_amount_detail")}</span>
              <span className="font-semibold font-num text-ex-yellow">50,000 USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("campaign_interest")}</span>
              <span className="font-semibold text-ex-green">{t("campaign_zero_pct")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("campaign_deadline")}</span>
              <span className="font-semibold">{t("campaign_dec_31")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("campaign_network")}</span>
              <span className="font-semibold">{t("campaign_tron")}</span>
            </div>
          </div>
          <Link href="/campaign" className="btn-primary w-full py-2.5 text-sm text-center block mt-4">
            {t("view_campaign_btn")}
          </Link>
        </div>
      </div>

      {/* Wallet balances (shown when has funds) */}
      {(usdtAvail > 0 || usdtLocked > 0 || (walletBalances.BTC?.available ?? 0) > 0) && (
        <div className="bg-ex-card border border-ex-border rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-ex-green" />
              <h2 className="font-bold">{t("wallet_balances_title")}</h2>
            </div>
            <Link href="/wallet" className="text-xs text-ex-yellow hover:underline flex items-center gap-1">
              {t("manage_link")} <ChevronRight className="w-3 h-3" />
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
                  {lkd > 0 && <div className="text-xs text-purple-400 mt-0.5">{t("locked_in_wallet", { amount: lkd.toFixed(2) })}</div>}
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
            <h2 className="font-bold">{t("market_overview_title")}</h2>
          </div>
          <Link href="/markets" className="text-xs text-ex-yellow hover:underline flex items-center gap-1">
            {t("all_markets_link")} <ChevronRight className="w-3 h-3" />
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
