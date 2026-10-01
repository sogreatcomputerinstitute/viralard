import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://viralard.vercel.app";

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/login"] }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}