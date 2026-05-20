import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { slugify } from "@/lib/format";

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

    // bump view count (best effort)
    await supabaseAdmin
      .from("articles")
      .update({ view_count: (row.view_count ?? 0) + 1 })
      .eq("id", row.id);

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
  const [{ data: hero }, { data: latest }, { data: breaking }, { data: mostRead }] =
    await Promise.all([
      supabaseAdmin
        .from("articles")
        .select(ARTICLE_SELECT)
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3),
      supabaseAdmin
        .from("articles")
        .select(ARTICLE_SELECT)
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .range(3, 14),
      supabaseAdmin
        .from("articles")
        .select("id,slug,title")
        .eq("is_published", true)
        .eq("is_breaking", true)
        .order("published_at", { ascending: false })
        .limit(8),
      supabaseAdmin
        .from("articles")
        .select(ARTICLE_SELECT)
        .eq("is_published", true)
        .order("view_count", { ascending: false })
        .limit(5),
    ]);
  return {
    hero: hero ?? [],
    latest: latest ?? [],
    breaking: breaking ?? [],
    mostRead: mostRead ?? [],
  };
});

// ADMIN: upsert article
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

async function ensureEditor(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r) => r.role);
  if (!roles.includes("admin") && !roles.includes("editor")) {
    throw new Error("ليس لديك صلاحية");
  }
}

export const saveArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => articleInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await ensureEditor(context.userId);
    const slug = (data.slug && data.slug.trim()) || slugify(data.title) || `article-${Date.now()}`;
    const payload = {
      title: data.title,
      slug,
      excerpt: data.excerpt ?? null,
      content: data.content ?? null,
      cover_image: data.cover_image ?? null,
      category_id: data.category_id ?? null,
      author_id: context.userId,
      author_name: data.author_name ?? null,
      source: data.source ?? "القاهرة الكبرى",
      source_url: data.source_url ?? null,
      is_breaking: data.is_breaking,
      is_published: data.is_published,
    };
    if (data.id) {
      const { data: row, error } = await supabaseAdmin
        .from("articles")
        .update(payload)
        .eq("id", data.id)
        .select(ARTICLE_SELECT)
        .single();
      if (error) throw new Error(error.message);
      return row;
    } else {
      const { data: row, error } = await supabaseAdmin
        .from("articles")
        .insert({ ...payload, published_at: new Date().toISOString() })
        .select(ARTICLE_SELECT)
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureEditor(context.userId);
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
    await ensureEditor(context.userId);
    let q = supabaseAdmin
      .from("articles")
      .select(ARTICLE_SELECT)
      .order("created_at", { ascending: false })
      .limit(data.limit);
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
    await ensureEditor(context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getCurrentUserRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { roles: (data ?? []).map((r) => r.role as "admin" | "editor"), userId: context.userId };
  });
