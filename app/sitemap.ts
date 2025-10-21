// app/sitemap.ts
import type { MetadataRoute } from "next";

type PostItem = { slug: string; updatedAt?: string | null };

export const revalidate = Number(process.env.SITEMAP_REVALIDATE || 3600); // 1h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    (process.env.NEXT_PUBLIC_SITE_URL || "https://news.receitapopular.com.br")
      .replace(/\/+$/, "");

  // Busca posts publicados da sua API interna
  let posts: PostItem[] = [];
  try {
    const res = await fetch(`${baseUrl}/api/sitemap/posts`, {
      // Se sua API estiver no mesmo domínio, pode usar URL relativa: "/api/sitemap/posts"
      // mas como há CDN/frontdoor, manter absoluta evita edge-cases.
      cache: "no-store",
    });
    if (res.ok) posts = await res.json();
  } catch {
    posts = [];
  }

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/cartoes`,     lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/empregos`,    lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/concursos`,   lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/beneficios`,  lastModified: now, changeFrequency: "daily", priority: 0.9 },
  ];

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/posts/${post.slug}`,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Opcional: dedup se por acaso a API repetir slugs
  const seen = new Set<string>();
  const entries = [...staticEntries, ...postEntries].filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  });

  return entries;
}
