import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your GROXchange account to access spot trading, your wallet, and the $50,000 USDT loan dashboard.",
  alternates: { canonical: "https://groxchange.com/login" },
  openGraph: {
    title: "Sign In — GROXchange",
    url: "https://groxchange.com/login",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
