import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { HDKey } from "@scure/bip32";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { createHash } from "crypto";

const USDT_TRC20 = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const TRONGRID   = "https://api.trongrid.io";
const BASE58_ALPHA = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(buf: Buffer): string {
  let n = BigInt("0x" + buf.toString("hex"));
  let s = "";
  while (n > 0n) { s = BASE58_ALPHA[Number(n % 58n)] + s; n /= 58n; }
  for (const b of buf) { if (b !== 0) break; s = "1" + s; }
  return s;
}

function privKeyToTronAddress(privKey: Uint8Array): string {
  const pub  = secp256k1.getPublicKey(privKey, false).slice(1); // 64 bytes (drop 0x04)
  const hash = keccak_256(pub).slice(12);                       // last 20 bytes
  const payload  = Buffer.concat([Buffer.from([0x41]), Buffer.from(hash)]);
  const h1       = createHash("sha256").update(payload).digest();
  const checksum = createHash("sha256").update(h1).digest().slice(0, 4);
  return base58Encode(Buffer.concat([payload, checksum]));
}

export function newMnemonic(): string {
  return generateMnemonic(128);
}

export function deriveAddress(mnemonic: string, index: number): string {
  const seed  = mnemonicToSeedSync(mnemonic);
  const root  = HDKey.fromMasterSeed(seed);
  const child = root.derive(`m/44'/195'/0'/0/${index}`);
  if (!child.privateKey) throw new Error("HD derivation failed");
  return privKeyToTronAddress(child.privateKey);
}

export interface TronDeposit {
  txHash: string;
  amount: number;
  timestamp: number;
}

export async function fetchUsdtDeposits(address: string): Promise<TronDeposit[]> {
  try {
    const url = `${TRONGRID}/v1/accounts/${address}/transactions/trc20?only_to=true&limit=50&contract_address=${USDT_TRC20}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const { data = [] } = (await res.json()) as { data?: any[] };
    return data
      .filter((tx: any) => tx.to === address)
      .map((tx: any) => ({
        txHash:    tx.transaction_id as string,
        amount:    Number(tx.value) / 1_000_000, // USDT has 6 decimals on TRON
        timestamp: tx.block_timestamp as number,
      }));
  } catch {
    return [];
  }
}
