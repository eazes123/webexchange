"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users, Shield, Gift, Search, Check, X, Eye,
  TrendingUp, Clock, CheckCircle, XCircle,
  LayoutDashboard, ArrowUpRight, RefreshCw
} from "lucide-react";
import { CAMPAIGN_STATS } from "@/lib/mock-data";
import { toast } from "sonner";

type TabType = "overview" | "users" | "kyc" | "loans" | "withdrawals";

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  queuePosition: number;
  kycStatus: string;
  loanStatus: string;
  loanAmount: number;
  activationFeePaid: boolean;
  loanWithdrawnToExternal: boolean;
  createdAt: string;
}

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved:    "text-ex-green  bg-ex-green/10  border-ex-green/30",
    pending:     "text-ex-yellow bg-ex-yellow/10 border-ex-yellow/30",
    under_review:"text-ex-blue   bg-ex-blue/10   border-ex-blue/30",
    rejected:    "text-ex-red    bg-ex-red/10    border-ex-red/30",
    none:        "text-gray-400  bg-gray-800     border-gray-700",
    disbursed:   "text-ex-green  bg-ex-green/10  border-ex-green/30",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${map[status] || map.none}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function AdminPage() {
  const [tab, setTab]       = useState<TabType>("overview");
  const [search, setSearch] = useState("");
  const [users, setUsers]   = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const { users: data } = await res.json();
      setUsers(data ?? []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

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

  const filtered = users.filter(
    u =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const kycPending  = users.filter(u => u.kycStatus === "under_review" || u.kycStatus === "pending");
  const kycApproved = users.filter(u => u.kycStatus === "approved");
  const loansActive = users.filter(u => u.loanStatus === "approved" || u.loanStatus === "disbursed");
  const withdrawn   = users.filter(u => u.loanWithdrawnToExternal);

  const TABS: { id: TabType; label: string; icon: any; badge?: number }[] = [
    { id: "overview",    label: "Overview",    icon: LayoutDashboard },
    { id: "users",       label: "Users",       icon: Users,       badge: users.length },
    { id: "kyc",         label: "KYC Review",  icon: Shield,      badge: kycPending.length },
    { id: "loans",       label: "Loans",       icon: Gift },
    { id: "withdrawals", label: "Withdrawals", icon: ArrowUpRight },
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
          <button onClick={fetchUsers} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link href="/" className="text-xs text-gray-400 hover:text-white">← Back to Site</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm">NovaBit Exchange — Administration Panel</p>
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
                { label: "Total Users",    value: users.length,        icon: Users,        color: "text-ex-blue" },
                { label: "KYC Approved",   value: kycApproved.length,  icon: Shield,       color: "text-ex-green" },
                { label: "KYC Pending",    value: kycPending.length,   icon: Clock,        color: "text-ex-yellow" },
                { label: "Loans Active",   value: loansActive.length,  icon: Gift,         color: "text-ex-green" },
                { label: "Withdrawn",      value: withdrawn.length,    icon: ArrowUpRight, color: "text-ex-red" },
              ].map((s, i) => (
                <div key={i} className="bg-ex-card border border-ex-border rounded-2xl p-4">
                  <s.icon className={`w-6 h-6 ${s.color} mb-2`} />
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-ex-card border border-ex-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Campaign Progress</h3>
                <span className="text-sm text-gray-400">{CAMPAIGN_STATS.spotsUsed}/{CAMPAIGN_STATS.totalSpots} spots filled</span>
              </div>
              <div className="h-4 bg-ex-card2 rounded-full overflow-hidden border border-ex-border">
                <div className="h-full bg-gradient-to-r from-ex-yellow to-orange-400 rounded-full"
                  style={{ width: `${(CAMPAIGN_STATS.spotsUsed / CAMPAIGN_STATS.totalSpots) * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Total Budget: ${(CAMPAIGN_STATS.totalSpots * CAMPAIGN_STATS.loanAmount).toLocaleString()} USDT</span>
                <span>Deployed: ${(loansActive.length * CAMPAIGN_STATS.loanAmount).toLocaleString()} USDT</span>
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
                      <th className="text-left">Loan</th>
                      <th className="text-left hidden md:table-cell">Queue</th>
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
                        <td><Badge status={u.loanStatus} /></td>
                        <td className="text-gray-400 text-sm hidden md:table-cell">#{u.queuePosition}</td>
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
                              Approve + Fund
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

            {/* Already reviewed */}
            {kycApproved.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3 text-gray-400 text-sm">Already Approved</h3>
                <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden">
                  <table className="w-full exchange-table">
                    <thead>
                      <tr>
                        <th className="text-left">User</th>
                        <th className="text-left">KYC</th>
                        <th className="text-left">Loan</th>
                        <th className="text-left hidden md:table-cell">Activation Fee</th>
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
                          <td><Badge status={u.loanStatus} /></td>
                          <td className="hidden md:table-cell">
                            {u.activationFeePaid
                              ? <span className="text-xs text-ex-green">✓ Paid</span>
                              : <span className="text-xs text-gray-500">Not paid</span>}
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

        {/* Loans */}
        {!loading && tab === "loans" && (
          <div>
            {loansActive.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No active loans yet — approve KYC to issue loans</div>
            ) : (
              <div className="bg-ex-card border border-ex-border rounded-2xl overflow-hidden">
                <table className="w-full exchange-table">
                  <thead>
                    <tr>
                      <th className="text-left">User</th>
                      <th className="text-left">Amount</th>
                      <th className="text-left">Loan Status</th>
                      <th className="text-left hidden md:table-cell">Activation Fee</th>
                      <th className="text-left hidden md:table-cell">Withdrawn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loansActive.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="font-semibold text-sm">{u.fullName}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </td>
                        <td className="text-ex-green font-semibold font-num">$50,000 USDT</td>
                        <td><Badge status={u.loanStatus} /></td>
                        <td className="hidden md:table-cell">
                          {u.activationFeePaid
                            ? <span className="text-xs text-ex-green">✓ $500 paid</span>
                            : <span className="text-xs text-gray-500">Pending</span>}
                        </td>
                        <td className="hidden md:table-cell">
                          {u.loanWithdrawnToExternal
                            ? <span className="text-xs text-ex-yellow">⏳ Processing</span>
                            : <span className="text-xs text-gray-500">In wallet</span>}
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
            {withdrawn.length === 0 ? (
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
                      <th className="text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawn.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="font-semibold text-sm">{u.fullName}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </td>
                        <td className="text-ex-yellow font-semibold font-num">50,000 USDT</td>
                        <td><span className="text-xs text-ex-yellow bg-ex-yellow/10 px-2 py-0.5 rounded-full border border-ex-yellow/30">Processing</span></td>
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
