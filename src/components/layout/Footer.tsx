"use client";
import Link from "next/link";
import { TrendingUp, AlertTriangle } from "lucide-react";

const LINKS: Record<string, { label: string; href: string }[]> = {
  Exchange: [
    { label: "Markets",        href: "/markets" },
    { label: "Trade",          href: "/trade/BTC-USDT" },
    { label: "Spot Trading",   href: "/trade/BTC-USDT" },
    { label: "Futures (Demo)", href: "/markets" },
  ],
  Account: [
    { label: "Register",          href: "/register" },
    { label: "Login",             href: "/login" },
    { label: "Dashboard",         href: "/dashboard" },
    { label: "KYC Verification",  href: "/kyc" },
  ],
  Campaign: [
    { label: "Loan Campaign",  href: "/campaign" },
    { label: "How It Works",   href: "/#how-it-works" },
    { label: "FAQ",            href: "/#faq" },
    { label: "Contact",        href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer style={{ background: "#080808", borderTop: "1px solid #141414", marginTop: "0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "56px 16px 0" }}>

        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-8 md:gap-12 mb-12">

          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#f0b90b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp style={{ width: "16px", height: "16px", color: "#000" }} />
              </div>
              <span style={{ fontWeight: 900, fontSize: "15px", color: "#fff", letterSpacing: "-0.02em" }}>
                GROX<span style={{ color: "#f0b90b" }}>change</span>
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "#555", lineHeight: 1.7, maxWidth: "220px" }}>
              A demo exchange platform built for academic and educational purposes only. Not a real financial service.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, items]) => (
            <div key={heading}>
              <h4 style={{ fontSize: "10px", fontWeight: 700, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
                {heading}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href}
                      style={{ fontSize: "12px", color: "#444", textDecoration: "none", transition: "color 0.15s" }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#888")}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#444")}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        {/* <div style={{
          background: "rgba(246,70,93,0.04)",
          border: "1px solid rgba(246,70,93,0.12)",
          borderRadius: "12px",
          padding: "16px 20px",
          display: "flex",
          gap: "12px",
          marginBottom: "32px",
        }}>
          <AlertTriangle style={{ width: "14px", height: "14px", color: "#f6465d", flexShrink: 0, marginTop: "1px" }} />
          <p style={{ fontSize: "11px", color: "#555", lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: "#666", fontWeight: 600 }}>DISCLAIMER: </strong>
            GROXchange is a demo project created for a class assignment. It is NOT a real exchange. All features,
            loan campaigns, KYC flows, and transactions are simulated for educational purposes only. Do NOT send
            any real money or personal documents. The gas-fee withdrawal flow is an intentional demonstration of
            advance-fee fraud patterns used in scam operations.
          </p>
        </div> */}

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid #111", padding: "20px 0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <p style={{ fontSize: "11px", color: "#333", margin: 0, letterSpacing: "0.02em" }}>
            © 2026 GROXchange | Demo Project
          </p>
          <div style={{ display: "flex", gap: "24px" }}>
            {[
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
              { label: "Risk Disclosure", href: "/terms#10" },
            ].map(({ label, href }) => (
              <Link key={label} href={href}
                style={{ fontSize: "11px", color: "#333", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#666")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#333")}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
