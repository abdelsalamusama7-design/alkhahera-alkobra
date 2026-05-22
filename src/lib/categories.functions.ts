import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hasPerm } from "@/lib/permissions";

async function ensureCatPerm(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as string);
  if (!hasPerm(roles, "manage_categories")) throw new Error("ليس لديك صلاحية");
}

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
    sort_order: z.number().int().default(0),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureCatPerm(context.userId);
    if (data.id) {
      const { error } = await supabaseAdmin.from("categories").update({
        name: data.name, slug: data.slug, sort_order: data.sort_order,
      }).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("categories").insert({
        name: data.name, slug: data.slug, sort_order: data.sort_order,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureCatPerm(context.userId);
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
