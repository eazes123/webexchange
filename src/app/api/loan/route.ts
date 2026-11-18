import { NextRequest, NextResponse } from "next/server";
import {
  getSessionUser, getUserWallet,
  updateWalletBalance, createTransaction,
  getLoanRepaymentTotal,
} from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const LOAN_AMOUNT   = 50_000;
const LOAN_MONTHS   = 120; // 10 years
const MIN_PAYMENT   = 100; // minimum installment

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user  = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.stakeStatus !== "rewarded") {
    return NextResponse.json({ eligible: false, message: "Loan not yet disbursed." });
  }

  const [wallets, totalRepaid] = await Promise.all([
    getUserWallet(user.id),
    getLoanRepaymentTotal(user.id),
  ]);
  const usdt = wallets.find((w) => w.symbol === "USDT");

  const monthlyInstallment = parseFloat((LOAN_AMOUNT / LOAN_MONTHS).toFixed(2));
  const remaining          = Math.max(0, LOAN_AMOUNT - totalRepaid);
  const paidMonths         = Math.floor(totalRepaid / monthlyInstallment);

  return NextResponse.json({
    eligible:            true,
    loanAmount:          LOAN_AMOUNT,
    loanMonths:          LOAN_MONTHS,
    monthlyInstallment,
    totalRepaid:         parseFloat(totalRepaid.toFixed(2)),
    remaining:           parseFloat(remaining.toFixed(2)),
    paidMonths,
    monthsLeft:          Math.max(0, LOAN_MONTHS - paidMonths),
    usdtAvailable:       usdt?.available ?? 0,
    minPayment:          MIN_PAYMENT,
    fullyRepaid:         remaining <= 0,
  });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user  = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.stakeStatus !== "rewarded") {
    return NextResponse.json({ error: "Loan not yet disbursed" }, { status: 400 });
  }

  const { amount } = await request.json() as { amount: number };

  if (!amount || isNaN(amount) || amount < MIN_PAYMENT) {
    return NextResponse.json(
      { error: `Minimum payment is ${MIN_PAYMENT} USDT` },
      { status: 400 }
    );
  }

  const [wallets, totalRepaid] = await Promise.all([
    getUserWallet(user.id),
    getLoanRepaymentTotal(user.id),
  ]);
  const usdt      = wallets.find((w) => w.symbol === "USDT");
  const available = usdt?.available ?? 0;

  if (available < amount) {
    return NextResponse.json(
      { error: `Insufficient USDT. Available: ${available.toFixed(2)} USDT` },
      { status: 400 }
    );
  }

  const remaining = LOAN_AMOUNT - totalRepaid;
  if (remaining <= 0) {
    return NextResponse.json({ error: "Loan already fully repaid" }, { status: 400 });
  }

  const actualPayment = Math.min(amount, remaining);

  await updateWalletBalance(user.id, "USDT", { available: -actualPayment });
  await createTransaction({
    userId: user.id,
    type:   "loan_repayment",
    asset:  "USDT",
    amount: actualPayment,
    status: "completed",
    date:   new Date().toISOString().split("T")[0],
    desc:   `Loan Installment Payment: ${actualPayment.toFixed(2)} USDT`,
  });

  const newRepaid    = totalRepaid + actualPayment;
  const newRemaining = Math.max(0, LOAN_AMOUNT - newRepaid);

  return NextResponse.json({
    success:       true,
    paid:          parseFloat(actualPayment.toFixed(2)),
    totalRepaid:   parseFloat(newRepaid.toFixed(2)),
    remaining:     parseFloat(newRemaining.toFixed(2)),
    fullyRepaid:   newRemaining <= 0,
    message:       newRemaining <= 0
      ? "🎉 Loan fully repaid! Congratulations."
      : `Payment of ${actualPayment.toFixed(2)} USDT submitted successfully.`,
  });
}
