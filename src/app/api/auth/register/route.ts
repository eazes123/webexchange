import { NextRequest, NextResponse } from "next/server";
import {
  findUserByEmail, createUser, createInitialWallets,
  createSession, countUsers,
} from "@/lib/db";
import { hashPassword, generateToken, SESSION_COOKIE, ASSETS } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { fullName, email, phone, country, password } = body;

  if (!fullName || !email || !phone || !country || !password) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  const queuePosition = (await countUsers()) + 1;

  const user = await createUser({
    fullName,
    email: email.toLowerCase().trim(),
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
  });

  await createInitialWallets(user.id, ASSETS);

  const token = generateToken();
  await createSession(user.id, token);

  const res = NextResponse.json({
    success: true,
    user: {
      id: user.id, fullName: user.fullName, email: user.email,
      queuePosition: user.queuePosition, kycStatus: "none", loanStatus: "none",
    },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, secure: false, sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, path: "/",
  });
  return res;
}
