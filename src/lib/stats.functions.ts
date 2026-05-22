import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hasPerm } from "@/lib/permissions";

async function ensureCanView(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r) => r.role as string);
  if (!hasPerm(roles, "view_publish_stats")) throw new Error("ليس لديك صلاحية");
}

export type AuthorStat = {
  author_id: string | null;
  author_name: string;
  email: string | null;
  total: number;
  published: number;
  drafts: number;
  breaking: number;
  views: number;
  last_published_at: string | null;
  first_published_at: string | null;
};

export type RecentArticle = {
  id: string;
  title: string;
  slug: string;
  author_id: string | null;
  author_name: string | null;
  is_published: boolean;
  is_breaking: boolean;
  published_at: string;
  created_at: string;
  view_count: number;
};

export type TopArticle = {
  id: string;
  title: string;
  slug: string;
  author_name: string | null;
  view_count: number;
  published_at: string;
};

export type DailyPoint = { date: string; articles: number; views: number };

export const getPublishStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureCanView(context.userId);

    const { data: articles, error } = await supabaseAdmin
      .from("articles")
      .select("id,title,slug,author_id,author_name,is_published,is_breaking,published_at,created_at,view_count")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const rows = articles ?? [];

    const authorIds = Array.from(
      new Set(rows.map((r) => r.author_id).filter((x): x is string => !!x)),
    );
    const emailMap = new Map<string, string>();
    await Promise.all(
      authorIds.map(async (id) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(id);
        if (data?.user?.email) emailMap.set(id, data.user.email);
      }),
    );

    const byAuthor = new Map<string, AuthorStat>();
    for (const a of rows) {
      const key = a.author_id ?? `name:${a.author_name ?? "غير معروف"}`;
      const existing = byAuthor.get(key);
      const stat: AuthorStat =
        existing ?? {
          author_id: a.author_id,
          author_name: a.author_name ?? "غير معروف",
          email: a.author_id ? emailMap.get(a.author_id) ?? null : null,
          total: 0,
          published: 0,
          drafts: 0,
          breaking: 0,
          views: 0,
          last_published_at: null,
          first_published_at: null,
        };
      stat.total += 1;
      stat.views += a.view_count ?? 0;
      if (a.is_published) stat.published += 1;
      else stat.drafts += 1;
      if (a.is_breaking) stat.breaking += 1;
      if (a.is_published) {
        if (!stat.last_published_at || a.published_at > stat.last_published_at) {
          stat.last_published_at = a.published_at;
        }
        if (!stat.first_published_at || a.published_at < stat.first_published_at) {
          stat.first_published_at = a.published_at;
        }
      }
      byAuthor.set(key, stat);
    }

    const authors = Array.from(byAuthor.values()).sort((a, b) => b.total - a.total);

    const recent: RecentArticle[] = rows.slice(0, 50).map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      author_id: a.author_id,
      author_name: a.author_name,
      is_published: a.is_published,
      is_breaking: a.is_breaking,
      published_at: a.published_at,
      created_at: a.created_at,
      view_count: a.view_count ?? 0,
    }));

    const topArticles: TopArticle[] = [...rows]
      .filter((r) => r.is_published)
      .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
      .slice(0, 10)
      .map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        author_name: a.author_name,
        view_count: a.view_count ?? 0,
        published_at: a.published_at,
      }));

    // Build 14-day series of articles published + views accumulated
    const days: DailyPoint[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, articles: 0, views: 0 });
    }
    const dayIndex = new Map(days.map((d, i) => [d.date, i]));
    for (const a of rows) {
      const key = (a.published_at ?? a.created_at).slice(0, 10);
      const idx = dayIndex.get(key);
      if (idx !== undefined) {
        days[idx].articles += 1;
        days[idx].views += a.view_count ?? 0;
      }
    }

    const totalViews = rows.reduce((s, r) => s + (r.view_count ?? 0), 0);

    return {
      totals: {
        articles: rows.length,
        published: rows.filter((r) => r.is_published).length,
        drafts: rows.filter((r) => !r.is_published).length,
        breaking: rows.filter((r) => r.is_breaking).length,
        authors: authors.length,
        views: totalViews,
      },
      authors,
      recent,
      topArticles,
      daily: days,
    };
  });
