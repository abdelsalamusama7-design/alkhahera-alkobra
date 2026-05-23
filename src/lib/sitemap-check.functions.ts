import { createServerFn } from "@tanstack/react-start";

export const checkSitemap = createServerFn({ method: "GET" }).handler(async () => {
  const url = "https://kaheraalkobra.online/sitemap.xml";
  const startedAt = Date.now();
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Lovable-Sitemap-Check/1.0" } });
    const text = await res.text();
    const elapsedMs = Date.now() - startedAt;

    if (!res.ok) {
      return {
        ok: false,
        url,
        status: res.status,
        elapsedMs,
        message: `الرد من الخادم HTTP ${res.status}. تأكد أن الموقع منشور وأن المسار /sitemap.xml يعمل.`,
      };
    }

    const contentType = res.headers.get("content-type") || "";
    const looksXml = text.trim().startsWith("<?xml");
    const hasUrlset = text.includes("<urlset");
    const urlMatches = text.match(/<loc>/g);
    const urlCount = urlMatches ? urlMatches.length : 0;

    if (!looksXml || !hasUrlset) {
      return {
        ok: false,
        url,
        status: res.status,
        elapsedMs,
        contentType,
        urlCount,
        message: "المحتوى المُسترجَع لا يبدو ملف XML صالحاً. تأكد أن /sitemap.xml يُرجِع XML وليس صفحة HTML.",
      };
    }

    if (urlCount === 0) {
      return {
        ok: false,
        url,
        status: res.status,
        elapsedMs,
        contentType,
        urlCount,
        message: "الملف فاضي بدون أي روابط <loc>. تحقق من توليد المحتوى داخل sitemap.",
      };
    }

    return {
      ok: true,
      url,
      status: res.status,
      elapsedMs,
      contentType,
      urlCount,
      message: `تم التحقق بنجاح: ${urlCount} رابط داخل sitemap.xml وجاهز للإرسال إلى Google Search Console.`,
    };
  } catch (err: any) {
    return {
      ok: false,
      url,
      status: 0,
      elapsedMs: Date.now() - startedAt,
      message: `فشل الاتصال بالملف: ${err?.message || String(err)}`,
    };
  }
});
