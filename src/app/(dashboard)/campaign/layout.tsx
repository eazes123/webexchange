import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loan Campaign",
  description: "Join GROXchange's $50,000 USDT interest-free loan campaign. Complete KYC and stake 500 USDT to qualify. First 1,000 stakers only.",
  alternates: { canonical: "https://groxchange.com/campaign" },
  openGraph: {
    title: "Loan Campaign — GROXchange",
    url: "https://groxchange.com/campaign",
  },
};

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
