import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ingestAllFeeds } from "./rss.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const adminIngestRss = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (data ?? []).map((r) => r.role);
    if (!roles.includes("admin") && !roles.includes("editor")) {
      throw new Error("ليس لديك صلاحية");
    }
    return ingestAllFeeds();
  });
