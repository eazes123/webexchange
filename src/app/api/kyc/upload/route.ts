import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["front", "back", "address"] as const;
type DocType = typeof ALLOWED_TYPES[number];

const ALLOWED_MIME_DOC = ["image/jpeg", "image/png", "image/webp"];
const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xFF, 0xD8, 0xFF],
  "image/png":  [0x89, 0x50, 0x4E, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }
  if (!ALLOWED_MIME_DOC.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images allowed" }, { status: 400 });
  }

  const bytes  = await file.arrayBuffer();
  const header = new Uint8Array(bytes.slice(0, 4));
  const magic  = MAGIC_BYTES[file.type];
  if (!magic || !magic.every((b, i) => header[i] === b)) {
    return NextResponse.json({ error: "File content does not match declared type" }, { status: 400 });
  }

  const buffer = Buffer.from(bytes);
  // Use file type's canonical extension, not the user-supplied filename
  const extMap: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const ext  = extMap[file.type] ?? "jpg";
  const path = `${user.id}/${type}-${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from("kyc-docs")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (error) {
    console.error("kyc-docs upload failed:", error.message);
    return NextResponse.json({ url: null, stored: false });
  }

  // Use signed URL (72 hours) — bucket must be set to private in Supabase dashboard
  const { data: signedData } = await supabaseAdmin.storage
    .from("kyc-docs")
    .createSignedUrl(path, 72 * 3600);

  return NextResponse.json({ url: signedData?.signedUrl ?? null, stored: true, path });
}
