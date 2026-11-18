import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSetting } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [{ count }, maxSpotsSetting] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .in("stake_status", ["active", "rewarded"]),
      getSetting("campaign_max_spots"),
    ]);
    const displayMaxSpots = Number(maxSpotsSetting ?? 1000) + 200;
    return NextResponse.json({ stakedCount: count ?? 0, displayMaxSpots });
  } catch {
    return NextResponse.json({ stakedCount: 0, displayMaxSpots: 1200 });
  }
}
