import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["front", "back", "address"] as const;
type DocType = typeof ALLOWED_TYPES[number];

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user  = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!type || !ALLOWED_TYPES.includes(type as DocType)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const ext  = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${type}-${Date.now()}.${ext}`;

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error } = await supabaseAdmin.storage
    .from("kyc-docs")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (error) {
    console.error("kyc-docs upload failed:", error.message);
    return NextResponse.json({ url: null, stored: false });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from("kyc-docs")
    .getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl, stored: true });
}
