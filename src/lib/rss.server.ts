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

// صور افتراضية مرتبطة بالقسم — تُستخدم فقط إذا فشل توليد صورة بالذكاء الاصطناعي.
// لا تُستخدم صور عشوائية غير مرتبطة بالمحتوى أبدًا.
const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  sports: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&h=750&q=80", // ملعب كرة قدم
  politics: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&h=750&q=80", // مبنى حكومي
  economy: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&h=750&q=80", // أوراق نقدية
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&h=750&q=80", // تقنية
  arts: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&h=750&q=80", // فن/سينما
  accidents: "https://images.unsplash.com/photo-1582820002321-cc34c4bb4f1f?auto=format&fit=crop&w=1200&h=750&q=80", // إسعاف/طوارئ
  local: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1200&h=750&q=80", // القاهرة
  world: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&h=750&q=80", // عالم/خريطة
};
const GENERIC_NEWS_FALLBACK =
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&h=750&q=80"; // جريدة

function pickCategoryFallback(categorySlug: string): string {
  return CATEGORY_FALLBACK_IMAGES[categorySlug] ?? GENERIC_NEWS_FALLBACK;
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
  // الشرق للأخبار (عبر Google News RSS)
  { url: "https://news.google.com/rss/search?q=site:asharq.com&hl=ar&gl=EG&ceid=EG:ar", categorySlug: "world", source: "الشرق" },
  { url: "https://news.google.com/rss/search?q=site:asharq.com+%D8%B3%D9%8A%D8%A7%D8%B3%D8%A9&hl=ar&gl=EG&ceid=EG:ar", categorySlug: "politics", source: "الشرق" },
  { url: "https://news.google.com/rss/search?q=site:asharq.com+%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF&hl=ar&gl=EG&ceid=EG:ar", categorySlug: "economy", source: "الشرق" },
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

// AI rewriter: يعيد صياغة العنوان + المقدمة + يولّد محتوى مقال كامل متنوع + وسومًا.
async function rewriteWithHook(
  title: string,
  excerpt: string,
  source: string,
): Promise<{ title: string; excerpt: string; content: string; tags: string[] } | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;
  const styles = [
    "أسلوب تحليلي يربط الخبر بسياق أوسع وتداعياته على القارئ المصري",
    "أسلوب سردي قصصي يبدأ بمشهد لافت ثم يفكّك الخبر",
    "أسلوب تقريري مباشر يجيب على من/ماذا/متى/أين/لماذا بترتيب واضح",
    "أسلوب أسئلة وأجوبة (3-4 أسئلة جوهرية مع إجابات موجزة)",
    "أسلوب توضيحي Explainer يبسّط المصطلحات ويشرح الخلفية",
  ];
  const style = styles[Math.abs(hash(title + source)) % styles.length];
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
              "أنت محرر صحفي عربي محترف في بوابة (القاهرة الكبرى). أعد صياغة الخبر بأسلوب صحفي جذاب. أرجع JSON فقط بالحقول: title (عنوان قوي ≤ 90 حرفًا فيه هوك SEO صادق)، excerpt (مقدمة 2-3 جمل ≤ 280 حرفًا)، content (مقال كامل 280-450 كلمة، 4-6 فقرات مفصولة بسطر فارغ، يحتوي على عنوان فرعي واحد بصيغة ## في المنتصف، يلتزم بالحقائق دون اختراع أرقام أو أسماء أو اقتباسات)، tags (3-6 وسوم عربية قصيرة). استخدم العربية الفصحى المبسطة.",
          },
          {
            role: "user",
            content: `المصدر: ${source}\nالأسلوب المطلوب: ${style}\nالعنوان الأصلي: ${title}\nالمحتوى الأصلي: ${excerpt}\n\nأرجع JSON: {"title":"...","excerpt":"...","content":"...","tags":["..."]}`,
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
    const body = String(parsed.content || "").trim();
    const rawTags = Array.isArray(parsed.tags) ? parsed.tags : [];
    const tags = rawTags
      .map((x: any) => String(x ?? "").trim())
      .filter((x: string) => x.length > 0 && x.length <= 50)
      .slice(0, 8);
    if (!t || !e || !body) return null;
    return { title: t.slice(0, 280), excerpt: e.slice(0, 600), content: body.slice(0, 6000), tags };
  } catch {
    return null;
  }
}

// جلب الأخبار الرائجة من GNews
async function fetchTrendingFromGNews(): Promise<
  { title: string; excerpt: string; link: string | null; cover: string | null; published_at: string; categorySlug: string; source: string }[]
