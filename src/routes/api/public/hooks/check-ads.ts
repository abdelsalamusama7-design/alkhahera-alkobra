/**
 * نقطة نهاية عامة يستدعيها pg_cron يوميًا لفحص صحة الإعلانات.
 * الحماية: تتطلب apikey في الـ header (المفتاح العام للمشروع).
 */
import { createFileRoute } from "@tanstack/react-router";
import { runAdHealthCheck } from "@/lib/ad-health.server";

export const Route = createFileRoute("/api/public/hooks/check-ads")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") || request.headers.get("x-api-key");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!apikey || !expected || apikey !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        try {
          const result = await runAdHealthCheck();
          return new Response(JSON.stringify({ ok: true, ...result }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          console.error("check-ads error:", e);
          return new Response(JSON.stringify({ ok: false, error: e?.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      GET: async () =>
        new Response(JSON.stringify({ info: "POST with apikey header to run check" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    },
  },
});
