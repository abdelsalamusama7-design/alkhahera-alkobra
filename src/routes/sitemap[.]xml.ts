import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE_URL = "https://kaheraalkobra.online";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "hourly", priority: "1.0" },
          { path: "/search", changefreq: "daily", priority: "0.5" },
        ];

        try {
          const [{ data: cats }, { data: arts }] = await Promise.all([
            supabaseAdmin.from("categories").select("slug"),
            supabaseAdmin
              .from("articles")
              .select("slug, updated_at, published_at")
              .eq("is_published", true)
              .order("published_at", { ascending: false })
              .limit(5000),
          ]);

          for (const c of cats ?? []) {
            entries.push({
              path: `/category/${c.slug}`,
              changefreq: "daily",
              priority: "0.7",
            });
          }
          for (const a of arts ?? []) {
            entries.push({
              path: `/article/${a.slug}`,
              lastmod: a.updated_at ?? a.published_at ?? undefined,
              changefreq: "weekly",
              priority: "0.8",
            });
          }
        } catch (err) {
          console.error("sitemap build error", err);
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
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
