import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserById, updateUser, updateKycStatus } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  // ── Pending: drive from users table (authoritative) ──────────────────────
  // This ensures we never miss a user even if kyc_submissions row is missing
  const { data: pendingUsers } = await supabaseAdmin
    .from("users")
    .select("id, full_name, email, country, kyc_status, created_at")
    .in("kyc_status", ["under_review", "pending"])
    .order("created_at");

  // Fetch their KYC submission details (optional enrichment)
  const pendingIds = (pendingUsers ?? []).map((u: any) => u.id as string);
  const kycDetailsMap: Record<string, any> = {};
  if (pendingIds.length > 0) {
    const { data: details } = await supabaseAdmin
      .from("kyc_submissions")
      .select("user_id, full_name, dob, address, id_type, nationality, submitted_at, selfie_url, doc_front_url, doc_back_url, address_doc_url")
      .in("user_id", pendingIds);
    (details ?? []).forEach((k: any) => { kycDetailsMap[k.user_id] = k; });
  }

  const pending = (pendingUsers ?? []).map((u: any) => ({
    userId: u.id,
    fullName: u.full_name,
    email: u.email,
    country: u.country ?? "",
    kycStatus: u.kyc_status,
    createdAt: u.created_at,
    kycDetail: kycDetailsMap[u.id] ? {
      fullName:    kycDetailsMap[u.id].full_name ?? "",
      dob:         kycDetailsMap[u.id].dob ?? "",
      nationality: kycDetailsMap[u.id].nationality ?? "",
      idType:      kycDetailsMap[u.id].id_type ?? "",
      address:     kycDetailsMap[u.id].address ?? "",
      submittedAt: kycDetailsMap[u.id].submitted_at ?? "",
      selfieUrl:      kycDetailsMap[u.id].selfie_url      ?? null,
      docFrontUrl:    kycDetailsMap[u.id].doc_front_url   ?? null,
      docBackUrl:     kycDetailsMap[u.id].doc_back_url    ?? null,
      addressDocUrl:  kycDetailsMap[u.id].address_doc_url ?? null,
    } : null,
  }));

  // ── Completed: from kyc_submissions table ─────────────────────────────────
  const { data: completedRows } = await supabaseAdmin
    .from("kyc_submissions")
    .select("user_id, full_name, id_type, nationality, status, submitted_at, users!inner(full_name, email)")
    .in("status", ["approved", "rejected"])
    .order("submitted_at", { ascending: false })
    .limit(100);

  const completed = (completedRows ?? []).map((k: any) => ({
    userId:      k.user_id,
    fullName:    k.users?.full_name ?? k.full_name ?? "",
    email:       k.users?.email ?? "",
    nationality: k.nationality ?? "",
    idType:      k.id_type ?? "",
    status:      k.status,
    submittedAt: k.submitted_at ?? "",
  }));

  return NextResponse.json({ pending, completed });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const { userId, action } = await request.json();
  if (!userId || !action) {
    return NextResponse.json({ error: "userId and action required" }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (action === "approve") {
    try {
      await updateUser(userId, { kycStatus: "approved", loanStatus: "approved" });
    } catch (err: any) {
      return NextResponse.json({ error: `DB update failed: ${err.message}` }, { status: 500 });
    }
    // Best-effort update of kyc_submissions (may not exist)
    try { await updateKycStatus(userId, "approved"); } catch {}
    return NextResponse.json({
      success: true,
      message: `KYC approved for ${user.fullName}. Loan will be disbursed on Dec 31, 2026.`,
    });
  }

  if (action === "reject") {
    try {
      await updateUser(userId, { kycStatus: "rejected" });
    } catch (err: any) {
      return NextResponse.json({ error: `DB update failed: ${err.message}` }, { status: 500 });
    }
    try { await updateKycStatus(userId, "rejected"); } catch {}
    return NextResponse.json({ success: true, message: `KYC rejected for ${user.fullName}.` });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
