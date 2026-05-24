import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { slugify } from "@/lib/format";
import { hasPerm, type Permission } from "@/lib/permissions";

const ARTICLE_SELECT = "*, category:categories(id,slug,name)";

// PUBLIC: list articles with filters
export const listArticles = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        categorySlug: z.string().optional(),
        q: z.string().optional(),
        breakingOnly: z.boolean().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("articles")
      .select(ARTICLE_SELECT, { count: "exact" })
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);

    if (data.breakingOnly) q = q.eq("is_breaking", true);
    if (data.from) q = q.gte("published_at", data.from);
    if (data.to) q = q.lte("published_at", data.to);
    if (data.q && data.q.trim()) {
      const term = `%${data.q.trim()}%`;
      q = q.or(`title.ilike.${term},excerpt.ilike.${term},content.ilike.${term}`);
    }
    if (data.categorySlug) {
      const { data: cat } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("slug", data.categorySlug)
        .maybeSingle();
      if (cat) q = q.eq("category_id", cat.id);
    }

    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { items: rows ?? [], total: count ?? 0 };
  });

// PUBLIC: single article
export const getArticleBySlug = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { article: null, related: [] };

    // View counting moved to logArticleView (called from the article page)
    // so we can also capture referrer, country and device information.

    let related: any[] = [];
    if (row.category_id) {
      const { data: rel } = await supabaseAdmin
        .from("articles")
        .select(ARTICLE_SELECT)
        .eq("is_published", true)
        .eq("category_id", row.category_id)
        .neq("id", row.id)
        .order("published_at", { ascending: false })
        .limit(4);
      related = rel ?? [];
    }

    return { article: row, related };
  });

// PUBLIC: categories
export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

// PUBLIC: home bundle
export const getHomeBundle = createServerFn({ method: "GET" }).handler(async () => {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const [{ data: hero }, { data: latest }, { data: breaking }, { data: mostRead }, { data: recentViews }, { data: worldCat }] =
    await Promise.all([
      supabaseAdmin.from("articles").select(ARTICLE_SELECT).eq("is_published", true).order("published_at", { ascending: false }).limit(3),
      supabaseAdmin.from("articles").select(ARTICLE_SELECT).eq("is_published", true).order("published_at", { ascending: false }).range(3, 80),
      supabaseAdmin.from("articles").select("id,slug,title").eq("is_published", true).eq("is_breaking", true).order("published_at", { ascending: false }).limit(8),
      supabaseAdmin.from("articles").select(ARTICLE_SELECT).eq("is_published", true).order("view_count", { ascending: false }).limit(5),
      supabaseAdmin.from("article_views").select("article_id").gte("viewed_at", since),
      supabaseAdmin.from("categories").select("id").eq("slug", "world").maybeSingle(),
    ]);

  // World top events (for the circular topics strip)
  let worldTop: any[] = [];
  if (worldCat?.id) {
    const { data: w } = await supabaseAdmin
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("is_published", true)
      .eq("category_id", worldCat.id)
      .not("cover_image", "is", null)
      .order("published_at", { ascending: false })
      .limit(60);
    worldTop = w ?? [];
  }

  // Trending: score = views_48h / (hours_since_published + 2)^1.3
  const viewCounts = new Map<string, number>();
  for (const v of (recentViews ?? []) as Array<{ article_id: string }>) {
    viewCounts.set(v.article_id, (viewCounts.get(v.article_id) ?? 0) + 1);
  }
  let trending: any[] = [];
  if (viewCounts.size > 0) {
    const ids = Array.from(viewCounts.keys());
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: trArticles } = await supabaseAdmin
      .from("articles")
      .select(ARTICLE_SELECT)
      .in("id", ids)
      .eq("is_published", true)
      .gte("published_at", weekAgo);
    const now = Date.now();
    trending = (trArticles ?? [])
      .map((a: any) => {
        const hours = Math.max(0, (now - new Date(a.published_at).getTime()) / 3_600_000);
        const score = (viewCounts.get(a.id) ?? 0) / Math.pow(hours + 2, 1.3);
        return { ...a, _trend_score: score, _trend_views: viewCounts.get(a.id) ?? 0 };
      })
      .sort((a, b) => b._trend_score - a._trend_score)
      .slice(0, 6);
  }

  return {
    hero: hero ?? [],
    latest: latest ?? [],
    breaking: breaking ?? [],
    mostRead: mostRead ?? [],
    trending,
    worldTop,
  };
});

// ADMIN HELPERS
async function getUserRoles(userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.role as string);
}

async function requirePerm(userId: string, perm: Permission) {
  const roles = await getUserRoles(userId);
  if (!hasPerm(roles, perm)) throw new Error("ليس لديك صلاحية لهذا الإجراء");
  return roles;
}

const articleInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3).max(300),
  slug: z.string().max(120).optional(),
  excerpt: z.string().max(1000).optional().nullable(),
  content: z.string().max(50000).optional().nullable(),
  cover_image: z.string().url().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  author_name: z.string().max(120).optional().nullable(),
  source: z.string().max(120).optional().nullable(),
  source_url: z.string().url().optional().nullable().or(z.literal("").transform(() => null)),
  is_breaking: z.boolean().default(false),
  is_published: z.boolean().default(true),
});

