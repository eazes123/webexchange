import { NextRequest, NextResponse } from "next/server";
import { getSupportStatus, setSupportStatus } from "@/lib/support-status";
import { requireAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public — user widget reads this to know if live support is available
export async function GET() {
  return NextResponse.json({ available: getSupportStatus() });
}

// Admin only — toggle global support availability
export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const { available } = await request.json();
  if (typeof available !== "boolean") {
    return NextResponse.json({ error: "available (boolean) required" }, { status: 400 });
  }
  setSupportStatus(available);
  return NextResponse.json({ available: getSupportStatus() });
}
