import { create } from "zustand";
import { COINS, type Coin, type KycStatus, type LoanStatus } from "./mock-data";

export interface WalletBalance {
  symbol: string;
  available: number;
  locked: number;
}

export interface Transaction {
  id: string;
  type: string;
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
  depositAddress: string | null;
  bscDepositAddress: string | null;
  stakeAmount: number;
  stakeStatus: "none" | "active" | "unstaked" | "rewarded";
  stakedAt: string | null;
  rewardDistributed: boolean;
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
  depositAddress: null,
  bscDepositAddress: null,
  stakeAmount: 0,
  stakeStatus: "none",
  stakedAt: null,
  rewardDistributed: false,
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

  hydrate: () => Promise<void>;
  fetchLivePrices: () => Promise<void>;
  setLoggedIn: (val: boolean) => void;
  setRegisteredEmail: (email: string) => void;
  logout: () => Promise<void>;
  updatePrices: () => void;
  setKycStatus: (status: KycStatus) => void;
  withdraw: (asset: string, amount: number, address: string) => void;
  // Legacy (kept for compatibility)
  deposit: (asset: string, amount: number) => void;
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
          activationFeePaid: user.activationFeePaid ?? false,
          activationFeeRefundRequested: user.activationFeeRefundRequested ?? false,
          loanWithdrawnToExternal: user.loanWithdrawnToExternal ?? false,
          depositAddress: user.depositAddress ?? null,
          bscDepositAddress: user.bscDepositAddress ?? null,
          stakeAmount: user.stakeAmount ?? 0,
          stakeStatus: user.stakeStatus ?? "none",
          stakedAt: user.stakedAt ?? null,
          rewardDistributed: user.rewardDistributed ?? false,
        },
        walletBalances: balances,
        transactions: transactions.map((t: any) => ({
          id: t.id, type: t.type, asset: t.asset, amount: t.amount,
          fee: t.fee, status: t.status, date: t.date, desc: t.desc,
          txHash: t.txHash, address: t.address,
        })),
      });
    } catch {}
  },

  fetchLivePrices: async () => {
    try {
      // Call Binance directly from the browser — Vercel server IPs are blocked by Binance
      const pairs = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","ADAUSDT","AVAXUSDT","DOGEUSDT"];
      const symbolsParam = encodeURIComponent(JSON.stringify(pairs));
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}`);
      if (!res.ok) throw new Error("Binance error");
      const tickers: any[] = await res.json();
      const PAIR_TO_SYMBOL: Record<string, string> = {
        BTCUSDT:"BTC", ETHUSDT:"ETH", BNBUSDT:"BNB", SOLUSDT:"SOL",
        XRPUSDT:"XRP", ADAUSDT:"ADA", AVAXUSDT:"AVAX", DOGEUSDT:"DOGE",
      };
      set((state) => ({
        coins: state.coins.map((c) => {
          const t = tickers.find((tk: any) => PAIR_TO_SYMBOL[tk.symbol] === c.symbol);
          if (!t) return c;
          return {
            ...c,
            price:     parseFloat(t.lastPrice),
            change24h: parseFloat(parseFloat(t.priceChangePercent).toFixed(2)),
            volume24h: parseFloat(t.quoteVolume),
            high24h:   parseFloat(t.highPrice),
            low24h:    parseFloat(t.lowPrice),
          };
        }),
      }));
    } catch {}
  },

  setLoggedIn: (val) => set({ isLoggedIn: val }),
  setRegisteredEmail: (email) => set({ registeredEmail: email }),

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ isLoggedIn: false, demoUser: DEFAULT_USER, walletBalances: DEFAULT_BALANCES, transactions: [] });
  },

  updatePrices: () =>
    set((state) => ({
      coins: state.coins.map((c) => {
        const delta = (Math.random() - 0.5) * 0.001;
        return { ...c, price: c.price * (1 + delta), change24h: parseFloat((c.change24h + (Math.random() - 0.5) * 0.05).toFixed(2)) };
      }),
    })),

  setKycStatus: (status) =>
    set((state) => ({ demoUser: { ...state.demoUser, kycStatus: status } })),

  // Optimistic withdraw (UI-only, actual call in wallet page)
  withdraw: (asset, amount, address) => {
    set((state) => ({
      walletBalances: {
        ...state.walletBalances,
        [asset]: { ...state.walletBalances[asset], available: (state.walletBalances[asset]?.available ?? 0) - amount },
      },
      transactions: [
        {
          id: `opt-${Date.now()}`, type: "withdrawal", asset, amount, fee: 0,
          status: "pending" as const, date: new Date().toISOString().split("T")[0],
          desc: `${asset} Withdrawal: Pending Approval`, address,
        },
        ...state.transactions,
      ],
    }));
  },

  // Kept for compatibility — real deposits detected via check-deposit
  deposit: (asset, amount) => {
    set((state) => ({
      walletBalances: {
        ...state.walletBalances,
        [asset]: { ...state.walletBalances[asset], available: (state.walletBalances[asset]?.available ?? 0) + amount },
      },
    }));
  },

  payActivationFee: async (_asset) => {},
  requestActivationRefund: async () => {},
  initiateExternalWithdrawal: async (_address) => {},
}));
