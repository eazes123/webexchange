import { create } from "zustand";
import { COINS, type Coin, type KycStatus, type LoanStatus } from "./mock-data";

export interface WalletBalance {
  symbol: string;
  available: number;
  locked: number;
}

export interface Transaction {
  id: string;
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

interface DemoUser {
  name: string;
  email: string;
  kycStatus: KycStatus;
  queuePosition: number;
  loanStatus: LoanStatus;
  loanAmount: number;
  activationFeePaid: boolean;
  activationFeeRefundRequested: boolean;
  loanWithdrawnToExternal: boolean;
}

const DEFAULT_USER: DemoUser = {
  name: "",
  email: "",
  kycStatus: "none",
  queuePosition: 0,
  loanStatus: "none",
  loanAmount: 50_000,
  activationFeePaid: false,
  activationFeeRefundRequested: false,
  loanWithdrawnToExternal: false,
};

const DEFAULT_BALANCES: Record<string, WalletBalance> = {
  USDT: { symbol: "USDT", available: 0, locked: 0 },
  BTC:  { symbol: "BTC",  available: 0, locked: 0 },
  ETH:  { symbol: "ETH",  available: 0, locked: 0 },
  BNB:  { symbol: "BNB",  available: 0, locked: 0 },
  SOL:  { symbol: "SOL",  available: 0, locked: 0 },
  XRP:  { symbol: "XRP",  available: 0, locked: 0 },
};

interface AppStore {
  coins: Coin[];
  isLoggedIn: boolean;
  demoUser: DemoUser;
  registeredEmail: string;
  walletBalances: Record<string, WalletBalance>;
  transactions: Transaction[];

  // Server sync
  hydrate: () => Promise<void>;
  fetchLivePrices: () => Promise<void>;

  // Auth
  setLoggedIn: (val: boolean) => void;
  setRegisteredEmail: (email: string) => void;
  logout: () => Promise<void>;

  // Local price animation (between API polls)
  updatePrices: () => void;

  // KYC
  setKycStatus: (status: KycStatus) => void;

  // Wallet mutations (optimistic + API)
  deposit: (asset: string, amount: number) => Promise<void>;
  withdraw: (asset: string, amount: number, address: string) => Promise<void>;

  // Activation fee
  payActivationFee: (asset: string) => Promise<void>;
  requestActivationRefund: () => Promise<void>;
  initiateExternalWithdrawal: (address: string) => Promise<void>;
}

export const useStore = create<AppStore>((set, get) => ({
  coins: COINS,
  isLoggedIn: false,
  registeredEmail: "",
  walletBalances: DEFAULT_BALANCES,
  transactions: [],
  demoUser: DEFAULT_USER,

  // ── Hydrate from server session ──────────────────────────────────
  hydrate: async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return;
      const { user, wallets, transactions } = await res.json();

      const balances: Record<string, WalletBalance> = { ...DEFAULT_BALANCES };
      for (const w of wallets) {
        balances[w.symbol] = { symbol: w.symbol, available: w.available, locked: w.locked };
      }

      set({
        isLoggedIn: true,
        demoUser: {
          name: user.fullName,
          email: user.email,
          kycStatus: user.kycStatus,
          queuePosition: user.queuePosition,
          loanStatus: user.loanStatus,
          loanAmount: user.loanAmount,
          activationFeePaid: user.activationFeePaid,
          activationFeeRefundRequested: user.activationFeeRefundRequested,
          loanWithdrawnToExternal: user.loanWithdrawnToExternal,
        },
        walletBalances: balances,
        transactions: transactions.map((t: any) => ({
          id: t.id,
          type: t.type,
          asset: t.asset,
          amount: t.amount,
          fee: t.fee,
          status: t.status,
          date: t.date,
          desc: t.desc,
          txHash: t.txHash,
          address: t.address,
        })),
      });
    } catch {}
  },

  // ── Live prices from CoinGecko (via API route) ───────────────────
  fetchLivePrices: async () => {
    try {
      const res = await fetch("/api/prices");
      if (!res.ok) return;
      const prices = await res.json();
      set((state) => ({
        coins: state.coins.map((c) => {
          const p = prices[c.symbol];
          if (!p) return c;
          return {
            ...c,
            price: p.usd,
            change24h: parseFloat((p.usd_24h_change ?? c.change24h).toFixed(2)),
            marketCap: p.usd_market_cap ?? c.marketCap,
            volume24h: p.usd_24h_vol ?? c.volume24h,
          };
        }),
      }));
    } catch {}
  },

  // ── Auth ──────────────────────────────────────────────────────────
  setLoggedIn: (val) => set({ isLoggedIn: val }),
  setRegisteredEmail: (email) => set({ registeredEmail: email }),

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({
      isLoggedIn: false,
      demoUser: DEFAULT_USER,
      walletBalances: DEFAULT_BALANCES,
      transactions: [],
    });
  },

