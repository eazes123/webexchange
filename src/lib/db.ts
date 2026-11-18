import { supabaseAdmin } from "./supabase";

// ── Types ─────────────────────────────────────────────────────────────────────
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
  depositAddress: string | null;
  addressIndex: number | null;
  stakeAmount: number;
  stakeStatus: "none" | "active" | "unstaked" | "rewarded";
  stakedAt: string | null;
  rewardDistributed: boolean;
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

export interface DbWithdrawalRequest {
  id: string;
  userId: string;
  asset: string;
  amount: number;
  fee: number;
  destinationAddress: string;
  status: "pending" | "approved" | "rejected" | "processing";
  adminNote: string | null;
  processedAt: string | null;
  createdAt: string;
  user?: { fullName: string; email: string };
}

// ── Row → Domain mappers ───────────────────────────────────────────────────────
function rowToUser(r: any): DbUser {
  return {
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone ?? "",
    country: r.country ?? "",
    passwordHash: r.password_hash,
    queuePosition: r.queue_position ?? 0,
    kycStatus: r.kyc_status,
    loanStatus: r.loan_status,
    loanAmount: Number(r.loan_amount ?? 50000),
    activationFeePaid: r.activation_fee_paid ?? false,
    activationFeeRefundRequested: r.activation_fee_refund_requested ?? false,
    loanWithdrawnToExternal: r.loan_withdrawn_to_external ?? false,
    depositAddress: r.deposit_address ?? null,
    addressIndex: r.address_index ?? null,
    stakeAmount: Number(r.stake_amount ?? 0),
    stakeStatus: r.stake_status ?? "none",
    stakedAt: r.staked_at ?? null,
    rewardDistributed: r.reward_distributed ?? false,
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
    userId: r.user_id, step: r.step, fullName: r.full_name ?? "", dob: r.dob ?? "",
    address: r.address ?? "", idType: r.id_type ?? "", idNumber: r.id_number ?? "",
    nationality: r.nationality ?? "", status: r.status,
    submittedAt: r.submitted_at,
  };
}

function rowToWithdrawal(r: any): DbWithdrawalRequest {
  return {
    id: r.id, userId: r.user_id, asset: r.asset,
    amount: Number(r.amount), fee: Number(r.fee ?? 0),
    destinationAddress: r.destination_address, status: r.status,
    adminNote: r.admin_note ?? null, processedAt: r.processed_at ?? null,
    createdAt: r.created_at,
    user: r.users ? { fullName: r.users.full_name, email: r.users.email } : undefined,
  };
}

// ── Session helpers ────────────────────────────────────────────────────────────
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

// ── User helpers ───────────────────────────────────────────────────────────────
export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const { data } = await supabaseAdmin
    .from("users").select("*").eq("email", email.toLowerCase().trim()).single();
  return data ? rowToUser(data) : null;
}

export async function createUser(user: Omit<DbUser, "id" | "createdAt">): Promise<DbUser> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      full_name: user.fullName, email: user.email, phone: user.phone,
      country: user.country, password_hash: user.passwordHash,
      queue_position: user.queuePosition, kyc_status: user.kycStatus,
      loan_status: user.loanStatus, loan_amount: user.loanAmount,
      activation_fee_paid: user.activationFeePaid,
      activation_fee_refund_requested: user.activationFeeRefundRequested,
      loan_withdrawn_to_external: user.loanWithdrawnToExternal,
      deposit_address: user.depositAddress,
      address_index: user.addressIndex,
      stake_amount: 0, stake_status: "none",
    })
    .select().single();
  if (error) throw new Error(error.message);
  return rowToUser(data);
}

