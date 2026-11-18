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

type TabType = "overview" | "users" | "kyc" | "campaign" | "withdrawals" | "transactions";

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  queuePosition: number;
  kycStatus: string;
  depositAddress: string | null;
  stakeStatus: string;
  stakeAmount: number;
  rewardDistributed: boolean;
  createdAt: string;
}

interface KycSubmission {
  userId: string;
  fullName: string;
  dob: string;
  address: string;
  idType: string;
  idNumber: string;
  nationality: string;
  status: string;
  submittedAt: string;
  userFullName: string;
  userEmail: string;
  userCountry: string;
  userKycStatus: string;
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Data state
  const [stats, setStats]           = useState<AdminStats | null>(null);
  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [kycList, setKycList]       = useState<KycSubmission[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [campaign, setCampaign]     = useState<CampaignData | null>(null);
  const [exchangeWallet, setExchangeWallet] = useState<string | null>(null);

  // Campaign settings edit state
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    deadline: "2026-12-31", maxSpots: 1000, loanAmount: 50000,
    minStake: 500, maxStake: 50000, enabled: true,
  });

  // Loading state per section
  const [loadingStats, setLoadingStats]     = useState(false);
  const [loadingUsers, setLoadingUsers]     = useState(false);
  const [loadingKyc, setLoadingKyc]         = useState(false);
  const [loadingWd, setLoadingWd]           = useState(false);
  const [loadingTx, setLoadingTx]           = useState(false);
  const [loadingCampaign, setLoadingCampaign] = useState(false);

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
      if (r.ok) { const d = await r.json(); setKycList(d.submissions ?? []); }
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
    if (tab === "kyc" && kycList.length === 0)       fetchKyc();
    if (tab === "campaign" && !campaign)             fetchCampaign();
    if (tab === "transactions" && transactions.length === 0) fetchTransactions();
  }, [tab]);

  const refreshAll = () => {
    fetchStats(); fetchUsers(); fetchWithdrawals();
    if (tab === "kyc")          fetchKyc();
    if (tab === "campaign")     fetchCampaign();
    if (tab === "transactions") fetchTransactions();
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
  const kycPending  = kycList.filter(k => k.status === "under_review");
  const kycDone     = kycList.filter(k => k.status !== "under_review");
  const filteredKyc = kycSearch
    ? kycPending.filter(k =>
        k.userFullName.toLowerCase().includes(kycSearch.toLowerCase()) ||
        k.userEmail.toLowerCase().includes(kycSearch.toLowerCase()))
    : kycPending;

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
    { id: "kyc",          label: "KYC Review",   icon: Shield,        badge: kycPending.length },
    { id: "campaign",     label: "Campaign",     icon: Trophy,        badge: campaign?.stats.activeStakers },
    { id: "withdrawals",  label: "Withdrawals",  icon: ArrowUpRight,  badge: pendingWdCount },
    { id: "transactions", label: "Transactions", icon: Activity },
  ];

  return (
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
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                {[
                                  { label: "Full ID",          value: u.id },
                                  { label: "Phone",            value: u.phone || "-" },
                                  { label: "Queue Position",   value: `#${u.queuePosition}` },
                                  { label: "Deposit Address",  value: u.depositAddress ?? "Not assigned" },
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
                  {kycPending.length > 0 && (
                    <span className="bg-ex-yellow text-black text-xs font-black px-2 py-0.5 rounded-full">{kycPending.length}</span>
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
                <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden">
                  <table className="w-full exchange-table">
                    <thead>
                      <tr>
                        <th className="text-left">User</th>
                        <th className="text-left hidden sm:table-cell">Nationality</th>
                        <th className="text-left hidden md:table-cell">DOB</th>
                        <th className="text-left hidden md:table-cell">ID Type</th>
                        <th className="text-left hidden lg:table-cell">Submitted</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKyc.map(k => (
                        <tr key={k.userId}>
                          <td>
                            <div className="font-semibold text-sm">{k.userFullName || k.fullName}</div>
                            <div className="text-xs text-gray-500">{k.userEmail}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{k.userCountry}</div>
                          </td>
                          <td className="text-gray-300 text-sm hidden sm:table-cell">{k.nationality || "-"}</td>
                          <td className="text-gray-400 text-xs hidden md:table-cell">{k.dob || "-"}</td>
                          <td className="text-gray-400 text-xs hidden md:table-cell">{k.idType || "-"}</td>
                          <td className="text-gray-400 text-xs hidden lg:table-cell">
                            {k.submittedAt ? new Date(k.submittedAt).toLocaleDateString() : "-"}
                          </td>
                          <td>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => kycAction(k.userId, "approve")}
                                disabled={!!actionLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-ex-green/10 text-ex-green text-xs rounded-lg hover:bg-ex-green/20 border border-ex-green/30 transition-colors disabled:opacity-50">
                                {actionLoading === k.userId + "approve"
                                  ? <RefreshCw className="w-3 h-3 animate-spin" />
                                  : <Check className="w-3 h-3" />}
                                Approve
                              </button>
                              <button
                                onClick={() => kycAction(k.userId, "reject")}
                                disabled={!!actionLoading}
                                className="flex items-center gap-1 px-2 py-1.5 bg-ex-red/10 text-ex-red text-xs rounded-lg hover:bg-ex-red/20 border border-ex-red/30 transition-colors disabled:opacity-50">
                                {actionLoading === k.userId + "reject"
                                  ? <RefreshCw className="w-3 h-3 animate-spin" />
                                  : <X className="w-3 h-3" />}
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Completed section */}
            {kycDone.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-400 text-sm mb-3">
                  Completed ({kycDone.length})
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
                      {kycDone.map(k => (
                        <tr key={k.userId}>
                          <td>
                            <div className="font-semibold text-sm">{k.userFullName || k.fullName}</div>
                            <div className="text-xs text-gray-500">{k.userEmail}</div>
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
                        <button onClick={() => { setEditingSettings(false); setSettingsForm(campaign!.settings); }}
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
                      { label: "Campaign Deadline",  key: "deadline",   type: "date",   value: settingsForm.deadline },
                      { label: "Max Spots",          key: "maxSpots",   type: "number", value: settingsForm.maxSpots },
                      { label: "Loan Amount (USDT)", key: "loanAmount", type: "number", value: settingsForm.loanAmount },
                      { label: "Min Stake (USDT)",   key: "minStake",   type: "number", value: settingsForm.minStake },
                      { label: "Max Stake (USDT)",   key: "maxStake",   type: "number", value: settingsForm.maxStake },
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
                          {settingsForm.enabled ? "ENABLED — Click to Disable" : "DISABLED — Click to Enable"}
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
                            <span className="text-xs text-gray-600 text-center block">—</span>
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
  );
}
