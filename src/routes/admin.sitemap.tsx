import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { checkSitemap } from "@/lib/sitemap-check.functions";

export const Route = createFileRoute("/admin/sitemap")({
  head: () => ({
    meta: [
      { title: "اختبار Sitemap — القاهرة الكبرى" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SitemapCheckPage,
});

function SitemapCheckPage() {
  const mutation = useMutation({
    mutationFn: () => checkSitemap(),
  });

  useEffect(() => {
    mutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const result = mutation.data;
  const isLoading = mutation.isPending;
  const gscUrl = `https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent("https://kaheraalkobra.online/")}`;

  return (
    <div dir="rtl" className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold text-primary">اختبار Sitemap</h1>
        <Button onClick={() => mutation.mutate()} disabled={isLoading} variant="outline">
          {isLoading ? <Loader2 className="ml-2 animate-spin" size={14} /> : <RefreshCw className="ml-2" size={14} />}
          إعادة الفحص
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="animate-spin" size={18} />
            جارٍ فحص ملف sitemap.xml ...
          </div>
        )}

        {!isLoading && result && (
          <>
            <div className={`flex items-start gap-3 mb-4 p-4 rounded-lg ${result.ok ? "bg-green-50 border border-green-300 text-green-900" : "bg-destructive/10 border border-destructive/40 text-destructive"}`}>
              {result.ok ? <CheckCircle2 size={22} className="shrink-0 mt-0.5" /> : <XCircle size={22} className="shrink-0 mt-0.5" />}
              <div>
                <div className="font-bold mb-1">{result.ok ? "ناجح" : "فشل"}</div>
                <div className="text-sm leading-relaxed">{result.message}</div>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Field label="الرابط" value={result.url} mono />
              <Field label="حالة HTTP" value={String(result.status || "—")} />
              <Field label="نوع المحتوى" value={(result as any).contentType || "—"} mono />
              <Field label="عدد الروابط" value={String((result as any).urlCount ?? "—")} />
              <Field label="زمن الاستجابة" value={`${result.elapsedMs} ms`} />
            </dl>

            <div className="flex flex-wrap gap-2 mt-5">
              <a href={result.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm"><ExternalLink size={14} className="ml-1" /> فتح sitemap.xml</Button>
              </a>
              <a href={gscUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm"><ExternalLink size={14} className="ml-1" /> فتح Google Search Console</Button>
              </a>
            </div>

            {result.ok && (
              <div className="mt-5 text-xs text-muted-foreground bg-muted/50 rounded p-3 leading-relaxed">
                <b>خطوة الإرسال اليدوي:</b> افتح Google Search Console ← Sitemaps ← أدخل <code className="bg-background px-1 rounded">sitemap.xml</code> ثم اضغط "إرسال". Google ميعدش يدعم الإرسال التلقائي (Ping API تم إيقافه) فلازم الإرسال يتم مرة واحدة يدوياً ثم هيُعاد فحصه دورياً.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border border-border rounded p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-sm font-medium break-all ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
