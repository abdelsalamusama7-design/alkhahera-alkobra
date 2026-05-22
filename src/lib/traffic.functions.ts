import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHeader } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hasPerm } from "@/lib/permissions";
import { classifyReferrer, detectDevice, type SourceType, type DeviceType } from "@/lib/analytics.server";

async function ensureCanView(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r) => r.role as string);
  if (!hasPerm(roles, "view_publish_stats")) throw new Error("ليس لديك صلاحية");
}

// PUBLIC: log a view for an article. Called from the article page on client.
export const logArticleView = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      slug: z.string().min(1).max(200),
      referrer: z.string().max(2048).optional().nullable(),
      path: z.string().max(500).optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: art } = await supabaseAdmin
      .from("articles").select("id, view_count").eq("slug", data.slug).maybeSingle();
    if (!art) return { ok: false };

    const ua = getRequestHeader("user-agent") ?? null;
    const country =
      getRequestHeader("cf-ipcountry") ??
      getRequestHeader("x-vercel-ip-country") ??
      getRequestHeader("x-country") ??
      null;
    const host = getRequestHeader("host") ?? null;

    const { source_type, referrer_host } = classifyReferrer(data.referrer, host);
    const device_type = detectDevice(ua);

    // Skip bot views in counters
    if (device_type !== "bot") {
      await supabaseAdmin.from("article_views").insert({
        article_id: art.id,
        path: data.path ?? null,
        referrer: data.referrer ?? null,
        referrer_host,
        source_type,
        country: country ? String(country).toUpperCase().slice(0, 8) : null,
        device_type,
        user_agent: ua ? ua.slice(0, 500) : null,
      });
      await supabaseAdmin
        .from("articles")
        .update({ view_count: (art.view_count ?? 0) + 1 })
        .eq("id", art.id);
    }

    return { ok: true };
  });

export type DailyViews = { date: string; views: number };
export type ReferrerRow = { host: string; count: number };
export type BreakdownRow<T extends string = string> = { key: T; count: number };

export type ArticleStats = {
  article: {
    id: string;
    slug: string;
    title: string;
    author_name: string | null;
    published_at: string;
    cover_image: string | null;
    view_count: number;
  };
  totals: { views30d: number; viewsAllTime: number; uniqueCountries: number };
  trend: { current: number; previous: number; deltaPct: number };
  daily: DailyViews[];
  topReferrers: ReferrerRow[];
  sources: BreakdownRow<SourceType>[];
  countries: BreakdownRow[];
  devices: BreakdownRow<DeviceType>[];
};

export const getArticleStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }): Promise<ArticleStats> => {
    await ensureCanView(context.userId);

    const { data: art, error: aerr } = await supabaseAdmin
      .from("articles")
      .select("id,slug,title,author_name,published_at,cover_image,view_count")
      .eq("slug", data.slug).maybeSingle();
    if (aerr) throw new Error(aerr.message);
    if (!art) throw new Error("الخبر غير موجود");

    const now = new Date();
    const start30 = new Date(now); start30.setDate(now.getDate() - 29); start30.setHours(0, 0, 0, 0);
    const start60 = new Date(now); start60.setDate(now.getDate() - 59); start60.setHours(0, 0, 0, 0);

    const { data: views } = await supabaseAdmin
      .from("article_views")
      .select("viewed_at,referrer_host,source_type,country,device_type")
      .eq("article_id", art.id)
      .gte("viewed_at", start60.toISOString())
      .order("viewed_at", { ascending: false })
      .limit(10000);

    const rows = views ?? [];

    // Daily series for last 30 days
    const days: DailyViews[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i); d.setHours(0, 0, 0, 0);
      days.push({ date: d.toISOString().slice(0, 10), views: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));

    let current = 0;
    let previous = 0;
    const refMap = new Map<string, number>();
    const srcMap = new Map<string, number>();
    const ctryMap = new Map<string, number>();
    const devMap = new Map<string, number>();

    for (const r of rows) {
      const t = new Date(r.viewed_at);
      if (t >= start30) {
        current += 1;
        const k = r.viewed_at.slice(0, 10);
        const i = idx.get(k);
        if (i !== undefined) days[i].views += 1;
        if (r.referrer_host) refMap.set(r.referrer_host, (refMap.get(r.referrer_host) ?? 0) + 1);
        srcMap.set(r.source_type ?? "direct", (srcMap.get(r.source_type ?? "direct") ?? 0) + 1);
        if (r.country) ctryMap.set(r.country, (ctryMap.get(r.country) ?? 0) + 1);
        devMap.set(r.device_type ?? "unknown", (devMap.get(r.device_type ?? "unknown") ?? 0) + 1);
      } else {
        previous += 1;
      }
    }
    const deltaPct = previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);

    const sortDesc = <T extends string>(m: Map<T, number>) =>
      Array.from(m.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);

    return {
      article: {
        id: art.id, slug: art.slug, title: art.title, author_name: art.author_name,
        published_at: art.published_at, cover_image: art.cover_image, view_count: art.view_count ?? 0,
      },
      totals: { views30d: current, viewsAllTime: art.view_count ?? 0, uniqueCountries: ctryMap.size },
      trend: { current, previous, deltaPct },
      daily: days,
      topReferrers: Array.from(refMap.entries()).map(([host, count]) => ({ host, count }))
        .sort((a, b) => b.count - a.count).slice(0, 10),
      sources: sortDesc(srcMap) as BreakdownRow<SourceType>[],
      countries: sortDesc(ctryMap).slice(0, 15),
      devices: sortDesc(devMap) as BreakdownRow<DeviceType>[],
    };
  });

