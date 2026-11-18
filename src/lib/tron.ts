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

function base58Decode(str: string): Buffer {
  let n = 0n;
  for (const ch of str) {
    const idx = BASE58_ALPHA.indexOf(ch);
    if (idx < 0) throw new Error(`Invalid base58 char: ${ch}`);
    n = n * 58n + BigInt(idx);
  }
  const bytes: number[] = [];
  while (n > 0n) { bytes.unshift(Number(n & 0xffn)); n >>= 8n; }
  let leading = 0;
  for (const ch of str) { if (ch === "1") leading++; else break; }
  return Buffer.from([...Array(leading).fill(0), ...bytes]);
}

function tronAddrToHex21(addr: string): string {
  return base58Decode(addr).slice(0, 21).toString("hex"); // 42 hex chars: 0x41 + 20 bytes
}

function tronAddrToHex20(addr: string): string {
  return base58Decode(addr).slice(1, 21).toString("hex"); // 20 bytes (EVM-style, for ABI encoding)
}

function privKeyToTronAddress(privKey: Uint8Array): string {
  const pub  = secp256k1.getPublicKey(privKey, false).slice(1);
  const hash = keccak_256(pub).slice(12);
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

export function derivePrivateKey(mnemonic: string, index: number): Uint8Array {
  const seed  = mnemonicToSeedSync(mnemonic);
  const root  = HDKey.fromMasterSeed(seed);
  const child = root.derive(`m/44'/195'/0'/0/${index}`);
  if (!child.privateKey) throw new Error("HD derivation failed");
  return child.privateKey;
}

// Exchange hot wallet — account index 1, completely separate from user deposit addresses (account 0)
export function getExchangeWallet(mnemonic: string): { address: string; privateKey: Uint8Array } {
  const seed  = mnemonicToSeedSync(mnemonic);
  const root  = HDKey.fromMasterSeed(seed);
  const child = root.derive(`m/44'/195'/1'/0/0`);
  if (!child.privateKey) throw new Error("HD derivation failed");
  return { address: privKeyToTronAddress(child.privateKey), privateKey: child.privateKey };
}

export interface TronDeposit {
  txHash: string;
  amount: number;
  timestamp: number;
  confirmed: boolean;
}

export async function fetchUsdtDeposits(address: string): Promise<TronDeposit[]> {
  try {
    const url = `${TRONGRID}/v1/accounts/${address}/transactions/trc20?only_to=true&limit=50&contract_address=${USDT_TRC20}`;
    const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) return [];
    const { data = [] } = (await res.json()) as { data?: any[] };
    return data
      .filter((tx: any) => tx.to === address)
      .map((tx: any) => ({
        txHash:    tx.transaction_id as string,
        amount:    Number(tx.value) / 1_000_000,
        timestamp: tx.block_timestamp as number,
        confirmed: true,
      }));
  } catch {
    return [];
  }
}

export async function fetchPendingUsdtDeposits(address: string): Promise<TronDeposit[]> {
  try {
    const url = `${TRONGRID}/v1/accounts/${address}/transactions/trc20?only_to=true&limit=10&only_unconfirmed=true&contract_address=${USDT_TRC20}`;
    const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) return [];
    const { data = [] } = (await res.json()) as { data?: any[] };
    return data
      .filter((tx: any) => tx.to === address)
      .map((tx: any) => ({
        txHash:    tx.transaction_id as string,
        amount:    Number(tx.value) / 1_000_000,
        timestamp: tx.block_timestamp as number,
        confirmed: false,
      }));
  } catch {
    return [];
  }
}

// Send USDT TRC20 from fromAddress to toAddress
// Returns the on-chain txHash on success
export async function sendUsdt(
  fromPrivateKey: Uint8Array,
  fromAddress: string,
  toAddress: string,
  amountUsdt: number,
): Promise<string> {
  const amountRaw = BigInt(Math.round(amountUsdt * 1_000_000));

  const fromHex = tronAddrToHex21(fromAddress);
  const toHex20 = tronAddrToHex20(toAddress);
  const usdtHex = tronAddrToHex21(USDT_TRC20);

  // ABI-encode transfer(address,uint256): 32-byte address + 32-byte amount
  const param = toHex20.padStart(64, "0") + amountRaw.toString(16).padStart(64, "0");

  // Step 1: Build the raw transaction
  const triggerRes = await fetch(`${TRONGRID}/wallet/triggersmartcontract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      owner_address:    fromHex,
      contract_address: usdtHex,
      function_selector: "transfer(address,uint256)",
      parameter: param,
      fee_limit:  50_000_000, // 50 TRX max fee
      call_value: 0,
      visible:    false,
    }),
  });

  if (!triggerRes.ok) {
    throw new Error(`TronGrid triggersmartcontract HTTP ${triggerRes.status}`);
  }
  const triggerData = await triggerRes.json();
  if (!triggerData.result?.result) {
    throw new Error(`Transaction build failed: ${JSON.stringify(triggerData.result ?? triggerData)}`);
  }

  const rawTx = triggerData.transaction as { txID: string; raw_data: object; raw_data_hex: string };

  // Step 2: Sign the txID with secp256k1
  // Cast needed: @noble/curves RecoveredSignatureType methods not reflected in all TS builds
  const hash = Buffer.from(rawTx.txID, "hex");
  const sig  = secp256k1.sign(hash, fromPrivateKey, { lowS: true }) as unknown as {
    toCompactRawBytes(): Uint8Array;
    recovery: number;
  };
  const sigHex = Buffer.concat([
    Buffer.from(sig.toCompactRawBytes()),  // 64 bytes: r + s
    Buffer.from([sig.recovery ?? 0]),       // 1 byte: v
  ]).toString("hex");

  // Step 3: Broadcast signed transaction
  const broadcastRes = await fetch(`${TRONGRID}/wallet/broadcasttransaction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...rawTx, signature: [sigHex] }),
  });

  if (!broadcastRes.ok) {
    throw new Error(`TronGrid broadcasttransaction HTTP ${broadcastRes.status}`);
  }
  const broadcastData = await broadcastRes.json();
  if (!broadcastData.result) {
    throw new Error(`Broadcast rejected: ${JSON.stringify(broadcastData)}`);
  }

  return rawTx.txID;
}