export async function updateUser(userId: string, fields: Partial<{
  kycStatus: string; loanStatus: string; activationFeePaid: boolean;
  activationFeeRefundRequested: boolean; loanWithdrawnToExternal: boolean;
  depositAddress: string; addressIndex: number;
  stakeAmount: number; stakeStatus: string; stakedAt: string | null;
  rewardDistributed: boolean;
}>): Promise<void> {
  const row: any = {};
  if (fields.kycStatus !== undefined)                  row.kyc_status = fields.kycStatus;
  if (fields.loanStatus !== undefined)                 row.loan_status = fields.loanStatus;
  if (fields.activationFeePaid !== undefined)          row.activation_fee_paid = fields.activationFeePaid;
  if (fields.activationFeeRefundRequested !== undefined) row.activation_fee_refund_requested = fields.activationFeeRefundRequested;
  if (fields.loanWithdrawnToExternal !== undefined)    row.loan_withdrawn_to_external = fields.loanWithdrawnToExternal;
  if (fields.depositAddress !== undefined)             row.deposit_address = fields.depositAddress;
  if (fields.addressIndex !== undefined)               row.address_index = fields.addressIndex;
  if (fields.stakeAmount !== undefined)                row.stake_amount = fields.stakeAmount;
  if (fields.stakeStatus !== undefined)                row.stake_status = fields.stakeStatus;
  if (Object.prototype.hasOwnProperty.call(fields, "stakedAt")) row.staked_at = fields.stakedAt;
  if (fields.rewardDistributed !== undefined)          row.reward_distributed = fields.rewardDistributed;
  const { error } = await supabaseAdmin.from("users").update(row).eq("id", userId);
  if (error) throw new Error(`updateUser failed: ${error.message}`);
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

// ── Wallet helpers ─────────────────────────────────────────────────────────────
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
    if (delta.setLocked !== undefined)    row.locked    = delta.setLocked;
    await supabaseAdmin.from("wallet_balances").update(row).eq("user_id", userId).eq("symbol", symbol);
  } else {
    const { data } = await supabaseAdmin.from("wallet_balances")
      .select("available, locked").eq("user_id", userId).eq("symbol", symbol).single();
    if (!data) {
      // Auto-create if missing
      await supabaseAdmin.from("wallet_balances").insert({
        user_id: userId, symbol,
        available: Math.max(0, delta.available ?? 0),
        locked:    Math.max(0, delta.locked ?? 0),
      });
      return;
    }
    const row: any = {};
    if (delta.available !== undefined) row.available = Number(data.available) + delta.available;
    if (delta.locked    !== undefined) row.locked    = Number(data.locked)    + delta.locked;
    await supabaseAdmin.from("wallet_balances").update(row).eq("user_id", userId).eq("symbol", symbol);
  }
}

// ── Transaction helpers ────────────────────────────────────────────────────────
export async function getUserTransactions(userId: string): Promise<DbTransaction[]> {
  const { data } = await supabaseAdmin.from("transactions").select("*")
    .eq("user_id", userId).order("created_at", { ascending: false });
  return (data ?? []).map(rowToTx);
}

export async function createTransaction(tx: Omit<DbTransaction, "id">): Promise<void> {
  await supabaseAdmin.from("transactions").insert({
    user_id: tx.userId, type: tx.type, asset: tx.asset, amount: tx.amount,
    fee: tx.fee ?? 0, status: tx.status, date: tx.date,
    description: tx.desc, address: tx.address, tx_hash: tx.txHash,
  });
}

// ── KYC helpers ────────────────────────────────────────────────────────────────
export async function getKyc(userId: string): Promise<DbKyc | null> {
  const { data } = await supabaseAdmin.from("kyc_submissions").select("*").eq("user_id", userId).single();
  return data ? rowToKyc(data) : null;
}

export async function upsertKyc(kyc: Omit<DbKyc, "submittedAt">): Promise<void> {
  await supabaseAdmin.from("kyc_submissions").upsert({
    user_id: kyc.userId, status: kyc.status, full_name: kyc.fullName,
    dob: kyc.dob, address: kyc.address, id_type: kyc.idType,
    id_number: kyc.idNumber, nationality: kyc.nationality,
    step: kyc.step, submitted_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}

export async function updateKycStatus(userId: string, status: string): Promise<void> {
  await supabaseAdmin.from("kyc_submissions").update({ status }).eq("user_id", userId);
}

export interface AdminKycSubmission extends DbKyc {
  userFullName: string;
  userEmail: string;
  userCountry: string;
  userKycStatus: string;
}

export async function getAllKycSubmissions(): Promise<AdminKycSubmission[]> {
  const { data } = await supabaseAdmin
    .from("kyc_submissions")
    .select("*, users!inner(full_name, email, country, kyc_status)")
    .order("submitted_at", { ascending: false });
  return (data ?? []).map(r => ({
    ...rowToKyc(r),
    userId: r.user_id,
    userFullName: r.users?.full_name ?? "",
    userEmail: r.users?.email ?? "",
    userCountry: r.users?.country ?? "",
    userKycStatus: r.users?.kyc_status ?? "none",
  }));
}

export interface AdminTransaction extends DbTransaction {
  userFullName: string;
  userEmail: string;
}

export async function getAllTransactions(limit = 200): Promise<AdminTransaction[]> {
  const { data } = await supabaseAdmin
    .from("transactions")
    .select("*, users!inner(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(r => ({
    ...rowToTx(r),
    userFullName: r.users?.full_name ?? "",
    userEmail: r.users?.email ?? "",
  }));
}

