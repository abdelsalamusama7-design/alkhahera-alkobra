import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE_URL = "https://kaheraalkobra.online";

export interface ArticleLastmodRow {
  id: string;
  slug: string;
  title: string;
  lastmod: string | null;
  published_at: string | null;
  category_id: string | null;
  category_name: string | null;
  is_published: boolean;
}

export interface CategoryLastmodRow {
  id: string;
  slug: string;
  name: string;
  lastmod: string | null;
  article_count: number;
}

export const getSeoLastmodOverview = createServerFn({ method: "GET" }).handler(async () => {
  const [{ data: cats }, { data: arts }] = await Promise.all([
    supabaseAdmin.from("categories").select("id, slug, name").order("sort_order"),
    supabaseAdmin
      .from("articles")
      .select("id, slug, title, updated_at, published_at, category_id, is_published")
      .order("updated_at", { ascending: false })
      .limit(2000),
  ]);

  const catMap = new Map<string, { id: string; slug: string; name: string }>();
  for (const c of cats ?? []) catMap.set(c.id, c);

  const catLastmod = new Map<string, string>();
  const catCount = new Map<string, number>();
  let siteLastmod: string | null = null;

  const articles: ArticleLastmodRow[] = (arts ?? []).map((a) => {
    const ts = a.updated_at ?? a.published_at ?? null;
    if (ts && (!siteLastmod || ts > siteLastmod)) siteLastmod = ts;
    if (a.is_published && a.category_id) {
      catCount.set(a.category_id, (catCount.get(a.category_id) ?? 0) + 1);
      if (ts) {
        const prev = catLastmod.get(a.category_id);
        if (!prev || ts > prev) catLastmod.set(a.category_id, ts);
      }
    }
    return {
      id: a.id,
      slug: a.slug,
      title: a.title,
      lastmod: ts,
      published_at: a.published_at,
      category_id: a.category_id,
      category_name: a.category_id ? catMap.get(a.category_id)?.name ?? null : null,
      is_published: a.is_published,
    };
  });

  const categories: CategoryLastmodRow[] = (cats ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    lastmod: catLastmod.get(c.id) ?? null,
    article_count: catCount.get(c.id) ?? 0,
  }));

  return {
    siteLastmod,
    baseUrl: BASE_URL,
    articles,
    categories,
    totals: {
      articles: articles.length,
      publishedArticles: articles.filter((a) => a.is_published).length,
      categories: categories.length,
    },
  };
});

/**
 * يعيد "تنشيط" المعلومات لجوجل عبر:
 * 1) إعادة بناء/تحقق sitemap.xml المنشور (يضمن أحدث محتوى).
 * 2) إعادة بناء robots.txt للتحقق منه.
 * 3) إرجاع روابط جاهزة لفتح Google Search Console مع الـ sitemap محدد مسبقاً.
 * Google أوقف Ping API، فالإرسال النهائي يتم بضغطة في GSC.
 */
export const refreshSearchConsole = createServerFn({ method: "POST" }).handler(async () => {
  const startedAt = Date.now();
  const sitemapUrl = `${BASE_URL}/sitemap.xml`;
  const robotsUrl = `${BASE_URL}/robots.txt`;

  const steps: Array<{ name: string; ok: boolean; detail: string }> = [];

  // 1) Sitemap warm + parse
  let urlCount = 0;
  let siteLastmod: string | null = null;
  try {
    const r = await fetch(`${sitemapUrl}?ts=${Date.now()}`, {
      headers: { "User-Agent": "Lovable-GSC-Refresh/1.0", "Cache-Control": "no-cache" },
    });
    const text = await r.text();
    const matches = text.match(/<loc>/g);
    urlCount = matches ? matches.length : 0;
    const lastmods = [...text.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
    if (lastmods.length) siteLastmod = lastmods.sort().slice(-1)[0];
    steps.push({
      ok: r.ok && urlCount > 0,
      name: "تحديث ملف Sitemap",
      detail: r.ok
        ? `تم تحميل ${urlCount} رابط بنجاح (HTTP ${r.status}).`
        : `فشل تحميل sitemap.xml — HTTP ${r.status}.`,
    });
  } catch (e: any) {
    steps.push({ ok: false, name: "تحديث ملف Sitemap", detail: `خطأ: ${e?.message || e}` });
  }

  // 2) robots.txt
  try {
    const r = await fetch(robotsUrl, { headers: { "Cache-Control": "no-cache" } });
    const text = await r.text();
    const hasSitemap = /Sitemap:\s*https?:\/\//i.test(text);
    steps.push({
      ok: r.ok && hasSitemap,
      name: "التحقق من robots.txt",
      detail: r.ok
        ? hasSitemap
          ? "الملف يحتوي على رابط Sitemap بشكل صحيح."
          : "الملف لا يحتوي على Sitemap: — أضفه لتسهيل الاكتشاف."
        : `HTTP ${r.status}`,
    });
  } catch (e: any) {
    steps.push({ ok: false, name: "التحقق من robots.txt", detail: `خطأ: ${e?.message || e}` });
  }

  // 3) أرقام حية من قاعدة البيانات
  try {
    const [{ count: pubCount }, { count: catCount }] = await Promise.all([
      supabaseAdmin
        .from("articles")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
      supabaseAdmin.from("categories").select("id", { count: "exact", head: true }),
    ]);
    steps.push({
      ok: true,
      name: "الأرقام الحالية",
      detail: `${pubCount ?? 0} مقال منشور — ${catCount ?? 0} تصنيف.`,
    });
  } catch (e: any) {
    steps.push({ ok: false, name: "الأرقام الحالية", detail: `خطأ: ${e?.message || e}` });
  }

  const allOk = steps.every((s) => s.ok);
  const encodedSite = encodeURIComponent(`${BASE_URL}/`);

  return {
    ok: allOk,
    elapsedMs: Date.now() - startedAt,
    sitemapUrl,
    robotsUrl,
    urlCount,
    siteLastmod,
    steps,
    gscSitemapsUrl: `https://search.google.com/search-console/sitemaps?resource_id=${encodedSite}`,
    gscInspectionUrl: `https://search.google.com/search-console/inspect?resource_id=${encodedSite}&id=${encodeURIComponent(BASE_URL + "/")}`,
    bingSubmitUrl: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
  };
});
