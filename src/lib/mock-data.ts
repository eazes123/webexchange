export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  high24h?: number;
  low24h?: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCap: number;
  rank: number;
  sparkline: number[];
  category: string;
}

export const COINS: Coin[] = [
  {
    id: "bitcoin", symbol: "BTC", name: "Bitcoin",
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    price: 97245.32, change24h: 2.14, change7d: 8.32,
    volume24h: 48_200_000_000, marketCap: 1_920_000_000_000, rank: 1,
    sparkline: [93200, 94100, 95800, 96200, 95400, 96800, 97245], category: "Layer 1",
  },
  {
    id: "ethereum", symbol: "ETH", name: "Ethereum",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    price: 3842.18, change24h: 1.87, change7d: 6.21,
    volume24h: 24_100_000_000, marketCap: 462_000_000_000, rank: 2,
    sparkline: [3680, 3710, 3780, 3800, 3760, 3820, 3842], category: "Layer 1",
  },
  {
    id: "binancecoin", symbol: "BNB", name: "BNB",
    image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
    price: 618.42, change24h: 0.54, change7d: 3.18,
    volume24h: 2_100_000_000, marketCap: 89_000_000_000, rank: 3,
    sparkline: [601, 608, 612, 615, 610, 616, 618], category: "Exchange",
  },
  {
    id: "solana", symbol: "SOL", name: "Solana",
    image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    price: 224.18, change24h: 3.42, change7d: 12.84,
    volume24h: 6_800_000_000, marketCap: 104_000_000_000, rank: 4,
    sparkline: [198, 205, 212, 218, 214, 220, 224], category: "Layer 1",
  },
  {
    id: "ripple", symbol: "XRP", name: "XRP",
    image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
    price: 0.6854, change24h: -0.84, change7d: 2.14,
    volume24h: 2_400_000_000, marketCap: 38_000_000_000, rank: 5,
    sparkline: [0.671, 0.675, 0.681, 0.690, 0.685, 0.683, 0.685], category: "Payments",
  },
  {
    id: "usd-coin", symbol: "USDC", name: "USD Coin",
    image: "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
    price: 1.0001, change24h: 0.01, change7d: 0.0,
    volume24h: 8_200_000_000, marketCap: 43_000_000_000, rank: 6,
    sparkline: [1.0, 1.0, 1.0001, 1.0, 1.0, 1.0001, 1.0001], category: "Stablecoin",
  },
  {
    id: "cardano", symbol: "ADA", name: "Cardano",
    image: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
    price: 0.4521, change24h: 1.24, change7d: 4.82,
    volume24h: 480_000_000, marketCap: 16_000_000_000, rank: 7,
    sparkline: [0.428, 0.432, 0.440, 0.448, 0.444, 0.450, 0.452], category: "Layer 1",
  },
  {
    id: "avalanche-2", symbol: "AVAX", name: "Avalanche",
    image: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
    price: 43.21, change24h: 2.84, change7d: 9.42,
    volume24h: 580_000_000, marketCap: 18_000_000_000, rank: 8,
    sparkline: [39.2, 40.1, 41.4, 42.2, 41.8, 42.8, 43.21], category: "Layer 1",
  },
  {
    id: "dogecoin", symbol: "DOGE", name: "Dogecoin",
    image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
    price: 0.3842, change24h: -1.24, change7d: 5.84,
    volume24h: 1_200_000_000, marketCap: 56_000_000_000, rank: 9,
    sparkline: [0.371, 0.375, 0.382, 0.390, 0.385, 0.382, 0.384], category: "Meme",
  },
  {
    id: "polkadot", symbol: "DOT", name: "Polkadot",
    image: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png",
    price: 8.42, change24h: 0.84, change7d: 3.21,
    volume24h: 320_000_000, marketCap: 12_000_000_000, rank: 10,
    sparkline: [8.0, 8.1, 8.2, 8.35, 8.3, 8.4, 8.42], category: "Layer 0",
  },
  {
    id: "chainlink", symbol: "LINK", name: "Chainlink",
    image: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
    price: 18.54, change24h: 1.84, change7d: 7.42,
    volume24h: 480_000_000, marketCap: 11_000_000_000, rank: 11,
    sparkline: [17.2, 17.5, 17.9, 18.2, 17.9, 18.3, 18.54], category: "DeFi",
  },
  {
    id: "matic-network", symbol: "MATIC", name: "Polygon",
    image: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png",
    price: 0.5231, change24h: -0.42, change7d: 1.84,
    volume24h: 380_000_000, marketCap: 5_200_000_000, rank: 12,
    sparkline: [0.510, 0.514, 0.520, 0.526, 0.520, 0.521, 0.523], category: "Layer 2",
  },
  {
    id: "shiba-inu", symbol: "SHIB", name: "Shiba Inu",
    image: "https://assets.coingecko.com/coins/images/11939/large/shiba.png",
    price: 0.00002543, change24h: -2.14, change7d: 8.42,
    volume24h: 580_000_000, marketCap: 15_000_000_000, rank: 13,
    sparkline: [0.0000238, 0.0000241, 0.0000248, 0.0000255, 0.0000251, 0.0000253, 0.0000254], category: "Meme",
  },
  {
    id: "litecoin", symbol: "LTC", name: "Litecoin",
    image: "https://assets.coingecko.com/coins/images/2/large/litecoin.png",
    price: 98.42, change24h: 0.84, change7d: 2.84,
    volume24h: 480_000_000, marketCap: 7_400_000_000, rank: 14,
    sparkline: [95.2, 96.0, 97.1, 97.8, 97.4, 98.0, 98.42], category: "Layer 1",
  },
  {
    id: "uniswap", symbol: "UNI", name: "Uniswap",
    image: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png",
    price: 12.84, change24h: 1.42, change7d: 5.84,
    volume24h: 220_000_000, marketCap: 7_700_000_000, rank: 15,
    sparkline: [12.1, 12.2, 12.5, 12.7, 12.5, 12.7, 12.84], category: "DeFi",
  },
  {
    id: "cosmos", symbol: "ATOM", name: "Cosmos",
    image: "https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png",
    price: 7.84, change24h: 0.54, change7d: 2.14,
    volume24h: 180_000_000, marketCap: 3_100_000_000, rank: 16,
    sparkline: [7.5, 7.6, 7.65, 7.75, 7.70, 7.78, 7.84], category: "Layer 0",
  },
  {
    id: "stellar", symbol: "XLM", name: "Stellar",
    image: "https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png",
    price: 0.1842, change24h: 1.84, change7d: 6.42,
    volume24h: 320_000_000, marketCap: 5_600_000_000, rank: 17,
    sparkline: [0.172, 0.175, 0.178, 0.182, 0.180, 0.183, 0.184], category: "Payments",
  },
  {
    id: "near", symbol: "NEAR", name: "Near Protocol",
    image: "https://assets.coingecko.com/coins/images/10365/large/near.jpg",
    price: 6.84, change24h: 2.84, change7d: 10.42,
    volume24h: 280_000_000, marketCap: 7_600_000_000, rank: 18,
    sparkline: [6.1, 6.2, 6.4, 6.6, 6.5, 6.7, 6.84], category: "Layer 1",
  },
  {
    id: "arbitrum", symbol: "ARB", name: "Arbitrum",
    image: "https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_18.08.54.jpeg",
    price: 1.254, change24h: 1.14, change7d: 4.84,
    volume24h: 580_000_000, marketCap: 3_900_000_000, rank: 19,
    sparkline: [1.18, 1.20, 1.22, 1.24, 1.22, 1.24, 1.254], category: "Layer 2",
  },
  {
    id: "optimism", symbol: "OP", name: "Optimism",
    image: "https://assets.coingecko.com/coins/images/25244/large/Optimism.png",
    price: 2.184, change24h: 2.14, change7d: 8.42,
    volume24h: 480_000_000, marketCap: 3_000_000_000, rank: 20,
    sparkline: [2.0, 2.04, 2.08, 2.14, 2.11, 2.16, 2.184], category: "Layer 2",
  },
  {
    id: "injective-protocol", symbol: "INJ", name: "Injective",
    image: "https://assets.coingecko.com/coins/images/12882/large/Secondary_Symbol.png",
    price: 34.21, change24h: 3.84, change7d: 14.42,
    volume24h: 320_000_000, marketCap: 3_200_000_000, rank: 21,
    sparkline: [30.2, 31.0, 32.1, 33.2, 32.8, 33.8, 34.21], category: "DeFi",
  },
  {
    id: "aptos", symbol: "APT", name: "Aptos",
    image: "https://assets.coingecko.com/coins/images/26455/large/aptos_round.png",
    price: 12.84, change24h: 2.14, change7d: 7.84,
    volume24h: 380_000_000, marketCap: 3_500_000_000, rank: 22,
    sparkline: [11.8, 12.0, 12.3, 12.6, 12.4, 12.7, 12.84], category: "Layer 1",
  },
  {
    id: "sui", symbol: "SUI", name: "Sui",
    image: "https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg",
    price: 3.421, change24h: 4.21, change7d: 18.42,
    volume24h: 580_000_000, marketCap: 9_600_000_000, rank: 23,
    sparkline: [2.88, 2.98, 3.10, 3.24, 3.18, 3.35, 3.421], category: "Layer 1",
  },
  {
    id: "tron", symbol: "TRX", name: "TRON",
    image: "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png",
    price: 0.1284, change24h: 0.84, change7d: 2.84,
    volume24h: 580_000_000, marketCap: 11_000_000_000, rank: 24,
    sparkline: [0.123, 0.124, 0.126, 0.128, 0.127, 0.128, 0.1284], category: "Layer 1",
  },
  {
    id: "hedera-hashgraph", symbol: "HBAR", name: "Hedera",
    image: "https://assets.coingecko.com/coins/images/3688/large/hbar.png",
    price: 0.1284, change24h: 1.84, change7d: 5.42,
    volume24h: 220_000_000, marketCap: 4_200_000_000, rank: 25,
    sparkline: [0.120, 0.122, 0.124, 0.127, 0.125, 0.127, 0.1284], category: "Layer 1",
  },
];

