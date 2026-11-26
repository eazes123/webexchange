import { NextRequest, NextResponse } from "next/server";
import {
  findUserByEmail, createUser, createInitialWallets, countUsers,
} from "@/lib/db";
import { hashPassword, ASSETS } from "@/lib/auth-utils";
import { deriveAddress } from "@/lib/tron";
import { deriveEvmAddress } from "@/lib/bsc";
import { sendWelcomeEmail, sendOtpEmail } from "@/lib/email";
import { createOtp } from "@/lib/otp-store";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { fullName, email, phone, country, password } = body;

  if (!fullName || !email || !phone || !country || !password) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await findUserByEmail(normalizedEmail);

  if (existing) {
    if (existing.emailVerified) {
      return NextResponse.json(
        { error: "Email already registered. Please login." },
        { status: 400 }
      );
    }
    // Existing but unverified — resend OTP so they can complete verification
    const otpCode = createOtp(normalizedEmail);
    try {
      await sendOtpEmail(normalizedEmail, otpCode, "verify");
    } catch {
      return NextResponse.json({ error: "Could not send verification email. Check server logs." }, { status: 500 });
    }
    return NextResponse.json({ needsVerification: true });
  }

  const count = await countUsers();
  const queuePosition  = count + 1;
  const addressIndex   = count;

  const tronMnemonic = process.env.TRON_MASTER_MNEMONIC!;
  const bscMnemonic  = process.env.BSC_MASTER_MNEMONIC ?? tronMnemonic;
  let depositAddress: string | null = null;
  let bscDepositAddress: string | null = null;
  try { depositAddress = deriveAddress(tronMnemonic, addressIndex); } catch {}
  try { bscDepositAddress = deriveEvmAddress(bscMnemonic, addressIndex); } catch {}

  const user = await createUser({
    fullName,
    email: normalizedEmail,
    phone,
    country,
    passwordHash: hashPassword(password),
    queuePosition,
    kycStatus: "none",
    loanStatus: "none",
    loanAmount: 50_000,
    activationFeePaid: false,
    activationFeeRefundRequested: false,
    loanWithdrawnToExternal: false,
    depositAddress,
    addressIndex,
    bscDepositAddress,
    bscWalletIndex: addressIndex,
    stakeAmount: 0,
    stakeStatus: "none",
    stakedAt: null,
    rewardDistributed: false,
    totpEnabled: false,
    totpSecret: null,
    emailVerified: false,
  });

  await createInitialWallets(user.id, ASSETS);

  sendWelcomeEmail(user.email, user.fullName).catch(() => {});
  const otpCode = createOtp(user.email);
  try {
    await sendOtpEmail(user.email, otpCode, "verify");
  } catch {
    return NextResponse.json({ error: "Could not send verification email. Check server logs." }, { status: 500 });
  }

  // Session is NOT created here — only after email OTP is verified
  return NextResponse.json({ needsVerification: true });
}
