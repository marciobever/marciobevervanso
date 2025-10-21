// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    (process.env.NEXT_PUBLIC_SITE_URL || "https://news.receitapopular.com.br")
      .replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/api/",     // endpoints internos
        "/_next/",   // artefatos de build
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
