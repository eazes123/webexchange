import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/ChatWidget";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { rtlLocales } from "@/i18n-config";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = (rtlLocales as readonly string[]).includes(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={inter.variable}>
      <body className="bg-ex-bg text-white min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages}>
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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
