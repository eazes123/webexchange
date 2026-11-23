import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, upsertKyc, updateUser } from "@/lib/db";
import { verifyMobileToken } from "@/lib/kyc-mobile-tokens";
import { sendKycSubmittedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    kycToken: string;
    fullName: string; dob: string; nationality: string; address: string;
    idType: string;
    selfieUrl: string | null; docFrontUrl: string | null;
    docBackUrl: string | null; addressDocUrl: string | null;
  };

  const sessionToken = verifyMobileToken(body.kycToken ?? "");
  if (!sessionToken) {
    return NextResponse.json({ error: "Link expired — scan the QR code again" }, { status: 401 });
  }

  const user = await getSessionUser(sessionToken);
  if (!user) return NextResponse.json({ error: "Session invalid" }, { status: 401 });

  if (user.kycStatus === "approved") {
    return NextResponse.json({ error: "KYC already approved" }, { status: 400 });
  }

  await upsertKyc({
    userId: user.id,
    step: 5,
    fullName:     body.fullName,
    dob:          body.dob,
    address:      body.address,
    idType:       body.idType,
    idNumber:     "",
    nationality:  body.nationality,
    selfieUrl:    body.selfieUrl ?? null,
    docFrontUrl:  body.docFrontUrl ?? null,
    docBackUrl:   body.docBackUrl ?? null,
    addressDocUrl: body.addressDocUrl ?? null,
    status:       "under_review",
  });

  await updateUser(user.id, { kycStatus: "under_review" });

  sendKycSubmittedEmail(user.email, user.fullName).catch(() => {});

  return NextResponse.json({ success: true, kycStatus: "under_review" });
}
