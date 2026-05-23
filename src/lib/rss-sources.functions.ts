import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { hasPerm } from "@/lib/permissions";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as string);
  if (!hasPerm(roles, "ingest_rss")) throw new Error("ليس لديك صلاحية");
}

export const listRssSources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("rss_sources")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const sourceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  url: z.string().url().max(1000),
  category_slug: z.string().min(1).max(80),
  source_label: z.string().min(1).max(120),
  enabled: z.boolean(),
  auto_publish: z.boolean(),
  max_items: z.number().int().min(1).max(50),
  sort_order: z.number().int().min(0).max(100000),
});

export const upsertRssSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => sourceSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.id) {
      const { error } = await supabaseAdmin.from("rss_sources").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await supabaseAdmin.from("rss_sources").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteRssSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("rss_sources").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleRssSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      field: z.enum(["enabled", "auto_publish"]),
      value: z.boolean(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("rss_sources")
      .update({ [data.field]: data.value })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderRssSources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ items: z.array(z.object({ id: z.string().uuid(), sort_order: z.number().int() })).max(500) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    for (const it of data.items) {
      await supabaseAdmin.from("rss_sources").update({ sort_order: it.sort_order }).eq("id", it.id);
    }
    return { ok: true };
  });
