import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, getSessionUser, DbKyc } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = readDb();
  const kyc = db.kyc.find((k) => k.userId === user.id) ?? null;
  return NextResponse.json({ kyc, kycStatus: user.kycStatus });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.kycStatus === "approved") {
    return NextResponse.json({ error: "KYC already approved" }, { status: 400 });
  }

  const body = await request.json();
  const db = readDb();

  const existing = db.kyc.findIndex((k) => k.userId === user.id);
  const record: DbKyc = {
    userId: user.id,
    step: body.step ?? 5,
    fullName: body.fullName ?? user.fullName,
    dob: body.dob ?? "",
    address: body.address ?? "",
    idType: body.idType ?? "",
    idNumber: body.idNumber ?? "",
    nationality: body.nationality ?? user.country,
    status: "under_review",   // Always under_review — admin must approve
    submittedAt: new Date().toISOString(),
  };

  if (existing !== -1) {
    db.kyc[existing] = record;
  } else {
    db.kyc.push(record);
  }

  // Set user kycStatus to under_review — not auto-approved
  const userIdx = db.users.findIndex((u) => u.id === user.id);
  if (userIdx !== -1) db.users[userIdx].kycStatus = "under_review";

  writeDb(db);
  return NextResponse.json({ success: true, kycStatus: "under_review" });
}
