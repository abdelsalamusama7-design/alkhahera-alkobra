/**
 * منطق فحص صحة الإعلانات — server-only.
 * - يفحص كل إعلان فيه URL (monetag-zone، adsterra) عن طريق طلب HEAD/GET.
 * - عند الفشل المتتالي مرتين أو أكثر، يعطّل الإعلان ويفعّل أي إعلان احتياطي في نفس السلوت.
 * - SmartLinks تُعتبر دائمًا "ok" لأنها روابط ثابتة من Monetag بترتد عشوائي.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Row = {
  id: string;
  name: string;
  slot: string;
  type: string;
  enabled: boolean;
  is_fallback: boolean;
  config: Record<string, any>;
  fail_count: number;
};

const FAIL_THRESHOLD = 2;
const TIMEOUT_MS = 8000;

async function pingUrl(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
      if (!res.ok || res.status >= 400) {
        // بعض السيرفرات ما بتدعمش HEAD، جرّب GET
        res = await fetch(url, { method: "GET", signal: controller.signal, redirect: "follow" });
      }
    } finally {
      clearTimeout(t);
    }
    if (res.status >= 200 && res.status < 400) return { ok: true, status: res.status };
    return { ok: false, status: res.status, error: `HTTP ${res.status}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || "network error" };
  }
}

function urlForPlacement(p: Row): string | null {
  if (p.type === "monetag-zone") {
    const src = p.config?.src;
    if (!src) return null;
    return src.startsWith("http") ? src : `https://${src}`;
  }
  if (p.type === "adsterra-banner") {
    const key = p.config?.adKey;
    if (!key) return null;
    return `https://www.profitableratecpm.com/${key}/invoke.js`;
  }
  // SmartLinks وغيرها لا تحتاج فحص URL
  return null;
}

export async function runAdHealthCheck() {
  const started = Date.now();
  const { data: rows, error } = await supabaseAdmin
    .from("ad_placements")
    .select("id,name,slot,type,enabled,is_fallback,config,fail_count");
  if (error) throw new Error(error.message);
  const placements = (rows ?? []) as Row[];

  let checked = 0;
  let failed = 0;
  let disabled = 0;
  let activatedFallbacks = 0;

  for (const p of placements) {
    const url = urlForPlacement(p);
    if (!url) {
      // اعتبر sponsored/smartlinks/custom-html شغّالة دائمًا
      if (p.enabled && !p.is_fallback) {
        await supabaseAdmin
          .from("ad_placements")
          .update({ health_status: "ok", fail_count: 0, last_checked_at: new Date().toISOString(), last_error: null })
          .eq("id", p.id);
      }
      continue;
    }

    checked++;
    const result = await pingUrl(url);

    await supabaseAdmin.from("ad_health_log").insert({
      placement_id: p.id,
      status: result.ok ? "ok" : "failed",
      http_status: result.status ?? null,
      error: result.error ?? null,
    });

    if (result.ok) {
      await supabaseAdmin
        .from("ad_placements")
        .update({
          health_status: "ok",
          fail_count: 0,
          last_checked_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", p.id);
    } else {
      failed++;
      const newFailCount = p.fail_count + 1;
      const shouldDisable = p.enabled && newFailCount >= FAIL_THRESHOLD;
      await supabaseAdmin
        .from("ad_placements")
        .update({
          health_status: "failed",
          fail_count: newFailCount,
          enabled: shouldDisable ? false : p.enabled,
          last_checked_at: new Date().toISOString(),
          last_error: result.error ?? "unknown",
        })
        .eq("id", p.id);

      if (shouldDisable) {
        disabled++;
        // فعّل أي إعلان احتياطي في نفس السلوت لو موجود
        const { data: fallbacks } = await supabaseAdmin
          .from("ad_placements")
          .select("id")
          .eq("slot", p.slot)
          .eq("is_fallback", true)
          .eq("enabled", false)
          .limit(1);
        if (fallbacks && fallbacks.length > 0) {
          await supabaseAdmin
            .from("ad_placements")
            .update({ enabled: true })
            .eq("id", fallbacks[0].id);
          activatedFallbacks++;
        }
      }
    }
  }

  const summary = {
    total: placements.length,
    checked,
    failed,
    disabled,
    activatedFallbacks,
    durationMs: Date.now() - started,
  };
  console.log("Ad health check completed:", summary);
  return summary;
}
