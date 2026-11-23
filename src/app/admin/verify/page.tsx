"use client";
import { useState, useEffect, useRef } from "react";

export default function AdminVerifyPage() {
  const [code, setCode]       = useState("");
  const [uri, setUri]         = useState<string | null>(null);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/auth/totp")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.uri) setUri(d.uri); })
      .catch(() => {});
    inputRef.current?.focus();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/auth/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (r.ok) {
        window.location.href = "/admin";
      } else {
        const d = await r.json().catch(() => ({}));
        setError(d.error ?? "Invalid code");
        setCode("");
        inputRef.current?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center",
      background: "#0d1117", color: "#e6edf3", fontFamily: "Inter, system-ui, sans-serif",
      padding: "1rem",
    }}>
      <div style={{
        width: "100%", maxWidth: 420, padding: "2rem",
        border: "1px solid #21262d", borderRadius: 12, background: "#161b22",
      }}>
        {/* Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{
            display: "inline-block", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: "#58a6ff", background: "rgba(88,166,255,0.1)",
            border: "1px solid rgba(88,166,255,0.2)", padding: "3px 10px",
            borderRadius: 20, marginBottom: "0.75rem",
          }}>
            GROXchange Admin
          </div>
          <h1 style={{ margin: "0 0 0.3rem", fontSize: "1.35rem", fontWeight: 700 }}>
            Two-Factor Verification
          </h1>
          <p style={{ margin: 0, color: "#8b949e", fontSize: 14, lineHeight: 1.5 }}>
            Enter the 6-digit code from your authenticator app. Session lasts 2 hours.
          </p>
        </div>

        {/* First-time setup */}
        {uri && (
          <details style={{ marginBottom: "1.5rem" }}>
            <summary style={{
              cursor: "pointer", fontSize: 13, color: "#58a6ff",
              fontWeight: 600, userSelect: "none",
            }}>
              First-time setup — show authenticator URI
            </summary>
            <div style={{
              marginTop: 10, padding: "10px 12px", background: "#0d1117",
              border: "1px solid #21262d", borderRadius: 8, fontSize: 12,
            }}>
              <p style={{ margin: "0 0 6px", color: "#8b949e", fontSize: 12 }}>
                Open Google Authenticator → Add account → Enter a setup key → paste this URI, or use any app that accepts <code style={{ color: "#58a6ff" }}>otpauth://</code> links:
              </p>
              <code style={{
                display: "block", wordBreak: "break-all", color: "#58a6ff",
                fontSize: 11, lineHeight: 1.6,
              }}>
                {uri}
              </code>
            </div>
          </details>
        )}

        {/* Code form */}
        <form onSubmit={submit}>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            value={code}
            autoComplete="one-time-code"
            onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
            style={{
              width: "100%", padding: "12px 14px",
              fontSize: 28, letterSpacing: "0.4em", textAlign: "center",
              border: `1px solid ${error ? "#ff4444" : "#21262d"}`,
              borderRadius: 8, background: "#0d1117", color: "#e6edf3",
              outline: "none", boxSizing: "border-box", fontVariantNumeric: "tabular-nums",
            }}
          />

          {error && (
            <p style={{ color: "#ff4444", fontSize: 13, margin: "8px 0 0", textAlign: "center" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            style={{
              width: "100%", marginTop: "1rem", padding: "11px",
              background: code.length === 6 && !loading ? "#238636" : "#21262d",
              color: code.length === 6 && !loading ? "#fff" : "#6e7681",
              border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600,
              cursor: code.length === 6 && !loading ? "pointer" : "not-allowed",
              transition: "background 0.15s",
            }}
          >
            {loading ? "Verifying…" : "Verify & Enter Admin Panel"}
          </button>
        </form>

        <p style={{ margin: "1.25rem 0 0", fontSize: 12, color: "#6e7681", textAlign: "center" }}>
          Code refreshes every 30 seconds. Make sure your device clock is synced.
        </p>
      </div>
    </div>
  );
}
