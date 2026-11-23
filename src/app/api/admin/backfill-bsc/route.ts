import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdminSession } from "@/lib/admin-auth";
import { deriveEvmAddress } from "@/lib/bsc";

export const dynamic = "force-dynamic";

// One-time endpoint: assigns bsc_deposit_address to any user that is missing one
export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const mnemonic = process.env.BSC_MASTER_MNEMONIC ?? process.env.TRON_MASTER_MNEMONIC;
  if (!mnemonic) {
    return NextResponse.json({ error: "BSC_MASTER_MNEMONIC not configured" }, { status: 500 });
  }

  const { data: users, error } = await supabaseAdmin
    .from("users")
    .select("id, address_index, bsc_deposit_address")
    .is("bsc_deposit_address", null)
    .not("address_index", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let updated = 0;
  const errors: string[] = [];

  for (const user of users ?? []) {
    try {
      const bscAddress = deriveEvmAddress(mnemonic, user.address_index as number);
      await supabaseAdmin
        .from("users")
        .update({ bsc_deposit_address: bscAddress, bsc_wallet_index: user.address_index })
        .eq("id", user.id);
      updated++;
    } catch (e: any) {
      errors.push(`${user.id}: ${e.message}`);
    }
  }

  return NextResponse.json({ updated, errors, total: (users ?? []).length });
}
