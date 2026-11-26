import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";

export async function POST(request: NextRequest) {
  const { email, code } = await request.json();
  if (!email || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const result = verifyOtp(email.toLowerCase().trim(), code.trim());
  if (result === "expired") {
    return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
  }
  if (result === "invalid") {
    return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
