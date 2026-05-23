import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE_URL = "https://kaheraalkobra.online";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  image?: { loc: string; title?: string };
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeImage(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return `${BASE_URL}${trimmed}`;
  return null;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [];

        try {
          const [{ data: cats }, { data: arts }] = await Promise.all([
            supabaseAdmin.from("categories").select("id, slug"),
            supabaseAdmin
              .from("articles")
              .select("slug, title, cover_image, updated_at, published_at, category_id")
              .eq("is_published", true)
              .order("updated_at", { ascending: false })
              .limit(5000),
          ]);

          // Per-category latest updated_at
          const catLastmod = new Map<string, string>();
          let siteLastmod: string | undefined;
          for (const a of arts ?? []) {
            const ts = a.updated_at ?? a.published_at;
            if (!ts) continue;
            if (!siteLastmod || ts > siteLastmod) siteLastmod = ts;
            if (a.category_id) {
              const prev = catLastmod.get(a.category_id);
              if (!prev || ts > prev) catLastmod.set(a.category_id, ts);
            }
          }

          entries.push({ path: "/", lastmod: siteLastmod, changefreq: "hourly", priority: "1.0" });
          entries.push({ path: "/search", changefreq: "daily", priority: "0.5" });

          for (const c of cats ?? []) {
            entries.push({
              path: `/category/${c.slug}`,
              lastmod: catLastmod.get(c.id),
              changefreq: "daily",
              priority: "0.7",
            });
          }
          for (const a of arts ?? []) {
            const img = normalizeImage(a.cover_image);
            entries.push({
              path: `/article/${a.slug}`,
              lastmod: a.updated_at ?? a.published_at ?? undefined,
              changefreq: "weekly",
              priority: "0.8",
              image: img ? { loc: img, title: a.title ?? undefined } : undefined,
            });
          }
        } catch (err) {
          console.error("sitemap build error", err);
          if (entries.length === 0) {
            entries.push({ path: "/", changefreq: "hourly", priority: "1.0" });
            entries.push({ path: "/search", changefreq: "daily", priority: "0.5" });
          }
        }

        const urls = entries.map((e) => {
          const lines = [
            `  <url>`,
            `    <loc>${xmlEscape(BASE_URL + e.path)}</loc>`,
            e.lastmod ? `    <lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
          ];
          if (e.image) {
            lines.push(`    <image:image>`);
            lines.push(`      <image:loc>${xmlEscape(e.image.loc)}</image:loc>`);
            if (e.image.title) {
              lines.push(`      <image:title>${xmlEscape(e.image.title)}</image:title>`);
            }
            lines.push(`    </image:image>`);
          }
          lines.push(`  </url>`);
          return lines.filter(Boolean).join("\n");
        });

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=1800, s-maxage=1800",
          },
        });
      },
    },
  },
});
