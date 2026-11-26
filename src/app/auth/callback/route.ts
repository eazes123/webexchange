import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  findUserByEmail, createUser, createInitialWallets,
  createSession, countUsers,
} from "@/lib/db";
import { generateToken, SESSION_COOKIE, ASSETS } from "@/lib/auth-utils";
import { deriveAddress } from "@/lib/tron";
import { deriveEvmAddress } from "@/lib/bsc";
import { sendWelcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }

  const oauthUser = data.user;
  const provider  = (oauthUser.app_metadata?.provider as string | undefined) ?? "oauth";

  if (!oauthUser.email) {
    return NextResponse.redirect(new URL("/login?error=oauth_no_email", request.url));
  }

  const email = oauthUser.email.toLowerCase().trim();
  const fullName =
    (oauthUser.user_metadata?.full_name as string | undefined) ??
    (oauthUser.user_metadata?.name as string | undefined) ??
    (oauthUser.user_metadata?.user_name as string | undefined) ??
    email.split("@")[0];

  let user = await findUserByEmail(email);

  if (!user) {
    const count = await countUsers();
    const addressIndex = count;
    const tronMnemonic = process.env.TRON_MASTER_MNEMONIC!;
    const bscMnemonic = process.env.BSC_MASTER_MNEMONIC ?? tronMnemonic;
    let depositAddress: string | null = null;
    let bscDepositAddress: string | null = null;
    try { depositAddress = deriveAddress(tronMnemonic, addressIndex); } catch {}
    try { bscDepositAddress = deriveEvmAddress(bscMnemonic, addressIndex); } catch {}

    const passwordHash = provider === "x" ? "TWITTER_OAUTH" : "GOOGLE_OAUTH";

    user = await createUser({
      fullName,
      email,
      phone: "",
      country: "",
      passwordHash,
      queuePosition: count + 1,
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
      emailVerified: true,
    });

    await createInitialWallets(user.id, ASSETS);
    sendWelcomeEmail(user.email, user.fullName).catch(() => {});
  }

  const token = generateToken();
  await createSession(user.id, token);

  const res = NextResponse.redirect(new URL("/dashboard", origin));
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}
