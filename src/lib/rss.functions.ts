import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ingestAllFeeds } from "./rss.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { hasPerm } from "@/lib/permissions";

export const adminIngestRss = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (data ?? []).map((r) => r.role as string);
    if (!hasPerm(roles, "ingest_rss")) {
      throw new Error("ليس لديك صلاحية");
    }
    return ingestAllFeeds();
  });
