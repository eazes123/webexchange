import { mnemonicToSeedSync } from "bip39";
import { HDKey } from "@scure/bip32";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { keccak_256 } from "@noble/hashes/sha3.js";

const USDT_BEP20   = "0x55d398326f99059fF775485246999027B3197955";
const BSCSCAN_BASE = "https://api.bscscan.com/api"; // kept for reference
const BSC_RPC      = "https://bsc-dataseed.binance.org/";
// PublicNode supports eth_getLogs up to 10000 blocks; Binance nodes do not
const BSC_LOGS_RPC = "https://bsc-rpc.publicnode.com";
const CHAIN_ID     = 56n;
const USDT_DECIMALS = 18; // BEP20 USDT has 18 decimals

// ── Address helpers ───────────────────────────────────────────────────────────

function privKeyToEvmAddress(privKey: Uint8Array): string {
  const pub  = secp256k1.getPublicKey(privKey, false).slice(1); // 64 bytes (drop 0x04 prefix)
  const hash = keccak_256(pub);                                  // 32 bytes
  const raw  = Buffer.from(hash.slice(12)).toString("hex");     // last 20 bytes → 40 hex
  return toChecksumAddress(raw);
}

function toChecksumAddress(hex: string): string {
  const lower = hex.toLowerCase().replace(/^0x/, "");
  const hash  = Buffer.from(keccak_256(Buffer.from(lower, "ascii"))).toString("hex");
  let result = "0x";
  for (let i = 0; i < 40; i++) {
    result += parseInt(hash[i], 16) >= 8 ? lower[i].toUpperCase() : lower[i];
  }
  return result;
}

export function deriveEvmAddress(mnemonic: string, index: number): string {
  const seed  = mnemonicToSeedSync(mnemonic);
  const root  = HDKey.fromMasterSeed(seed);
  const child = root.derive(`m/44'/60'/0'/0/${index}`);
  if (!child.privateKey) throw new Error("HD derivation failed");
  return privKeyToEvmAddress(child.privateKey);
}

export function deriveEvmPrivateKey(mnemonic: string, index: number): Uint8Array {
  const seed  = mnemonicToSeedSync(mnemonic);
  const root  = HDKey.fromMasterSeed(seed);
  const child = root.derive(`m/44'/60'/0'/0/${index}`);
  if (!child.privateKey) throw new Error("HD derivation failed");
  return child.privateKey;
}

// Exchange hot wallet — account index 1
export function getEvmExchangeWallet(mnemonic: string): { address: string; privateKey: Uint8Array } {
  const seed  = mnemonicToSeedSync(mnemonic);
  const root  = HDKey.fromMasterSeed(seed);
  const child = root.derive(`m/44'/60'/1'/0/0`);
  if (!child.privateKey) throw new Error("HD derivation failed");
  return { address: privKeyToEvmAddress(child.privateKey), privateKey: child.privateKey };
}

// ── Deposit types ─────────────────────────────────────────────────────────────

export interface BscDeposit {
  txHash:    string;
  amount:    number;
  timestamp: number;
  confirmed: boolean;
}

// ── ERC20 Transfer event topic ────────────────────────────────────────────────
// keccak256("Transfer(address,address,uint256)") = 0xddf252ad...
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

// ── BSCScan fetch helpers (kept for reference, replaced by RPC approach) ──────

function bscscanKey(): string {
  return process.env.BSCSCAN_API_KEY ?? "";
}

// Fetch BEP20 USDT deposits using direct BSC RPC eth_getLogs.
// Uses publicnode.com which supports up to 10000-block range.
export async function fetchBep20Deposits(address: string): Promise<BscDeposit[]> {
  try {
    const paddedAddr = "0x" + address.toLowerCase().replace(/^0x/, "").padStart(64, "0");

    // Get latest block from logs RPC
    const latestRes = await rpcCallTo(BSC_LOGS_RPC, "eth_blockNumber", []);
    if (latestRes.error) return [];
    const latestBlock = BigInt(latestRes.result);

    // 5000 blocks ≈ 4 hours on BSC (3-second blocks)
    const BLOCK_RANGE = 5000n;
    const fromBlock = "0x" + (latestBlock - BLOCK_RANGE).toString(16);
    const toBlock   = "0x" + latestBlock.toString(16);

    const logsRes = await rpcCallTo(BSC_LOGS_RPC, "eth_getLogs", [{
      fromBlock,
      toBlock,
      address:  USDT_BEP20,
      topics:   [TRANSFER_TOPIC, null, paddedAddr], // Transfer(*, to=address, *)
    }]);

    if (logsRes.error || !Array.isArray(logsRes.result)) return [];

    return logsRes.result
      .map((log: any) => ({
        txHash:    log.transactionHash as string,
        amount:    Number(BigInt(log.data)) / 10 ** USDT_DECIMALS,
        timestamp: Date.now(), // block timestamp fetch skipped to reduce RPC calls
        confirmed: true,
      }))
      .filter((d: BscDeposit) => d.amount > 0);
  } catch {
    return [];
  }
}