export const CAMPAIGN_STATS = {
  totalSpots: 1200,
  spotsUsed: 15,        // initial offset — updated live from /api/stats
  spotsRemaining: 1185, // initial display value before fetch
  deadline: new Date("2026-12-31T23:59:59"),
  stakeAmount: 500,
  rewardAmount: 50_000,
  campaignNote: "Stake 500 USDT and get a $50,000 USDT interest-free loan on December 31, 2026.",
};

export const MOCK_USER = {
  id: "demo-001",
  name: "Demo User",
  email: "demo@novabit.demo",
  phone: "+92 300 1234567",
  country: "Pakistan",
  kycStatus: "approved" as const,
  queuePosition: 234,
  loanStatus: "approved" as const,
  loanAmount: 50_000,
  walletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
};

export const DEPOSIT_ADDRESSES: Record<string, { address: string; network: string; minDeposit: string; confirmations: number }> = {
  BTC:  { address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", network: "Bitcoin (BTC)",     minDeposit: "0.0001 BTC",   confirmations: 2 },
  ETH:  { address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", network: "Ethereum (ERC20)",   minDeposit: "0.001 ETH",    confirmations: 12 },
  USDT: { address: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",         network: "TRON (TRC20)",       minDeposit: "1 USDT",       confirmations: 20 },
  BNB:  { address: "bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2", network: "BNB Chain (BEP20)", minDeposit: "0.01 BNB",     confirmations: 15 },
  SOL:  { address: "DRpbCBMxVnDK7maPdmhLKaggfJXHq2v5EoMrh35CWSEU", network: "Solana (SOL)",   minDeposit: "0.01 SOL",     confirmations: 32 },
  XRP:  { address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",          network: "XRP Ledger",         minDeposit: "1 XRP",        confirmations: 6 },
};

export const WITHDRAWAL_FEES: Record<string, { fee: number; feeUSD: number; min: number; network: string }> = {
  BTC:  { fee: 0.0001, feeUSD: 9.72,  min: 0.001,  network: "Bitcoin (BTC)" },
  ETH:  { fee: 0.004,  feeUSD: 15.37, min: 0.01,   network: "Ethereum (ERC20)" },
  USDT: { fee: 1,      feeUSD: 1.00,  min: 10,     network: "TRON (TRC20)" },
  BNB:  { fee: 0.001,  feeUSD: 0.62,  min: 0.01,   network: "BNB Chain (BEP20)" },
  SOL:  { fee: 0.01,   feeUSD: 2.24,  min: 0.1,    network: "Solana (SOL)" },
  XRP:  { fee: 0.25,   feeUSD: 0.17,  min: 1,      network: "XRP Ledger" },
};

export type KycStatus = "none" | "pending" | "under_review" | "approved" | "rejected";
export type LoanStatus = "none" | "pending" | "approved" | "disbursed";

export const MOCK_ADMIN_USERS = [
  { id: "001", name: "Ahmed Khan",     email: "ahmed@example.com",  kycStatus: "approved",     loanStatus: "approved",  queue: 1,   joinDate: "2024-11-01" },
  { id: "002", name: "Sara Ali",       email: "sara@example.com",   kycStatus: "approved",     loanStatus: "pending",   queue: 2,   joinDate: "2024-11-02" },
  { id: "003", name: "John Smith",     email: "john@example.com",   kycStatus: "under_review", loanStatus: "none",      queue: 847, joinDate: "2024-11-15" },
  { id: "004", name: "Maria Garcia",   email: "maria@example.com",  kycStatus: "approved",     loanStatus: "approved",  queue: 3,   joinDate: "2024-11-03" },
  { id: "005", name: "Wei Chen",       email: "wei@example.com",    kycStatus: "pending",      loanStatus: "none",      queue: 848, joinDate: "2024-11-16" },
  { id: "006", name: "Fatima Malik",   email: "fatima@example.com", kycStatus: "approved",     loanStatus: "approved",  queue: 5,   joinDate: "2024-11-04" },
  { id: "007", name: "David Wilson",   email: "david@example.com",  kycStatus: "rejected",     loanStatus: "none",      queue: 0,   joinDate: "2024-11-05" },
  { id: "008", name: "Aisha Siddiqui", email: "aisha@example.com",  kycStatus: "approved",     loanStatus: "disbursed", queue: 4,   joinDate: "2024-11-03" },
];

export const TRADING_PAIRS = COINS.filter(c => c.symbol !== "USDC").map(c => ({
  pair: `${c.symbol}/USDT`,
  tvSymbol: `BINANCE:${c.symbol}USDT`,
  baseAsset: c.symbol,
  quoteAsset: "USDT",
  coinId: c.id,
}));
