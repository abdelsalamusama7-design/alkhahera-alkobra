import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SITEMAP_URL = "https://kaheraalkobra.online/sitemap.xml";

async function runCheck(source: string) {
  const started = Date.now();
  let status = "ok";
  let http_status: number | null = null;
  let content_type: string | null = null;
  let url_count: number | null = null;
  let image_count: number | null = null;
  let latest_lastmod: string | null = null;
  let error: string | null = null;

  try {
    const res = await fetch(SITEMAP_URL, { headers: { "User-Agent": "LovableSitemapChecker/1.0" } });
    http_status = res.status;
    content_type = res.headers.get("content-type");
    const body = await res.text();

    if (!res.ok) {
      status = "error";
      error = `HTTP ${res.status}`;
    } else if (!content_type || !/xml/i.test(content_type)) {
      status = "warn";
      error = `Content-Type غير صالح: ${content_type ?? "غير محدد"}`;
    }

    const urlMatches = body.match(/<url>/g);
    url_count = urlMatches ? urlMatches.length : 0;
    const imgMatches = body.match(/<image:image>/g);
    image_count = imgMatches ? imgMatches.length : 0;

    const lastmods = Array.from(body.matchAll(/<lastmod>([^<]+)<\/lastmod>/g))
      .map((m) => new Date(m[1]).getTime())
      .filter((t) => !isNaN(t));
    if (lastmods.length) {
      latest_lastmod = new Date(Math.max(...lastmods)).toISOString();
    }

    if (status === "ok" && url_count === 0) {
      status = "warn";
      error = "لا توجد روابط <url> في الـ sitemap";
    }

    if (!body.includes("<urlset") && !body.includes("<sitemapindex")) {
      status = "error";
      error = "XML غير سليم: لا يحتوي <urlset> أو <sitemapindex>";
    }
  } catch (e: any) {
    status = "error";
    error = e?.message ?? "فشل الطلب";
  }

  const duration_ms = Date.now() - started;
  const { data, error: insErr } = await supabaseAdmin
    .from("sitemap_checks")
    .insert({ status, http_status, content_type, url_count, image_count, latest_lastmod, duration_ms, error, source })
    .select()
    .single();

  if (insErr) console.error("sitemap_checks insert error", insErr);

  return { status, http_status, content_type, url_count, image_count, latest_lastmod, duration_ms, error, id: data?.id };
}

export const Route = createFileRoute("/api/public/hooks/sitemap-check")({
  server: {
    handlers: {
      GET: async () => {
        const result = await runCheck("manual");
        return Response.json(result);
      },
      POST: async ({ request }) => {
        let source = "cron";
        try {
          const body = await request.json().catch(() => ({}));
          if (body?.source) source = String(body.source);
        } catch {}
        const result = await runCheck(source);
        return Response.json(result);
      },
    },
  },
});
