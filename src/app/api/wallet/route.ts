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

  const [wallets, withdrawals, withdrawalsEnabled, trc20Fee, bscFee] = await Promise.all([
    getUserWallet(user.id),
    getUserWithdrawalRequests(user.id),
    getSetting("withdrawals_enabled").then(v => v !== "false"),
    getSetting("withdrawal_fee_trc20"),
    getSetting("withdrawal_fee_bsc"),
  ]);

  return NextResponse.json({
    wallets,
    depositAddress: user.depositAddress,
    withdrawals,
    withdrawalsEnabled,
    withdrawalFees: {
      trc20: parseFloat(trc20Fee ?? "1"),
      bsc:   parseFloat(bscFee   ?? "1"),
    },
  });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user  = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, asset, amount, address, network: wdNetwork } = await request.json();

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

    // For USDT, read admin-configured fee based on network; fall back to WITHDRAWAL_FEES_CONFIG for others
    let feeConfig: { fee: number; min: number };
    if (asset === "USDT") {
      const isBsc = wdNetwork === "BSC";
      const feeSetting = await getSetting(isBsc ? "withdrawal_fee_bsc" : "withdrawal_fee_trc20");
      feeConfig = { fee: parseFloat(feeSetting ?? "1"), min: 10 };

      // Validate address format
      const addr = address?.trim() ?? "";
      if (isBsc && !(addr.startsWith("0x") && addr.length === 42)) {
        return NextResponse.json({ error: "Invalid BSC address (must start with 0x, 42 chars)" }, { status: 400 });
      }
      if (!isBsc && !(addr.startsWith("T") && addr.length === 34)) {
        return NextResponse.json({ error: "Invalid TRC20 address (must start with T, 34 chars)" }, { status: 400 });
      }
    } else {
      feeConfig = WITHDRAWAL_FEES_CONFIG[asset] ?? { fee: 1, min: 10 };
    }

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