// ── Deposit helpers ────────────────────────────────────────────────────────────
export async function isDepositProcessed(txHash: string): Promise<boolean> {
  const { data } = await supabaseAdmin.from("processed_deposits").select("id").eq("tx_hash", txHash).single();
  return !!data;
}

export async function markDepositProcessed(txHash: string, userId: string, amount: number): Promise<void> {
  await supabaseAdmin.from("processed_deposits").insert({
    tx_hash: txHash, user_id: userId, asset: "USDT", amount,
  });
}

// ── Campaign / Staking ─────────────────────────────────────────────────────────
export async function stakeForCampaign(userId: string, amount: number): Promise<void> {
  await updateWalletBalance(userId, "USDT", { available: -amount, locked: amount });
  await updateUser(userId, {
    stakeAmount: amount, stakeStatus: "active",
    stakedAt: new Date().toISOString(),
  });
  await createTransaction({
    userId, type: "stake", asset: "USDT", amount,
    status: "completed", date: new Date().toISOString().split("T")[0],
    desc: "New Year Campaign Stake: Locked until Dec 31, 2026",
  });
}

export async function unstakeFromCampaign(userId: string, stakeAmount: number): Promise<void> {
  await updateWalletBalance(userId, "USDT", { available: stakeAmount, locked: -stakeAmount });
  await updateUser(userId, { stakeAmount: 0, stakeStatus: "unstaked", stakedAt: null });
  await createTransaction({
    userId, type: "unstake", asset: "USDT", amount: stakeAmount,
    status: "completed", date: new Date().toISOString().split("T")[0],
    desc: "Campaign Unstake: Loan eligibility forfeited",
  });
}

export async function getLoanRepaymentTotal(userId: string): Promise<number> {
  try {
    const { data } = await supabaseAdmin
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "loan_repayment")
      .eq("status", "completed");
    return (data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);
  } catch { return 0; }
}

export async function getCampaignStats(): Promise<{ totalParticipants: number; totalStaked: number }> {
  try {
    const { data } = await supabaseAdmin
      .from("users")
      .select("stake_amount")
      .in("stake_status", ["active", "rewarded"]);
    const rows = data ?? [];
    return {
      totalParticipants: rows.length,
      totalStaked: rows.reduce((s, r) => s + (r.stake_amount ?? 0), 0),
    };
  } catch { return { totalParticipants: 0, totalStaked: 0 }; }
}

export async function distributeReward(userId: string, stakeAmount: number): Promise<void> {
  const reward = 50_000;
  // Return stake + credit reward
  await updateWalletBalance(userId, "USDT", { available: stakeAmount + reward, locked: -stakeAmount });
  await updateUser(userId, { stakeStatus: "rewarded", rewardDistributed: true });
  await createTransaction({
    userId, type: "reward", asset: "USDT", amount: reward,
    status: "completed", date: new Date().toISOString().split("T")[0],
    desc: "🎉 New Year Campaign Loan: $50,000 USDT",
    txHash: `0x${crypto.randomUUID().replace(/-/g, "")}`,
  });
}

// ── Withdrawal requests ────────────────────────────────────────────────────────
export async function createWithdrawalRequest(req: {
  userId: string; asset: string; amount: number; fee: number; destinationAddress: string;
}): Promise<void> {
  await supabaseAdmin.from("withdrawal_requests").insert({
    user_id: req.userId, asset: req.asset, amount: req.amount,
    fee: req.fee, destination_address: req.destinationAddress, status: "pending",
  });
  // Immediately lock the amount so user can't double-spend
  await updateWalletBalance(req.userId, req.asset, { available: -req.amount, locked: req.amount });
  await createTransaction({
    userId: req.userId, type: "withdrawal", asset: req.asset, amount: req.amount,
    fee: req.fee, status: "pending", date: new Date().toISOString().split("T")[0],
    desc: `${req.asset} Withdrawal: Pending Admin Approval`,
    address: req.destinationAddress,
  });
}

