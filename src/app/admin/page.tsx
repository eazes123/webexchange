"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users, Shield, Gift, Search, Check, X,
  TrendingUp, Clock, CheckCircle, XCircle,
  LayoutDashboard, ArrowUpRight, RefreshCw,
  Lock, Wallet, Power, Trophy, Settings,
  CreditCard, Activity, ChevronDown, ChevronUp,
  AlertCircle, Ban, Edit3, Save,
} from "lucide-react";
import { toast } from "sonner";

type TabType = "overview" | "users" | "kyc" | "campaign" | "withdrawals" | "transactions" | "deposits";

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  queuePosition: number;
  kycStatus: string;
  depositAddress: string | null;
  bscDepositAddress: string | null;
  bscWalletIndex: number | null;
  stakeStatus: string;
  stakeAmount: number;
  rewardDistributed: boolean;
  createdAt: string;
}

interface DepositTx {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  asset: string;
  amount: number;
  status: string;
  date: string;
  desc?: string;
  txHash?: string;
  createdAt: string;
  chain: "TRC20" | "BSC" | "unknown";
}

interface DepositUser {
  id: string;
  fullName: string;
  email: string;
  addressIndex: number | null;
  trc20Address: string | null;
  bscAddress: string | null;
  kycStatus: string;
  createdAt: string;
}

interface DepositStats {
  totalDeposits: number;
  trc20Total: number;
  bscTotal: number;
  totalVolume: number;
  usersWithTrc: number;
  usersWithBsc: number;
  trc20Count: number;
  bscCount: number;
}

interface KycPendingUser {
  userId: string;
  fullName: string;
  email: string;
  country: string;
  kycStatus: string;
  createdAt: string;
  kycDetail: {
    fullName: string;
    dob: string;
    nationality: string;
    idType: string;
    address: string;
    submittedAt: string;
    selfieUrl: string | null;
    docFrontUrl: string | null;
    docBackUrl: string | null;
    addressDocUrl: string | null;
  } | null;
}

interface KycCompleted {
  userId: string;
  fullName: string;
  email: string;
  nationality: string;
  idType: string;
  status: string;
  submittedAt: string;
}

interface WithdrawalRequest {
  id: string;
  userId: string;
  asset: string;
  amount: number;
  fee: number;
  destinationAddress: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user?: { fullName: string; email: string };
}

interface AdminTransaction {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  type: string;
  asset: string;
  amount: number;
  fee?: number;
  status: string;
  date: string;
  desc?: string;
  txHash?: string;
}

interface AdminStats {
  totalUsers: number;
  kycApproved: number;
  kycPending: number;
  activeStakers: number;
  loansDisbursed: number;
  pendingWithdrawals: number;
  totalWithdrawals: number;
  totalStakedVolume: number;
  avgStake: number;
  totalLoanPool: number;
  campaignSpots: number;
  campaignMaxSpots: number;
}

interface CampaignData {
  settings: {
    deadline: string;
    maxSpots: number;
    loanAmount: number;
    minStake: number;
    maxStake: number;
    enabled: boolean;
    displayFilled: number;
  };
  participants: {
    id: string;
    fullName: string;
    email: string;
    country: string;
    kycStatus: string;
    stakeStatus: string;
    stakeAmount: number;
    stakedAt: string | null;
    rewardDistributed: boolean;
    depositAddress: string | null;
  }[];
  stats: {
    totalParticipants: number;
    activeStakers: number;
    loansDisbursed: number;
    totalStaked: number;
  };
}

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved:    "text-ex-green  bg-ex-green/10  border-ex-green/30",
    pending:     "text-ex-yellow bg-ex-yellow/10 border-ex-yellow/30",
    under_review:"text-blue-400  bg-blue-400/10  border-blue-400/30",
    rejected:    "text-ex-red    bg-ex-red/10    border-ex-red/30",
    none:        "text-gray-400  bg-gray-800     border-gray-700",
    active:      "text-ex-green  bg-ex-green/10  border-ex-green/30",
    rewarded:    "text-ex-yellow bg-ex-yellow/10 border-ex-yellow/30",
    unstaked:    "text-gray-400  bg-gray-800     border-gray-700",
    processing:  "text-blue-400  bg-blue-400/10  border-blue-400/30",
    completed:   "text-ex-green  bg-ex-green/10  border-ex-green/30",
    failed:      "text-ex-red    bg-ex-red/10    border-ex-red/30",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${map[status] || map.none}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: any; label: string; value: number | string; color: string; sub?: string;
}) {
  return (
    <div className="bg-ex-card border border-ex-border rounded-2xl p-4 flex flex-col gap-2">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-current/10`} style={{ color: undefined }}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className={`text-2xl font-black ${color}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
      {sub && <div className="text-xs text-gray-600">{sub}</div>}
    </div>
  );
}

function TxTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    deposit:        "text-ex-green",
    withdrawal:     "text-ex-red",
    stake:          "text-blue-400",
    unstake:        "text-orange-400",
    reward:         "text-ex-yellow",
    loan_repayment: "text-purple-400",
  };
  return (
    <span className={`text-xs font-bold ${map[type] || "text-gray-400"}`}>
      {type.replace(/_/g, " ")}
    </span>
  );
}

