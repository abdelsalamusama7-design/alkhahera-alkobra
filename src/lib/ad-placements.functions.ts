/**
 * Server functions لإدارة الإعلانات في قاعدة البيانات.
 * - getActivePlacementsFn: قراءة عامة للإعلانات المفعّلة (تستخدمها AdSlot).
 * - listAllPlacementsFn / upsertPlacementFn / deletePlacementFn: للإدمن.
 * - checkAdsNowFn: تشغيل فحص الصحة يدويًا.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAdHealthCheck } from "./ad-health.server";

export type AdSlotKey =
  | "home-top" | "home-middle" | "home-bottom"
  | "article-top" | "article-middle" | "article-bottom"
  | "sidebar" | "header" | "footer";

export type AdPlacementType =
  | "smartlink-banner" | "smartlink-context" | "smartlink-download"
  | "adsterra-banner" | "monetag-zone" | "custom-html";

export type AdPlacementRow = {
  id: string;
  name: string;
  slot: AdSlotKey;
  type: AdPlacementType;
  enabled: boolean;
  order_index: number;
  is_fallback: boolean;
  config: Record<string, any>;
  health_status: "ok" | "failed" | "unknown";
  fail_count: number;
  last_checked_at: string | null;
  last_error: string | null;
  impressions?: number;
  clicks?: number;
};

const placementSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  slot: z.string().min(1).max(50),
  type: z.string().min(1).max(50),
  enabled: z.boolean(),
  order_index: z.number().int(),
  is_fallback: z.boolean().optional(),
  config: z.record(z.any()).default({}),
});

/** قراءة عامة — لا تتطلب auth، تُستخدم من AdSlot في الصفحات العامة. */
export const getActivePlacementsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("ad_placements")
    .select("id,name,slot,type,enabled,order_index,is_fallback,config,health_status")
    .eq("enabled", true)
    .order("order_index", { ascending: true });
  if (error) {
    console.error("getActivePlacementsFn error:", error);
    return [] as AdPlacementRow[];
  }
  return (data ?? []) as AdPlacementRow[];
});

/** قائمة كاملة للإدمن. */
export const listAllPlacementsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("ad_placements")
      .select("*")
      .order("slot", { ascending: true })
      .order("order_index", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as AdPlacementRow[];
  });

export const upsertPlacementFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => placementSchema.parse(input))
  .handler(async ({ data }) => {
    const row = {
      ...data,
      is_fallback: data.is_fallback ?? false,
    };
    const { data: out, error } = await supabaseAdmin
      .from("ad_placements")
      .upsert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return out as AdPlacementRow;
  });

export const deletePlacementFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("ad_placements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** تشغيل فحص الإعلانات يدويًا من لوحة التحكم. */
export const checkAdsNowFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const result = await runAdHealthCheck();
    return result;
  });

/** قراءة آخر سجلات الفحص للإدمن. */
export const getHealthLogFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("ad_health_log")
      .select("id,placement_id,status,http_status,error,checked_at")
      .order("checked_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
