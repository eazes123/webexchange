"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  TrendingUp, Menu, X, ChevronDown,
  LogOut, LayoutDashboard, FileText, Zap, UserCircle, Shield
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const { isLoggedIn, demoUser, logout, hydrate } = useStore();

  useEffect(() => { hydrate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const NAV_LINKS = [
    { href: "/markets",        label: t("markets") },
    { href: "/trade/BTC-USDT", label: t("trade") },
    { href: "/campaign",       label: t("campaign"), badge: "LIVE" },
    { href: "/withdrawals",    label: t("campaign"), badge: "ENDED", badgeRed: true },
  ];

  return (
    <>
    <nav
      className="sticky top-0 z-40 transition-all duration-200"
      style={{
        background: scrolled
          ? "rgba(7,7,7,0.92)"
          : "rgba(7,7,7,0.80)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid #1a1a1a",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all group-hover:scale-105"
            style={{ background: "#f0b90b" }}
          >
            <TrendingUp className="w-4 h-4 text-black" />
          </div>
          <span className="font-black text-base tracking-tight text-white">
            GROX<span style={{ color: "#f0b90b" }}>change</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "text-white"
                    : "text-[#555] hover:text-[#aaa]"
                )}
              >
                {active && (
                  <span
                    className="absolute inset-0 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  />
                )}
                <span className="relative">{link.label}</span>
                {link.badge && (
                  <span
                    className="relative ml-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={link.badgeRed
                      ? { background: "rgba(246,70,93,0.12)", color: "#f6465d", letterSpacing: "0.06em" }
                      : { background: "rgba(240,185,11,0.15)", color: "#f0b90b", letterSpacing: "0.06em" }}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Right */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #1e1e1e" }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = "#1e1e1e")}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-black font-black text-xs shrink-0"
                  style={{ background: "#f0b90b" }}
                >
                  {demoUser.name[0]}
                </div>
                <span className="text-[#aaa] text-xs">{demoUser.name}</span>
                <ChevronDown className="w-3 h-3 text-[#444]" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl shadow-2xl py-1 z-50"
                  style={{ background: "#0d0d0d", border: "1px solid #1e1e1e" }}
                >
                  <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#888] hover:text-white hover:bg-white/[0.03] transition-colors">
                    <LayoutDashboard className="w-3.5 h-3.5" /> {t("dashboard")}
                  </Link>
                  <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#888] hover:text-white hover:bg-white/[0.03] transition-colors">
                    <UserCircle className="w-3.5 h-3.5" /> {t("my_profile")}
                  </Link>
                  <Link href="/kyc" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#888] hover:text-white hover:bg-white/[0.03] transition-colors">
                    <FileText className="w-3.5 h-3.5" /> {t("kyc_status")}
                  </Link>
                  <Link href="/security" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#888] hover:text-white hover:bg-white/[0.03] transition-colors">
                    <Shield className="w-3.5 h-3.5" /> {t("security")}
                  </Link>
                  <Link href="/campaign" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/[0.03] transition-colors"
                    style={{ color: "#f0b90b" }}>
                    <Zap className="w-3.5 h-3.5" /> {t("new_year_campaign")}
                  </Link>
                  <div style={{ borderTop: "1px solid #1a1a1a", margin: "4px 0" }} />
                  <button
                    onClick={async () => { await logout(); setUserMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-white/[0.03] transition-colors"
                    style={{ color: "#f6465d" }}
                  >
                    <LogOut className="w-3.5 h-3.5" /> {t("logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login"
                className="px-3 py-1.5 text-sm text-[#555] hover:text-[#aaa] transition-colors rounded-lg">
                {t("login")}
              </Link>
              <Link href="/register"
                className="px-4 py-1.5 text-sm font-bold text-black rounded-lg transition-all"
                style={{ background: "#f0b90b" }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#ffc929")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#f0b90b")}
              >
                {t("register")}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile btn */}
        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher />
          <button
            className="p-2 rounded-lg transition-colors"
            style={{ color: "#555" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

    </nav>

      {/* Mobile drawer — full-height slide-in from right — OUTSIDE nav (nav has backdrop-filter which would trap fixed children) */}
      {/* Backdrop */}
      <div
        className="md:hidden fixed inset-0 z-50 transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
        }}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drawer panel */}
      <div
        className="md:hidden fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: "280px",
          background: "#0a0a0a",
          borderLeft: "1px solid #1a1a1a",
          transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: mobileOpen ? "-24px 0 60px rgba(0,0,0,0.6)" : "none",
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #141414" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#f0b90b" }}>
              <TrendingUp className="w-4 h-4 text-black" />
            </div>
            <span className="font-black text-sm tracking-tight text-white">
              GROX<span style={{ color: "#f0b90b" }}>change</span>
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "#141414", color: "#555" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info (logged in) */}
        {isLoggedIn && (
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #141414" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-black shrink-0"
                style={{ background: "#f0b90b" }}>
                {demoUser.name[0]}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{demoUser.name}</div>
                <div className="text-[11px]" style={{ color: "#555" }}>Member</div>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable links */}
        <div className="flex-1 overflow-y-auto py-3">

          {/* Main nav */}
          <div className="px-3 mb-2">
            <div className="text-[10px] font-bold tracking-widest uppercase px-2 mb-1" style={{ color: "#333" }}>
              Explore
            </div>
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors"
                style={{ color: "#888" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#141414"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#888"; }}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={link.badgeRed
                      ? { background: "rgba(246,70,93,0.1)", color: "#f6465d" }
                      : { background: "rgba(240,185,11,0.12)", color: "#f0b90b" }}>
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Account links */}
          {isLoggedIn && (
            <div className="px-3 mt-2">
              <div className="text-[10px] font-bold tracking-widest uppercase px-2 mb-1" style={{ color: "#333" }}>
                Account
              </div>
              {[
                { href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" />, label: t("dashboard") },
                { href: "/profile",   icon: <UserCircle    className="w-4 h-4" />, label: t("my_profile") },
                { href: "/kyc",       icon: <FileText      className="w-4 h-4" />, label: t("kyc_status") },
                { href: "/security",  icon: <Shield        className="w-4 h-4" />, label: t("security") },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
                  style={{ color: "#888" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#141414"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#888"; }}
                >
                  <span style={{ color: "#444" }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {/* Guest links */}
          {!isLoggedIn && (
            <div className="px-5 mt-4 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="text-center py-2.5 text-sm rounded-xl transition-colors"
                style={{ color: "#888", border: "1px solid #1e1e1e" }}>
                {t("login")}
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}
                className="text-center py-2.5 text-sm font-bold rounded-xl"
                style={{ background: "#f0b90b", color: "#000" }}>
                {t("register")}
              </Link>
            </div>
          )}
        </div>

        {/* Sign out pinned to bottom */}
        {isLoggedIn && (
          <div className="px-5 py-4" style={{ borderTop: "1px solid #141414" }}>
            <button
              onClick={async () => { await logout(); setMobileOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm rounded-xl transition-colors"
              style={{ color: "#f6465d", border: "1px solid rgba(246,70,93,0.15)" }}
            >
              <LogOut className="w-4 h-4" /> {t("logout")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
