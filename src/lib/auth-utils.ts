import bcrypt from "bcryptjs";

export const SESSION_COOKIE = "nb_session";
export const ASSETS = ["USDT", "BTC", "ETH", "BNB", "SOL", "XRP"];

export const WITHDRAWAL_FEES_CONFIG: Record<string, { fee: number; min: number; network: string }> = {
  USDT: { fee: 1,      min: 10,    network: "TRON (TRC20)" },
  BTC:  { fee: 0.0001, min: 0.001, network: "Bitcoin (BTC)" },
  ETH:  { fee: 0.004,  min: 0.01,  network: "Ethereum (ERC20)" },
  BNB:  { fee: 0.001,  min: 0.01,  network: "BNB Chain (BEP20)" },
  SOL:  { fee: 0.01,   min: 0.1,   network: "Solana (SOL)" },
  XRP:  { fee: 0.25,   min: 1,     network: "XRP Ledger" },
};

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(): string {
  return (
    crypto.randomUUID().replace(/-/g, "") +
    crypto.randomUUID().replace(/-/g, "")
  );
}
