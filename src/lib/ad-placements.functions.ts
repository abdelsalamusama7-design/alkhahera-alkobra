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

/**
 * تسجيل ظهور/نقرة لإعلان — يستدعى من المتصفح (بدون auth).
 * يحدّث العدّاد الإجمالي + عدّاد اليوم في جدول ad_events_daily.
 */
export const trackAdEventFn = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      kind: z.enum(["impression", "click"]),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const column = data.kind === "click" ? "clicks" : "impressions";
    // (1) العدّاد الإجمالي (lifetime) على ad_placements
    const { data: row } = await supabaseAdmin
      .from("ad_placements")
      .select(column)
      .eq("id", data.id)
      .single();
    const current = Number((row as any)?.[column] ?? 0);
    const patch: any = { [column]: current + 1 };
    await supabaseAdmin.from("ad_placements").update(patch).eq("id", data.id);

    // (2) عدّاد اليوم (per-day) — upsert ذرّي
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
    const { data: dayRow } = await supabaseAdmin
      .from("ad_events_daily")
      .select(column)
      .eq("placement_id", data.id)
      .eq("day", today)
      .maybeSingle();
    const dayCur = Number((dayRow as any)?.[column] ?? 0);
    await supabaseAdmin
      .from("ad_events_daily")
      .upsert({
        placement_id: data.id,
        day: today,
        [column]: dayCur + 1,
        updated_at: new Date().toISOString(),
      } as any);
    return { ok: true };
  });

/** ملخص يومي لكل إعلان (اليوم الحالي UTC) — للإدمن. */
export const getDailyAdStatsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data: daily, error } = await supabaseAdmin
      .from("ad_events_daily")
      .select("placement_id, impressions, clicks")
      .eq("day", today);
    if (error) throw new Error(error.message);
    const { data: placements } = await supabaseAdmin
      .from("ad_placements")
      .select("id,name,slot,enabled");
    const map = new Map<string, { impressions: number; clicks: number }>();
    for (const r of daily ?? []) {
      map.set(r.placement_id as string, {
        impressions: Number((r as any).impressions ?? 0),
        clicks: Number((r as any).clicks ?? 0),
      });
    }
    return (placements ?? []).map((p: any) => {
      const s = map.get(p.id) ?? { impressions: 0, clicks: 0 };
      const ctr = s.impressions > 0 ? (s.clicks / s.impressions) * 100 : 0;
      return {
        id: p.id,
        name: p.name,
        slot: p.slot,
        enabled: p.enabled,
        impressions: s.impressions,
        clicks: s.clicks,
        ctr,
      };
    });
  });

/** تصفير عدّادات إعلان واحد أو كلها. */
export const resetAdCountersFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid().optional() }).parse(input)
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin.from("ad_placements").update({ impressions: 0, clicks: 0 });
    q = data.id ? q.eq("id", data.id) : q.neq("id", "00000000-0000-0000-0000-000000000000");
    const { error } = await q;
    if (error) throw new Error(error.message);
    // امسح كمان عدّادات اليوم
    let dq = supabaseAdmin.from("ad_events_daily").delete();
    dq = data.id
      ? dq.eq("placement_id", data.id)
      : dq.neq("placement_id", "00000000-0000-0000-0000-000000000000");
    await dq;
    return { ok: true };
  });

