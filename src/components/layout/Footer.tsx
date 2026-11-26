"use client";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");

  const LINKS = [
    {
      heading: t("exchange"),
      items: [
        { label: t("markets"),      href: "/markets" },
        { label: t("trade"),        href: "/trade/BTC-USDT" },
        { label: t("spot_trading"), href: "/trade/BTC-USDT" },
        { label: t("futures_demo"), href: "/markets" },
      ],
    },
    {
      heading: t("account"),
      items: [
        { label: t("register"),          href: "/register" },
        { label: t("login"),             href: "/login" },
        { label: t("dashboard"),         href: "/dashboard" },
        { label: t("kyc_verification"),  href: "/kyc" },
      ],
    },
    {
      heading: t("campaign_section"),
      items: [
        { label: t("loan_campaign"), href: "/campaign" },
        { label: t("how_it_works"),  href: "/#how-it-works" },
        { label: t("faq"),           href: "/#faq" },
        { label: t("contact"),       href: "#" },
      ],
    },
  ];

  return (
    <footer aria-label="Site footer" style={{ background: "#080808", borderTop: "1px solid #141414", marginTop: "0" }}>
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
              {t("brand_desc")}
            </p>
          </div>

          {/* Link columns */}
          {LINKS.map(({ heading, items }) => (
            <nav key={heading} aria-label={heading}>
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
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid #111", padding: "20px 0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <p style={{ fontSize: "11px", color: "#333", margin: 0, letterSpacing: "0.02em" }}>
            {t("copyright")}
          </p>
          <div style={{ display: "flex", gap: "24px" }}>
            <Link href="/privacy"
              style={{ fontSize: "11px", color: "#333", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#666")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#333")}
            >
              {t("privacy_policy")}
            </Link>
            <Link href="/terms"
              style={{ fontSize: "11px", color: "#333", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#666")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#333")}
            >
              {t("terms_of_service")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
