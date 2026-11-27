import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Register on GROXchange to trade BTC, ETH, BNB and more. First 1,000 verified stakers receive a $50,000 USDT interest-free loan.",
  alternates: { canonical: "https://groxchange.com/register" },
  openGraph: {
    title: "Create Account — GROXchange",
    url: "https://groxchange.com/register",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
