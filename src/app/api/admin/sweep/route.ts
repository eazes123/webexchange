import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { getUserById } from "@/lib/db";
import {
  derivePrivateKey, getExchangeWallet, sendUsdt, fetchUsdtBalance,
  fetchTrxBalance, sendTrx,
} from "@/lib/tron";
import {
  deriveEvmPrivateKey, getEvmExchangeWallet, sendBep20Usdt, fetchBep20Balance,
  fetchBnbBalance, sendBnb,
} from "@/lib/bsc";

export const dynamic = "force-dynamic";

const MIN_SWEEP    = 0.5;    // don't sweep dust < 0.5 USDT
const TRX_MIN      = 5;      // fund user if TRX balance < 5
const TRX_FUND     = 15;     // send 15 TRX to cover USDT transfer energy
const BNB_MIN      = 0.0005; // fund user if BNB balance < 0.0005
const BNB_FUND     = 0.001;  // send 0.001 BNB (~1 USDT transfer gas on BSC)
const WAIT_MS      = 6000;   // wait for gas tx to confirm before sweeping

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json() as { chain: "TRC20" | "BSC"; userId: string; pin: string };
  const { chain, userId, pin } = body;

  // PIN check — env only, never stored in DB
  const sweepPin = process.env.SWEEP_PIN;
  if (!sweepPin) {
    return NextResponse.json({ error: "SWEEP_PIN not configured in server environment" }, { status: 500 });
  }
  if (!pin || pin !== sweepPin) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  if (!chain || !userId) {
    return NextResponse.json({ error: "chain and userId required" }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const walletIndex = user.bscWalletIndex ?? user.addressIndex;
  if (walletIndex == null) {
    return NextResponse.json({ error: "User has no wallet index" }, { status: 400 });
  }

  // ── TRC20 ──────────────────────────────────────────────────────────────────
  if (chain === "TRC20") {
    const mnemonic    = process.env.TRON_MASTER_MNEMONIC!;
    const fromAddress = user.depositAddress;
    if (!fromAddress) {
      return NextResponse.json({ error: "User has no TRC20 deposit address" }, { status: 400 });
    }

    // Check USDT balance first
    const usdtBal = await fetchUsdtBalance(fromAddress);
    if (usdtBal < MIN_SWEEP) {
      return NextResponse.json(
        { error: `Balance too low: ${usdtBal.toFixed(6)} USDT (minimum ${MIN_SWEEP})`, balance: usdtBal },
        { status: 400 },
      );
    }

    // Auto-fund TRX for energy if needed
    const trxBal = await fetchTrxBalance(fromAddress);
    let gasTxHash: string | undefined;
    if (trxBal < TRX_MIN) {
      const { address: adminAddr, privateKey: adminPrivKey } = getExchangeWallet(mnemonic);
      try {
        gasTxHash = await sendTrx(adminPrivKey, adminAddr, fromAddress, TRX_FUND);
        await sleep(WAIT_MS); // wait for TRON block confirmation
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: `Gas funding failed: ${msg}` }, { status: 500 });
      }
    }

    // Sweep USDT to admin hot wallet
    const { address: toAddress } = getExchangeWallet(mnemonic);
    const privKey = derivePrivateKey(mnemonic, walletIndex);
    try {
      const txHash = await sendUsdt(privKey, fromAddress, toAddress, usdtBal);
      return NextResponse.json({
        success: true, txHash, amount: usdtBal, from: fromAddress, to: toAddress,
        chain: "TRC20", gasTxHash,
        gasFunded: gasTxHash ? `${TRX_FUND} TRX sent for energy` : undefined,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // ── BSC ────────────────────────────────────────────────────────────────────
  if (chain === "BSC") {
    const mnemonic    = process.env.BSC_MASTER_MNEMONIC ?? process.env.TRON_MASTER_MNEMONIC!;
    const fromAddress = user.bscDepositAddress;
    if (!fromAddress) {
      return NextResponse.json({ error: "User has no BSC deposit address" }, { status: 400 });
    }

    // Check USDT balance first
    const usdtBal = await fetchBep20Balance(fromAddress);
    if (usdtBal < MIN_SWEEP) {
      return NextResponse.json(
        { error: `Balance too low: ${usdtBal.toFixed(6)} USDT (minimum ${MIN_SWEEP})`, balance: usdtBal },
        { status: 400 },
      );
    }

    // Auto-fund BNB for gas if needed
    const bnbBal = await fetchBnbBalance(fromAddress);
    let gasTxHash: string | undefined;
    if (bnbBal < BNB_MIN) {
      const { address: adminAddr, privateKey: adminPrivKey } = getEvmExchangeWallet(mnemonic);
      try {
        gasTxHash = await sendBnb(adminPrivKey, adminAddr, fromAddress, BNB_FUND);
        await sleep(WAIT_MS); // wait for BSC block confirmation (~3s, 6s is safe)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: `Gas funding failed: ${msg}` }, { status: 500 });
      }
    }

    // Sweep USDT to admin hot wallet
    const { address: toAddress } = getEvmExchangeWallet(mnemonic);
    const privKey = deriveEvmPrivateKey(mnemonic, walletIndex);
    try {
      const txHash = await sendBep20Usdt(privKey, fromAddress, toAddress, usdtBal);
      return NextResponse.json({
        success: true, txHash, amount: usdtBal, from: fromAddress, to: toAddress,
        chain: "BSC", gasTxHash,
        gasFunded: gasTxHash ? `${BNB_FUND} BNB sent for gas` : undefined,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid chain — must be TRC20 or BSC" }, { status: 400 });
}
