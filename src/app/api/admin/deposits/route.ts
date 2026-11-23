import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  // Fetch all users with their deposit addresses
  const { data: users, error: usersErr } = await supabaseAdmin
    .from("users")
    .select("id, full_name, email, address_index, deposit_address, bsc_deposit_address, bsc_wallet_index, kyc_status, created_at")
    .order("address_index", { ascending: true });

  if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 });

  // Fetch all deposit transactions
  const { data: txns, error: txErr } = await supabaseAdmin
    .from("transactions")
    .select("id, user_id, type, asset, amount, status, date, description, tx_hash, created_at")
    .eq("type", "deposit")
    .order("created_at", { ascending: false })
    .limit(500);

  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });

  // Build user map for quick lookup
  const userMap: Record<string, { fullName: string; email: string }> = {};
  for (const u of users ?? []) {
    userMap[u.id] = { fullName: u.full_name ?? "-", email: u.email ?? "-" };
  }

  // Enrich transactions with user info
  const deposits = (txns ?? []).map((tx: any) => ({
    id:          tx.id,
    userId:      tx.user_id,
    userFullName: userMap[tx.user_id]?.fullName ?? "-",
    userEmail:   userMap[tx.user_id]?.email ?? "-",
    asset:       tx.asset,
    amount:      tx.amount,
    status:      tx.status,
    date:        tx.date,
    desc:        tx.description,
    txHash:      tx.tx_hash,
    createdAt:   tx.created_at,
    chain:       tx.description?.includes("BEP20") ? "BSC" : tx.description?.includes("TRC20") ? "TRC20" : "unknown",
  }));

  // Aggregate stats
  const trc20Total = deposits
    .filter((d: any) => d.chain === "TRC20")
    .reduce((sum: number, d: any) => sum + (d.amount ?? 0), 0);
  const bscTotal = deposits
    .filter((d: any) => d.chain === "BSC")
    .reduce((sum: number, d: any) => sum + (d.amount ?? 0), 0);
  const usersWithTrc = (users ?? []).filter((u: any) => u.deposit_address).length;
  const usersWithBsc = (users ?? []).filter((u: any) => u.bsc_deposit_address).length;

  const stats = {
    totalDeposits:  deposits.length,
    trc20Total:     Math.round(trc20Total * 100) / 100,
    bscTotal:       Math.round(bscTotal * 100) / 100,
    totalVolume:    Math.round((trc20Total + bscTotal) * 100) / 100,
    usersWithTrc,
    usersWithBsc,
    trc20Count:     deposits.filter((d: any) => d.chain === "TRC20").length,
    bscCount:       deposits.filter((d: any) => d.chain === "BSC").length,
  };

  const addressList = (users ?? [])
    .filter((u: any) => u.deposit_address || u.bsc_deposit_address)
    .map((u: any) => ({
      id:            u.id,
      fullName:      u.full_name ?? "-",
      email:         u.email ?? "-",
      addressIndex:  u.address_index,
      trc20Address:  u.deposit_address ?? null,
      bscAddress:    u.bsc_deposit_address ?? null,
      kycStatus:     u.kyc_status ?? "none",
      createdAt:     u.created_at,
    }));

  return NextResponse.json({ stats, deposits, addressList });
}