export default function AdminPage() {
  const [tab, setTab]           = useState<TabType>("overview");
  const [search, setSearch]     = useState("");
  const [kycSearch, setKycSearch] = useState("");
  const [txSearch, setTxSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("all");
  const [userKycFilter, setUserKycFilter] = useState("all");
  const [userStakeFilter, setUserStakeFilter] = useState("all");
  const [wdStatusFilter, setWdStatusFilter] = useState("all");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedKyc, setExpandedKyc]   = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Data state
  const [stats, setStats]           = useState<AdminStats | null>(null);
  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [kycPendingList, setKycPendingList] = useState<KycPendingUser[]>([]);
  const [kycCompletedList, setKycCompletedList] = useState<KycCompleted[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [campaign, setCampaign]     = useState<CampaignData | null>(null);
  const [exchangeWallet, setExchangeWallet] = useState<string | null>(null);

  // Campaign settings edit state
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    deadline: "2026-12-31", maxSpots: 1000, loanAmount: 50000,
    minStake: 500, maxStake: 50000, enabled: true, displayFilled: 0,
    chatModel: "gemini-3.5-flash-lite",
  });

  // Deposits state
  const [depositStats, setDepositStats]     = useState<DepositStats | null>(null);
  const [depositTxns, setDepositTxns]       = useState<DepositTx[]>([]);
  const [depositUsers, setDepositUsers]     = useState<DepositUser[]>([]);
  const [depositChainFilter, setDepositChainFilter] = useState<"all" | "TRC20" | "BSC">("all");
  const [depositSearch, setDepositSearch]   = useState("");
  const [depositView, setDepositView]       = useState<"addresses" | "transactions">("addresses");

  // Loading state per section
  const [loadingStats, setLoadingStats]     = useState(false);
  const [loadingUsers, setLoadingUsers]     = useState(false);
  const [loadingKyc, setLoadingKyc]         = useState(false);
  const [loadingWd, setLoadingWd]           = useState(false);
  const [loadingTx, setLoadingTx]           = useState(false);
  const [loadingCampaign, setLoadingCampaign] = useState(false);
  const [loadingDeposits, setLoadingDeposits] = useState(false);

  // Sweep state: key = `${userId}-${chain}`
  const [sweepStatus, setSweepStatus] = useState<Record<string, {
    loading: boolean;
    txHash?: string;
    amount?: number;
    error?: string;
  }>>({});

  // Balances: userId → { trc20, bsc }
  const [addressBalances, setAddressBalances] = useState<Record<string, { trc20: number; bsc: number }>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  // PIN modal
  const [pinModal, setPinModal] = useState<{
    show: boolean;
    mode: "single" | "bulk";
    userId?: string;
    userName?: string;
    chain: "TRC20" | "BSC" | "all";
    pin: string;
    loading: boolean;
    error?: string;
  }>({ show: false, mode: "single", chain: "TRC20", pin: "", loading: false });

  // ── Fetchers ───────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const r = await fetch("/api/admin/stats");
      if (r.ok) setStats(await r.json());
    } finally { setLoadingStats(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const r = await fetch("/api/admin/users");
      if (r.ok) { const d = await r.json(); setUsers(d.users ?? []); }
    } finally { setLoadingUsers(false); }
  }, []);

  const fetchKyc = useCallback(async () => {
    setLoadingKyc(true);
    try {
      const r = await fetch("/api/admin/kyc");
      if (r.ok) {
        const d = await r.json();
        setKycPendingList(d.pending ?? []);
        setKycCompletedList(d.completed ?? []);
      }
    } finally { setLoadingKyc(false); }
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    setLoadingWd(true);
    try {
      const r = await fetch("/api/admin/withdrawals");
      if (r.ok) {
        const d = await r.json();
        setWithdrawals(d.withdrawals ?? []);
        setWithdrawalsEnabled(d.withdrawalsEnabled ?? true);
      }
    } finally { setLoadingWd(false); }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoadingTx(true);
    try {
      const r = await fetch("/api/admin/transactions");
      if (r.ok) { const d = await r.json(); setTransactions(d.transactions ?? []); }
    } finally { setLoadingTx(false); }
  }, []);

  const fetchDeposits = useCallback(async () => {
    setLoadingDeposits(true);
    try {
      const r = await fetch("/api/admin/deposits");
      if (r.ok) {
        const d = await r.json();
        setDepositStats(d.stats ?? null);
        setDepositTxns(d.deposits ?? []);
        setDepositUsers(d.addressList ?? []);
      }
    } finally { setLoadingDeposits(false); }
  }, []);

  const fetchBalances = useCallback(async () => {
    setLoadingBalances(true);
    try {
      const r = await fetch("/api/admin/balances");
      if (r.ok) {
        const { balances } = await r.json() as { balances: { userId: string; trc20: number; bsc: number }[] };
        const map: Record<string, { trc20: number; bsc: number }> = {};
        for (const b of balances) map[b.userId] = { trc20: b.trc20, bsc: b.bsc };
        setAddressBalances(map);
      }
    } finally { setLoadingBalances(false); }
  }, []);

  const handleSweep = useCallback(async (userId: string, chain: "TRC20" | "BSC", pin: string) => {
    const key = `${userId}-${chain}`;
    setSweepStatus(prev => ({ ...prev, [key]: { loading: true } }));
    try {
      const r = await fetch("/api/admin/sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, chain, pin }),
      });
      const d = await r.json();
      if (r.ok && d.success) {
        setSweepStatus(prev => ({ ...prev, [key]: { loading: false, txHash: d.txHash, amount: d.amount } }));
        // Refresh balances after successful sweep
        fetchBalances();
      } else {
        setSweepStatus(prev => ({ ...prev, [key]: { loading: false, error: d.error ?? "Sweep failed" } }));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error";
      setSweepStatus(prev => ({ ...prev, [key]: { loading: false, error: msg } }));
    }
  }, [fetchBalances]);

  const fetchCampaign = useCallback(async () => {
    setLoadingCampaign(true);
    try {
      const r = await fetch("/api/admin/campaign");
      if (r.ok) {
        const d = await r.json();
        setCampaign(d);
        setSettingsForm(d.settings);
      }
    } finally { setLoadingCampaign(false); }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchWithdrawals();
    // Exchange wallet
    fetch("/api/admin/withdrawals", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_exchange_wallet" }),
    }).then(r => r.json()).then(d => { if (d.exchangeWalletAddress) setExchangeWallet(d.exchangeWalletAddress); }).catch(() => {});
  }, [fetchStats, fetchUsers, fetchWithdrawals]);

  // Lazy load per tab
  useEffect(() => {
    if (tab === "kyc" && kycPendingList.length === 0 && kycCompletedList.length === 0) fetchKyc();
    if (tab === "campaign" && !campaign)             fetchCampaign();
    if (tab === "transactions" && transactions.length === 0) fetchTransactions();
    if (tab === "deposits" && !depositStats) { fetchDeposits(); fetchBalances(); }
  }, [tab]);

  const refreshAll = () => {
    fetchStats(); fetchUsers(); fetchWithdrawals();
    if (tab === "kyc")          fetchKyc();
    if (tab === "campaign")     fetchCampaign();
    if (tab === "transactions") fetchTransactions();
    if (tab === "deposits")     fetchDeposits();
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const kycAction = async (userId: string, action: "approve" | "reject") => {
    setActionLoading(userId + action);
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      await fetchKyc();
      await fetchStats();
      await fetchUsers();
    } catch { toast.error("Action failed"); }
    finally { setActionLoading(null); }
  };

  const withdrawalAction = async (id: string, action: "approve" | "reject", adminNote?: string) => {
    setActionLoading(id + action);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, adminNote }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      await fetchWithdrawals(); await fetchStats();
    } catch { toast.error("Action failed"); }
    finally { setActionLoading(null); }
  };

  const distributeReward = async (userId?: string) => {
    const key = userId ? `dist_${userId}` : "dist_all";
    setActionLoading(key);
    try {
      const res = await fetch("/api/admin/campaign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: userId ? "distribute_reward" : "distribute_all_rewards", userId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      await fetchCampaign(); await fetchStats();
    } catch { toast.error("Action failed"); }
    finally { setActionLoading(null); }
  };

  const toggleWithdrawals = async () => {
    setActionLoading("toggle");
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_withdrawals" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      setWithdrawalsEnabled(data.withdrawalsEnabled);
    } catch { toast.error("Action failed"); }
    finally { setActionLoading(null); }
  };

  const saveSettings = async () => {
    setActionLoading("save_settings");
    try {
      const res = await fetch("/api/admin/campaign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_settings", ...settingsForm }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      setEditingSettings(false);
      await fetchCampaign(); await fetchStats();
    } catch { toast.error("Failed to save"); }
    finally { setActionLoading(null); }
  };

  // ── Derived / Filtered ─────────────────────────────────────────────────────
  const filteredKyc = kycSearch
    ? kycPendingList.filter(k =>
        k.fullName.toLowerCase().includes(kycSearch.toLowerCase()) ||
        k.email.toLowerCase().includes(kycSearch.toLowerCase()))
    : kycPendingList;

  const filteredUsers = users.filter(u => {
    const matchSearch = !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchKyc   = userKycFilter === "all" || u.kycStatus === userKycFilter;
    const matchStake = userStakeFilter === "all" || u.stakeStatus === userStakeFilter;
    return matchSearch && matchKyc && matchStake;
  });

  const filteredWithdrawals = withdrawals.filter(w =>
    wdStatusFilter === "all" || w.status === wdStatusFilter
  );

  const filteredTx = transactions.filter(tx => {
    const matchSearch = !txSearch ||
      tx.userFullName.toLowerCase().includes(txSearch.toLowerCase()) ||
      tx.userEmail.toLowerCase().includes(txSearch.toLowerCase());
    const matchType = txTypeFilter === "all" || tx.type === txTypeFilter;
    return matchSearch && matchType;
  });

  const pendingWdCount = withdrawals.filter(w => w.status === "pending").length;

  const TABS: { id: TabType; label: string; icon: any; badge?: number }[] = [
    { id: "overview",     label: "Overview",     icon: LayoutDashboard },
    { id: "users",        label: "Users",        icon: Users,         badge: users.length },
    { id: "kyc",          label: "KYC Review",   icon: Shield,        badge: kycPendingList.length },
    { id: "campaign",     label: "Campaign",     icon: Trophy,        badge: campaign?.stats.activeStakers },
    { id: "deposits",     label: "Deposits",     icon: CreditCard,    badge: depositStats?.totalDeposits },
    { id: "withdrawals",  label: "Withdrawals",  icon: ArrowUpRight,  badge: pendingWdCount },
    { id: "transactions", label: "Transactions", icon: Activity },
  ];

  return (
    <>
    <div className="min-h-screen bg-ex-bg">
      {/* Header */}
      <div className="bg-ex-card border-b border-ex-border px-4 py-2.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-ex-yellow" />
          <span className="font-black text-white">NovaBit Admin</span>
          <span className="text-xs text-gray-500 hidden md:block ml-2">v2 · Expert Panel</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refreshAll}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? "animate-spin" : ""}`} /> Refresh
          </button>
          <div className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
            withdrawalsEnabled
              ? "text-ex-green bg-ex-green/10 border-ex-green/30"
              : "text-ex-red bg-ex-red/10 border-ex-red/30"
          }`}>
            WD {withdrawalsEnabled ? "ON" : "OFF"}
          </div>
          <Link href="/" className="text-xs text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5">
            ← Site
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5">
        {/* Tab nav */}
        <div className="flex gap-0.5 mb-6 border-b border-ex-border overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? "border-ex-yellow text-ex-yellow"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="bg-ex-yellow text-black text-xs font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard icon={Users}      label="Total Users"        value={stats?.totalUsers ?? 0}         color="text-blue-400" />
              <StatCard icon={CheckCircle} label="KYC Approved"      value={stats?.kycApproved ?? 0}        color="text-ex-green" />
              <StatCard icon={Clock}      label="KYC Pending"        value={stats?.kycPending ?? 0}         color="text-ex-yellow" />
              <StatCard icon={Lock}       label="Active Stakers"     value={stats?.activeStakers ?? 0}      color="text-ex-green" />
              <StatCard icon={Trophy}     label="Loans Disbursed"    value={stats?.loansDisbursed ?? 0}     color="text-ex-yellow" />
              <StatCard icon={ArrowUpRight} label="Pending Withdrawals" value={stats?.pendingWithdrawals ?? 0} color={stats?.pendingWithdrawals ? "text-ex-red" : "text-gray-400"} />
            </div>

            {/* Campaign + Withdrawals row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Campaign card */}
              <div className="md:col-span-2 bg-ex-card border border-ex-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-ex-yellow" /> New Year Campaign
                  </h3>
                  <button onClick={() => setTab("campaign")} className="text-xs text-ex-yellow hover:underline">
                    Manage →
                  </button>
                </div>
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>Spots Filled</span>
                    <span className="font-semibold text-white">
                      {stats?.campaignSpots ?? 0} / {stats?.campaignMaxSpots ?? 1000}
                    </span>
                  </div>
                  <div className="h-3 bg-ex-card2 rounded-full overflow-hidden border border-ex-border">
                    <div
                      className="h-full bg-gradient-to-r from-ex-yellow to-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((stats?.campaignSpots ?? 0) / (stats?.campaignMaxSpots ?? 1000)) * 100)}%` }}
                    />
                  </div>
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {((stats?.campaignSpots ?? 0) / (stats?.campaignMaxSpots ?? 1000) * 100).toFixed(1)}% full
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-ex-card2 rounded-xl p-3 border border-ex-border">
                    <div className="text-gray-500 text-xs mb-1">Total Staked</div>
                    <div className="font-bold font-num text-ex-green">${(stats?.totalStakedVolume ?? 0).toLocaleString()}</div>
                  </div>
                  <div className="bg-ex-card2 rounded-xl p-3 border border-ex-border">
                    <div className="text-gray-500 text-xs mb-1">Avg Stake</div>
                    <div className="font-bold font-num">${(stats?.avgStake ?? 0).toLocaleString()}</div>
                  </div>
                  <div className="bg-ex-card2 rounded-xl p-3 border border-ex-border">
                    <div className="text-gray-500 text-xs mb-1">Loan Pool</div>
                    <div className="font-bold font-num text-ex-yellow">${(stats?.totalLoanPool ?? 0).toLocaleString()}</div>
                  </div>
                </div>
                <button
                  onClick={() => distributeReward()}
                  disabled={(campaign?.stats.activeStakers ?? 0) === 0 || !!actionLoading}
                  className="mt-4 btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-40">
                  {actionLoading === "dist_all" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                  Disburse All Loans ({campaign?.stats.activeStakers ?? stats?.activeStakers ?? 0} eligible)
                </button>
              </div>

              {/* Withdrawal + wallet card */}
              <div className="space-y-4">
                <div className="bg-ex-card border border-ex-border rounded-2xl p-4">
                  <h3 className="font-bold mb-3 text-sm">Withdrawal Control</h3>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold">Status</div>
                      <div className={`text-xs mt-0.5 ${withdrawalsEnabled ? "text-ex-green" : "text-ex-red"}`}>
                        {withdrawalsEnabled ? "Currently enabled" : "Currently disabled"}
                      </div>
                    </div>
                    <button
                      onClick={toggleWithdrawals}
                      disabled={actionLoading === "toggle"}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        withdrawalsEnabled
                          ? "bg-ex-red/10 text-ex-red border-ex-red/30 hover:bg-ex-red/20"
                          : "bg-ex-green/10 text-ex-green border-ex-green/30 hover:bg-ex-green/20"
                      } disabled:opacity-50`}>
                      <Power className="w-3.5 h-3.5" />
                      {withdrawalsEnabled ? "Disable" : "Enable"}
                    </button>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pending</span>
                      <span className={pendingWdCount > 0 ? "text-ex-yellow font-semibold" : "text-gray-400"}>{pendingWdCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total requests</span>
                      <span className="text-gray-300">{withdrawals.length}</span>
                    </div>
                  </div>
                </div>

                {exchangeWallet && (
                  <div className="bg-ex-card border border-ex-border rounded-2xl p-4">
                    <h3 className="font-bold mb-2 text-sm flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-ex-green" /> Hot Wallet
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">Fund with USDT + TRX for auto-send</p>
                    <div className="font-mono text-xs text-gray-200 break-all bg-ex-bg rounded-lg p-2 select-all border border-ex-border">
                      {exchangeWallet}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ────────────────────────────────────────────────────────── */}
        {tab === "users" && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input className="ex-input pl-9 h-9 text-sm w-full" placeholder="Search name or email..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="ex-input h-9 text-sm w-auto" value={userKycFilter}
                onChange={e => setUserKycFilter(e.target.value)}>
                <option value="all">All KYC</option>
                <option value="none">Not Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select className="ex-input h-9 text-sm w-auto" value={userStakeFilter}
                onChange={e => setUserStakeFilter(e.target.value)}>
                <option value="all">All Stake</option>
                <option value="none">Not Staked</option>
                <option value="active">Active</option>
                <option value="rewarded">Rewarded</option>
                <option value="unstaked">Unstaked</option>
              </select>
              <div className="text-xs text-gray-500 flex items-center">
                {filteredUsers.length} of {users.length} users
              </div>
            </div>

            {loadingUsers ? (
              <div className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No users match filters</div>
            ) : (
              <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden">
                <table className="w-full exchange-table">
                  <thead>
                    <tr>
                      <th className="text-left text-xs">#</th>
                      <th className="text-left">User</th>
                      <th className="text-left hidden sm:table-cell">Country</th>
                      <th className="text-left">KYC</th>
                      <th className="text-left">Stake</th>
                      <th className="text-left hidden md:table-cell">Amount</th>
                      <th className="text-left hidden lg:table-cell">Joined</th>
                      <th className="text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <>
                        <tr key={u.id} className="cursor-pointer" onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}>
                          <td className="text-gray-500 text-xs font-mono">#{u.queuePosition}</td>
                          <td>
                            <div className="font-semibold text-sm">{u.fullName}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </td>
                          <td className="text-gray-400 text-sm hidden sm:table-cell">{u.country || "-"}</td>
                          <td><Badge status={u.kycStatus || "none"} /></td>
                          <td><Badge status={u.stakeStatus || "none"} /></td>
                          <td className="font-num text-sm hidden md:table-cell">
                            {u.stakeAmount > 0 ? `$${u.stakeAmount.toLocaleString()}` : "-"}
                          </td>
                          <td className="text-gray-400 text-xs hidden lg:table-cell">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="text-center text-gray-500">
                            {expandedUser === u.id ? <ChevronUp className="w-4 h-4 mx-auto" /> : <ChevronDown className="w-4 h-4 mx-auto" />}
                          </td>
                        </tr>
                        {expandedUser === u.id && (
                          <tr key={u.id + "_expanded"}>
                            <td colSpan={8} className="bg-ex-bg/50 px-4 py-4 border-t border-ex-border">
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                                {[
                                  { label: "Full ID",          value: u.id },
                                  { label: "Phone",            value: u.phone || "-" },
                                  { label: "Queue Position",   value: `#${u.queuePosition}` },
                                  { label: "TRC20 Address",    value: u.depositAddress ?? "Not assigned" },
                                  { label: "BSC Address",      value: u.bscDepositAddress ?? "Not assigned" },
                                  { label: "KYC Status",       value: u.kycStatus || "none" },
                                  { label: "Stake Status",     value: u.stakeStatus || "none" },
                                  { label: "Stake Amount",     value: u.stakeAmount > 0 ? `$${u.stakeAmount}` : "-" },
                                  { label: "Reward Sent",      value: u.rewardDistributed ? "Yes ✓" : "No" },
                                ].map(r => (
                                  <div key={r.label} className="bg-ex-card border border-ex-border rounded-xl p-2.5">
                                    <div className="text-gray-500 mb-0.5">{r.label}</div>
                                    <div className="font-semibold text-white truncate font-mono text-xs">{r.value}</div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── KYC REVIEW ───────────────────────────────────────────────────── */}
        {tab === "kyc" && (
          <div className="space-y-6">
            {/* Pending section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-ex-yellow" />
                  Pending Review
                  {kycPendingList.length > 0 && (
                    <span className="bg-ex-yellow text-black text-xs font-black px-2 py-0.5 rounded-full">{kycPendingList.length}</span>
                  )}
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input className="ex-input pl-8 h-8 text-xs w-48" placeholder="Search..."
                    value={kycSearch} onChange={e => setKycSearch(e.target.value)} />
                </div>
              </div>

              {loadingKyc ? (
                <div className="text-center py-8 text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /></div>
              ) : filteredKyc.length === 0 ? (
                <div className="bg-ex-card border border-ex-border rounded-2xl p-8 text-center text-gray-500">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-gray-700" />
                  No pending KYC submissions
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredKyc.map(k => (
                    <div key={k.userId} className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden">
                      {/* Summary row */}
                      <div className="flex items-center gap-3 p-4">
                        {/* Selfie thumbnail */}
                        {k.kycDetail?.selfieUrl ? (
                          <a href={k.kycDetail.selfieUrl} target="_blank" rel="noreferrer" className="shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={k.kycDetail.selfieUrl} alt="Selfie"
                              className="w-12 h-12 rounded-xl object-cover border border-[#1e1e1e] hover:border-[#f0b90b]/50 transition-colors" />
                          </a>
                        ) : (
                          <div className="w-12 h-12 shrink-0 rounded-xl bg-[#131313] border border-[#1e1e1e] flex items-center justify-center">
                            <span className="text-[9px] text-gray-700 font-semibold text-center leading-tight">NO<br/>PHOTO</span>
                          </div>
                        )}
                        {/* User info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-white">{k.fullName}</div>
                          <div className="text-xs text-gray-500">{k.email}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-600">{k.kycDetail?.nationality || k.country}</span>
                            {k.kycDetail?.idType && <span className="text-xs text-gray-700">· {k.kycDetail.idType}</span>}
                            {k.kycDetail?.submittedAt && (
                              <span className="text-xs text-gray-700">· {new Date(k.kycDetail.submittedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setExpandedKyc(expandedKyc === k.userId ? null : k.userId)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#1e1e1e] text-gray-300 text-xs rounded-lg hover:bg-[#2a2a2a] border border-[#2a2a2a] transition-colors">
                            {expandedKyc === k.userId ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            Details
                          </button>
                          <button
                            onClick={() => kycAction(k.userId, "approve")}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 bg-ex-green/10 text-ex-green text-xs rounded-lg hover:bg-ex-green/20 border border-ex-green/30 transition-colors disabled:opacity-50">
                            {actionLoading === k.userId + "approve" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Approve
                          </button>
                          <button
                            onClick={() => kycAction(k.userId, "reject")}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 px-2 py-1.5 bg-ex-red/10 text-ex-red text-xs rounded-lg hover:bg-ex-red/20 border border-ex-red/30 transition-colors disabled:opacity-50">
                            {actionLoading === k.userId + "reject" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                            Reject
                          </button>
                        </div>
                      </div>

                      {/* Expanded detail panel */}
                      {expandedKyc === k.userId && k.kycDetail && (
                        <div className="border-t border-[#1e1e1e] p-4 bg-[#0d0d0d]">
                          {/* Documents row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            {[
                              { label: "Selfie",          url: k.kycDetail.selfieUrl },
                              { label: "ID Front",        url: k.kycDetail.docFrontUrl },
                              { label: "ID Back",         url: k.kycDetail.docBackUrl },
                              { label: "Address Proof",   url: k.kycDetail.addressDocUrl },
                            ].map(({ label, url }) => (
                              <div key={label}>
                                <p className="text-[10px] text-gray-600 mb-1 font-semibold uppercase tracking-wide">{label}</p>
                                {url ? (
                                  <a href={url} target="_blank" rel="noreferrer"
                                    className="block relative rounded-lg overflow-hidden border border-[#2a2a2a] hover:border-[#f0b90b]/40 transition-colors group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={url} alt={label}
                                      className="w-full h-24 object-cover"
                                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                      <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-semibold">View</span>
                                    </div>
                                  </a>
                                ) : (
                                  <div className="h-24 rounded-lg bg-[#131313] border border-[#1e1e1e] flex items-center justify-center">
                                    <span className="text-[10px] text-gray-700 font-semibold">Not uploaded</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {/* Text details */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                            {[
                              { label: "Full Name",    value: k.kycDetail.fullName },
                              { label: "Date of Birth", value: k.kycDetail.dob },
                              { label: "Nationality",  value: k.kycDetail.nationality },
                              { label: "ID Type",      value: k.kycDetail.idType },
                              { label: "Address",      value: k.kycDetail.address },
                              { label: "Submitted",    value: k.kycDetail.submittedAt ? new Date(k.kycDetail.submittedAt).toLocaleString() : "-" },
                            ].map(({ label, value }) => (
                              <div key={label}>
                                <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide">{label}</p>
                                <p className="text-xs text-gray-300 mt-0.5">{value || "-"}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed section */}
            {kycCompletedList.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-400 text-sm mb-3">
                  Completed ({kycCompletedList.length})
                </h3>
                <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden">
                  <table className="w-full exchange-table">
                    <thead>
                      <tr>
                        <th className="text-left">User</th>
                        <th className="text-left hidden sm:table-cell">Nationality</th>
                        <th className="text-left hidden md:table-cell">ID Type</th>
                        <th className="text-left">Status</th>
                        <th className="text-left hidden lg:table-cell">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kycCompletedList.map(k => (
                        <tr key={k.userId}>
                          <td>
                            <div className="font-semibold text-sm">{k.fullName}</div>
                            <div className="text-xs text-gray-500">{k.email}</div>
                          </td>
                          <td className="text-gray-400 text-sm hidden sm:table-cell">{k.nationality || "-"}</td>
                          <td className="text-gray-400 text-xs hidden md:table-cell">{k.idType || "-"}</td>
                          <td><Badge status={k.status} /></td>
                          <td className="text-gray-400 text-xs hidden lg:table-cell">
                            {k.submittedAt ? new Date(k.submittedAt).toLocaleDateString() : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CAMPAIGN ─────────────────────────────────────────────────────── */}
        {tab === "campaign" && (
          <div className="space-y-6">
            {loadingCampaign ? (
              <div className="text-center py-12 text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading campaign data...
              </div>
            ) : (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Participants", value: campaign?.stats.totalParticipants ?? 0, color: "text-blue-400" },
                    { label: "Active Stakers",     value: campaign?.stats.activeStakers ?? 0,     color: "text-ex-green" },
                    { label: "Loans Disbursed",    value: campaign?.stats.loansDisbursed ?? 0,    color: "text-ex-yellow" },
                    { label: "Total Staked",       value: `$${(campaign?.stats.totalStaked ?? 0).toLocaleString()}`, color: "text-ex-green" },
                  ].map((s, i) => (
                    <div key={i} className="bg-ex-card border border-ex-border rounded-2xl p-4">
                      <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Campaign Settings */}
                <div className="bg-ex-card border border-ex-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2">
                      <Settings className="w-4 h-4 text-ex-yellow" /> Campaign Settings
                    </h3>
                    {!editingSettings ? (
                      <button onClick={() => setEditingSettings(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-ex-yellow/10 text-ex-yellow text-xs rounded-lg border border-ex-yellow/30 hover:bg-ex-yellow/20 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" /> Edit Settings
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingSettings(false); setSettingsForm({ chatModel: "gemini-2.5-flash", ...campaign!.settings }); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-ex-red/10 text-ex-red text-xs rounded-lg border border-ex-red/30 hover:bg-ex-red/20 transition-colors">
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                        <button onClick={saveSettings} disabled={actionLoading === "save_settings"}
                          className="flex items-center gap-1 px-3 py-1.5 bg-ex-green text-black text-xs font-bold rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50">
                          {actionLoading === "save_settings" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: "Campaign Deadline",    key: "deadline",      type: "date",   value: settingsForm.deadline },
                      { label: "Max Spots",            key: "maxSpots",      type: "number", value: settingsForm.maxSpots },
                      { label: "Loan Amount (USDT)",   key: "loanAmount",    type: "number", value: settingsForm.loanAmount },
                      { label: "Min Stake (USDT)",     key: "minStake",      type: "number", value: settingsForm.minStake },
                      { label: "Max Stake (USDT)",     key: "maxStake",      type: "number", value: settingsForm.maxStake },
                      { label: "Display Filled (base)", key: "displayFilled", type: "number", value: settingsForm.displayFilled },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-xs text-gray-500 block mb-1">{f.label}</label>
                        {editingSettings ? (
                          <input
                            type={f.type} className="ex-input h-9 text-sm w-full"
                            value={f.value}
                            onChange={e => setSettingsForm(s => ({
                              ...s,
                              [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                            }))}
                          />
                        ) : (
                          <div className="bg-ex-bg border border-ex-border rounded-xl px-3 h-9 flex items-center text-sm font-semibold">
                            {f.type === "number" ? Number(f.value).toLocaleString() : f.value}
                          </div>
                        )}
                      </div>
                    ))}

                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Campaign Status</label>
                      {editingSettings ? (
                        <button
                          onClick={() => setSettingsForm(s => ({ ...s, enabled: !s.enabled }))}
                          className={`h-9 px-4 rounded-xl text-xs font-bold border transition-colors w-full ${
                            settingsForm.enabled
                              ? "bg-ex-green/10 text-ex-green border-ex-green/30"
                              : "bg-ex-red/10 text-ex-red border-ex-red/30"
                          }`}>
                          {settingsForm.enabled ? "ENABLED · Click to Disable" : "DISABLED · Click to Enable"}
                        </button>
                      ) : (
                        <div className={`bg-ex-bg border rounded-xl px-3 h-9 flex items-center text-xs font-bold ${
                          campaign?.settings.enabled
                            ? "border-ex-green/30 text-ex-green"
                            : "border-ex-red/30 text-ex-red"
                        }`}>
                          {campaign?.settings.enabled ? "✓ Campaign Active" : "✗ Campaign Disabled"}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    <span className="text-ex-yellow font-semibold">Display Filled</span> = base number you set + real stakers from DB. This controls what homepage &amp; campaign page show. Does not block staking.
                  </p>

                  {/* Chat Bot Model */}
                  <div className="mt-4 pt-4 border-t border-ex-border">
                    <label className="text-xs text-gray-500 block mb-1">Chat Bot Model (Gemini)</label>
                    {editingSettings ? (
                      <input
                        type="text"
                        className="ex-input h-9 text-sm w-full max-w-xs font-mono"
                        value={settingsForm.chatModel}
                        placeholder="e.g. gemini-2.5-flash"
                        onChange={e => setSettingsForm(s => ({ ...s, chatModel: e.target.value }))}
                      />
                    ) : (
                      <div className="bg-ex-bg border border-ex-border rounded-xl px-3 h-9 flex items-center text-sm font-mono text-ex-yellow w-fit min-w-[180px]">
                        {settingsForm.chatModel || "gemini-2.5-flash"}
                      </div>
                    )}
                    <p className="text-xs text-gray-600 mt-1">Gemini model ID used by the Nova chat widget. Must match a valid model on <span className="text-gray-500">ai.google.dev</span>.</p>
                  </div>
                </div>

                {/* Distribute all */}
                {(campaign?.stats.activeStakers ?? 0) > 0 && (
                  <div className="bg-ex-yellow/5 border border-ex-yellow/20 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-ex-yellow">{campaign?.stats.activeStakers} users ready for loan disbursement</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Total: {((campaign?.stats.activeStakers ?? 0) * (campaign?.settings.loanAmount ?? 50000)).toLocaleString()} USDT
                      </div>
                    </div>
                    <button
                      onClick={() => distributeReward()}
                      disabled={!!actionLoading}
                      className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2 disabled:opacity-40">
                      {actionLoading === "dist_all" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                      Disburse All
                    </button>
                  </div>
                )}

                {/* Participants table */}
                {(campaign?.participants.length ?? 0) === 0 ? (
                  <div className="text-center py-10 text-gray-500 bg-ex-card border border-ex-border rounded-2xl">
                    <Lock className="w-10 h-10 mx-auto mb-2 text-gray-700" />
                    No participants yet
                  </div>
                ) : (
                  <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-ex-border">
                      <h3 className="font-bold text-sm">All Participants ({campaign?.participants.length})</h3>
                    </div>
                    <table className="w-full exchange-table">
                      <thead>
                        <tr>
                          <th className="text-left">User</th>
                          <th className="text-left hidden sm:table-cell">KYC</th>
                          <th className="text-left">Staked</th>
                          <th className="text-left">Status</th>
                          <th className="text-left hidden md:table-cell">Deposit Address</th>
                          <th className="text-left hidden lg:table-cell">Staked On</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaign?.participants.map(p => (
                          <tr key={p.id}>
                            <td>
                              <div className="font-semibold text-sm">{p.fullName}</div>
                              <div className="text-xs text-gray-500">{p.email}</div>
                            </td>
                            <td className="hidden sm:table-cell"><Badge status={p.kycStatus || "none"} /></td>
                            <td className="font-num font-semibold text-sm">${(p.stakeAmount ?? 0).toLocaleString()}</td>
                            <td><Badge status={p.stakeStatus} /></td>
                            <td className="text-xs font-mono text-gray-400 max-w-[130px] truncate hidden md:table-cell">
                              {p.depositAddress ?? "-"}
                            </td>
                            <td className="text-gray-400 text-xs hidden lg:table-cell">
                              {p.stakedAt ? new Date(p.stakedAt).toLocaleDateString() : "-"}
                            </td>
                            <td className="text-center">
                              {p.stakeStatus === "active" && (
                                <button
                                  onClick={() => distributeReward(p.id)}
                                  disabled={!!actionLoading}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-ex-yellow/10 text-ex-yellow text-xs rounded-lg hover:bg-ex-yellow/20 border border-ex-yellow/30 disabled:opacity-50 mx-auto transition-colors">
                                  {actionLoading === `dist_${p.id}` ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Gift className="w-3 h-3" />}
                                  Disburse
                                </button>
                              )}
                              {p.stakeStatus === "rewarded" && (
                                <span className="text-xs text-ex-green flex items-center gap-1 justify-center">
                                  <CheckCircle className="w-3 h-3" /> Done
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── DEPOSITS ─────────────────────────────────────────────────────── */}
        {tab === "deposits" && (
          <div className="space-y-5">
            {loadingDeposits ? (
              <div className="text-center py-16 text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading deposit data...
              </div>
            ) : (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-ex-card border border-ex-border rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-ex-green/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-ex-green" />
                      </div>
                      <span className="text-xs text-gray-500">Total Volume</span>
                    </div>
                    <div className="text-2xl font-black text-ex-green font-num">
                      ${(depositStats?.totalVolume ?? 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">USDT all chains</div>
                  </div>
                  <div className="bg-ex-card border border-ex-border rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <span className="text-[10px] font-black text-red-400">TRX</span>
                      </div>
                      <span className="text-xs text-gray-500">TRC20 Total</span>
                    </div>
                    <div className="text-2xl font-black text-white font-num">
                      ${(depositStats?.trc20Total ?? 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{depositStats?.trc20Count ?? 0} deposits</div>
                  </div>
                  <div className="bg-ex-card border border-ex-border rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-ex-yellow/10 flex items-center justify-center">
                        <span className="text-[10px] font-black text-ex-yellow">BSC</span>
                      </div>
                      <span className="text-xs text-gray-500">BEP20 Total</span>
                    </div>
                    <div className="text-2xl font-black text-ex-yellow font-num">
                      ${(depositStats?.bscTotal ?? 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{depositStats?.bscCount ?? 0} deposits</div>
                  </div>
                  <div className="bg-ex-card border border-ex-border rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-400/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-xs text-gray-500">Addresses Assigned</span>
                    </div>
                    <div className="flex gap-3">
                      <div>
                        <div className="text-xl font-black text-red-400 font-num">{depositStats?.usersWithTrc ?? 0}</div>
                        <div className="text-[10px] text-gray-600">TRC20</div>
                      </div>
                      <div className="w-px bg-ex-border" />
                      <div>
                        <div className="text-xl font-black text-ex-yellow font-num">{depositStats?.usersWithBsc ?? 0}</div>
                        <div className="text-[10px] text-gray-600">BSC</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exchange wallets info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exchangeWallet && (
                    <div className="bg-ex-card border border-ex-border rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <span className="text-[9px] font-black text-red-400">TRX</span>
                        </div>
                        <span className="text-sm font-bold">TRC20 Exchange Wallet</span>
                        <span className="text-xs text-gray-500 ml-auto">Fund with USDT + TRX</span>
                      </div>
                      <div className="font-mono text-xs text-gray-200 break-all bg-ex-bg rounded-lg p-2.5 select-all border border-ex-border">
                        {exchangeWallet}
                      </div>
                    </div>
                  )}
                  <div className="bg-ex-card border border-ex-border rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-ex-yellow/10 flex items-center justify-center">
                        <span className="text-[9px] font-black text-ex-yellow">BSC</span>
                      </div>
                      <span className="text-sm font-bold">BSC Exchange Wallet</span>
                      <span className="text-xs text-gray-500 ml-auto">Fund with USDT + BNB</span>
                    </div>
                    <div className="font-mono text-xs text-gray-200 break-all bg-ex-bg rounded-lg p-2.5 select-all border border-ex-border">
                      0xDD1480D39466c4457693fE3408A052bbfAA68C18
                    </div>
                  </div>
                </div>

                {/* View toggle + search + chain filter */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex bg-ex-card border border-ex-border rounded-xl overflow-hidden">
                    {(["addresses", "transactions"] as const).map(v => (
                      <button key={v} onClick={() => setDepositView(v)}
                        className={`px-4 py-2 text-xs font-semibold transition-colors capitalize ${
                          depositView === v
                            ? "bg-ex-yellow text-black"
                            : "text-gray-400 hover:text-white"
                        }`}>
                        {v === "addresses" ? `User Addresses (${depositUsers.length})` : `Deposit History (${depositTxns.length})`}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {(["all", "TRC20", "BSC"] as const).map(c => (
                      <button key={c} onClick={() => setDepositChainFilter(c)}
                        className={`px-3 py-1.5 text-xs rounded-lg border font-semibold transition-colors ${
                          depositChainFilter === c
                            ? c === "TRC20" ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : c === "BSC"   ? "bg-ex-yellow/20 text-ex-yellow border-ex-yellow/30"
                            :                 "bg-white/10 text-white border-white/20"
                            : "text-gray-500 border-ex-border hover:text-gray-300"
                        }`}>
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input className="ex-input pl-8 h-8 text-xs w-full"
                      placeholder={depositView === "addresses" ? "Search user..." : "Search user or hash..."}
                      value={depositSearch} onChange={e => setDepositSearch(e.target.value)} />
                  </div>
                  <button onClick={() => { fetchDeposits(); fetchBalances(); }} disabled={loadingDeposits}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-ex-border rounded-lg transition-colors disabled:opacity-50">
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingDeposits ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                  {depositView === "addresses" && (
                    <button
                      onClick={() => setPinModal({ show: true, mode: "bulk", chain: depositChainFilter === "all" ? "all" : depositChainFilter, pin: "", loading: false })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-ex-yellow hover:bg-ex-yellow/80 rounded-lg transition-colors">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Sweep All
                    </button>
                  )}
                </div>

                {/* USER ADDRESSES TABLE */}
                {depositView === "addresses" && (() => {
                  const filtered = depositUsers
                    .filter(u => {
                      const matchSearch = !depositSearch ||
                        u.fullName.toLowerCase().includes(depositSearch.toLowerCase()) ||
                        u.email.toLowerCase().includes(depositSearch.toLowerCase());
                      const matchChain = depositChainFilter === "all"
                        || (depositChainFilter === "TRC20" && !!u.trc20Address)
                        || (depositChainFilter === "BSC"   && !!u.bscAddress);
                      return matchSearch && matchChain;
                    })
                    // Sort: addresses with balance first
                    .sort((a, b) => {
                      const balA = (addressBalances[a.id]?.trc20 ?? 0) + (addressBalances[a.id]?.bsc ?? 0);
                      const balB = (addressBalances[b.id]?.trc20 ?? 0) + (addressBalances[b.id]?.bsc ?? 0);
                      return balB - balA;
                    });
                  return filtered.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-ex-card border border-ex-border rounded-2xl">
                      <Wallet className="w-10 h-10 mx-auto mb-2 text-gray-700" />
                      No users match filters
                    </div>
                  ) : (
                    <div className="bg-ex-card border border-ex-border rounded-2xl overflow-x-auto">
                      <table className="w-full exchange-table">
                        <thead>
                          <tr>
                            <th className="text-left text-xs">#</th>
                            <th className="text-left">User</th>
                            <th className="text-left">KYC</th>
                            <th className="text-left">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                                TRC20 Address (TRON)
                              </span>
                            </th>
                            <th className="text-left">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-ex-yellow inline-block" />
                                BSC Address (BEP20)
                              </span>
                            </th>
                            <th className="text-left text-xs">Sweep to Hot Wallet</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map(u => {
                            const trcKey  = `${u.id}-TRC20`;
                            const bscKey  = `${u.id}-BSC`;
                            const trcSt   = sweepStatus[trcKey];
                            const bscSt   = sweepStatus[bscKey];
                            const bal     = addressBalances[u.id];
                            const trcBal  = bal?.trc20 ?? null;
                            const bscBal  = bal?.bsc  ?? null;
                            return (
                            <tr key={u.id}>
                              <td className="text-gray-500 text-xs font-mono">{u.addressIndex ?? "-"}</td>
                              <td>
                                <div className="font-semibold text-sm">{u.fullName}</div>
                                <div className="text-xs text-gray-500">{u.email}</div>
                              </td>
                              <td><Badge status={u.kycStatus || "none"} /></td>
                              <td>
                                {u.trc20Address ? (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-mono text-xs text-red-300 bg-red-500/5 border border-red-500/20 rounded-lg px-2 py-1 select-all">
                                      {u.trc20Address}
                                    </span>
                                    {trcBal !== null && (
                                      <span className={`text-[11px] font-semibold px-1 ${trcBal > 0 ? "text-green-400" : "text-gray-600"}`}>
                                        {loadingBalances ? "…" : `${trcBal.toFixed(2)} USDT`}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-700">—</span>
                                )}
                              </td>
                              <td>
                                {u.bscAddress ? (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-mono text-xs text-ex-yellow bg-ex-yellow/5 border border-ex-yellow/20 rounded-lg px-2 py-1 select-all">
                                      {u.bscAddress}
                                    </span>
                                    {bscBal !== null && (
                                      <span className={`text-[11px] font-semibold px-1 ${bscBal > 0 ? "text-green-400" : "text-gray-600"}`}>
                                        {loadingBalances ? "…" : `${bscBal.toFixed(2)} USDT`}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-700">—</span>
                                )}
                              </td>
                              <td>
                                <div className="flex flex-col gap-1.5 min-w-[160px]">
                                  {/* TRC20 sweep */}
                                  {u.trc20Address && (
                                    <div className="flex flex-col gap-0.5">
                                      <button
                                        disabled={trcSt?.loading}
                                        onClick={() => setPinModal({ show: true, mode: "single", userId: u.id, userName: u.fullName, chain: "TRC20", pin: "", loading: false })}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                      >
                                        {trcSt?.loading ? (
                                          <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <ArrowUpRight className="w-3 h-3" />
                                        )}
                                        Sweep TRC20
                                      </button>
                                      {trcSt?.txHash && (
                                        <a href={`https://tronscan.org/#/transaction/${trcSt.txHash}`} target="_blank" rel="noreferrer"
                                          className="text-[10px] text-green-400 hover:underline truncate max-w-[160px]">
                                          ✓ {trcSt.amount?.toFixed(2)} USDT swept
                                        </a>
                                      )}
                                      {trcSt?.error && (
                                        <span className="text-[10px] text-red-400 leading-tight">{trcSt.error}</span>
                                      )}
                                    </div>
                                  )}
                                  {/* BSC sweep */}
                                  {u.bscAddress && (
                                    <div className="flex flex-col gap-0.5">
                                      <button
                                        disabled={bscSt?.loading}
                                        onClick={() => setPinModal({ show: true, mode: "single", userId: u.id, userName: u.fullName, chain: "BSC", pin: "", loading: false })}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-ex-yellow/10 border border-ex-yellow/30 text-ex-yellow hover:bg-ex-yellow/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                      >
                                        {bscSt?.loading ? (
                                          <span className="w-3 h-3 border border-ex-yellow border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <ArrowUpRight className="w-3 h-3" />
                                        )}
                                        Sweep BSC
                                      </button>
                                      {bscSt?.txHash && (
                                        <a href={`https://bscscan.com/tx/${bscSt.txHash}`} target="_blank" rel="noreferrer"
                                          className="text-[10px] text-green-400 hover:underline truncate max-w-[160px]">
                                          ✓ {bscSt.amount?.toFixed(2)} USDT swept
                                        </a>
                                      )}
                                      {bscSt?.error && (
                                        <span className="text-[10px] text-yellow-400 leading-tight">{bscSt.error}</span>
                                      )}
                                    </div>
                                  )}
                                  {!u.trc20Address && !u.bscAddress && (
                                    <span className="text-xs text-gray-700">—</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {/* DEPOSIT TRANSACTIONS TABLE */}
                {depositView === "transactions" && (() => {
                  const filtered = depositTxns.filter(tx => {
                    const matchSearch = !depositSearch ||
                      tx.userFullName.toLowerCase().includes(depositSearch.toLowerCase()) ||
                      tx.userEmail.toLowerCase().includes(depositSearch.toLowerCase()) ||
                      (tx.txHash ?? "").toLowerCase().includes(depositSearch.toLowerCase());
                    const matchChain = depositChainFilter === "all" || tx.chain === depositChainFilter;
                    return matchSearch && matchChain;
                  });
                  return filtered.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-ex-card border border-ex-border rounded-2xl">
                      <Activity className="w-10 h-10 mx-auto mb-2 text-gray-700" />
                      No deposits found
                    </div>
                  ) : (
                    <div className="bg-ex-card border border-ex-border rounded-2xl overflow-x-auto">
                      <table className="w-full exchange-table">
                        <thead>
                          <tr>
                            <th className="text-left">User</th>
                            <th className="text-left">Chain</th>
                            <th className="text-left">Amount</th>
                            <th className="text-left">Status</th>
                            <th className="text-left hidden md:table-cell">Description</th>
                            <th className="text-left hidden lg:table-cell">TX Hash</th>
                            <th className="text-left hidden md:table-cell">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map(tx => (
                            <tr key={tx.id}>
                              <td>
                                <div className="font-semibold text-sm">{tx.userFullName}</div>
                                <div className="text-xs text-gray-500">{tx.userEmail}</div>
                              </td>
                              <td>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                  tx.chain === "TRC20"
                                    ? "text-red-400 bg-red-500/10 border-red-500/20"
                                    : tx.chain === "BSC"
                                    ? "text-ex-yellow bg-ex-yellow/10 border-ex-yellow/20"
                                    : "text-gray-400 bg-gray-800 border-gray-700"
                                }`}>
                                  {tx.chain}
                                </span>
                              </td>
                              <td>
                                <div className="font-semibold font-num text-ex-green text-sm">
                                  +{tx.amount.toLocaleString()} {tx.asset}
                                </div>
                              </td>
                              <td><Badge status={tx.status} /></td>
                              <td className="text-gray-500 text-xs hidden md:table-cell max-w-[160px] truncate">
                                {tx.desc ?? "-"}
                              </td>
                              <td className="hidden lg:table-cell">
                                {tx.txHash ? (
                                  <a
                                    href={
                                      tx.chain === "BSC"
                                        ? `https://bscscan.com/tx/${tx.txHash}`
                                        : `https://tronscan.org/#/transaction/${tx.txHash}`
                                    }
                                    target="_blank" rel="noreferrer"
                                    className="font-mono text-xs text-blue-400 hover:text-blue-300 underline max-w-[120px] truncate block">
                                    {tx.txHash.slice(0, 12)}…
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-700">—</span>
                                )}
                              </td>
                              <td className="text-gray-400 text-xs hidden md:table-cell">
                                {tx.date || (tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "-")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* ── WITHDRAWALS ──────────────────────────────────────────────────── */}
        {tab === "withdrawals" && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <h2 className="font-bold">Withdrawal Requests</h2>
                <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${
                  withdrawalsEnabled
                    ? "text-ex-green bg-ex-green/10 border-ex-green/30"
                    : "text-ex-red bg-ex-red/10 border-ex-red/30"
                }`}>
                  WD {withdrawalsEnabled ? "ON" : "OFF"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Status filter tabs */}
                {["all", "pending", "approved", "rejected"].map(s => (
                  <button key={s} onClick={() => setWdStatusFilter(s)}
                    className={`px-3 py-1 text-xs rounded-lg border font-semibold transition-colors ${
                      wdStatusFilter === s
                        ? "bg-ex-yellow text-black border-ex-yellow"
                        : "text-gray-400 border-ex-border hover:text-white"
                    }`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                    {s !== "all" && (
                      <span className="ml-1 text-xs opacity-70">
                        ({withdrawals.filter(w => w.status === s).length})
                      </span>
                    )}
                  </button>
                ))}
                <button onClick={toggleWithdrawals} disabled={actionLoading === "toggle"}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    withdrawalsEnabled
                      ? "bg-ex-red/10 text-ex-red border-ex-red/30 hover:bg-ex-red/20"
                      : "bg-ex-green/10 text-ex-green border-ex-green/30 hover:bg-ex-green/20"
                  } disabled:opacity-50`}>
                  <Power className="w-3 h-3" />
                  {withdrawalsEnabled ? "Disable" : "Enable"}
                </button>
              </div>
            </div>

            {loadingWd ? (
              <div className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /></div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-ex-card border border-ex-border rounded-2xl">
                <ArrowUpRight className="w-10 h-10 mx-auto mb-2 text-gray-700" />
                No {wdStatusFilter === "all" ? "" : wdStatusFilter} withdrawal requests
              </div>
            ) : (
              <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden">
                <table className="w-full exchange-table">
                  <thead>
                    <tr>
                      <th className="text-left">User</th>
                      <th className="text-left">Amount</th>
                      <th className="text-left hidden md:table-cell">Destination</th>
                      <th className="text-left">Status</th>
                      <th className="text-left hidden lg:table-cell">Note</th>
                      <th className="text-left hidden md:table-cell">Date</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWithdrawals.map(w => (
                      <tr key={w.id}>
                        <td>
                          <div className="font-semibold text-sm">{w.user?.fullName ?? "-"}</div>
                          <div className="text-xs text-gray-500">{w.user?.email ?? w.userId.slice(0, 8)}</div>
                        </td>
                        <td>
                          <div className="font-semibold font-num text-sm">{w.amount} {w.asset}</div>
                          <div className="text-xs text-gray-500">fee: {w.fee} {w.asset}</div>
                          <div className="text-xs text-ex-green">net: {w.amount - w.fee} {w.asset}</div>
                        </td>
                        <td className="hidden md:table-cell text-xs font-mono text-gray-400 max-w-[140px] truncate">
                          {w.destinationAddress}
                        </td>
                        <td><Badge status={w.status} /></td>
                        <td className="hidden lg:table-cell text-xs text-gray-500 max-w-[120px] truncate">
                          {w.adminNote ?? "-"}
                        </td>
                        <td className="text-gray-400 text-xs hidden md:table-cell">
                          {new Date(w.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          {w.status === "pending" && (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => withdrawalAction(w.id, "approve")}
                                disabled={!!actionLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-ex-green/10 text-ex-green text-xs rounded-lg hover:bg-ex-green/20 border border-ex-green/30 disabled:opacity-50 transition-colors">
                                {actionLoading === w.id + "approve"
                                  ? <RefreshCw className="w-3 h-3 animate-spin" />
                                  : <Check className="w-3 h-3" />}
                                Approve
                              </button>
                              <button
                                onClick={() => withdrawalAction(w.id, "reject")}
                                disabled={!!actionLoading}
                                className="flex items-center gap-1 px-2 py-1.5 bg-ex-red/10 text-ex-red text-xs rounded-lg hover:bg-ex-red/20 border border-ex-red/30 disabled:opacity-50 transition-colors">
                                {actionLoading === w.id + "reject"
                                  ? <RefreshCw className="w-3 h-3 animate-spin" />
                                  : <X className="w-3 h-3" />}
                                Reject
                              </button>
                            </div>
                          )}
                          {w.status !== "pending" && (
                            <span className="text-xs text-gray-600 text-center block">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TRANSACTIONS ─────────────────────────────────────────────────── */}
        {tab === "transactions" && (
          <div>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input className="ex-input pl-9 h-9 text-sm w-full" placeholder="Search user..."
                  value={txSearch} onChange={e => setTxSearch(e.target.value)} />
              </div>
              <select className="ex-input h-9 text-sm w-auto" value={txTypeFilter}
                onChange={e => setTxTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="stake">Stake</option>
                <option value="unstake">Unstake</option>
                <option value="reward">Reward / Loan</option>
                <option value="loan_repayment">Loan Repayment</option>
              </select>
              <div className="text-xs text-gray-500 flex items-center">
                {filteredTx.length} of {transactions.length} transactions
              </div>
            </div>

            {loadingTx ? (
              <div className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /></div>
            ) : filteredTx.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-ex-card border border-ex-border rounded-2xl">
                <Activity className="w-10 h-10 mx-auto mb-2 text-gray-700" />
                No transactions found
              </div>
            ) : (
              <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden">
                <table className="w-full exchange-table">
                  <thead>
                    <tr>
                      <th className="text-left">User</th>
                      <th className="text-left">Type</th>
                      <th className="text-left">Amount</th>
                      <th className="text-left hidden sm:table-cell">Asset</th>
                      <th className="text-left">Status</th>
                      <th className="text-left hidden md:table-cell">Description</th>
                      <th className="text-left hidden lg:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx.map(tx => (
                      <tr key={tx.id}>
                        <td>
                          <div className="font-semibold text-sm">{tx.userFullName || "-"}</div>
                          <div className="text-xs text-gray-500">{tx.userEmail}</div>
                        </td>
                        <td><TxTypeBadge type={tx.type} /></td>
                        <td className="font-num font-semibold text-sm">{tx.amount.toLocaleString()}</td>
                        <td className="text-gray-400 text-xs hidden sm:table-cell">{tx.asset}</td>
                        <td><Badge status={tx.status} /></td>
                        <td className="text-gray-500 text-xs hidden md:table-cell max-w-[160px] truncate">
                          {tx.desc ?? "-"}
                        </td>
                        <td className="text-gray-400 text-xs hidden lg:table-cell">
                          {tx.date || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* ── PIN Modal ──────────────────────────────────────────────────────────── */}
    {pinModal.show && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
        onClick={() => !pinModal.loading && setPinModal({ show: false, mode: "single", chain: "TRC20", pin: "", loading: false })}
        onKeyDown={e => e.key === "Escape" && !pinModal.loading && setPinModal({ show: false, mode: "single", chain: "TRC20", pin: "", loading: false })}
      >
        <div className="bg-ex-card border border-ex-border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-ex-yellow/10 border border-ex-yellow/30 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-ex-yellow" />
            </div>
            <div>
              <div className="font-semibold text-sm text-white">
                {pinModal.mode === "bulk"
                  ? `Sweep All — ${pinModal.chain === "all" ? "TRC20 + BSC" : pinModal.chain}`
                  : `Sweep ${pinModal.chain} — ${pinModal.userName ?? ""}`}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Enter your sweep PIN to continue</div>
            </div>
          </div>

          <input
            type="password"
            autoFocus
            placeholder="PIN"
            value={pinModal.pin}
            onChange={e => setPinModal(prev => ({ ...prev, pin: e.target.value, error: undefined }))}
            onKeyDown={async e => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (!pinModal.pin) return;
                if (pinModal.mode === "single" && pinModal.userId) {
                  setPinModal(prev => ({ ...prev, loading: true, error: undefined }));
                  await handleSweep(pinModal.userId!, pinModal.chain as "TRC20" | "BSC", pinModal.pin);
                  setPinModal({ show: false, mode: "single", chain: "TRC20", pin: "", loading: false });
                } else if (pinModal.mode === "bulk") {
                  setPinModal(prev => ({ ...prev, loading: true, error: undefined }));
                  const pin = pinModal.pin;
                  const chains: ("TRC20" | "BSC")[] = pinModal.chain === "all" ? ["TRC20", "BSC"] : [pinModal.chain as "TRC20" | "BSC"];
                  const targets = depositUsers.filter(u =>
                    (chains.includes("TRC20") && !!u.trc20Address) ||
                    (chains.includes("BSC")   && !!u.bscAddress)
                  );
                  setPinModal({ show: false, mode: "single", chain: "TRC20", pin: "", loading: false });
                  for (const u of targets) {
                    for (const chain of chains) {
                      if (chain === "TRC20" && !u.trc20Address) continue;
                      if (chain === "BSC"   && !u.bscAddress)   continue;
                      await handleSweep(u.id, chain, pin);
                    }
                  }
                }
              }
            }}
            className="ex-input w-full text-center tracking-widest text-lg mb-3"
          />
          {pinModal.error && (
            <div className="text-xs text-red-400 mb-3 text-center">{pinModal.error}</div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setPinModal({ show: false, mode: "single", chain: "TRC20", pin: "", loading: false })}
              className="flex-1 px-4 py-2 text-xs text-gray-400 border border-ex-border rounded-lg hover:text-white transition-colors">
              Cancel
            </button>
            <button
              disabled={!pinModal.pin || pinModal.loading}
              onClick={async () => {
                if (!pinModal.pin) return;
                if (pinModal.mode === "single" && pinModal.userId) {
                  setPinModal(prev => ({ ...prev, loading: true, error: undefined }));
                  await handleSweep(pinModal.userId!, pinModal.chain as "TRC20" | "BSC", pinModal.pin);
                  setPinModal({ show: false, mode: "single", chain: "TRC20", pin: "", loading: false });
                } else if (pinModal.mode === "bulk") {
                  setPinModal(prev => ({ ...prev, loading: true, error: undefined }));
                  const pin = pinModal.pin;
                  const chains: ("TRC20" | "BSC")[] = pinModal.chain === "all" ? ["TRC20", "BSC"] : [pinModal.chain as "TRC20" | "BSC"];
                  const targets = depositUsers.filter(u =>
                    (chains.includes("TRC20") && !!u.trc20Address) ||
                    (chains.includes("BSC")   && !!u.bscAddress)
                  );
                  setPinModal({ show: false, mode: "single", chain: "TRC20", pin: "", loading: false });
                  for (const u of targets) {
                    for (const chain of chains) {
                      if (chain === "TRC20" && !u.trc20Address) continue;
                      if (chain === "BSC"   && !u.bscAddress)   continue;
                      await handleSweep(u.id, chain, pin);
                    }
                  }
                }
              }}
              className="flex-1 px-4 py-2 text-xs font-semibold bg-ex-yellow text-black rounded-lg hover:bg-ex-yellow/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5">
              {pinModal.loading ? <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              {pinModal.mode === "bulk" ? "Sweep All" : "Confirm Sweep"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