// BSCScan does not expose a mempool endpoint; we return an empty array for pending
export async function fetchPendingBep20Deposits(_address: string): Promise<BscDeposit[]> {
  return [];
}

export async function fetchBnbBalance(address: string): Promise<number> {
  try {
    const res = await rpcCall("eth_getBalance", [address, "latest"]);
    if (res.error) return 0;
    return Number(BigInt(res.result)) / 10 ** 18;
  } catch {
    return 0;
  }
}

// Send native BNB from one address to another (for gas sponsoring)
export async function sendBnb(
  fromPrivateKey: Uint8Array,
  fromAddress:   string,
  toAddress:     string,
  amountBnb:     number,
): Promise<string> {
  const amountRaw = BigInt(Math.round(amountBnb * 10 ** 18));

  const [nonceResult, gasPriceResult] = await Promise.all([
    rpcCall("eth_getTransactionCount", [fromAddress, "latest"]),
    rpcCall("eth_gasPrice",            []),
  ]);
  if (nonceResult.error)    throw new Error(`Nonce fetch failed: ${nonceResult.error.message}`);
  if (gasPriceResult.error) throw new Error(`GasPrice fetch failed: ${gasPriceResult.error.message}`);

  const nonce    = BigInt(nonceResult.result);
  const gasPrice = BigInt(gasPriceResult.result);
  const gasLimit = 21000n; // standard native transfer
  const toBytes  = Buffer.from(toAddress.replace(/^0x/, ""), "hex");

  const signingPayload = rlpList([
    bigIntToBytes(nonce),
    bigIntToBytes(gasPrice),
    bigIntToBytes(gasLimit),
    toBytes,
    bigIntToBytes(amountRaw),
    new Uint8Array(0), // empty data for native transfer
    bigIntToBytes(CHAIN_ID),
    new Uint8Array(0),
    new Uint8Array(0),
  ]);

  const msgHash = keccak_256(signingPayload);
  const sig = secp256k1.sign(msgHash, fromPrivateKey, { lowS: true }) as unknown as {
    toCompactRawBytes(): Uint8Array; recovery: number;
  };

  const v       = BigInt(sig.recovery ?? 0) + 27n + CHAIN_ID * 2n + 8n;
  const compact = sig.toCompactRawBytes();
  const r       = compact.slice(0, 32);
  const s       = compact.slice(32, 64);

  const rawTx = rlpList([
    bigIntToBytes(nonce),
    bigIntToBytes(gasPrice),
    bigIntToBytes(gasLimit),
    toBytes,
    bigIntToBytes(amountRaw),
    new Uint8Array(0),
    bigIntToBytes(v),
    r,
    s,
  ]);

  const rawHex        = "0x" + Buffer.from(rawTx).toString("hex");
  const broadcastResult = await rpcCall("eth_sendRawTransaction", [rawHex]);
  if (broadcastResult.error) throw new Error(`BSC broadcast failed: ${broadcastResult.error.message}`);
  return broadcastResult.result as string;
}

export async function fetchBep20Balance(address: string): Promise<number> {
  try {
    // Use eth_call to invoke balanceOf(address) on the USDT contract (no BscScan needed)
    const paddedAddr = "0x" + address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    // balanceOf selector = 0x70a08231
    const data = "0x70a08231" + paddedAddr.slice(2);
    const res  = await rpcCall("eth_call", [{ to: USDT_BEP20, data }, "latest"]);
    if (res.error || !res.result || res.result === "0x") return 0;
    return Number(BigInt(res.result)) / 10 ** USDT_DECIMALS;
  } catch {
    return 0;
  }
}

// ── Minimal RLP encoder ───────────────────────────────────────────────────────

function bigIntToBytes(n: bigint): Uint8Array {
  if (n === 0n) return new Uint8Array(0);
  const hex = n.toString(16);
  return Buffer.from(hex.length % 2 ? "0" + hex : hex, "hex");
}

function rlpLengthPrefix(len: number, offset: number): Uint8Array {
  if (len <= 55) return new Uint8Array([offset + len]);
  const lenBytes = bigIntToBytes(BigInt(len));
  return new Uint8Array([offset + 55 + lenBytes.length, ...lenBytes]);
}

