"use client";
import { useState, useEffect, useCallback } from "react";
import {
  CreditCard, CheckCircle, Clock, AlertTriangle,
  Wallet, TrendingDown, ChevronRight, Info,
  ArrowRight, BadgeCheck, Banknote, Calendar,
  RefreshCw, Lock,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import Link from "next/link";
import { useTranslations } from "next-intl";

const LOAN_AMOUNT  = 50_000;
const LOAN_MONTHS  = 120;
const MONTHLY_INST = parseFloat((LOAN_AMOUNT / LOAN_MONTHS).toFixed(2)); // 416.67

interface LoanData {
  eligible:          boolean;
  loanAmount:        number;
  loanMonths:        number;
  monthlyInstallment:number;
  totalRepaid:       number;
  remaining:         number;
  paidMonths:        number;
  monthsLeft:        number;
  usdtAvailable:     number;
  minPayment:        number;
  fullyRepaid:       boolean;
  message?:          string;
}

function ProgressRing({ pct, size = 120, stroke = 10 }: { pct: number; size?: number; stroke?: number }) {
  const r  = (size - stroke) / 2;
  const c  = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#111" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f0b90b"
        strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={off}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

export default function LoanPage() {
  const t = useTranslations("loan");
  const { demoUser, walletBalances, hydrate } = useStore();
  const [loanData, setLoanData]   = useState<LoanData | null>(null);
  const [amount, setAmount]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);

  const isRewarded = demoUser.stakeStatus === "rewarded";

  const fetchLoan = useCallback(async () => {
    setFetching(true);
    try {
      const res  = await fetch("/api/loan");
      const data = await res.json();
      setLoanData(data);
    } catch { /* silent */ }
    finally { setFetching(false); }
  }, []);

  useEffect(() => { fetchLoan(); }, [fetchLoan]);

  const repaidPct = loanData ? Math.min(100, (loanData.totalRepaid / LOAN_AMOUNT) * 100) : 0;

  const handlePayment = async () => {
    const pay = parseFloat(amount);
    if (!pay || isNaN(pay) || pay < 100) {
      toast.error("Minimum installment is 100 USDT");
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch("/api/loan", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ amount: pay }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Payment failed"); return; }
      toast.success(data.message ?? "Payment submitted successfully!");
      setAmount("");
      await Promise.all([fetchLoan(), hydrate()]);
    } catch { toast.error("Network error"); }
    finally   { setLoading(false); }
  };

  // ── Not yet rewarded ─────────────────────────────────────────────────────────
  if (!isRewarded) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full">
        <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-[#f0b90b]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-[#f0b90b]" />
          </div>
          <h1 className="text-2xl font-black mb-2">{t("not_disbursed_title")}</h1>
          <p className="text-gray-400 text-sm mb-6">{t("not_disbursed_desc")}</p>
          <div className="space-y-3 mb-6">
            {[
              { done: demoUser.kycStatus === "approved", label: t("kyc_approved_step"), href: "/kyc" },
              { done: demoUser.stakeStatus === "active" || demoUser.stakeStatus === "rewarded",
                label: t("stake_step"), href: "/campaign" },
              { done: false, label: t("disbursement_step"), href: null },
            ].map(({ done, label, href }) => (
              <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border ${
                done ? "bg-[#0ecb81]/5 border-[#0ecb81]/20" : "bg-[#111] border-[#1e1e1e]"
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  done ? "bg-[#0ecb81] text-black" : "bg-[#1e1e1e] text-gray-500"
                }`}>
                  {done ? <CheckCircle className="w-3 h-3" /> : <span className="text-[9px] font-bold">!</span>}
                </div>
                <span className={`text-sm flex-1 ${done ? "text-[#0ecb81]" : "text-gray-400"}`}>{label}</span>
                {!done && href && (
                  <Link href={href} className="text-xs text-[#f0b90b] font-bold hover:underline flex items-center gap-1">
                    Go <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
          <Link href="/campaign"
            className="inline-flex items-center gap-2 bg-[#f0b90b] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#f0b90b]/90 transition-colors text-sm">
            {t("view_campaign_btn")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Fully repaid ─────────────────────────────────────────────────────────────
  if (loanData?.fullyRepaid) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0ecb81]/10 via-[#0d0d0d] to-[#f0b90b]/5 border border-[#0ecb81]/30 rounded-3xl p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <div className="inline-flex items-center gap-2 bg-[#0ecb81]/10 border border-[#0ecb81]/30 rounded-full px-3 py-1 text-xs font-bold text-[#0ecb81] mb-4">
            <BadgeCheck className="w-3.5 h-3.5" /> {t("loan_fully_repaid_badge")}
          </div>
          <h2 className="text-3xl font-black mb-2">{t("congrats_title")}</h2>
          <p className="text-gray-400 mb-4 text-sm">{t("fully_repaid_desc")}</p>
          <div className="bg-[#0ecb81]/10 border border-[#0ecb81]/30 rounded-2xl p-5 inline-block">
            <div className="text-3xl font-black text-[#0ecb81] font-mono">$50,000 USDT</div>
            <div className="text-sm text-gray-400 mt-1">{t("repaid_in_full")}</div>
          </div>
        </div>
      </div>
    );
  }

  const usdtAvail = loanData?.usdtAvailable ?? (walletBalances.USDT?.available ?? 0);

  // ── Main repayment view ───────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-6">

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 bg-[#f0b90b]/10 border border-[#f0b90b]/30 rounded-full px-3 py-1 text-xs font-bold text-[#f0b90b] mb-3">
          <CreditCard className="w-3 h-3" /> {t("repayment_badge")}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">{t("loan_title")}</h1>
        <p className="text-gray-400 text-sm mt-1">{t("loan_subtitle")}</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("loan_amount_label"), val: "$50,000",                       color: "text-white",        sub: t("total_disbursed") },
          { label: t("repaid_label"),     val: `$${(loanData?.totalRepaid ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
            color: "text-[#0ecb81]", sub: t("months_paid_sub", { count: loanData?.paidMonths ?? 0 }) },
          { label: t("remaining_label"),  val: `$${(loanData?.remaining ?? LOAN_AMOUNT).toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
            color: "text-[#f6465d]", sub: t("months_left_sub", { count: loanData?.monthsLeft ?? LOAN_MONTHS }) },
          { label: t("monthly_due_label"), val: `$${MONTHLY_INST.toFixed(2)}`,   color: "text-[#f0b90b]",   sub: t("per_month_sub") },
        ].map(({ label, val, color, sub }) => (
          <div key={label} className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-4">
            <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide mb-1">{label}</div>
            <div className={`text-lg font-black font-mono ${color}`}>{val}</div>
            <div className="text-[11px] text-gray-600 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Progress ring + details */}
      <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row gap-6 items-center">
        <div className="relative shrink-0">
          <ProgressRing pct={repaidPct} size={130} stroke={12} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-[#f0b90b]">{repaidPct.toFixed(1)}%</span>
            <span className="text-[10px] text-gray-500 font-semibold">{t("repaid_pct")}</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500">{t("repayment_progress")}</span>
              <span className="text-[#f0b90b] font-bold">{(loanData?.totalRepaid ?? 0).toFixed(2)} / 50,000 USDT</span>
            </div>
            <div className="h-2.5 bg-[#111] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#f0b90b] to-[#0ecb81] rounded-full transition-all duration-700"
                style={{ width: `${Math.max(1, repaidPct)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-[#080808] border border-[#1e1e1e] rounded-xl p-3">
              <div className="text-[11px] text-gray-500 mb-0.5">{t("months_paid_label")}</div>
              <div className="font-bold font-mono">{loanData?.paidMonths ?? 0} / {LOAN_MONTHS}</div>
            </div>
            <div className="bg-[#080808] border border-[#1e1e1e] rounded-xl p-3">
              <div className="text-[11px] text-gray-500 mb-0.5">{t("remaining_balance_label")}</div>
              <div className="font-bold font-mono text-[#f6465d]">
                {(loanData?.remaining ?? LOAN_AMOUNT).toLocaleString("en-US", { maximumFractionDigits: 2 })} USDT
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment form */}
      <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-3xl p-5 sm:p-6">
        <h2 className="font-black text-lg mb-5 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-[#f0b90b]" />
          {t("pay_installment_title")}
        </h2>

        {/* Wallet balance */}
        <div className="flex items-center justify-between p-3 bg-[#080808] border border-[#1e1e1e] rounded-xl mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Wallet className="w-4 h-4" />
            {t("usdt_available_label")}
          </div>
          <div className="font-bold font-mono text-sm">
            {usdtAvail.toFixed(2)} USDT
            {usdtAvail < MONTHLY_INST && (
              <span className="ml-2 text-[11px] text-[#f6465d] font-semibold">{t("low_balance")}</span>
            )}
          </div>
        </div>

        {/* Quick amount buttons */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2 font-semibold">{t("quick_amounts")}</div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: t("one_month"),    val: MONTHLY_INST },
              { label: t("three_months"), val: parseFloat((MONTHLY_INST * 3).toFixed(2)) },
              { label: t("six_months"),   val: parseFloat((MONTHLY_INST * 6).toFixed(2)) },
              { label: t("one_year"),     val: parseFloat((MONTHLY_INST * 12).toFixed(2)) },
              ...(loanData?.remaining ? [{ label: t("full_balance"), val: loanData.remaining }] : []),
            ].map(({ label, val }) => (
              <button key={label}
                onClick={() => setAmount(val.toFixed(2))}
                disabled={val > usdtAvail}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  parseFloat(amount) === val
                    ? "bg-[#f0b90b] text-black border-[#f0b90b]"
                    : val > usdtAvail
                      ? "bg-[#111] text-gray-600 border-[#1e1e1e] cursor-not-allowed opacity-50"
                      : "bg-[#111] text-gray-300 border-[#1e1e1e] hover:border-[#f0b90b]/40 hover:text-[#f0b90b]"
                }`}>
                {label}
                <span className="ml-1 opacity-70">${val.toFixed(0)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount input */}
        <div className="mb-5">
          <label className="text-xs text-gray-400 font-semibold mb-2 block">{t("payment_amount_label")}</label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={`Min ${(loanData?.minPayment ?? 100).toFixed(2)}`}
                min={loanData?.minPayment ?? 100}
                step="0.01"
                className="w-full bg-[#080808] border border-[#1e1e1e] rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-600 outline-none focus:border-[#f0b90b]/50 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-semibold">USDT</span>
            </div>
            <button
              onClick={handlePayment}
              disabled={loading || !amount || parseFloat(amount) < 100 || parseFloat(amount) > usdtAvail}
              className="px-6 py-3 rounded-xl font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: (!amount || parseFloat(amount) < 100 || parseFloat(amount) > usdtAvail)
                  ? "#111"
                  : "linear-gradient(135deg, #f0b90b, #d4a017)",
                color: (!amount || parseFloat(amount) < 100 || parseFloat(amount) > usdtAvail)
                  ? "#6b7280"
                  : "#000",
              }}>
              {loading ? t("paying_btn") : t("pay_now_btn")}
            </button>
          </div>
          {parseFloat(amount) > 0 && parseFloat(amount) < 100 && (
            <p className="text-xs text-[#f6465d] mt-1.5">{t("min_payment_error")}</p>
          )}
          {parseFloat(amount) > usdtAvail && (
            <p className="text-xs text-[#f6465d] mt-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {t("insufficient_balance")}{" "}
              <Link href="/wallet" className="underline">{t("deposit_usdt_link")}</Link>
            </p>
          )}
        </div>

        {/* Summary */}
        {parseFloat(amount) >= 100 && parseFloat(amount) <= usdtAvail && (
          <div className="bg-[#080808] border border-[#1e1e1e] rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">{t("you_pay_label")}</span>
              <span className="font-bold font-mono">{parseFloat(amount).toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("remaining_after_label")}</span>
              <span className="font-bold font-mono text-[#0ecb81]">
                {Math.max(0, (loanData?.remaining ?? LOAN_AMOUNT) - parseFloat(amount)).toFixed(2)} USDT
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#1e1e1e]">
              <span className="text-gray-500">{t("repayment_fee_label")}</span>
              <span className="font-bold text-[#0ecb81]">{t("free_zero")}</span>
            </div>
          </div>
        )}

        <p className="text-[11px] text-gray-600 mt-3 leading-relaxed">
          {t("payments_note")}
        </p>
      </div>

      {/* Loan terms */}
      <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-3xl p-5 sm:p-6">
        <h2 className="font-black text-base mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-[#f0b90b]" /> {t("loan_summary_title")}
        </h2>
        <div className="divide-y divide-[#1e1e1e]/60 text-sm">
          {[
            [t("total_loan_label"),          "$50,000 USDT"],
            [t("interest_rate_label"),       t("interest_free")],
            [t("loan_term_label"),           t("ten_years")],
            [t("monthly_installment_label"), `$${MONTHLY_INST.toFixed(2)} USDT`],
            [t("disbursement_date_label"),   t("disbursement_date_val")],
            [t("early_repayment_label"),     t("early_repayment_val")],
            [t("repayment_asset_label"),     t("repayment_asset_val")],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-2.5 gap-4">
              <span className="text-gray-500 shrink-0">{k}</span>
              <span className="font-semibold text-right">{v}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
