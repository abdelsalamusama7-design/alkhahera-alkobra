import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, ExternalLink, Search } from "lucide-react";
import { getSeoLastmodOverview } from "@/lib/seo-overview.functions";

export const Route = createFileRoute("/admin/seo-lastmod")({
  head: () => ({
    meta: [
      { title: "آخر تحديث (lastmod) — القاهرة الكبرى" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SeoLastmodPage,
});

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function relative(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  if (d < 30) return `منذ ${d} يوم`;
  const mo = Math.floor(d / 30);
  return `منذ ${mo} شهر`;
}

function SeoLastmodPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["seo-lastmod-overview"],
    queryFn: () => getSeoLastmodOverview(),
  });
  const [q, setQ] = useState("");

  const filteredArticles = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    const list = term
      ? data.articles.filter(
          (a) =>
            a.title.toLowerCase().includes(term) ||
            a.slug.toLowerCase().includes(term) ||
            (a.category_name ?? "").toLowerCase().includes(term),
        )
      : data.articles;
    return list.slice(0, 200);
  }, [data, q]);

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-primary">آخر تحديث (lastmod) للمقالات والتصنيفات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            القيم اللي بيستخدمها Google لتحديد تكرار الزحف من sitemap.xml.
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isFetching} variant="outline">
          {isFetching ? <Loader2 className="ml-2 animate-spin" size={14} /> : <RefreshCw className="ml-2" size={14} />}
          تحديث
        </Button>
      </div>

      {isLoading && (
        <div className="bg-card border border-border rounded-lg p-6 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin" size={18} /> جارٍ التحميل ...
        </div>
      )}

      {data && (
        <>
          {/* بطاقات ملخص */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="إجمالي المقالات" value={String(data.totals.articles)} />
            <Stat label="المقالات المنشورة" value={String(data.totals.publishedArticles)} />
            <Stat label="عدد التصنيفات" value={String(data.totals.categories)} />
            <Stat label="أحدث lastmod" value={relative(data.siteLastmod)} hint={formatDate(data.siteLastmod)} />
          </div>

          {/* جدول التصنيفات */}
          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <header className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-extrabold text-primary">التصنيفات</h2>
              <span className="text-xs text-muted-foreground">{data.categories.length} تصنيف</span>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-right p-3">التصنيف</th>
                    <th className="text-right p-3">عدد المقالات</th>
                    <th className="text-right p-3">آخر تحديث</th>
                    <th className="text-right p-3">منذ</th>
                    <th className="text-right p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.categories.map((c) => (
                    <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-3 font-bold">{c.name}</td>
                      <td className="p-3">{c.article_count}</td>
                      <td className="p-3 font-mono text-xs">{formatDate(c.lastmod)}</td>
                      <td className="p-3 text-muted-foreground">{relative(c.lastmod)}</td>
                      <td className="p-3">
                        <a
                          href={`${data.baseUrl}/category/${c.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-gold inline-flex items-center gap-1 text-xs"
                        >
                          فتح <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {data.categories.length === 0 && (
                    <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">لا توجد تصنيفات</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* جدول المقالات */}
          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <header className="px-4 py-3 border-b border-border flex items-center justify-between gap-2 flex-wrap">
              <h2 className="font-extrabold text-primary">المقالات</h2>
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ابحث بالعنوان أو slug أو التصنيف..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pr-8 h-9"
                />
              </div>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-right p-3">العنوان</th>
                    <th className="text-right p-3">التصنيف</th>
                    <th className="text-right p-3">آخر تحديث</th>
                    <th className="text-right p-3">منذ</th>
                    <th className="text-right p-3">الحالة</th>
                    <th className="text-right p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map((a) => (
                    <tr key={a.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-3 font-bold max-w-md truncate" title={a.title}>{a.title}</td>
                      <td className="p-3">{a.category_name ?? "—"}</td>
                      <td className="p-3 font-mono text-xs">{formatDate(a.lastmod)}</td>
                      <td className="p-3 text-muted-foreground">{relative(a.lastmod)}</td>
                      <td className="p-3">
                        {a.is_published ? (
                          <span className="text-[11px] bg-green-100 text-green-800 px-2 py-0.5 rounded">منشور</span>
                        ) : (
                          <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded">مسودة</span>
                        )}
                      </td>
                      <td className="p-3">
                        <a
                          href={`${data.baseUrl}/article/${a.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-gold inline-flex items-center gap-1 text-xs"
                        >
                          فتح <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {filteredArticles.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">لا نتائج</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {data.articles.length > 200 && !q && (
              <div className="p-3 text-center text-xs text-muted-foreground bg-muted/30 border-t border-border">
                يتم عرض أحدث 200 مقال. استخدم البحث للوصول للباقي.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-xl font-extrabold text-primary">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1 font-mono truncate" title={hint}>{hint}</div>}
    </div>
  );
}
