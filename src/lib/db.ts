import { supabaseAdmin } from "./supabase";

// ── Types (kept for API route compatibility) ──────────────────────────────────
export interface DbUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  passwordHash: string;
  queuePosition: number;
  kycStatus: "none" | "under_review" | "pending" | "approved" | "rejected";
  loanStatus: "none" | "pending" | "approved" | "disbursed" | "rejected";
  loanAmount: number;
  activationFeePaid: boolean;
  activationFeeRefundRequested: boolean;
  loanWithdrawnToExternal: boolean;
  createdAt: string;
}

export interface DbWalletBalance {
  userId: string;
  symbol: string;
  available: number;
  locked: number;
}

export interface DbTransaction {
  id: string;
  userId: string;
  type: string;
  asset: string;
  amount: number;
  fee?: number;
  status: string;
  date: string;
  desc?: string;
  address?: string;
  txHash?: string;
}

export interface DbKyc {
  userId: string;
  step: number;
  fullName: string;
  dob: string;
  address: string;
  idType: string;
  idNumber: string;
  nationality: string;
  status: "under_review" | "approved" | "rejected";
  submittedAt: string;
}

// ── Row → Domain mappers ──────────────────────────────────────────────────────
function rowToUser(r: any): DbUser {
  return {
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    country: r.country,
    passwordHash: r.password_hash,
    queuePosition: r.queue_position,
    kycStatus: r.kyc_status,
    loanStatus: r.loan_status,
    loanAmount: Number(r.loan_amount),
    activationFeePaid: r.activation_fee_paid,
    activationFeeRefundRequested: r.activation_fee_refund_requested,
    loanWithdrawnToExternal: r.loan_withdrawn_to_external,
    createdAt: r.created_at,
  };
}

function rowToWallet(r: any): DbWalletBalance {
  return { userId: r.user_id, symbol: r.symbol, available: Number(r.available), locked: Number(r.locked) };
}

function rowToTx(r: any): DbTransaction {
  return {
    id: r.id, userId: r.user_id, type: r.type, asset: r.asset,
    amount: Number(r.amount), fee: r.fee ? Number(r.fee) : undefined,
    status: r.status, date: r.date ?? r.created_at?.split("T")[0],
    desc: r.description, address: r.address, txHash: r.tx_hash,
  };
}

function rowToKyc(r: any): DbKyc {
  return {
    userId: r.user_id, step: r.step, fullName: r.full_name, dob: r.dob,
    address: r.address, idType: r.id_type, idNumber: r.id_number ?? "",
    nationality: r.nationality, status: r.status,
    submittedAt: r.submitted_at,
  };
}

// ── Session helpers ───────────────────────────────────────────────────────────
export async function getSessionUser(token: string | undefined): Promise<DbUser | null> {
  if (!token) return null;
  const { data } = await supabaseAdmin
    .from("sessions")
    .select("*, users(*)")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .single();
  if (!data?.users) return null;
  return rowToUser(data.users);
}

export async function createSession(userId: string, token: string): Promise<void> {
  await supabaseAdmin.from("sessions").insert({
    token,
    user_id: userId,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
}

export async function deleteSession(token: string): Promise<void> {
  await supabaseAdmin.from("sessions").delete().eq("token", token);
}

// ── User helpers ──────────────────────────────────────────────────────────────
export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .single();
  return data ? rowToUser(data) : null;
}

export async function createUser(user: Omit<DbUser, "id" | "createdAt">): Promise<DbUser> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      full_name: user.fullName,
      email: user.email,
      phone: user.phone,
      country: user.country,
      password_hash: user.passwordHash,
      queue_position: user.queuePosition,
      kyc_status: user.kycStatus,
      loan_status: user.loanStatus,
      loan_amount: user.loanAmount,
      activation_fee_paid: user.activationFeePaid,
      activation_fee_refund_requested: user.activationFeeRefundRequested,
      loan_withdrawn_to_external: user.loanWithdrawnToExternal,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToUser(data);
}