> {
  const key = process.env.GNEWS_API_KEY;
  if (!key) return [];
  const topics: { topic: string; categorySlug: string }[] = [
    { topic: "world", categorySlug: "world" },
    { topic: "business", categorySlug: "economy" },
    { topic: "technology", categorySlug: "technology" },
    { topic: "sports", categorySlug: "sports" },
    { topic: "entertainment", categorySlug: "arts" },
  ];
  const out: any[] = [];
  for (const t of topics) {
    try {
      const url = `https://gnews.io/api/v4/top-headlines?topic=${t.topic}&lang=ar&country=eg&max=6&apikey=${key}`;
      const r = await fetch(url);
      if (!r.ok) continue;
      const j: any = await r.json();
      for (const a of j.articles ?? []) {
        if (!a?.title) continue;
        out.push({
          title: String(a.title).slice(0, 280),
          excerpt: String(a.description || a.content || "").slice(0, 500),
          link: a.url || null,
          cover: a.image || null,
          published_at: a.publishedAt ? new Date(a.publishedAt).toISOString() : new Date().toISOString(),
          categorySlug: t.categorySlug,
          source: `GNews · ${a.source?.name || "trending"}`,
        });
      }
    } catch {
      // skip topic
    }
  }
  return out;
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

  // Load active sources from DB (fallback to hardcoded if table empty)
  const { data: dbSources } = await supabaseAdmin
    .from("rss_sources")
    .select("*")
    .eq("enabled", true)
    .order("sort_order", { ascending: true });

  type ActiveSrc = {
    id?: string;
    url: string;
    categorySlug: string;
    source: string;
    maxItems: number;
    autoPublish: boolean;
  };
  const sources: ActiveSrc[] =
    dbSources && dbSources.length > 0
      ? dbSources.map((s) => ({
          id: s.id,
          url: s.url,
          categorySlug: s.category_slug,
          source: s.source_label,
          maxItems: s.max_items ?? 8,
          autoPublish: s.auto_publish ?? false,
        }))
      : RSS_SOURCES.map((s) => ({
          url: s.url,
          categorySlug: s.categorySlug,
          source: s.source,
          maxItems: 8,
          autoPublish: true,
        }));

  let inserted = 0;
  let skipped = 0;
  let rewritten = 0;
  let drafted = 0;
  const errors: string[] = [];
  const insertedArticles: { id: string; title: string; excerpt: string; slug: string; cover_image: string | null; tags: string[] }[] = [];

  // معالجة عنصر واحد (RSS أو Trending)
  async function processItem(args: {
    rawTitle: string;
    rawExcerpt: string;
    link: string | null;
    cover: string | null;
    published_at: string;
    categorySlug: string;
    source: string;
    autoPublish: boolean;
  }) {
    const { rawTitle, rawExcerpt, link, cover, published_at, categorySlug, source, autoPublish } = args;
    if (!rawTitle) return { ok: false as const };
    const sourceUrl = link?.trim() || null;
    if (sourceUrl) {
      const { data: bySourceUrl } = await supabaseAdmin
        .from("articles")
        .select("id")
        .eq("source_url", sourceUrl)
        .limit(1)
        .maybeSingle();
      if (bySourceUrl) {
        skipped++;
        return { ok: false as const };
      }
      const { data: byDraft } = await supabaseAdmin
        .from("article_drafts")
        .select("id")
        .eq("source_url", sourceUrl)
        .limit(1)
        .maybeSingle();
      if (byDraft) {
        skipped++;
        return { ok: false as const };
      }
    }

    const tmpSlug = `${slugify(rawTitle)}-${Math.abs(hash(String(link || rawTitle))).toString(36).slice(0, 6)}`;
    const { data: existingSlug } = await supabaseAdmin
      .from("articles")
      .select("id")
      .eq("slug", tmpSlug)
      .maybeSingle();
    if (existingSlug) {
      skipped++;
      return { ok: false as const };
    }

    const rewrite = await rewriteWithHook(rawTitle, rawExcerpt, source);
    const finalTitle = rewrite?.title || rawTitle;
    const finalExcerpt = rewrite?.excerpt || rawExcerpt;
    const finalContent = rewrite?.content || rawExcerpt;
    const finalTags = rewrite?.tags ?? [];
    if (rewrite) rewritten++;

    const slug = `${slugify(finalTitle)}-${Math.abs(hash(String(link || finalTitle))).toString(36).slice(0, 6)}`;

    let finalCover = cover;
    // لو الصورة الأصلية مكررة في مقال آخر، نعتبرها غير صالحة ونعيد التوليد بدل استخدام صورة عشوائية.
    if (finalCover) {
      const { data: dup } = await supabaseAdmin
        .from("articles")
        .select("id")
        .eq("cover_image", finalCover)
        .limit(1)
        .maybeSingle();
      if (dup) finalCover = null;
    }
    // لا توجد صورة → نولّد واحدة بالذكاء الاصطناعي مرتبطة بالعنوان.
    if (!finalCover) {
      finalCover = await generateCoverImage(finalTitle, slug);
    }
    // الملاذ الأخير: صورة افتراضية حسب القسم (مرتبطة بالموضوع وليست عشوائية).
    if (!finalCover) finalCover = pickCategoryFallback(categorySlug);

    if (!autoPublish) {
      // Save as draft for review
      const { error: dErr } = await supabaseAdmin.from("article_drafts").insert({
        title: finalTitle,
        excerpt: finalExcerpt,
        content: finalContent,
        cover_image: finalCover,
        category_id: catBySlug.get(categorySlug) ?? null,
        source,
        source_url: sourceUrl,
        tags: finalTags,
        published_at,
        original_title: rawTitle,
        original_excerpt: rawExcerpt,
        status: "pending",
      });
      if (dErr) {
        if (dErr.code === "23505") skipped++;
        else errors.push(`${source} (draft): ${dErr.message}`);
        return { ok: false as const };
      }
      drafted++;
      return { ok: true as const, draft: true };
    }

    const { data: newRows, error } = await supabaseAdmin.from("articles").insert({
      title: finalTitle,
      slug,
      excerpt: finalExcerpt,
      content: finalContent,
      cover_image: finalCover,
      category_id: catBySlug.get(categorySlug) ?? null,
      source,
      source_url: sourceUrl,
      is_published: true,
      is_breaking: false,
      published_at,
      tags: finalTags,
    }).select("id");
    if (error) {
      if (error.code === "23505") {
        skipped++;
        return { ok: false as const };
      }
      errors.push(`${source}: ${error.message}`);
      return { ok: false as const };
    }
    inserted++;
    if (newRows && newRows[0]) {
      insertedArticles.push({
        id: newRows[0].id,
        title: finalTitle,
        excerpt: finalExcerpt,
        slug,
        cover_image: finalCover,
        tags: finalTags,
      });
    }
    return { ok: true as const, draft: false };
  }

  for (const src of sources) {
    let srcInsertedCount = 0;
    let srcError: string | null = null;
    try {
      const res = await fetch(src.url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5",
          "accept-language": "ar,en;q=0.8",
        },
      });
      if (!res.ok) {
        srcError = `HTTP ${res.status}`;
        errors.push(`${src.source}: ${srcError}`);
      } else {
        const xml = await res.text();
        const parsed = parser.parse(xml);
        const items = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
        const list = Array.isArray(items) ? items : [items];

        for (const item of list.slice(0, src.maxItems)) {
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
          const r = await processItem({
            rawTitle,
            rawExcerpt,
            link,
            cover,
            published_at,
            categorySlug: src.categorySlug,
            source: src.source,
            autoPublish: src.autoPublish,
          });
          if (r.ok) srcInsertedCount++;
        }
      }
    } catch (e: any) {
      srcError = e.message;
      errors.push(`${src.source}: ${e.message}`);
    }
    if (src.id) {
      await supabaseAdmin
        .from("rss_sources")
        .update({
          last_fetched_at: new Date().toISOString(),
          last_inserted_count: srcInsertedCount,
          last_error: srcError,
          total_inserted: ((dbSources?.find((d) => d.id === src.id)?.total_inserted ?? 0) as number) + srcInsertedCount,
        })
        .eq("id", src.id);
    }
  }


  // الأخبار الرائجة من GNews
  try {
    const trending = await fetchTrendingFromGNews();
    for (const t of trending) {
      await processItem({
        rawTitle: t.title,
        rawExcerpt: t.excerpt,
        link: t.link,
        cover: t.cover,
        published_at: t.published_at,
        categorySlug: t.categorySlug,
        source: t.source,
        autoPublish: true,
      });
    }
  } catch (e: any) {
    errors.push(`GNews: ${e.message}`);
  }


  // نشر على صفحة الفيسبوك (أحدث 5 أخبار)
  let facebookPosted = 0;
  let facebookFailed = 0;
  const facebookErrors: string[] = [];

  if (insertedArticles.length > 0) {
    const siteUrl = process.env.SITE_URL || "https://alkhahera-alkobra.lovable.app";
    for (const article of insertedArticles.slice(0, 5)) {
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

  return { inserted, skipped, rewritten, drafted, errors, facebookPosted, facebookFailed, facebookErrors };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
