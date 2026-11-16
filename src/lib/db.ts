import fs from "fs";
import path from "path";

const DB_DIR  = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "db.json");

export interface DbUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  passwordHash: string;
  queuePosition: number;
  kycStatus: "none" | "pending" | "under_review" | "approved" | "rejected";
  loanStatus: "none" | "pending" | "approved" | "disbursed";
  loanAmount: number;
  activationFeePaid: boolean;
  activationFeeRefundRequested: boolean;
  loanWithdrawnToExternal: boolean;
  createdAt: string;
}

export interface DbSession {
  token: string;
  userId: string;
  expiresAt: string;
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
  type: "deposit" | "withdrawal" | "loan_credit" | "trade" | "fee" | "refund";
  asset: string;
  amount: number;
  fee?: number;
  status: "pending" | "processing" | "completed" | "failed";
  date: string;
  desc: string;
  txHash?: string;
  address?: string;
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
  status: "pending" | "under_review" | "approved" | "rejected";
  submittedAt: string;
}

export interface Database {
  users: DbUser[];
  sessions: DbSession[];
  walletBalances: DbWalletBalance[];
  transactions: DbTransaction[];
  kyc: DbKyc[];
  nextQueuePosition: number;
}

function getInitial(): Database {
  return {
    users: [],
    sessions: [],
    walletBalances: [],
    transactions: [],
    kyc: [],
    nextQueuePosition: 150,
  };
}

export function readDb(): Database {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    const init = getInitial();
    fs.writeFileSync(DB_PATH, JSON.stringify(init, null, 2), "utf-8");
    return init;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as Database;
}

export function writeDb(db: Database): void {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export function getSessionUser(token: string | undefined): DbUser | null {
  if (!token) return null;
  const db = readDb();
  const session = db.sessions.find(
    (s) => s.token === token && new Date(s.expiresAt) > new Date()
  );
  if (!session) return null;
  return db.users.find((u) => u.id === session.userId) ?? null;
}

export function getUserWallet(userId: string): DbWalletBalance[] {
  const db = readDb();
  return db.walletBalances.filter((b) => b.userId === userId);
}

export function getUserTransactions(userId: string): DbTransaction[] {
  const db = readDb();
  return db.transactions
    .filter((t) => t.userId === userId)
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}
