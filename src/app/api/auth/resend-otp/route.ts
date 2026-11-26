import { NextRequest, NextResponse } from "next/server";
import { canResend, recordResend, getResendInfo } from "@/lib/otp-store";
import { sendOtpEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const { email, type } = await request.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const key = email.toLowerCase().trim();
  const block = canResend(key);

  if (block === "max_resend") {
    return NextResponse.json({ error: "Maximum resend attempts reached." }, { status: 429 });
  }
  if (block?.startsWith("cooldown:")) {
    const secs = block.split(":")[1];
    return NextResponse.json(
      { error: `Please wait ${secs}s before requesting a new code.`, retryAfter: Number(secs) },
      { status: 429 }
    );
  }

  const code = recordResend(key);
  const info = getResendInfo(key);

  try {
    await sendOtpEmail(key, code, type ?? "verify");
  } catch {
    return NextResponse.json({ error: "Could not send verification email. Check server logs." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    remaining: info.remaining,
    lockedUntil: info.lockedUntil,
  });
}
