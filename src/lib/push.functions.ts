import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendPushToAll, type PushPayload } from "@/lib/push.server";

const SubSchema = z.object({
  endpoint: z.string().url().min(1).max(2000),
  p256dh: z.string().min(1).max(500),
  auth: z.string().min(1).max(200),
  user_agent: z.string().max(500).optional(),
});

export const subscribePush = createServerFn({ method: "POST" })
  .inputValidator((input) => SubSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        {
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
          user_agent: data.user_agent ?? null,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      );
    if (error) return { success: false, error: error.message };
    return { success: true };
  });

const SendSchema = z.object({
  title: z.string().min(1).max(150),
  body: z.string().max(300).optional(),
  url: z.string().max(500).optional(),
  image: z.string().max(800).optional(),
  tag: z.string().max(100).optional(),
});

export const sendBreakingPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SendSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) return { success: false, error: "ليس لديك صلاحية" };

    try {
      const res = await sendPushToAll(data as PushPayload);
      return { success: true, ...res };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const getPushStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) return { count: 0, configured: false };
    const { count } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true });
    return {
      count: count ?? 0,
      configured: !!process.env.VAPID_PRIVATE_KEY,
    };
  });
