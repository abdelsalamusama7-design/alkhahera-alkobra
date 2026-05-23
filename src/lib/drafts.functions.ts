import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { hasPerm } from "@/lib/permissions";
import { z } from "zod";

async function assertEditor(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as string);
  if (!hasPerm(roles, "publish_article") && !hasPerm(roles, "ingest_rss")) {
    throw new Error("ليس لديك صلاحية");
  }
}

export const listDrafts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ status: z.enum(["pending", "approved", "rejected"]).default("pending") }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    const { data: rows, error } = await supabaseAdmin
      .from("article_drafts")
      .select("*")
      .eq("status", data.status)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const countPendingDrafts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertEditor(context.userId);
    const { count } = await supabaseAdmin
      .from("article_drafts")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    return { count: count ?? 0 };
  });

const editSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(280),
  excerpt: z.string().max(600).optional(),
  content: z.string().max(20000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  cover_image: z.string().url().optional().nullable(),
});

export const updateDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => editSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("article_drafts").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const approveDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    const { data: draft, error: e1 } = await supabaseAdmin
      .from("article_drafts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!draft) throw new Error("المسودة غير موجودة");
    if (draft.status !== "pending") throw new Error("المسودة سبق مراجعتها");

    // generate slug
    const base = (draft.title || "article").toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
    const suffix = Math.random().toString(36).slice(2, 8);
    const slug = `${base}-${suffix}`;

    const { data: inserted, error: e2 } = await supabaseAdmin.from("articles").insert({
      title: draft.title,
      slug,
      excerpt: draft.excerpt,
      content: draft.content,
      cover_image: draft.cover_image,
      category_id: draft.category_id,
      source: draft.source,
      source_url: draft.source_url,
      is_published: true,
      is_breaking: false,
      published_at: draft.published_at,
      tags: draft.tags ?? [],
    }).select("id").single();
    if (e2) throw new Error(e2.message);

    await supabaseAdmin
      .from("article_drafts")
      .update({ status: "approved", approved_article_id: inserted.id })
      .eq("id", data.id);
    return { ok: true, article_id: inserted.id, slug };
  });

export const rejectDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), reason: z.string().max(300).optional() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    const { error } = await supabaseAdmin
      .from("article_drafts")
      .update({ status: "rejected", rejected_reason: data.reason ?? null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    const { error } = await supabaseAdmin.from("article_drafts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