  // ── Local small price animation (between API polls) ──────────────
  updatePrices: () =>
    set((state) => ({
      coins: state.coins.map((c) => {
        const delta = (Math.random() - 0.5) * 0.001;
        return {
          ...c,
          price: c.price * (1 + delta),
          change24h: parseFloat((c.change24h + (Math.random() - 0.5) * 0.05).toFixed(2)),
        };
      }),
    })),

  // ── KYC ──────────────────────────────────────────────────────────
  setKycStatus: (status) =>
    set((state) => ({ demoUser: { ...state.demoUser, kycStatus: status } })),

  // ── Wallet ───────────────────────────────────────────────────────
  deposit: async (asset, amount) => {
    // Optimistic update
    set((state) => ({
      walletBalances: {
        ...state.walletBalances,
        [asset]: {
          ...state.walletBalances[asset],
          available: (state.walletBalances[asset]?.available ?? 0) + amount,
        },
      },
      transactions: [
        {
          id: `opt-${Date.now()}`,
          type: "deposit" as const,
          asset,
          amount,
          status: "completed" as const,
          date: new Date().toISOString().split("T")[0],
          desc: `${asset} Deposit`,
          txHash: `0x${Math.random().toString(16).slice(2, 34)}`,
        },
        ...state.transactions,
      ],
    }));
    // Persist to server
    try {
      await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deposit", asset, amount }),
      });
    } catch {}
  },

  withdraw: async (asset, amount, address) => {
    set((state) => ({
      walletBalances: {
        ...state.walletBalances,
        [asset]: {
          ...state.walletBalances[asset],
          available: (state.walletBalances[asset]?.available ?? 0) - amount,
        },
      },
      transactions: [
        {
          id: `opt-${Date.now()}`,
          type: "withdrawal" as const,
          asset,
          amount,
          fee: 0.1,
          status: "pending" as const,
          date: new Date().toISOString().split("T")[0],
          desc: `${asset} Withdrawal`,
          address,
        },
        ...state.transactions,
      ],
    }));
    try {
      await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw", asset, amount, address }),
      });
    } catch {}
  },

  // ── Activation fee ───────────────────────────────────────────────
  payActivationFee: async (_asset) => {
    const feeAmount = 500;
    set((state) => ({
      demoUser: { ...state.demoUser, activationFeePaid: true },
      walletBalances: {
        ...state.walletBalances,
        USDT: {
          ...state.walletBalances.USDT,
          available: state.walletBalances.USDT.available - feeAmount,
        },
      },
      transactions: [
        {
          id: `opt-${Date.now()}`,
          type: "fee" as const,
          asset: "USDT",
          amount: feeAmount,
          status: "completed" as const,
          date: new Date().toISOString().split("T")[0],
          desc: "Loan Activation Fee — Platform Processing Charge",
          txHash: `0x${Math.random().toString(16).slice(2, 34)}`,
        },
        ...get().transactions,
      ],
    }));
    try {
      await fetch("/api/activation-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay" }),
      });
    } catch {}
  },

  requestActivationRefund: async () => {
    set((state) => ({
      demoUser: {
        ...state.demoUser,
        activationFeePaid: false,
        activationFeeRefundRequested: true,
      },
      walletBalances: {
        ...state.walletBalances,
        USDT: {
          ...state.walletBalances.USDT,
          available: state.walletBalances.USDT.available + 500,
        },
      },
      transactions: [
        {
          id: `opt-${Date.now()}`,
          type: "refund" as const,
          asset: "USDT",
          amount: 500,
          status: "completed" as const,
          date: new Date().toISOString().split("T")[0],
          desc: "Activation Fee Refund — Pre-Campaign Cancellation",
        },
        ...get().transactions,
      ],
    }));
    try {
      await fetch("/api/activation-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refund" }),
      });
    } catch {}
  },

  initiateExternalWithdrawal: async (address) => {
    set((state) => ({
      demoUser: { ...state.demoUser, loanWithdrawnToExternal: true },
      walletBalances: {
        ...state.walletBalances,
        USDT: { ...state.walletBalances.USDT, available: 0, locked: 50_000 },
      },
      transactions: [
        {
          id: `opt-${Date.now()}`,
          type: "withdrawal" as const,
          asset: "USDT",
          amount: 50_000,
          fee: 1,
          status: "processing" as const,
          date: new Date().toISOString().split("T")[0],
          desc: "Loan Withdrawal to External Wallet",
          address,
        },
        ...get().transactions,
      ],
    }));
    try {
      await fetch("/api/activation-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw", address }),
      });
    } catch {}
  },
}));
