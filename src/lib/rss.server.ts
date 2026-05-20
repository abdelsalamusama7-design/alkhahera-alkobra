// Server-only RSS ingestion helpers.
import { XMLParser } from "fast-xml-parser";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { slugify } from "@/lib/format";

export type RssSource = {
  url: string;
  categorySlug: string;
  source: string;
};

// Curated reliable Arabic news feeds covering Egypt + region + sports + economy.
export const RSS_SOURCES: RssSource[] = [
  { url: "https://www.youm7.com/rss/SectionRss?SectionID=65", categorySlug: "politics", source: "اليوم السابع" },
  { url: "https://www.youm7.com/rss/SectionRss?SectionID=297", categorySlug: "economy", source: "اليوم السابع" },
  { url: "https://www.youm7.com/rss/SectionRss?SectionID=88", categorySlug: "sports", source: "اليوم السابع" },
  { url: "https://www.youm7.com/rss/SectionRss?SectionID=203", categorySlug: "arts", source: "اليوم السابع" },
  { url: "https://www.youm7.com/rss/SectionRss?SectionID=319", categorySlug: "accidents", source: "اليوم السابع" },
  { url: "https://feeds.bbci.co.uk/arabic/rss.xml", categorySlug: "world", source: "BBC عربي" },
  { url: "https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9", categorySlug: "world", source: "الجزيرة" },
];

function pickImage(item: any): string | null {
  if (item["media:content"]?.["@_url"]) return item["media:content"]["@_url"];
  if (item["media:thumbnail"]?.["@_url"]) return item["media:thumbnail"]["@_url"];
  if (item.enclosure?.["@_url"]) return item.enclosure["@_url"];
  const desc: string = item.description || item["content:encoded"] || "";
  const m = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export async function ingestAllFeeds() {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const { data: cats } = await supabaseAdmin.from("categories").select("id,slug");
  const catBySlug = new Map((cats ?? []).map((c) => [c.slug, c.id]));

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const src of RSS_SOURCES) {
    try {
      const res = await fetch(src.url, {
        headers: { "user-agent": "Mozilla/5.0 (compatible; AlqahiraBot/1.0)" },
      });
      if (!res.ok) {
        errors.push(`${src.source}: HTTP ${res.status}`);
        continue;
      }
      const xml = await res.text();
      const parsed = parser.parse(xml);
      const items = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
      const list = Array.isArray(items) ? items : [items];

      for (const item of list.slice(0, 15)) {
        const title = stripHtml(String(item.title?.["#text"] ?? item.title ?? "")).slice(0, 280);
        if (!title) continue;
        const link =
          typeof item.link === "string"
            ? item.link
            : item.link?.["@_href"] || item.link?.["#text"] || item.guid?.["#text"] || item.guid || null;
        const rawDesc = item.description || item.summary || item["content:encoded"] || "";
        const excerpt = stripHtml(String(rawDesc)).slice(0, 400);
        const cover = pickImage(item);
        const pub = item.pubDate || item.published || item.updated;
        const published_at = pub ? new Date(String(pub)).toISOString() : new Date().toISOString();

        const slug = `${slugify(title)}-${Math.abs(hash(String(link || title))).toString(36).slice(0, 6)}`;

        // dedupe by slug or source_url
        const { data: existing } = await supabaseAdmin
          .from("articles")
          .select("id")
          .or(`slug.eq.${slug},source_url.eq.${(link ?? "").replace(/,/g, "")}`)
          .maybeSingle();
        if (existing) {
          skipped++;
          continue;
        }

        const { error } = await supabaseAdmin.from("articles").insert({
          title,
          slug,
          excerpt,
          content: excerpt,
          cover_image: cover,
          category_id: catBySlug.get(src.categorySlug) ?? null,
          source: src.source,
          source_url: link || null,
          is_published: true,
          is_breaking: false,
          published_at,
        });
        if (error) {
          errors.push(`${src.source}: ${error.message}`);
        } else {
          inserted++;
        }
      }
    } catch (e: any) {
      errors.push(`${src.source}: ${e.message}`);
    }
  }

  return { inserted, skipped, errors };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