export const saveArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => articleInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const roles = await getUserRoles(userId);

    // Editing existing article
    if (data.id) {
      const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("articles")
        .select("id, author_id, is_published, is_breaking")
        .eq("id", data.id)
        .single();
      if (fetchErr || !existing) throw new Error("الخبر غير موجود");

      const canEditAny = hasPerm(roles, "edit_any_article");
      const canEditOwn = hasPerm(roles, "edit_own_article") && existing.author_id === userId;
      if (!canEditAny && !canEditOwn) throw new Error("ليس لديك صلاحية تعديل هذا الخبر");

      const canPublish = hasPerm(roles, "publish_article");
      const canBreaking = hasPerm(roles, "mark_breaking");

      const slug = (data.slug && data.slug.trim()) || slugify(data.title) || `article-${Date.now()}`;
      if (data.cover_image) {
        const coverKey = data.cover_image.split("?")[0];
        const { data: dup } = await supabaseAdmin
          .from("articles")
          .select("id, title")
          .ilike("cover_image", `${coverKey}%`)
          .neq("id", data.id)
          .limit(1)
          .maybeSingle();
        if (dup) throw new Error(`صورة الغلاف مستخدمة بالفعل في مقال آخر: "${dup.title}". يرجى اختيار صورة مختلفة.`);
      }

      const payload: any = {
        title: data.title,
        slug,
        excerpt: data.excerpt ?? null,
        content: data.content ?? null,
        cover_image: data.cover_image ?? null,
        category_id: data.category_id ?? null,
        author_name: data.author_name ?? null,
        source: data.source ?? "القاهرة الكبرى",
        source_url: data.source_url ?? null,
        // Force-keep current value if user lacks permission
        is_published: canPublish ? data.is_published : existing.is_published,
        is_breaking: canBreaking ? data.is_breaking : existing.is_breaking,
      };

      const { data: row, error } = await supabaseAdmin
        .from("articles").update(payload).eq("id", data.id).select(ARTICLE_SELECT).single();
      if (error) throw new Error(error.message);
      return row;
    }

    // Creating new article
    if (!hasPerm(roles, "create_article")) throw new Error("ليس لديك صلاحية إنشاء خبر");
    const canPublish = hasPerm(roles, "publish_article");
    const canBreaking = hasPerm(roles, "mark_breaking");

    const slug = (data.slug && data.slug.trim()) || slugify(data.title) || `article-${Date.now()}`;
    if (data.cover_image) {
      const coverKey = data.cover_image.split("?")[0];
      const { data: dup } = await supabaseAdmin
        .from("articles")
        .select("id, title")
        .ilike("cover_image", `${coverKey}%`)
        .limit(1)
        .maybeSingle();
      if (dup) throw new Error(`صورة الغلاف مستخدمة بالفعل في مقال آخر: "${dup.title}". يرجى اختيار صورة مختلفة.`);
    }
    const payload = {
      title: data.title,
      slug,
      excerpt: data.excerpt ?? null,
      content: data.content ?? null,
      cover_image: data.cover_image ?? null,
      category_id: data.category_id ?? null,
      author_id: userId,
      author_name: data.author_name ?? null,
      source: data.source ?? "القاهرة الكبرى",
      source_url: data.source_url ?? null,
      // Journalists can only create drafts; non-chief cannot set breaking
      is_published: canPublish ? data.is_published : false,
      is_breaking: canBreaking ? data.is_breaking : false,
      published_at: new Date().toISOString(),
    };
    const { data: row, error } = await supabaseAdmin
      .from("articles").insert(payload).select(ARTICLE_SELECT).single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requirePerm(context.userId, "delete_article");
    const { error } = await supabaseAdmin.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListArticles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ q: z.string().optional(), limit: z.number().default(50) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const roles = await getUserRoles(context.userId);
    if (!hasPerm(roles, "view_admin")) throw new Error("ليس لديك صلاحية");
    let q = supabaseAdmin
      .from("articles")
      .select(ARTICLE_SELECT)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    // Journalist sees only their own articles
    if (!hasPerm(roles, "edit_any_article")) {
      q = q.eq("author_id", context.userId);
    }
    if (data.q) {
      const term = `%${data.q}%`;
      q = q.or(`title.ilike.${term},slug.ilike.${term}`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminGetArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const roles = await getUserRoles(context.userId);
    if (!hasPerm(roles, "view_admin")) throw new Error("ليس لديك صلاحية");
    const { data: row, error } = await supabaseAdmin
      .from("articles").select(ARTICLE_SELECT).eq("id", data.id).single();
    if (error) throw new Error(error.message);
    // Journalist can only open own
    if (!hasPerm(roles, "edit_any_article") && row.author_id !== context.userId) {
      throw new Error("ليس لديك صلاحية");
    }
    return row;
  });

export const getCurrentUserRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getUserRoles(context.userId);
    return { roles, userId: context.userId };
  });

// Find articles sharing the same cover_image (duplicates)
export const findDuplicateCovers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getUserRoles(context.userId);
    if (!hasPerm(roles, "view_admin")) throw new Error("ليس لديك صلاحية");

    const { data: rows, error } = await supabaseAdmin
      .from("articles")
      .select("id, title, slug, cover_image, published_at")
      .not("cover_image", "is", null)
      .order("published_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const groups = new Map<string, { id: string; title: string; slug: string; published_at: string }[]>();
    for (const r of rows ?? []) {
      const key = (r.cover_image || "").split("?")[0];
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ id: r.id, title: r.title, slug: r.slug, published_at: r.published_at });
    }
    const duplicates = Array.from(groups.entries())
      .filter(([, list]) => list.length > 1)
      .map(([cover, articles]) => ({ cover, articles }));
    return { duplicates, totalGroups: duplicates.length };
  });
