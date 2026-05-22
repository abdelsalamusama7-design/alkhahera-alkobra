import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getArticleStats } from "@/lib/traffic.functions";
import { getSourceLabelAr, getDeviceLabelAr } from "@/lib/analytics-labels";
import { BarChart3, Eye, TrendingUp, TrendingDown, Globe, Smartphone, Link2 } from "lucide-react";

export const Route = createFileRoute("/admin/article-stats/$slug")({
  head: () => ({ meta: [{ title: "إحصائيات المقال — لوحة التحكم" }] }),
  component: ArticleStatsPage,
});

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max === 0 ? 0 : (value / max) * 100;
  return <div className="flex-1 bg-muted rounded h-2 overflow-hidden"><div className={color} style={{ width: `${w}%`, height: "100%" }} /></div>;
}

function ArticleStatsPage() {
  const { slug } = Route.useParams();
  const fetchStats = useServerFn(getArticleStats);
  const { data, isLoading, error } = useQuery({
    queryKey: ["article-stats", slug],
    queryFn: () => fetchStats({ data: { slug } }),
    refetchInterval: 60_000,
  });

  if (isLoading) return <div className="text-center py-10" dir="rtl">جارٍ التحميل...</div>;
  if (error) return <div className="text-center py-10 text-breaking" dir="rtl">{(error as Error).message}</div>;
  if (!data) return null;

  const maxDay = Math.max(1, ...data.daily.map((d) => d.views));
  const totalSources = Math.max(1, data.sources.reduce((s, x) => s + x.count, 0));
  const trendUp = data.trend.deltaPct >= 0;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <BarChart3 className="text-gold shrink-0" />
          <h1 className="text-xl font-extrabold text-primary truncate">{data.article.title}</h1>
        </div>
        <Link to="/article/$slug" params={{ slug: data.article.slug }} className="text-xs text-gold hover:underline whitespace-nowrap">عرض المقال ←</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground">آخر 30 يوم</div>
          <div className="text-2xl font-extrabold text-indigo-600 flex items-center gap-2">
            <Eye size={20} /> {data.totals.views30d}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground">إجمالي المشاهدات</div>
          <div className="text-2xl font-extrabold text-primary">{data.totals.viewsAllTime}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground">دول مختلفة</div>
          <div className="text-2xl font-extrabold text-emerald-600 flex items-center gap-2"><Globe size={20} /> {data.totals.uniqueCountries}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground">الاتجاه (30 يوم مقابل السابقة)</div>
          <div className={`text-2xl font-extrabold flex items-center gap-2 ${trendUp ? "text-emerald-600" : "text-breaking"}`}>
            {trendUp ? <TrendingUp size={20} /> : <TrendingDown size={20} />} {data.trend.deltaPct}%
          </div>
        </div>
      </div>

      {/* Daily chart */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-primary text-primary-foreground px-4 py-2 font-extrabold text-sm flex items-center gap-2">
          <TrendingUp size={14} /> المشاهدات اليومية — آخر 30 يوم
        </div>
        <div className="p-4">
          <div className="flex items-end gap-1 h-48">
            {data.daily.map((d) => {
              const h = (d.views / maxDay) * 100;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1 group" title={`${d.date}: ${d.views}`}>
                  <div className="text-[9px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100">{d.views}</div>
                  <div className="w-full bg-indigo-500 rounded-t" style={{ height: `${h}%`, minHeight: d.views > 0 ? "2px" : 0 }} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-2">
            <span>{data.daily[0]?.date}</span>
            <span>{data.daily[data.daily.length - 1]?.date}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top referrers */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-primary text-primary-foreground px-4 py-2 font-extrabold text-sm flex items-center gap-2">
            <Link2 size={14} /> أهم المواقع المُحيلة
          </div>
          <ol className="divide-y divide-border">
            {data.topReferrers.map((r) => (
              <li key={r.host} className="px-4 py-2 flex items-center gap-3 text-sm">
                <span className="flex-1 truncate font-bold text-primary">{r.host}</span>
                <Bar value={r.count} max={data.topReferrers[0]?.count ?? 1} color="bg-gold" />
                <span className="font-mono font-bold w-10 text-left">{r.count}</span>
              </li>
            ))}
            {data.topReferrers.length === 0 && <li className="px-4 py-6 text-center text-muted-foreground text-sm">لا توجد إحالات بعد</li>}
          </ol>
        </div>

        {/* Sources */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-primary text-primary-foreground px-4 py-2 font-extrabold text-sm">مصادر الزيارات</div>
          <ul className="divide-y divide-border">
            {data.sources.map((s) => (
              <li key={s.key} className="px-4 py-2 flex items-center gap-3 text-sm">
                <span className="flex-1 font-bold text-primary">{getSourceLabelAr(s.key)}</span>
                <Bar value={s.count} max={totalSources} color="bg-indigo-500" />
                <span className="font-mono font-bold w-10 text-left">{s.count}</span>
                <span className="text-xs text-muted-foreground w-12 text-left">{Math.round((s.count / totalSources) * 100)}%</span>
              </li>
            ))}
            {data.sources.length === 0 && <li className="px-4 py-6 text-center text-muted-foreground text-sm">لا يوجد بيانات</li>}
          </ul>
        </div>

        {/* Countries */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-primary text-primary-foreground px-4 py-2 font-extrabold text-sm flex items-center gap-2">
            <Globe size={14} /> الزوار حسب البلد
          </div>
          <ul className="divide-y divide-border">
            {data.countries.map((c) => (
              <li key={c.key} className="px-4 py-2 flex items-center gap-3 text-sm">
                <span className="font-mono font-bold w-10 text-primary">{c.key}</span>
                <Bar value={c.count} max={data.countries[0]?.count ?? 1} color="bg-emerald-500" />
                <span className="font-mono font-bold w-10 text-left">{c.count}</span>
              </li>
            ))}
            {data.countries.length === 0 && <li className="px-4 py-6 text-center text-muted-foreground text-sm">لا يوجد بيانات</li>}
          </ul>
        </div>

        {/* Devices */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-primary text-primary-foreground px-4 py-2 font-extrabold text-sm flex items-center gap-2">
            <Smartphone size={14} /> الأجهزة
          </div>
          <ul className="divide-y divide-border">
            {data.devices.map((d) => (
              <li key={d.key} className="px-4 py-2 flex items-center gap-3 text-sm">
                <span className="flex-1 font-bold text-primary">{getDeviceLabelAr(d.key)}</span>
                <Bar value={d.count} max={data.devices[0]?.count ?? 1} color="bg-amber-500" />
                <span className="font-mono font-bold w-10 text-left">{d.count}</span>
              </li>
            ))}
            {data.devices.length === 0 && <li className="px-4 py-6 text-center text-muted-foreground text-sm">لا يوجد بيانات</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
