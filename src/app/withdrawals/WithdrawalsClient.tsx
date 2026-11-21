"use client";

import { useEffect, useState } from "react";
import { ExternalLink, CheckCircle2, TrendingUp, Calendar, Hash } from "lucide-react";

interface TxRow {
  txHash: string;
  from: string;
  fromFull: string;
  to: string;
  toFull: string;
  amount: string;
  amountRaw: number;
  timestamp: number;
  block: number;
}

interface DayGroup {
  date: string;
  txns: TxRow[];
}

interface ApiResponse {
  days: DayGroup[];
  total: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

function shortHash(h: string) {
  if (!h || h.length < 16) return h;
  return `${h.slice(0, 8)}...${h.slice(-8)}`;
}

export default function WithdrawalsClient() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/withdrawals")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalUsdt = data?.days?.reduce(
    (sum, day) => sum + day.txns.reduce((s, t) => s + t.amountRaw, 0),
    0
  ) ?? 0;

  const totalUsdtFormatted = (totalUsdt / 1_000_000).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div style={{ background: "#080808", minHeight: "100vh", color: "#e5e5e5" }}>

      {/* Demo banner */}
      {/* <div style={{
        background: "linear-gradient(90deg, rgba(240,185,11,0.08) 0%, rgba(240,185,11,0.04) 100%)",
        borderBottom: "1px solid rgba(240,185,11,0.2)",
        padding: "10px 16px",
        textAlign: "center",
      }}>
        <span style={{ color: "#f0b90b", fontSize: "12px", fontWeight: 500, letterSpacing: "0.02em" }}>
          ⚠ CLASS DEMO PROJECT — FOR PRESENTATION PURPOSES ONLY. Transactions shown are real TRON blockchain transfers used as illustrative examples.
        </span>
      </div> */}

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 16px" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "8px",
              background: "rgba(240,185,11,0.12)", border: "1px solid rgba(240,185,11,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <TrendingUp size={18} color="#f0b90b" />
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
              Campaign
            </h1>
            <span style={{
              fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
              color: "#f6465d", background: "rgba(246,70,93,0.1)",
              border: "1px solid rgba(246,70,93,0.25)",
              borderRadius: "20px", padding: "3px 10px",
            }}>
              ENDED
            </span>
          </div>
          <p style={{ color: "#666", fontSize: "13px", margin: "0 0 20px", lineHeight: 1.5 }}>
            Verified TRC20 USDT disbursements · Every entry independently verifiable on TRONSCAN
          </p>

          {/* Oct campaign notice */}
          <div style={{
            background: "rgba(240,185,11,0.05)",
            border: "1px solid rgba(240,185,11,0.15)",
            borderRadius: "12px",
            padding: "16px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{
                minWidth: "32px", height: "32px", borderRadius: "8px",
                background: "rgba(240,185,11,0.1)", border: "1px solid rgba(240,185,11,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", marginTop: "1px",
              }}>
                <Calendar size={15} color="#f0b90b" />
              </div>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 600, color: "#e5c76b", letterSpacing: "-0.01em" }}>
                  October 2026 Loan Campaign — Disbursement Records
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#555", lineHeight: 1.6 }}>
                  The October 2026 staking campaign concluded successfully. The disbursements listed below represent the $50,000 USDT loan payouts made to all verified participants. Each transaction was processed on-chain via the TRON network and can be independently verified on TRONSCAN.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {data && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "28px" }}>
            {[
              { label: "Total Transactions", value: data.total.toLocaleString(), icon: <Hash size={14} color="#f0b90b" /> },
              { label: "Total USDT Disbursed", value: `${totalUsdtFormatted} USDT`, icon: <TrendingUp size={14} color="#f0b90b" />, accent: true },
              { label: "Days Covered", value: data.days.length.toString(), icon: <Calendar size={14} color="#f0b90b" /> },
            ].map((s) => (
              <div key={s.label} style={{
                background: "#0f0f0f",
                border: "1px solid #1f1f1f",
                borderRadius: "12px",
                padding: "18px 20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                  {s.icon}
                  <span style={{ color: "#555", fontSize: "11px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {s.label}
                  </span>
                </div>
                <span style={{
                  fontSize: "24px", fontWeight: 700, letterSpacing: "-0.03em",
                  color: s.accent ? "#f0b90b" : "#fff",
                }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#333" }}>
            <div style={{
              width: "32px", height: "32px", border: "2px solid #1f1f1f",
              borderTopColor: "#f0b90b", borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 0.8s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize: "13px" }}>Loading transactions…</span>
          </div>
        )}

        {/* Days */}
        {data?.days.map((day) => (
          <div key={day.date} style={{ marginBottom: "24px" }}>

            {/* Day header */}
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              marginBottom: "10px", paddingBottom: "10px",
              borderBottom: "1px solid #141414",
            }}>
              <span style={{
                fontSize: "12px", fontWeight: 600, color: "#f0b90b",
                background: "rgba(240,185,11,0.08)", border: "1px solid rgba(240,185,11,0.15)",
                borderRadius: "6px", padding: "3px 10px", letterSpacing: "0.01em",
              }}>
                {formatDate(day.date)}
              </span>
              <span style={{ color: "#333", fontSize: "12px" }}>·</span>
              <span style={{ color: "#444", fontSize: "12px" }}>{day.txns.length} transactions</span>
              <div style={{ flex: 1, height: "1px", background: "#141414" }} />
              <span style={{ color: "#333", fontSize: "12px", fontFamily: "monospace" }}>
                {(day.txns.reduce((s, t) => s + t.amountRaw, 0) / 1_000_000).toLocaleString()} USDT
              </span>
            </div>

            {/* Table */}
            <div style={{
              background: "#0a0a0a",
              border: "1px solid #1a1a1a",
              borderRadius: "12px",
              overflow: "hidden",
            }}>
              {/* Table head */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr 1fr 130px 90px 100px",
                gap: "0",
                padding: "10px 20px",
                borderBottom: "1px solid #141414",
                background: "#0d0d0d",
              }}>
                {["Time (UTC)", "TX Hash", "From → To", "Amount", "Block", "Status"].map((h) => (
                  <span key={h} style={{
                    fontSize: "10px", fontWeight: 600, color: "#3a3a3a",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* Rows */}
              {day.txns.map((tx, i) => (
                <div
                  key={tx.txHash}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "160px 1fr 1fr 130px 90px 100px",
                    gap: "0",
                    padding: "13px 20px",
                    borderBottom: i < day.txns.length - 1 ? "1px solid #111" : "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#0f0f0f")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Time */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <span style={{ fontSize: "12px", color: "#aaa", fontFamily: "monospace" }}>
                      {formatTime(tx.timestamp)}
                    </span>
                  </div>

                  {/* TX Hash */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <a
                      href={`https://tronscan.org/#/transaction/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "monospace", fontSize: "12px", color: "#e5e5e5",
                        textDecoration: "none", display: "flex", alignItems: "center", gap: "5px",
                      }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#fff")}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#e5e5e5")}
                    >
                      {shortHash(tx.txHash)}
                      <ExternalLink size={10} color="#444" />
                    </a>
                  </div>

                  {/* From → To */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                    <a
                      href={`https://tronscan.org/#/address/${tx.fromFull}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontFamily: "monospace", fontSize: "11px", color: "#777", textDecoration: "none" }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#aaa")}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#777")}
                    >
                      {tx.from}
                    </a>
                    <span style={{ color: "#2a2a2a", fontSize: "11px" }}>→</span>
                    <a
                      href={`https://tronscan.org/#/address/${tx.toFull}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontFamily: "monospace", fontSize: "11px", color: "#777", textDecoration: "none" }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#aaa")}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#777")}
                    >
                      {tx.to}
                    </a>
                  </div>

                  {/* Amount */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#f0b90b", letterSpacing: "-0.01em", fontFamily: "monospace" }}>
                      50,000.00
                      <span style={{ fontSize: "10px", fontWeight: 400, color: "#6b5500", marginLeft: "4px" }}>USDT</span>
                    </span>
                  </div>

                  {/* Block */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#333", fontFamily: "monospace" }}>
                      #{tx.block?.toLocaleString() ?? "—"}
                    </span>
                  </div>

                  {/* Status */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      fontSize: "10px", fontWeight: 600, color: "#0ecb81",
                      background: "rgba(14,203,129,0.08)", border: "1px solid rgba(14,203,129,0.15)",
                      borderRadius: "20px", padding: "3px 8px", letterSpacing: "0.04em",
                    }}>
                      <CheckCircle2 size={9} />
                      CONFIRMED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Empty */}
        {data && data.days.length === 0 && (
          <div style={{
            textAlign: "center", padding: "80px 0",
            border: "1px solid #141414", borderRadius: "12px",
            color: "#333", fontSize: "13px",
          }}>
            No transactions found.
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #111" }}>
          <p style={{ color: "#2a2a2a", fontSize: "11px", letterSpacing: "0.04em" }}>
            ALL TRANSACTIONS INDEPENDENTLY VERIFIABLE ON{" "}
            <a
              href="https://tronscan.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#3a3a3a", textDecoration: "none" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#555")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#3a3a3a")}
            >
              TRONSCAN.ORG
            </a>
            {" "}· TRON BLOCKCHAIN · TRC20 USDT
          </p>
        </div>
      </div>
    </div>
  );
}
