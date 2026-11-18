"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users, Shield, Gift, Search, Check, X,
  TrendingUp, Clock, CheckCircle, XCircle,
  LayoutDashboard, ArrowUpRight, RefreshCw,
  Lock, Wallet, Power, Trophy
} from "lucide-react";
import { toast } from "sonner";

type TabType = "overview" | "users" | "kyc" | "campaign" | "withdrawals";

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

interface WithdrawalRequest {
  id: string;
  userId: string;
  asset: string;
  amount: number;
  fee: number;
  destinationAddress: string;
  status: "pending" | "approved" | "rejected";
  adminNote: string | null;
  createdAt: string;
  user?: { fullName: string; email: string };
}

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved:    "text-ex-green  bg-ex-green/10  border-ex-green/30",
    pending:     "text-ex-yellow bg-ex-yellow/10 border-ex-yellow/30",
    under_review:"text-ex-blue   bg-ex-blue/10   border-ex-blue/30",
    rejected:    "text-ex-red    bg-ex-red/10    border-ex-red/30",
    none:        "text-gray-400  bg-gray-800     border-gray-700",
    active:      "text-ex-green  bg-ex-green/10  border-ex-green/30",
    rewarded:    "text-ex-yellow bg-ex-yellow/10 border-ex-yellow/30",
    unstaked:    "text-gray-400  bg-gray-800     border-gray-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${map[status] || map.none}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function AdminPage() {
  const [tab, setTab]           = useState<TabType>("overview");
  const [search, setSearch]     = useState("");
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true);
  const [loading, setLoading]   = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [exchangeWallet, setExchangeWallet] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) return;
      const { users: data } = await res.json();
      setUsers(data ?? []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/withdrawals");
      const data = await res.json();
      setWithdrawals(data.withdrawals ?? []);
      setWithdrawalsEnabled(data.withdrawalsEnabled ?? true);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchWithdrawals();
    // Load exchange wallet address for admin reference
    fetch("/api/admin/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_exchange_wallet" }),
    }).then(r => r.json()).then(d => { if (d.exchangeWalletAddress) setExchangeWallet(d.exchangeWalletAddress); }).catch(() => {});
  }, [fetchUsers, fetchWithdrawals]);

  const kycAction = async (userId: string, action: "approve" | "reject") => {
    setActionLoading(userId + action);
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      await fetchUsers();
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const withdrawalAction = async (id: string, action: "approve" | "reject", adminNote?: string) => {
    setActionLoading(id + action);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, adminNote }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      await fetchWithdrawals();
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const distributeReward = async (userId?: string) => {
    const action = userId ? "distribute_reward" : "distribute_all_rewards";
    setActionLoading(action + (userId ?? ""));
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      await fetchUsers();
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleWithdrawals = async () => {
    setActionLoading("toggle");
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_withdrawals" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      setWithdrawalsEnabled(data.withdrawalsEnabled);
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered    = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const kycPending  = users.filter(u => u.kycStatus === "under_review" || u.kycStatus === "pending");
  const kycApproved = users.filter(u => u.kycStatus === "approved");
  const staked      = users.filter(u => u.stakeStatus === "active");
  const rewarded    = users.filter(u => u.stakeStatus === "rewarded");
  const pendingWd   = withdrawals.filter(w => w.status === "pending");

  const TABS: { id: TabType; label: string; icon: any; badge?: number }[] = [
    { id: "overview",    label: "Overview",    icon: LayoutDashboard },
    { id: "users",       label: "Users",       icon: Users,       badge: users.length },
    { id: "kyc",         label: "KYC Review",  icon: Shield,      badge: kycPending.length },
    { id: "campaign",    label: "Campaign",    icon: Trophy,      badge: staked.length },
    { id: "withdrawals", label: "Withdrawals", icon: ArrowUpRight, badge: pendingWd.length },
  ];

  return (
    <div className="min-h-screen bg-ex-bg">
      {/* Admin header */}
      <div className="bg-ex-card border-b border-ex-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Shield className="w-4 h-4 text-ex-yellow" />
          <span className="font-semibold text-white">NovaBit Admin Panel</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { fetchUsers(); fetchWithdrawals(); }}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link href="/" className="text-xs text-gray-400 hover:text-white">← Back to Site</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm">NovaBit Exchange: Administration Panel</p>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 mb-6 border-b border-ex-border overflow-x-auto">
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

        {loading && (
          <div className="text-center py-12 text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading...
          </div>
        )}

        {/* Overview */}
        {!loading && tab === "overview" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {[
                { label: "Total Users",   value: users.length,        icon: Users,       color: "text-ex-blue" },
                { label: "KYC Approved",  value: kycApproved.length,  icon: Shield,      color: "text-ex-green" },
                { label: "KYC Pending",   value: kycPending.length,   icon: Clock,       color: "text-ex-yellow" },
                { label: "Staked",        value: staked.length,       icon: Lock,        color: "text-ex-green" },
                { label: "Loans Disbursed", value: rewarded.length,     icon: Trophy,      color: "text-ex-yellow" },
              ].map((s, i) => (
                <div key={i} className="bg-ex-card border border-ex-border rounded-2xl p-4">
                  <s.icon className={`w-6 h-6 ${s.color} mb-2`} />
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-ex-card border border-ex-border rounded-2xl p-5">
                <h3 className="font-bold mb-3">New Year Campaign</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Staked Users</span>
                    <span className="font-semibold">{staked.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Loans Disbursed</span>
                    <span className="font-semibold text-ex-yellow">{rewarded.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Loan Pool</span>
                    <span className="font-semibold font-num text-ex-green">
                      {((staked.length + rewarded.length) * 50_000).toLocaleString()} USDT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deadline</span>
                    <span className="font-semibold">Dec 31, 2026</span>
                  </div>
                </div>
                <button
                  onClick={() => distributeReward()}
                  disabled={staked.length === 0 || !!actionLoading}
                  className="mt-4 btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-40">
                  {actionLoading?.startsWith("distribute_all") ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                  Disburse All Loans ({staked.length} users)
                </button>
              </div>

              {exchangeWallet && (
                <div className="bg-ex-card border border-ex-border rounded-2xl p-5 md:col-span-2">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-ex-green" /> Exchange Hot Wallet (USDT auto-send)
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">Fund this address with USDT + TRX (for gas) to enable automatic withdrawal processing.</p>
                  <div className="font-mono text-xs text-gray-200 break-all bg-ex-bg rounded-xl p-3 select-all border border-ex-border">
                    {exchangeWallet}
                  </div>
                </div>
              )}

              <div className="bg-ex-card border border-ex-border rounded-2xl p-5">
                <h3 className="font-bold mb-3">Withdrawal Settings</h3>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold">Withdrawals</div>
                    <div className={`text-xs mt-0.5 ${withdrawalsEnabled ? "text-ex-green" : "text-ex-red"}`}>
                      {withdrawalsEnabled ? "Currently enabled" : "Currently disabled"}
                    </div>
                  </div>
                  <button
                    onClick={toggleWithdrawals}
                    disabled={actionLoading === "toggle"}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                      withdrawalsEnabled
                        ? "bg-ex-red/10 text-ex-red border-ex-red/30 hover:bg-ex-red/20"
                        : "bg-ex-green/10 text-ex-green border-ex-green/30 hover:bg-ex-green/20"
                    } disabled:opacity-50`}>
                    <Power className="w-4 h-4" />
                    {withdrawalsEnabled ? "Disable" : "Enable"}
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pending Requests</span>
                    <span className={`font-semibold ${pendingWd.length > 0 ? "text-ex-yellow" : "text-gray-400"}`}>
                      {pendingWd.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Requests</span>
                    <span className="font-semibold">{withdrawals.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Users */}
        {!loading && tab === "users" && (
          <div>
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input className="ex-input pl-9 h-9 text-sm" placeholder="Search by name or email..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No users found</div>
            ) : (
              <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden">
                <table className="w-full exchange-table">
                  <thead>
                    <tr>
                      <th className="text-left">#</th>
                      <th className="text-left">User</th>
                      <th className="text-left">KYC</th>
                      <th className="text-left">Stake</th>
                      <th className="text-left hidden md:table-cell">Deposit Address</th>
                      <th className="text-left hidden md:table-cell">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(u => (
                      <tr key={u.id}>
                        <td className="text-gray-500 text-xs font-mono">{u.id.slice(0, 8)}</td>
                        <td>
                          <div className="font-semibold text-sm">{u.fullName}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </td>
                        <td><Badge status={u.kycStatus} /></td>
                        <td><Badge status={u.stakeStatus || "none"} /></td>
                        <td className="hidden md:table-cell text-xs font-mono text-gray-400 max-w-[160px] truncate">
                          {u.depositAddress ?? "-"}
                        </td>
                        <td className="text-gray-400 text-xs hidden md:table-cell">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* KYC Review */}
        {!loading && tab === "kyc" && (
          <div>
            {kycPending.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-gray-700" />
                No pending KYC reviews
              </div>
            ) : (
              <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden">
                <table className="w-full exchange-table">
                  <thead>
                    <tr>
                      <th className="text-left">User</th>
                      <th className="text-left">Country</th>
                      <th className="text-left">Status</th>
                      <th className="text-left hidden md:table-cell">Submitted</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kycPending.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="font-semibold text-sm">{u.fullName}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </td>
                        <td className="text-gray-400 text-sm">{u.country}</td>
                        <td><Badge status={u.kycStatus} /></td>
                        <td className="text-gray-400 text-xs hidden md:table-cell">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => kycAction(u.id, "approve")}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1 px-3 py-1.5 bg-ex-green/10 text-ex-green text-xs rounded-lg hover:bg-ex-green/20 border border-ex-green/30 transition-colors disabled:opacity-50">
                              {actionLoading === u.id + "approve"
                                ? <RefreshCw className="w-3 h-3 animate-spin" />
                                : <Check className="w-3 h-3" />}
                              Approve
                            </button>
                            <button
                              onClick={() => kycAction(u.id, "reject")}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1 px-2 py-1.5 bg-ex-red/10 text-ex-red text-xs rounded-lg hover:bg-ex-red/20 border border-ex-red/30 transition-colors disabled:opacity-50">
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {kycApproved.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3 text-gray-400 text-sm">Already Approved ({kycApproved.length})</h3>
                <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden">
                  <table className="w-full exchange-table">
                    <thead>
                      <tr>
                        <th className="text-left">User</th>
                        <th className="text-left">KYC</th>
                        <th className="text-left">Stake Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kycApproved.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className="font-semibold text-sm">{u.fullName}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </td>
                          <td><Badge status={u.kycStatus} /></td>
                          <td><Badge status={u.stakeStatus || "none"} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Campaign — staking */}
        {!loading && tab === "campaign" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">New Year Campaign: Staked Users</h2>
              <button
                onClick={() => distributeReward()}
                disabled={staked.length === 0 || !!actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-ex-yellow text-black text-sm font-bold rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-40">
                {actionLoading?.startsWith("distribute_all") ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                Disburse All Loans
              </button>
            </div>

            {staked.length === 0 && rewarded.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Lock className="w-10 h-10 mx-auto mb-2 text-gray-700" />
                No users have staked yet
              </div>
            ) : (
              <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden">
                <table className="w-full exchange-table">
                  <thead>
                    <tr>
                      <th className="text-left">User</th>
                      <th className="text-left">Deposit Address</th>
                      <th className="text-left">Staked</th>
                      <th className="text-left">Status</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...staked, ...rewarded].map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="font-semibold text-sm">{u.fullName}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </td>
                        <td className="text-xs font-mono text-gray-400 max-w-[140px] truncate">
                          {u.depositAddress ?? "-"}
                        </td>
                        <td className="font-semibold font-num text-sm">{u.stakeAmount} USDT</td>
                        <td><Badge status={u.stakeStatus} /></td>
                        <td className="text-center">
                          {u.stakeStatus === "active" && (
                            <button
                              onClick={() => distributeReward(u.id)}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1 px-3 py-1.5 bg-ex-yellow/10 text-ex-yellow text-xs rounded-lg hover:bg-ex-yellow/20 border border-ex-yellow/30 transition-colors disabled:opacity-50 mx-auto">
                              {actionLoading === "distribute_reward" + u.id
                                ? <RefreshCw className="w-3 h-3 animate-spin" />
                                : <Gift className="w-3 h-3" />}
                              Disburse Loan
                            </button>
                          )}
                          {u.stakeStatus === "rewarded" && (
                            <span className="text-xs text-ex-yellow">✓ Distributed</span>
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

        {/* Withdrawals */}
        {!loading && tab === "withdrawals" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Withdrawal Requests</h2>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${
                  withdrawalsEnabled
                    ? "text-ex-green bg-ex-green/10 border-ex-green/30"
                    : "text-ex-red bg-ex-red/10 border-ex-red/30"
                }`}>
                  Withdrawals {withdrawalsEnabled ? "ON" : "OFF"}
                </span>
                <button onClick={toggleWithdrawals} disabled={actionLoading === "toggle"}
                  className="flex items-center gap-1 px-3 py-1.5 bg-ex-card2 border border-ex-border text-xs text-gray-300 rounded-lg hover:text-white transition-colors">
                  <Power className="w-3 h-3" />
                  {withdrawalsEnabled ? "Disable" : "Enable"}
                </button>
              </div>
            </div>

            {withdrawals.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ArrowUpRight className="w-10 h-10 mx-auto mb-2 text-gray-700" />
                No withdrawal requests yet
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
                      <th className="text-left hidden md:table-cell">Date</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map(w => (
                      <tr key={w.id}>
                        <td>
                          <div className="font-semibold text-sm">{w.user?.fullName ?? "-"}</div>
                          <div className="text-xs text-gray-500">{w.user?.email ?? w.userId.slice(0, 8)}</div>
                        </td>
                        <td>
                          <div className="font-semibold font-num text-sm">{w.amount} {w.asset}</div>
                          <div className="text-xs text-gray-500">fee: {w.fee} {w.asset}</div>
                        </td>
                        <td className="hidden md:table-cell text-xs font-mono text-gray-400 max-w-[140px] truncate">
                          {w.destinationAddress}
                        </td>
                        <td><Badge status={w.status} /></td>
                        <td className="text-gray-400 text-xs hidden md:table-cell">
                          {new Date(w.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          {w.status === "pending" && (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => withdrawalAction(w.id, "approve")}
                                disabled={!!actionLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-ex-green/10 text-ex-green text-xs rounded-lg hover:bg-ex-green/20 border border-ex-green/30 disabled:opacity-50">
                                {actionLoading === w.id + "approve"
                                  ? <RefreshCw className="w-3 h-3 animate-spin" />
                                  : <Check className="w-3 h-3" />}
                                Approve
                              </button>
                              <button
                                onClick={() => withdrawalAction(w.id, "reject")}
                                disabled={!!actionLoading}
                                className="flex items-center gap-1 px-2 py-1.5 bg-ex-red/10 text-ex-red text-xs rounded-lg hover:bg-ex-red/20 border border-ex-red/30 disabled:opacity-50">
                                <X className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          )}
                          {w.status !== "pending" && (
                            <span className="text-xs text-gray-500 text-center block">-</span>
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
      </div>
    </div>
  );
}
