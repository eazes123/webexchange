"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  TrendingUp, Menu, X, ChevronDown,
  LogOut, LayoutDashboard, FileText, Zap
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV_LINKS: { href: string; label: string; badge?: string; badgeRed?: boolean }[] = [
  { href: "/markets",       label: "Markets" },
  { href: "/trade/BTC-USDT", label: "Trade" },
  { href: "/campaign",      label: "Campaign", badge: "LIVE" },
  { href: "/withdrawals",   label: "Campaign", badge: "ENDED", badgeRed: true },
];

export default function Navbar() {
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

  return (
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
            Nova<span style={{ color: "#f0b90b" }}>Bit</span>
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
                    <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                  </Link>
                  <Link href="/kyc" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#888] hover:text-white hover:bg-white/[0.03] transition-colors">
                    <FileText className="w-3.5 h-3.5" /> KYC Status
                  </Link>
                  <Link href="/campaign" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/[0.03] transition-colors"
                    style={{ color: "#f0b90b" }}>
                    <Zap className="w-3.5 h-3.5" /> New Year Campaign
                  </Link>
                  <div style={{ borderTop: "1px solid #1a1a1a", margin: "4px 0" }} />
                  <button
                    onClick={async () => { await logout(); setUserMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-white/[0.03] transition-colors"
                    style={{ color: "#f6465d" }}
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login"
                className="px-3 py-1.5 text-sm text-[#555] hover:text-[#aaa] transition-colors rounded-lg">
                Login
              </Link>
              <Link href="/register"
                className="px-4 py-1.5 text-sm font-bold text-black rounded-lg transition-all"
                style={{ background: "#f0b90b" }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#ffc929")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#f0b90b")}
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile btn */}
        <button
          className="md:hidden p-2 rounded-lg transition-colors"
          style={{ color: "#555" }}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden px-4 pb-4 pt-2"
          style={{ borderTop: "1px solid #141414", background: "rgba(7,7,7,0.98)" }}
        >
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between py-3 text-sm border-b"
              style={{ color: "#666", borderColor: "#111" }}
            >
              {link.label}
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
          <div className="flex gap-2 mt-4">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2 text-sm rounded-lg"
                  style={{ background: "#111", color: "#aaa", border: "1px solid #1e1e1e" }}>
                  Dashboard
                </Link>
                <button onClick={async () => { await logout(); setMobileOpen(false); }}
                  className="flex-1 py-2 text-sm rounded-lg"
                  style={{ color: "#f6465d", border: "1px solid rgba(246,70,93,0.2)" }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2 text-sm rounded-lg"
                  style={{ color: "#888", border: "1px solid #1e1e1e" }}>
                  Login
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-bold rounded-lg"
                  style={{ background: "#f0b90b", color: "#000" }}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
