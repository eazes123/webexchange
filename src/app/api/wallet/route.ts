import { NextRequest, NextResponse } from "next/server";
import {
  getSessionUser, getUserWallet, createWithdrawalRequest,
  getUserWithdrawalRequests, getSetting,
} from "@/lib/db";
import { SESSION_COOKIE, ASSETS, WITHDRAWAL_FEES_CONFIG } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user  = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wallets     = await getUserWallet(user.id);
  const withdrawals = await getUserWithdrawalRequests(user.id);
  const withdrawalsEnabled = (await getSetting("withdrawals_enabled")) !== "false";

  return NextResponse.json({
    wallets,
    depositAddress: user.depositAddress,
    withdrawals,
    withdrawalsEnabled,
  });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user  = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, asset, amount, address } = await request.json();

  if (!ASSETS.includes(asset)) {
    return NextResponse.json({ error: "Invalid asset" }, { status: 400 });
  }

  if (action === "withdraw") {
    const withdrawalsEnabled = (await getSetting("withdrawals_enabled")) !== "false";
    if (!withdrawalsEnabled) {
      return NextResponse.json({ error: "Withdrawals are temporarily paused by admin" }, { status: 400 });
    }

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    const feeConfig = WITHDRAWAL_FEES_CONFIG[asset] ?? { fee: 1, min: 10 };
    if (amt < feeConfig.min) {
      return NextResponse.json({ error: `Minimum withdrawal: ${feeConfig.min} ${asset}` }, { status: 400 });
    }

    if (!address || address.trim().length < 10) {
      return NextResponse.json({ error: "Invalid destination address" }, { status: 400 });
    }

    const wallets = await getUserWallet(user.id);
    const wallet  = wallets.find((w) => w.symbol === asset);
    if (!wallet || wallet.available < amt) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    await createWithdrawalRequest({
      userId: user.id, asset, amount: amt,
      fee: feeConfig.fee, destinationAddress: address.trim(),
    });

    return NextResponse.json({ success: true, message: "Withdrawal request submitted. Pending admin approval (24-48h)." });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
