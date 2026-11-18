import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { count } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .in("stake_status", ["active", "rewarded"]);
    return NextResponse.json({ stakedCount: count ?? 0 });
  } catch {
    return NextResponse.json({ stakedCount: 0 });
  }
}
