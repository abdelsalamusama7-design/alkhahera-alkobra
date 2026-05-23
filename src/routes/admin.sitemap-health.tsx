import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, RefreshCw, Activity } from "lucide-react";

export const Route = createFileRoute("/admin/sitemap-health")({
  head: () => ({
    meta: [
      { title: "صحة Sitemap — القاهرة الكبرى" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SitemapHealthPage,
});

type Check = {
  id: string;
  checked_at: string;
  status: string;
  http_status: number | null;
  content_type: string | null;
  url_count: number | null;
  image_count: number | null;
  latest_lastmod: string | null;
  duration_ms: number | null;
  error: string | null;
  source: string;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "ok") return <Badge className="bg-green-600 hover:bg-green-600"><CheckCircle2 size={12} className="ml-1" /> ناجح</Badge>;
  if (status === "warn") return <Badge className="bg-amber-500 hover:bg-amber-500"><AlertTriangle size={12} className="ml-1" /> تحذير</Badge>;
  return <Badge variant="destructive"><XCircle size={12} className="ml-1" /> خطأ</Badge>;
}

function fmt(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("ar-EG"); } catch { return d; }
}

function SitemapHealthPage() {
  const qc = useQueryClient();
  const { data: checks, isLoading } = useQuery({
    queryKey: ["sitemap-checks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sitemap_checks" as any)
        .select("*")
        .order("checked_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as Check[];
    },
    refetchInterval: 60_000,
  });

  const runNow = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/public/hooks/sitemap-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "manual" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sitemap-checks"] }),
  });

  const latest = checks?.[0];

  return (
    <div dir="rtl" className="max-w-5xl space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Activity size={22} /> صحة Sitemap
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            فحص دوري لملف <code>sitemap.xml</code>: حالة HTTP، نوع المحتوى، عدد الروابط، وأحدث lastmod. راجع هنا قبل الإرسال إلى Google Search Console.
          </p>
        </div>
        <Button onClick={() => runNow.mutate()} disabled={runNow.isPending} className="bg-primary text-primary-foreground">
          {runNow.isPending ? <Loader2 size={14} className="ml-1 animate-spin" /> : <RefreshCw size={14} className="ml-1" />}
          تشغيل فحص الآن
        </Button>
      </div>

      {latest && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-lg">آخر فحص</h2>
            <StatusBadge status={latest.status} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="الوقت" value={fmt(latest.checked_at)} />
            <Stat label="HTTP" value={latest.http_status?.toString() ?? "—"} />
            <Stat label="Content-Type" value={latest.content_type ?? "—"} mono />
            <Stat label="المدة" value={latest.duration_ms ? `${latest.duration_ms}ms` : "—"} />
            <Stat label="عدد الروابط" value={latest.url_count?.toString() ?? "—"} />
            <Stat label="عدد الصور" value={latest.image_count?.toString() ?? "—"} />
            <Stat label="أحدث lastmod" value={fmt(latest.latest_lastmod)} />
            <Stat label="المصدر" value={latest.source} />
          </div>
          {latest.error && (
            <div className="mt-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded p-3">
              {latest.error}
            </div>
          )}
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-border font-extrabold">السجل (آخر 50 فحص)</div>
        {isLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>
        ) : !checks?.length ? (
          <div className="p-6 text-center text-sm text-muted-foreground">لا توجد فحوصات بعد — اضغط "تشغيل فحص الآن".</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs">
                <tr>
                  <th className="px-3 py-2 text-right">الوقت</th>
                  <th className="px-3 py-2 text-right">الحالة</th>
                  <th className="px-3 py-2 text-right">HTTP</th>
                  <th className="px-3 py-2 text-right">روابط</th>
                  <th className="px-3 py-2 text-right">صور</th>
                  <th className="px-3 py-2 text-right">أحدث lastmod</th>
                  <th className="px-3 py-2 text-right">المصدر</th>
                  <th className="px-3 py-2 text-right">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-3 py-2 whitespace-nowrap">{fmt(c.checked_at)}</td>
                    <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-2">{c.http_status ?? "—"}</td>
                    <td className="px-3 py-2">{c.url_count ?? "—"}</td>
                    <td className="px-3 py-2">{c.image_count ?? "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmt(c.latest_lastmod)}</td>
                    <td className="px-3 py-2">{c.source}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{c.error ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-muted/30 rounded p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`font-bold ${mono ? "font-mono text-xs break-all" : ""}`}>{value}</div>
    </div>
  );
}
