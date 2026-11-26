import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GROXchange — Crypto Trading & $50K Loans",
    short_name: "GROXchange",
    description:
      "Trade crypto spot markets and earn a $50,000 USDT interest-free loan. Stake 500 USDT, complete KYC, and receive your loan instantly.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#070707",
    theme_color: "#f0b90b",
    categories: ["finance", "crypto"],
    lang: "en",
    icons: [
      { src: "/favicon.svg", sizes: "any",     type: "image/svg+xml", purpose: "any" },
      { src: "/favicon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "maskable" },
      { src: "/favicon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
    ],
    screenshots: [],
  };
}
