import { MetadataRoute } from "next";

const BASE = "https://groxchange.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const tradePairs = ["BTC-USDT", "ETH-USDT", "BNB-USDT", "SOL-USDT", "XRP-USDT"];

  return [
    { url: BASE,                   lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/markets`,      lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/campaign`,     lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/register`,     lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/login`,        lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/terms`,        lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/privacy`,      lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    ...tradePairs.map(pair => ({
      url: `${BASE}/trade/${pair}`,
      lastModified: now,
      changeFrequency: "always" as const,
      priority: 0.8,
    })),
  ];
}