export async function updateUser(userId: string, fields: Partial<{
  kycStatus: string; loanStatus: string; activationFeePaid: boolean;
  activationFeeRefundRequested: boolean; loanWithdrawnToExternal: boolean;
}>): Promise<void> {
  const row: any = {};
  if (fields.kycStatus !== undefined) row.kyc_status = fields.kycStatus;
  if (fields.loanStatus !== undefined) row.loan_status = fields.loanStatus;
  if (fields.activationFeePaid !== undefined) row.activation_fee_paid = fields.activationFeePaid;
  if (fields.activationFeeRefundRequested !== undefined) row.activation_fee_refund_requested = fields.activationFeeRefundRequested;
  if (fields.loanWithdrawnToExternal !== undefined) row.loan_withdrawn_to_external = fields.loanWithdrawnToExternal;
  await supabaseAdmin.from("users").update(row).eq("id", userId);
}

export async function countUsers(): Promise<number> {
  const { count } = await supabaseAdmin.from("users").select("*", { count: "exact", head: true });
  return count ?? 0;
}

export async function getAllUsers(): Promise<DbUser[]> {
  const { data } = await supabaseAdmin.from("users").select("*").order("created_at");
  return (data ?? []).map(rowToUser);
}

export async function getUserById(userId: string): Promise<DbUser | null> {
  const { data } = await supabaseAdmin.from("users").select("*").eq("id", userId).single();
  return data ? rowToUser(data) : null;
}

// ── Wallet helpers ────────────────────────────────────────────────────────────
export async function getUserWallet(userId: string): Promise<DbWalletBalance[]> {
  const { data } = await supabaseAdmin.from("wallet_balances").select("*").eq("user_id", userId);
  return (data ?? []).map(rowToWallet);
}

export async function createInitialWallets(userId: string, symbols: string[]): Promise<void> {
  await supabaseAdmin.from("wallet_balances").insert(
    symbols.map((symbol) => ({ user_id: userId, symbol, available: 0, locked: 0 }))
  );
}

export async function updateWalletBalance(
  userId: string, symbol: string,
  delta: { available?: number; locked?: number; setAvailable?: number; setLocked?: number }
): Promise<void> {
  if (delta.setAvailable !== undefined || delta.setLocked !== undefined) {
    const row: any = {};
    if (delta.setAvailable !== undefined) row.available = delta.setAvailable;
    if (delta.setLocked !== undefined) row.locked = delta.setLocked;
    await supabaseAdmin.from("wallet_balances").update(row)
      .eq("user_id", userId).eq("symbol", symbol);
  } else {
    // Delta update using RPC increment
    const { data } = await supabaseAdmin.from("wallet_balances")
      .select("available, locked").eq("user_id", userId).eq("symbol", symbol).single();
    if (!data) return;
    const row: any = {};
    if (delta.available !== undefined) row.available = Number(data.available) + delta.available;
    if (delta.locked !== undefined) row.locked = Number(data.locked) + delta.locked;
    await supabaseAdmin.from("wallet_balances").update(row)
      .eq("user_id", userId).eq("symbol", symbol);
  }
}

// ── Transaction helpers ───────────────────────────────────────────────────────
export async function getUserTransactions(userId: string): Promise<DbTransaction[]> {
  const { data } = await supabaseAdmin.from("transactions").select("*")
    .eq("user_id", userId).order("created_at", { ascending: false });
  return (data ?? []).map(rowToTx);
}

export async function createTransaction(tx: Omit<DbTransaction, "id">): Promise<void> {
  await supabaseAdmin.from("transactions").insert({
    user_id: tx.userId,
    type: tx.type,
    asset: tx.asset,
    amount: tx.amount,
    fee: tx.fee ?? 0,
    status: tx.status,
    date: tx.date,
    description: tx.desc,
    address: tx.address,
    tx_hash: tx.txHash,
  });
}

// ── KYC helpers ───────────────────────────────────────────────────────────────
export async function getKyc(userId: string): Promise<DbKyc | null> {
  const { data } = await supabaseAdmin.from("kyc_submissions").select("*").eq("user_id", userId).single();
  return data ? rowToKyc(data) : null;
}

export async function upsertKyc(kyc: Omit<DbKyc, "submittedAt">): Promise<void> {
  await supabaseAdmin.from("kyc_submissions").upsert({
    user_id: kyc.userId,
    status: kyc.status,
    full_name: kyc.fullName,
    dob: kyc.dob,
    address: kyc.address,
    id_type: kyc.idType,
    id_number: kyc.idNumber,
    nationality: kyc.nationality,
    step: kyc.step,
    submitted_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}

export async function updateKycStatus(userId: string, status: string): Promise<void> {
  await supabaseAdmin.from("kyc_submissions").update({ status }).eq("user_id", userId);
}
