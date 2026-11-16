import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, getKyc, upsertKyc, updateUser } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kyc = await getKyc(user.id);
  return NextResponse.json({ kyc, kycStatus: user.kycStatus });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.kycStatus === "approved") {
    return NextResponse.json({ error: "KYC already approved" }, { status: 400 });
  }

  const body = await request.json();

  await upsertKyc({
    userId: user.id,
    step: body.step ?? 5,
    fullName: body.fullName ?? user.fullName,
    dob: body.dob ?? "",
    address: body.address ?? "",
    idType: body.idType ?? "",
    idNumber: body.idNumber ?? "",
    nationality: body.nationality ?? user.country,
    status: "under_review",
  });

  await updateUser(user.id, { kycStatus: "under_review" });

  return NextResponse.json({ success: true, kycStatus: "under_review" });
}
