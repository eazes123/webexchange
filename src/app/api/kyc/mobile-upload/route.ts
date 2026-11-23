import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";
import { mobileTokenMap } from "@/lib/kyc-mobile-tokens";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["front", "back", "address", "selfie"] as const;
type DocType = typeof ALLOWED_TYPES[number];

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xFF, 0xD8, 0xFF],
  "image/png":  [0x89, 0x50, 0x4E, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};
const EXT_MAP: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_SIZE = 10 * 1024 * 1024;

async function getUserFromToken(kycToken: string | null) {
  if (!kycToken) return null;
  const entry = mobileTokenMap.get(kycToken);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return getSessionUser(entry.sessionToken);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const kycToken = formData.get("kycToken") as string | null;
  const file     = formData.get("file")     as File | null;
  const type     = formData.get("type")     as string | null;

  const user = await getUserFromToken(kycToken);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!type || !ALLOWED_TYPES.includes(type as DocType)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG or WebP allowed" }, { status: 400 });
  }

  const bytes  = await file.arrayBuffer();
  const header = new Uint8Array(bytes.slice(0, 4));
  const magic  = MAGIC_BYTES[file.type];
  if (!magic || !magic.every((b, i) => header[i] === b)) {
    return NextResponse.json({ error: "File content does not match declared type" }, { status: 400 });
  }

  const buffer  = Buffer.from(bytes);
  const ext     = EXT_MAP[file.type] ?? "jpg";
  const isSelfie = type === "selfie";
  const bucket  = isSelfie ? "kyc-selfies" : "kyc-docs";
  const path    = isSelfie
    ? `${user.id}/${Date.now()}.${ext}`
    : `${user.id}/${type}-${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (error) {
    console.error(`${bucket} upload failed:`, error.message);
    return NextResponse.json({ url: null, stored: false });
  }

  const { data: signedData } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, 72 * 3600);

  return NextResponse.json({ url: signedData?.signedUrl ?? null, stored: true });
}
