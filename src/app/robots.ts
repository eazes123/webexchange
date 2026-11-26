import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
      // Allow AI crawlers — helps with AI Overview and LLM indexing
      {
        userAgent: ["GPTBot", "Claude-Web", "CCBot", "anthropic-ai", "Googlebot", "Bingbot"],
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: "https://groxchange.com/sitemap.xml",
  };
}
