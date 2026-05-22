// Server-only RSS ingestion helpers.
import { XMLParser } from "fast-xml-parser";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { slugify } from "@/lib/format";

export type RssSource = {
  url: string;
  categorySlug: string;
  source: string;
};

// Curated reliable Arabic news feeds.
export const RSS_SOURCES: RssSource[] = [
  // اليوم السابع
  { url: "https://www.youm7.com/rss/SectionRss?SectionID=65", categorySlug: "politics", source: "اليوم السابع" },
  { url: "https://www.youm7.com/rss/SectionRss?SectionID=297", categorySlug: "economy", source: "اليوم السابع" },
  { url: "https://www.youm7.com/rss/SectionRss?SectionID=88", categorySlug: "sports", source: "اليوم السابع" },
  { url: "https://www.youm7.com/rss/SectionRss?SectionID=203", categorySlug: "arts", source: "اليوم السابع" },
  { url: "https://www.youm7.com/rss/SectionRss?SectionID=319", categorySlug: "accidents", source: "اليوم السابع" },
  { url: "https://www.youm7.com/rss/SectionRss?SectionID=94", categorySlug: "technology", source: "اليوم السابع" },
  { url: "https://www.youm7.com/rss/SectionRss?SectionID=97", categorySlug: "local", source: "اليوم السابع" },
  // المصري اليوم
  { url: "https://www.almasryalyoum.com/rss/rssfeed", categorySlug: "local", source: "المصري اليوم" },
  { url: "https://www.almasryalyoum.com/rss/rssfeeds?sectionId=14", categorySlug: "politics", source: "المصري اليوم" },
  { url: "https://www.almasryalyoum.com/rss/rssfeeds?sectionId=18", categorySlug: "economy", source: "المصري اليوم" },
  { url: "https://www.almasryalyoum.com/rss/rssfeeds?sectionId=16", categorySlug: "sports", source: "المصري اليوم" },
  { url: "https://www.almasryalyoum.com/rss/rssfeeds?sectionId=20", categorySlug: "arts", source: "المصري اليوم" },
  // مصراوي
  { url: "https://www.masrawy.com/export/rss", categorySlug: "local", source: "مصراوي" },
  { url: "https://www.masrawy.com/export/rss?sectionId=204895", categorySlug: "politics", source: "مصراوي" },
  { url: "https://www.masrawy.com/export/rss?sectionId=204896", categorySlug: "economy", source: "مصراوي" },
  { url: "https://www.masrawy.com/export/rss?sectionId=205220", categorySlug: "sports", source: "مصراوي" },
  { url: "https://www.masrawy.com/export/rss?sectionId=205230", categorySlug: "technology", source: "مصراوي" },
  // MSN عربي
  { url: "https://www.msn.com/ar-xl/news/rss", categorySlug: "world", source: "MSN عربي" },
  // دولي
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

// AI rewriter: يعيد صياغة العنوان والمقدمة بأسلوب احترافي + يولّد وسومًا للمقال.
async function rewriteWithHook(
  title: string,
  excerpt: string,
  source: string,
): Promise<{ title: string; excerpt: string; tags: string[] } | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "أنت محرر صحفي عربي محترف في بوابة (القاهرة الكبرى). مهمتك إعادة صياغة الأخبار بأسلوب جذاب واحترافي، بعنوان قوي يحتوي على هوك (Hook) صديق لمحركات البحث (SEO) يثير الفضول دون مبالغة أو إثارة كاذبة، ومقدمة (lede) قصيرة 2-3 جمل تلخّص الخبر. حافظ على الدقة والحقائق، لا تخترع أرقامًا أو أسماء، استخدم العربية الفصحى المبسطة. ولّد أيضًا قائمة وسوم (tags) من 3 إلى 6 كلمات/عبارات قصيرة بالعربية تصف الموضوع. أرجع JSON فقط بالحقول title و excerpt و tags.",
          },
          {
            role: "user",
            content: `المصدر: ${source}\nالعنوان الأصلي: ${title}\nالمقدمة الأصلية: ${excerpt}\n\nأعد الصياغة وأرجع JSON بالشكل: {"title":"...","excerpt":"...","tags":["...","..."]}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return null;
    const j: any = await res.json();
    const content = j?.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    const t = String(parsed.title || "").trim();
    const e = String(parsed.excerpt || "").trim();
    const rawTags = Array.isArray(parsed.tags) ? parsed.tags : [];
    const tags = rawTags
      .map((x: any) => String(x ?? "").trim())
      .filter((x: string) => x.length > 0 && x.length <= 50)
      .slice(0, 8);
    if (!t || !e) return null;
    return { title: t.slice(0, 280), excerpt: e.slice(0, 600), tags };
  } catch {
    return null;
  }
}

export async function ingestAllFeeds() {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const { data: cats } = await supabaseAdmin.from("categories").select("id,slug");
  const catBySlug = new Map((cats ?? []).map((c) => [c.slug, c.id]));

  let inserted = 0;
  let skipped = 0;
  let rewritten = 0;
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

      // نأخذ أحدث 10 أخبار من كل مصدر (أكثر تريندًا)
      for (const item of list.slice(0, 10)) {
        const rawTitle = stripHtml(String(item.title?.["#text"] ?? item.title ?? "")).slice(0, 280);
        if (!rawTitle) continue;
        const link =
          typeof item.link === "string"
            ? item.link
            : item.link?.["@_href"] || item.link?.["#text"] || item.guid?.["#text"] || item.guid || null;
        const rawDesc = item.description || item.summary || item["content:encoded"] || "";
        const rawExcerpt = stripHtml(String(rawDesc)).slice(0, 500);
        const cover = pickImage(item);
        const pub = item.pubDate || item.published || item.updated;
        const published_at = pub ? new Date(String(pub)).toISOString() : new Date().toISOString();

        // dedupe قبل استدعاء الـ AI لتوفير التكلفة
        const tmpSlug = `${slugify(rawTitle)}-${Math.abs(hash(String(link || rawTitle))).toString(36).slice(0, 6)}`;
        const { data: existing } = await supabaseAdmin
          .from("articles")
          .select("id")
          .or(`slug.eq.${tmpSlug},source_url.eq.${(link ?? "").replace(/,/g, "")}`)
          .maybeSingle();
        if (existing) {
          skipped++;
          continue;
        }

        // إعادة صياغة بالـ AI بأسلوب جذاب
        const rewrite = await rewriteWithHook(rawTitle, rawExcerpt, src.source);
        const finalTitle = rewrite?.title || rawTitle;
        const finalExcerpt = rewrite?.excerpt || rawExcerpt;
        const finalTags = rewrite?.tags ?? [];
        if (rewrite) rewritten++;

        const slug = `${slugify(finalTitle)}-${Math.abs(hash(String(link || finalTitle))).toString(36).slice(0, 6)}`;

        const { error } = await supabaseAdmin.from("articles").insert({
          title: finalTitle,
          slug,
          excerpt: finalExcerpt,
          content: finalExcerpt,
          cover_image: cover,
          category_id: catBySlug.get(src.categorySlug) ?? null,
          source: src.source,
          source_url: link || null,
          is_published: true,
          is_breaking: false,
          published_at,
          tags: finalTags,
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

  return { inserted, skipped, rewritten, errors };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
