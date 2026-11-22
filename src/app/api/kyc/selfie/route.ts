import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user  = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const path   = `${user.id}/${Date.now()}.jpg`;

  // Try to upload to Supabase storage bucket "kyc-selfies"
  const { error } = await supabaseAdmin.storage
    .from("kyc-selfies")
    .upload(path, buffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) {
    // If bucket doesn't exist, return a data-URL path so KYC still proceeds
    console.error("Supabase storage upload failed:", error.message);
    return NextResponse.json({ url: null, stored: false });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from("kyc-selfies")
    .getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl, stored: true });
}
