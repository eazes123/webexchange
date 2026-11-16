import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NovaBit Exchange — Crypto Trading & Loans",
  description:
    "NovaBit Exchange — Trade crypto, earn rewards, and access interest-free loans. Join the first 1,000 users and unlock $50,000 USDT.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-ex-bg text-white min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster
          theme="dark"
          toastOptions={{
            style: { background: "#1a2035", border: "1px solid #2d3548", color: "white" },
          }}
        />
      </body>
    </html>
  );
}
