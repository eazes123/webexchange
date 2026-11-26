"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, ArrowUpRight,
  LogOut, TrendingUp, Shield, Wallet, Trophy, CreditCard
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t        = useTranslations("layout");
  const pathname = usePathname();
  const router   = useRouter();
  const { isLoggedIn, hydrate, fetchLivePrices, updatePrices, logout, demoUser } = useStore();

  const NAV = [
    { href: "/dashboard",  label: t("nav_dashboard"),  icon: LayoutDashboard },
    { href: "/campaign",   label: t("nav_campaign"),   icon: Trophy },
    { href: "/kyc",        label: t("nav_kyc"),        icon: Shield },
    { href: "/wallet",     label: t("nav_wallet"),     icon: Wallet },
    { href: "/loan",       label: t("nav_loan"),       icon: CreditCard },
  ];

  const BOTTOM_NAV = [
    { href: "/dashboard", label: t("nav_home"),     icon: LayoutDashboard },
    { href: "/campaign",  label: t("nav_campaign"), icon: Trophy },
    { href: "/wallet",    label: t("nav_wallet"),   icon: Wallet },
    { href: "/loan",      label: t("nav_loan"),     icon: CreditCard },
  ];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrate().finally(() => setLoading(false));
  }, []);

  // Live price polling: CoinGecko every 30s, micro-animation every 3s
  useEffect(() => {
    fetchLivePrices();
    const bigPoll  = setInterval(fetchLivePrices, 30_000);
    const miniTick = setInterval(updatePrices, 3_000);
    return () => { clearInterval(bigPoll); clearInterval(miniTick); };
  }, []);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push("/login");
  }, [loading, isLoggedIn, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ex-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-ex-yellow border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{t("loading_account")}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="flex bg-ex-bg">
      {/* Sidebar */}
      <aside aria-label="Dashboard sidebar" className="hidden md:flex flex-col w-56 bg-ex-card border-r border-ex-border p-4 gap-1 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
        {/* User info */}
        <div className="flex items-center gap-3 p-3 mb-4 bg-ex-card2 rounded-xl border border-ex-border">
          <div className="w-10 h-10 rounded-full bg-ex-yellow flex items-center justify-center text-black font-black text-lg">
            {demoUser.name?.[0] ?? "U"}
          </div>
          <div>
            <div className="font-semibold text-sm">{demoUser.name || "User"}</div>
            <div className="text-xs text-gray-500 truncate max-w-[120px]">{demoUser.email}</div>
          </div>
        </div>

        {NAV.map(item => (
          <Link key={item.href} href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-ex-yellow/10 text-ex-yellow border border-ex-yellow/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}>
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}

        <div className="border-t border-ex-border my-2" />

        <Link href="/markets"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <TrendingUp className="w-4 h-4" /> {t("nav_markets")}
        </Link>

        <div className="mt-auto">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-ex-red hover:bg-ex-red/5 transition-colors">
            <LogOut className="w-4 h-4" /> {t("nav_sign_out")}
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </div>

      {/* Mobile bottom nav */}
      <nav aria-label="Dashboard navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-md border-t border-[#1e1e1e] flex">
        {BOTTOM_NAV.map(item => (
          <Link key={item.href} href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-semibold transition-colors",
              pathname === item.href ? "text-[#f0b90b]" : "text-gray-500 hover:text-gray-300"
            )}>
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
        <button onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-semibold text-gray-500 hover:text-red-400 transition-colors">
          <LogOut className="w-5 h-5" />
          {t("nav_out")}
        </button>
      </nav>
    </div>
  );
}
