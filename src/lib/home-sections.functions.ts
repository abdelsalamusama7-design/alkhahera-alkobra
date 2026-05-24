import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type HomeSectionConfig = {
  key: string;
  title: string;
  enabled: boolean;
  layout: "grid" | "list" | "circles";
  columns: number;
  display_count: number;
  load_more_step: number;
  max_count: number;
  sort_order: number;
};

export type HomeSectionItem = {
  id: string;
  section_key: string;
  kind: "article" | "custom";
  article_id: string | null;
  custom_title: string | null;
  custom_image: string | null;
  custom_url: string | null;
  custom_source: string | null;
  sort_order: number;
  article?: {
    id: string;
    title: string;
    slug: string;
    cover_image: string | null;
    source: string | null;
  } | null;
};

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as string);
  if (!roles.includes("admin")) throw new Error("ليس لديك صلاحية");
}

export const listHomeSections = createServerFn({ method: "GET" }).handler(async () => {
  const { data: sections } = await (supabaseAdmin as any)
    .from("home_sections")
    .select("*")
    .order("sort_order", { ascending: true });
  const { data: items } = await (supabaseAdmin as any)
    .from("home_section_items")
    .select("*, article:articles(id,title,slug,cover_image,source)")
    .order("sort_order", { ascending: true });
  return {
    sections: (sections ?? []) as HomeSectionConfig[],
    items: (items ?? []) as HomeSectionItem[],
  };
});

const sectionSchema = z.object({
  key: z.string().min(1).max(64),
  enabled: z.boolean().optional(),
  layout: z.enum(["grid", "list", "circles"]).optional(),
  columns: z.number().int().min(1).max(8).optional(),
  display_count: z.number().int().min(1).max(60).optional(),
  load_more_step: z.number().int().min(1).max(60).optional(),
  max_count: z.number().int().min(1).max(200).optional(),
});

export const updateHomeSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof sectionSchema>) => sectionSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { key, ...patch } = data;
    const { error } = await (supabaseAdmin as any)
      .from("home_sections")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const itemSchema = z
  .object({
    section_key: z.string().min(1).max(64),
    kind: z.enum(["article", "custom"]),
    article_id: z.string().uuid().nullable().optional(),
    custom_title: z.string().min(1).max(300).nullable().optional(),
    custom_image: z.string().url().max(1000).nullable().optional(),
    custom_url: z.string().url().max(1000).nullable().optional(),
    custom_source: z.string().max(120).nullable().optional(),
    sort_order: z.number().int().min(0).max(9999).optional(),
  })
  .refine(
    (v) =>
      (v.kind === "article" && !!v.article_id) ||
      (v.kind === "custom" && !!v.custom_title),
    { message: "بيانات غير مكتملة" },
  );

export const addHomeSectionItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof itemSchema>) => itemSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await (supabaseAdmin as any)
      .from("home_section_items")
      .insert({
        section_key: data.section_key,
        kind: data.kind,
        article_id: data.article_id ?? null,
        custom_title: data.custom_title ?? null,
        custom_image: data.custom_image ?? null,
        custom_url: data.custom_url ?? null,
        custom_source: data.custom_source ?? null,
        sort_order: data.sort_order ?? 0,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteHomeSectionItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await (supabaseAdmin as any)
      .from("home_section_items")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const searchArticlesForPin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { q?: string }) =>
    z.object({ q: z.string().max(120).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    let query = (supabaseAdmin as any)
      .from("articles")
      .select("id,title,slug,cover_image,source,published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(20);
    if (data.q && data.q.trim()) query = query.ilike("title", `%${data.q.trim()}%`);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { articles: rows ?? [] };
  });
