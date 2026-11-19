"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  TrendingUp, Menu, X, ChevronDown,
  Settings, LogOut, LayoutDashboard, FileText
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/markets", label: "Markets" },
  { href: "/trade/BTC-USDT", label: "Trade" },
  { href: "/campaign", label: "Campaign", highlight: true },
  { href: "/#how-it-works", label: "How It Works" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isLoggedIn, demoUser, logout, hydrate } = useStore();

  useEffect(() => { hydrate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <nav className="bg-ex-card border-b border-ex-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-ex-yellow flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Nova<span className="text-ex-yellow">Bit</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                link.highlight
                  ? "text-ex-yellow"
                  : "text-gray-400 hover:text-white hover:bg-white/5",
                pathname === link.href && "text-white bg-white/5"
              )}
            >
              {link.label}
              {link.highlight && (
                <span className="ml-1 text-xs bg-ex-yellow text-black px-1.5 py-0.5 rounded-full font-bold">
                  HOT
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2">
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-sm"
              >
                <div className="w-6 h-6 rounded-full bg-ex-yellow flex items-center justify-center text-black font-bold text-xs">
                  {demoUser.name[0]}
                </div>
                <span className="text-gray-300">{demoUser.name}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-ex-card2 border border-ex-border rounded-xl shadow-2xl py-1 z-50">
                  <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link href="/kyc" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                    <FileText className="w-4 h-4" /> KYC Status
                  </Link>
                  <Link href="/campaign" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-ex-yellow hover:bg-white/5 transition-colors">
                    <Settings className="w-4 h-4" /> New Year Campaign
                  </Link>
                  <div className="border-t border-ex-border my-1" />
                  <button
                    onClick={async () => { await logout(); setUserMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-ex-red hover:bg-white/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login"
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded-md hover:bg-white/5">
                Login
              </Link>
              <Link href="/register"
                className="px-4 py-2 text-sm font-semibold bg-ex-yellow text-black rounded-md hover:bg-yellow-400 transition-colors">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu btn */}
        <button
          className="md:hidden p-2 text-gray-400 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-ex-border bg-ex-card px-4 pb-4">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-sm text-gray-400 hover:text-white border-b border-ex-border/50 last:border-0">
              {link.label}
              {link.highlight && <span className="ml-2 text-xs text-ex-yellow font-semibold">HOT</span>}
            </Link>
          ))}
          <div className="flex gap-2 mt-3">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2 text-sm bg-white/5 rounded-md text-gray-300">
                  Dashboard
                </Link>
                <button onClick={async () => { await logout(); setMobileOpen(false); }}
                  className="flex-1 py-2 text-sm text-ex-red border border-ex-red/30 rounded-md">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2 text-sm border border-ex-border rounded-md text-gray-300">
                  Login
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2 text-sm bg-ex-yellow text-black rounded-md font-semibold">
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
