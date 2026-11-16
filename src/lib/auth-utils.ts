import bcrypt from "bcryptjs";

export const SESSION_COOKIE = "nb_session";
export const ASSETS = ["USDT", "BTC", "ETH", "BNB", "SOL", "XRP"];

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
