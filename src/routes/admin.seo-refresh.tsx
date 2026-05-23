import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ExternalLink, Loader2, Zap, Info } from "lucide-react";
import { refreshSearchConsole } from "@/lib/seo-overview.functions";

export const Route = createFileRoute("/admin/seo-refresh")({
  head: () => ({
    meta: [
      { title: "تحديث Google Search Console — القاهرة الكبرى" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SeoRefreshPage,
});

function SeoRefreshPage() {
  const mutation = useMutation({
    mutationFn: () => refreshSearchConsole(),
  });
  const result = mutation.data;
  const isLoading = mutation.isPending;

  return (
    <div dir="rtl" className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-primary">تحديث المعلومات لجوجل</h1>
        <p className="text-sm text-muted-foreground mt-1">
          اضغط الزر لإعادة بناء sitemap.xml وrobots.txt على السيرفر وفحصهما، ثم افتح Google Search Console مباشرة لإرسال آخر تحديث.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <Button
          onClick={() => mutation.mutate()}
          disabled={isLoading}
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-base font-extrabold"
        >
          {isLoading ? (
            <><Loader2 className="ml-2 animate-spin" size={18} /> جارٍ التحديث ...</>
          ) : (
            <><Zap className="ml-2" size={18} /> ابدأ التحديث الآن</>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          العملية بتاخد ثوانٍ قليلة وبتعيد التحقق من ملفات SEO المنشورة.
        </p>
      </div>

      {result && (
        <>
          <div
            className={`flex items-start gap-3 p-4 rounded-lg ${
              result.ok
                ? "bg-green-50 border border-green-300 text-green-900"
                : "bg-destructive/10 border border-destructive/40 text-destructive"
            }`}
          >
            {result.ok ? <CheckCircle2 size={22} className="shrink-0 mt-0.5" /> : <XCircle size={22} className="shrink-0 mt-0.5" />}
            <div className="text-sm">
              <div className="font-bold mb-1">
                {result.ok ? "تم التحديث بنجاح" : "في خطوة فشلت — راجع التفاصيل"}
              </div>
              <div>
                {result.urlCount} رابط في sitemap • آخر lastmod: {result.siteLastmod ?? "—"} • زمن العملية {result.elapsedMs}ms
              </div>
            </div>
          </div>

          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <header className="px-4 py-3 border-b border-border">
              <h2 className="font-extrabold text-primary">خطوات التحديث</h2>
            </header>
            <ul className="divide-y divide-border">
              {result.steps.map((s, i) => (
                <li key={i} className="p-4 flex items-start gap-3">
                  {s.ok ? (
                    <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={18} className="text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-bold text-sm">{s.name}</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h2 className="font-extrabold text-primary">الخطوة الأخيرة — أرسل لجوجل</h2>
            <p className="text-xs text-muted-foreground leading-relaxed flex gap-2">
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>
                Google أوقف Ping API. الإرسال يتم بضغطة في Search Console، وبعد كده Google بيعيد فحص الـ sitemap تلقائياً كل فترة بناءً على lastmod.
              </span>
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a href={result.gscSitemapsUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm">
                  <ExternalLink size={14} className="ml-1" /> فتح GSC — Sitemaps
                </Button>
              </a>
              <a href={result.gscInspectionUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  <ExternalLink size={14} className="ml-1" /> فحص الصفحة الرئيسية
                </Button>
              </a>
              <a href={result.sitemapUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  <ExternalLink size={14} className="ml-1" /> عرض sitemap.xml
                </Button>
              </a>
              <a href={result.robotsUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  <ExternalLink size={14} className="ml-1" /> عرض robots.txt
                </Button>
              </a>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
