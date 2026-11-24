import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/ChatWidget";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "GROXchange: Crypto Trading & Loans",
  description:
    "GROXchange: Trade crypto and get a $50,000 USDT interest-free loan. Stake 500 USDT after KYC and receive your loan instantly.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-ex-bg text-white min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatWidget />
        <Toaster
          theme="dark"
          toastOptions={{
            style: { background: "#0d0d0d", border: "1px solid #1e1e1e", color: "white" },
          }}
        />
      </body>
    </html>
  );
}