export type SiteTrafficStats = {
  totals: { views30d: number; visitors30d: number; viewsAllTime: number };
  daily: DailyViews[];
  sources: BreakdownRow<SourceType>[];
  topReferrers: ReferrerRow[];
  countries: BreakdownRow[];
  devices: BreakdownRow<DeviceType>[];
  topArticles: { id: string; slug: string; title: string; views: number }[];
};

export const getSiteTrafficStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SiteTrafficStats> => {
    await ensureCanView(context.userId);

    const now = new Date();
    const start30 = new Date(now); start30.setDate(now.getDate() - 29); start30.setHours(0, 0, 0, 0);

    const { data: views } = await supabaseAdmin
      .from("article_views")
      .select("article_id,viewed_at,referrer_host,source_type,country,device_type")
      .gte("viewed_at", start30.toISOString())
      .order("viewed_at", { ascending: false })
      .limit(50000);

    const rows = views ?? [];

    const days: DailyViews[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i); d.setHours(0, 0, 0, 0);
      days.push({ date: d.toISOString().slice(0, 10), views: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));

    const refMap = new Map<string, number>();
    const srcMap = new Map<string, number>();
    const ctryMap = new Map<string, number>();
    const devMap = new Map<string, number>();
    const articleMap = new Map<string, number>();

    for (const r of rows) {
      const i = idx.get(r.viewed_at.slice(0, 10));
      if (i !== undefined) days[i].views += 1;
      if (r.referrer_host) refMap.set(r.referrer_host, (refMap.get(r.referrer_host) ?? 0) + 1);
      srcMap.set(r.source_type ?? "direct", (srcMap.get(r.source_type ?? "direct") ?? 0) + 1);
      if (r.country) ctryMap.set(r.country, (ctryMap.get(r.country) ?? 0) + 1);
      devMap.set(r.device_type ?? "unknown", (devMap.get(r.device_type ?? "unknown") ?? 0) + 1);
      articleMap.set(r.article_id, (articleMap.get(r.article_id) ?? 0) + 1);
    }

    const topIds = Array.from(articleMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    let topArticles: SiteTrafficStats["topArticles"] = [];
    if (topIds.length) {
      const { data: arts } = await supabaseAdmin
        .from("articles").select("id,slug,title").in("id", topIds.map((t) => t[0]));
      const byId = new Map((arts ?? []).map((a) => [a.id, a]));
      topArticles = topIds.map(([id, views]) => {
        const a = byId.get(id);
        return { id, slug: a?.slug ?? "", title: a?.title ?? "(محذوف)", views };
      });
    }

    const { count: allTimeViews } = await supabaseAdmin
      .from("article_views").select("id", { count: "exact", head: true });

    const sortDesc = <T extends string>(m: Map<T, number>) =>
      Array.from(m.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);

    return {
      totals: {
        views30d: rows.length,
        visitors30d: rows.length, // session unification not implemented yet
        viewsAllTime: allTimeViews ?? 0,
      },
      daily: days,
      sources: sortDesc(srcMap) as BreakdownRow<SourceType>[],
      topReferrers: Array.from(refMap.entries()).map(([host, count]) => ({ host, count }))
        .sort((a, b) => b.count - a.count).slice(0, 15),
      countries: sortDesc(ctryMap).slice(0, 20),
      devices: sortDesc(devMap) as BreakdownRow<DeviceType>[],
      topArticles,
    };
  });
