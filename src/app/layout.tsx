import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/ChatWidget";
import GTMProvider from "@/components/GTMProvider";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { rtlLocales } from "@/i18n-config";
import { GTM_ID } from "@/lib/gtm";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const BASE_URL = "https://groxchange.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "GROXchange — Crypto Trading & $50,000 USDT Loans",
    template: "%s | GROXchange",
  },
  description:
    "GROXchange: Trade BTC, ETH, BNB, SOL & more with zero fees. First 1,000 verified users who stake 500 USDT receive a $50,000 USDT interest-free loan for 10 years.",
  keywords: [
    "crypto exchange", "cryptocurrency trading", "USDT loan", "crypto loan",
    "bitcoin trading", "BTC USDT", "ETH trading", "crypto staking",
    "interest free loan", "USDT TRC20", "BEP20 USDT", "GROXchange",
    "crypto KYC", "50000 USDT loan", "spot trading", "BNB BSC",
  ],
  authors: [{ name: "GROXchange" }],
  creator: "GROXchange",
  publisher: "GROXchange",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "GROXchange",
    title: "GROXchange — Crypto Trading & $50,000 USDT Loans",
    description:
      "Trade BTC, ETH & more on GROXchange. First 1,000 stakers get a $50,000 USDT interest-free loan. Register today.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GROXchange — Crypto Trading & $50K USDT Loan Program",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@groxchange",
    creator: "@groxchange",
    title: "GROXchange — Crypto Trading & $50,000 USDT Loans",
    description:
      "Trade crypto spot markets and earn a $50,000 USDT interest-free loan. First 1,000 stakers only.",
    images: ["/og-image.png"],
  },
  icons: {
    icon:    "/favicon.svg",
    shortcut: "/favicon.svg",
    apple:   "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
  category: "finance",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "GROXchange",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/favicon.svg`,
        width: 512,
        height: 512,
      },
      description:
        "GROXchange is a cryptocurrency exchange offering spot trading and an exclusive $50,000 USDT interest-free loan program for verified users.",
      foundingDate: "2024",
      areaServed: "Worldwide",
      knowsAbout: ["Cryptocurrency", "Bitcoin", "Ethereum", "USDT", "DeFi", "Crypto trading"],
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "GROXchange",
      description: "Crypto trading platform with $50K USDT loan program",
      publisher: { "@id": `${BASE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/trade/{search_term_string}-USDT` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "FinancialService",
      "@id": `${BASE_URL}/#service`,
      name: "GROXchange Crypto Exchange",
      url: BASE_URL,
      serviceType: "Cryptocurrency Exchange",
      provider: { "@id": `${BASE_URL}/#organization` },
      description:
        "Spot cryptocurrency trading platform with BTC, ETH, BNB, SOL, XRP and USDT pairs. Features a $50,000 USDT interest-free loan for verified stakers.",
      areaServed: { "@type": "Place", name: "Worldwide" },
      offers: {
        "@type": "Offer",
        name: "$50,000 USDT Interest-Free Loan",
        description: "First 1,000 users to stake 500 USDT after KYC receive a $50,000 USDT loan with zero interest for 10 years.",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/LimitedAvailability",
      },
    },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = (rtlLocales as readonly string[]).includes(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-ex-bg text-white min-h-screen flex flex-col">
        {/* GTM noscript fallback */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0" width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* GTM script — loads after hydration, fires on every route */}
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />

        <NextIntlClientProvider messages={messages}>
          <GTMProvider />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-ex-yellow focus:text-black focus:rounded-lg focus:font-bold"
          >
            Skip to main content
          </a>
          <Navbar />
          <main id="main-content" className="flex-1">{children}</main>
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
