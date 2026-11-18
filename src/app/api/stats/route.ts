import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSetting } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [{ count }, displayFilledSetting, maxSpotsSetting] = await Promise.all([
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }).in("stake_status", ["active", "rewarded"]),
      getSetting("campaign_display_filled"),
      getSetting("campaign_max_spots"),
    ]);
    const realStakers  = count ?? 0;
    const baseFilled   = Number(displayFilledSetting ?? 0);
    const maxSpots     = Number(maxSpotsSetting ?? 1000);
    const displayFilled = baseFilled + realStakers;
    return NextResponse.json({
      stakedCount: realStakers,
      displayFilled,
      spotsLeft: Math.max(0, maxSpots - displayFilled),
      maxSpots,
    });
  } catch {
    return NextResponse.json({ stakedCount: 0, displayFilled: 0, spotsLeft: 1000, maxSpots: 1000 });
  }
}