export async function getWithdrawalRequests(status?: string): Promise<DbWithdrawalRequest[]> {
  let q = supabaseAdmin
    .from("withdrawal_requests")
    .select("*, users(full_name, email)")
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (data ?? []).map(rowToWithdrawal);
}

export async function getUserWithdrawalRequests(userId: string): Promise<DbWithdrawalRequest[]> {
  const { data } = await supabaseAdmin.from("withdrawal_requests")
    .select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return (data ?? []).map(rowToWithdrawal);
}

export async function getWithdrawalById(id: string): Promise<DbWithdrawalRequest | null> {
  const { data } = await supabaseAdmin.from("withdrawal_requests").select("*").eq("id", id).single();
  return data ? rowToWithdrawal(data) : null;
}

export async function approveWithdrawal(id: string): Promise<void> {
  const { data } = await supabaseAdmin.from("withdrawal_requests").select("*").eq("id", id).single();
  if (!data || data.status !== "pending") throw new Error("Not found or already processed");
  await supabaseAdmin.from("withdrawal_requests").update({
    status: "approved", processed_at: new Date().toISOString(),
  }).eq("id", id);
  await updateWalletBalance(data.user_id, data.asset, { locked: -Number(data.amount) });
  await supabaseAdmin.from("transactions")
    .update({ status: "completed" })
    .eq("user_id", data.user_id)
    .eq("type", "withdrawal")
    .eq("amount", data.amount)
    .eq("status", "pending");
}

// Two-step USDT auto-send flow:
// 1. processWithdrawal  — mark as "processing" before sending on-chain
// 2. finalizeWithdrawal — deduct balance + set approved + store txHash
// 3. failWithdrawal     — reset to pending so admin can retry

export async function processWithdrawal(id: string): Promise<DbWithdrawalRequest> {
  const { data, error } = await supabaseAdmin.from("withdrawal_requests")
    .update({ status: "processing" })
    .eq("id", id)
    .eq("status", "pending")
    .select("*")
    .single();
  if (error || !data) throw new Error("Withdrawal not found or already processing");
  return rowToWithdrawal(data);
}

export async function finalizeWithdrawal(id: string, txHash: string): Promise<void> {
  const { data } = await supabaseAdmin.from("withdrawal_requests").select("*").eq("id", id).single();
  if (!data) throw new Error("Withdrawal not found");
  await supabaseAdmin.from("withdrawal_requests").update({
    status: "approved", processed_at: new Date().toISOString(),
  }).eq("id", id);
  await updateWalletBalance(data.user_id, data.asset, { locked: -Number(data.amount) });
  await supabaseAdmin.from("transactions")
    .update({
      status: "completed",
      tx_hash: txHash,
      description: `${data.asset} Withdrawal: Sent on-chain`,
    })
    .eq("user_id", data.user_id)
    .eq("type", "withdrawal")
    .eq("asset", data.asset)
    .eq("status", "pending");
}

export async function failWithdrawal(id: string, errorMsg: string): Promise<void> {
  await supabaseAdmin.from("withdrawal_requests").update({
    status: "pending",
    admin_note: `Auto-send failed: ${errorMsg.slice(0, 300)}`,
  }).eq("id", id);
}

export async function rejectWithdrawal(id: string, adminNote?: string): Promise<void> {
  const { data } = await supabaseAdmin.from("withdrawal_requests").select("*").eq("id", id).single();
  if (!data || data.status !== "pending") throw new Error("Not found or already processed");
  await supabaseAdmin.from("withdrawal_requests").update({
    status: "rejected", admin_note: adminNote ?? null, processed_at: new Date().toISOString(),
  }).eq("id", id);
  // Return locked amount to available
  await updateWalletBalance(data.user_id, data.asset, { available: Number(data.amount), locked: -Number(data.amount) });
  await supabaseAdmin.from("transactions")
    .update({ status: "failed", description: `Rejected: ${adminNote ?? "Admin rejection"}` })
    .eq("user_id", data.user_id)
    .eq("type", "withdrawal")
    .eq("amount", data.amount)
    .eq("status", "pending");
}

// ── Settings ───────────────────────────────────────────────────────────────────
export async function getSetting(key: string): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin.from("settings").select("value").eq("key", key).single();
    return data?.value ?? null;
  } catch {
    return null;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await supabaseAdmin.from("settings").upsert({ key, value }, { onConflict: "key" });
}