function rlpBytes(data: Uint8Array): Uint8Array {
  if (data.length === 0) return new Uint8Array([0x80]);
  if (data.length === 1 && data[0] < 0x80) return data;
  const prefix = rlpLengthPrefix(data.length, 0x80);
  const out = new Uint8Array(prefix.length + data.length);
  out.set(prefix); out.set(data, prefix.length);
  return out;
}

function rlpList(items: Uint8Array[]): Uint8Array {
  const body = concatAll(items.map(rlpBytes));
  const prefix = rlpLengthPrefix(body.length, 0xc0);
  const out = new Uint8Array(prefix.length + body.length);
  out.set(prefix); out.set(body, prefix.length);
  return out;
}

function concatAll(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

// ── ERC20 ABI encode ──────────────────────────────────────────────────────────

function encodeTransfer(to: string, amount: bigint): Uint8Array {
  const selector  = Buffer.from("a9059cbb", "hex"); // transfer(address,uint256)
  const paddedTo  = Buffer.from(to.toLowerCase().replace(/^0x/, "").padStart(64, "0"), "hex");
  const paddedAmt = Buffer.from(amount.toString(16).padStart(64, "0"), "hex");
  return concatAll([selector, paddedTo, paddedAmt]);
}

// ── BSC JSON-RPC helpers ──────────────────────────────────────────────────────

async function rpcCallTo(endpoint: string, method: string, params: unknown[]): Promise<any> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`BSC RPC HTTP ${res.status}`);
  return res.json();
}

async function rpcCall(method: string, params: unknown[]): Promise<any> {
  return rpcCallTo(BSC_RPC, method, params);
}

// ── Send BEP20 USDT ───────────────────────────────────────────────────────────

export async function sendBep20Usdt(
  fromPrivateKey: Uint8Array,
  fromAddress:   string,
  toAddress:     string,
  amountUsdt:    number,
): Promise<string> {
  const amountRaw = BigInt(Math.round(amountUsdt * 10 ** USDT_DECIMALS));

  // Fetch nonce and gas price in parallel
  const [nonceResult, gasPriceResult] = await Promise.all([
    rpcCall("eth_getTransactionCount", [fromAddress, "latest"]),
    rpcCall("eth_gasPrice",            []),
  ]);

  if (nonceResult.error)    throw new Error(`Nonce fetch failed: ${nonceResult.error.message}`);
  if (gasPriceResult.error) throw new Error(`GasPrice fetch failed: ${gasPriceResult.error.message}`);

  const nonce    = BigInt(nonceResult.result);
  const gasPrice = BigInt(gasPriceResult.result);
  const gasLimit = 65000n;
  const value    = 0n;

  const toContract = Buffer.from(USDT_BEP20.replace(/^0x/, ""), "hex");
  const data       = encodeTransfer(toAddress, amountRaw);

  // EIP-155 signing payload: [nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0]
  const signingPayload = rlpList([
    bigIntToBytes(nonce),
    bigIntToBytes(gasPrice),
    bigIntToBytes(gasLimit),
    toContract,
    bigIntToBytes(value),
    data,
    bigIntToBytes(CHAIN_ID),
    new Uint8Array(0),
    new Uint8Array(0),
  ]);

  const msgHash = keccak_256(signingPayload);

  const sig = secp256k1.sign(msgHash, fromPrivateKey, { lowS: true }) as unknown as {
    toCompactRawBytes(): Uint8Array;
    recovery: number;
  };

  const v = BigInt(sig.recovery ?? 0) + 27n + CHAIN_ID * 2n + 8n; // EIP-155
  const compact = sig.toCompactRawBytes();
  const r = compact.slice(0, 32);
  const s = compact.slice(32, 64);

  // Signed tx: [nonce, gasPrice, gasLimit, to, value, data, v, r, s]
  const rawTx = rlpList([
    bigIntToBytes(nonce),
    bigIntToBytes(gasPrice),
    bigIntToBytes(gasLimit),
    toContract,
    bigIntToBytes(value),
    data,
    bigIntToBytes(v),
    r,
    s,
  ]);

  const rawHex = "0x" + Buffer.from(rawTx).toString("hex");

  const broadcastResult = await rpcCall("eth_sendRawTransaction", [rawHex]);
  if (broadcastResult.error) {
    throw new Error(`BSC broadcast failed: ${broadcastResult.error.message}`);
  }

  return broadcastResult.result as string; // txHash
}
