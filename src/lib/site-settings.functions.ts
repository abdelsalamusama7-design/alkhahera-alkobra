import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getSiteSetting = createServerFn({ method: "GET" })
  .inputValidator((input: { key: string }) => z.object({ key: z.string().min(1).max(64) }).parse(input))
  .handler(async ({ data }) => {
    const { data: row } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", data.key)
      .maybeSingle();
    return { value: (row?.value as unknown) ?? null };
  });

export const setSiteSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string; value: unknown }) =>
    z.object({ key: z.string().min(1).max(64), value: z.unknown() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: roleRows } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (roleRows ?? []).map((r) => r.role as string);
    if (!roles.includes("admin")) throw new Error("ليس لديك صلاحية");

    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: data.key, value: data.value as any, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
