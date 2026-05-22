// Server-only RSS ingestion helpers.
import { XMLParser } from "fast-xml-parser";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { slugify } from "@/lib/format";
import { postArticleToFacebook } from "@/lib/facebook.server";

export type RssSource = {
  url: string;
  categorySlug: string;
  source: string;
};

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&h=500&q=80",
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=800&h=500&q=80",
  "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?auto=format&fit=crop&w=800&h=500&q=80",
  "https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=800&h=500&q=80",
  "https://images.unsplash.com/photo-1518544801976-3e159e50e5bb?auto=format&fit=crop&w=800&h=500&q=80",
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&h=500&q=80",
  "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?auto=format&fit=crop&w=800&h=500&q=80",
  "https://images.unsplash.com/photo-1591696205602-2f950c417cb9?auto=format&fit=crop&w=800&h=500&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&h=500&q=80",
  "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&h=500&q=80",
  "https://images.unsplash.com/photo-1496449903678-68ddcb189a24?auto=format&fit=crop&w=800&h=500&q=80",
  "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=800&h=500&q=80",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&h=500&q=80",
  "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&h=500&q=80",
  "https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&w=800&h=500&q=80",
];

function pickFallbackImage(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return FALLBACK_IMAGES[Math.abs(h) % FALLBACK_IMAGES.length];
}

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

// مولّد صورة تلقائي للأخبار التي لا تحتوي على صورة
async function generateCoverImage(title: string, slug: string): Promise<string | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: `صورة صحفية واقعية احترافية بأسلوب تحريري لجريدة عربية، تعبّر عن الخبر التالي بدون أي نص مكتوب داخل الصورة: ${title}. ألوان متوازنة، إضاءة طبيعية، تكوين سينمائي 16:9.`,
          },
        ],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) return null;
    const j: any = await res.json();
    const dataUrl: string | undefined = j?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl || !dataUrl.startsWith("data:image/")) return null;

    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return null;
    const mime = match[1];
    const ext = mime.split("/")[1].replace("jpeg", "jpg");
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    const path = `ai-generated/${slug}.${ext}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("article-images")
      .upload(path, bytes, { contentType: mime, upsert: true });
    if (upErr) return null;
    const { data: pub } = supabaseAdmin.storage.from("article-images").getPublicUrl(path);
    return pub?.publicUrl ?? null;
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
  const insertedArticles: { id: string; title: string; excerpt: string; slug: string; cover_image: string | null; tags: string[] }[] = [];

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

        // منع تكرار نفس الصورة عبر المقالات: لو الصورة مستخدمة قبل كده، استبدلها من مجموعة متنوعة
        let finalCover = cover;
        if (finalCover) {
          const { data: dup } = await supabaseAdmin
            .from("articles")
            .select("id")
            .eq("cover_image", finalCover)
            .limit(1)
            .maybeSingle();
          if (dup) finalCover = pickFallbackImage(slug);
        }
        if (!finalCover) {
          finalCover = await generateCoverImage(finalTitle, slug);
        }
        if (!finalCover) finalCover = pickFallbackImage(slug);


        const { data: newRows, error } = await supabaseAdmin.from("articles").insert({
          title: finalTitle,
          slug,
          excerpt: finalExcerpt,
          content: finalExcerpt,
          cover_image: finalCover,
          category_id: catBySlug.get(src.categorySlug) ?? null,
          source: src.source,
          source_url: link || null,
          is_published: true,
          is_breaking: false,
          published_at,
          tags: finalTags,
        }).select("id");
        if (error) {
          errors.push(`${src.source}: ${error.message}`);
        } else {
          inserted++;
          if (newRows && newRows[1]) {
            insertedArticles.push({
              id: newRows[1].id,
              title: finalTitle,
              excerpt: finalExcerpt,
              slug,
              cover_image: finalCover,
              tags: finalTags,
            });
          }
        }
      }
    } catch (e: any) {
      errors.push(`${src.source}: ${e.message}`);
    }
  }

  // نشر على صفحة الفيسبوك (أحدث 5 أخبار)
  let facebookPosted = 0;
  let facebookFailed = 0;
  const facebookErrors: string[] = [];

  if (insertedArticles.length > 1) {
    const siteUrl = process.env.SITE_URL || "https://alkhahera-alkobra.lovable.app";
    for (const article of insertedArticles.slice(1, 6)) {
      const fb = await postArticleToFacebook(article, siteUrl);
      if (fb.success) {
        facebookPosted++;
      } else {
        facebookFailed++;
        if (fb.error) facebookErrors.push(fb.error);
      }
      await new Promise((r) => setTimeout(r, 1101));
    }
  }

  return { inserted, skipped, rewritten, errors, facebookPosted, facebookFailed, facebookErrors };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
