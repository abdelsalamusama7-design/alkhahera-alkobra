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

const DONUT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

function Donut({ data, size = 96 }: { data: { label: string; value: number }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="text-xs text-muted-foreground">لا يوجد بيانات</div>;
  const r = size / 2 - 6;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={c} cy={c} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={10} />
      {data.map((d, i) => {
        const frac = d.value / total;
        const dash = frac * circ;
        const el = (
          <circle key={i} cx={c} cy={c} r={r} fill="none"
            stroke={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth={10}
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset}
            transform={`rotate(-90 ${c} ${c})`}>
            <title>{`${d.label}: ${d.value} (${Math.round(frac * 100)}%)`}</title>
          </circle>
        );
        offset += dash;
        return el;
      })}
      <text x={c} y={c} textAnchor="middle" dominantBaseline="central" className="fill-primary font-extrabold text-sm">{total}</text>
    </svg>
  );
}

function DistroTable({ rows, total, colorClass, labelHeader }: { rows: { key: string; label: string; count: number }[]; total: number; colorClass: string; labelHeader: string }) {
  if (rows.length === 0) return <div className="px-4 py-6 text-center text-muted-foreground text-sm">لا يوجد بيانات</div>;
  return (
    <div className="flex items-center gap-4 p-4">
      <Donut data={rows.map((r) => ({ label: r.label, value: r.count }))} />
      <table className="flex-1 text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground border-b border-border">
            <th className="text-right py-1 font-bold">{labelHeader}</th>
            <th className="text-left py-1 font-bold w-12">العدد</th>
            <th className="text-left py-1 font-bold w-12">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.key} className="border-b border-border/50 last:border-0">
              <td className="py-1.5 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                <span className="font-bold text-primary truncate">{r.label}</span>
              </td>
              <td className="py-1.5 text-left font-mono font-bold">{r.count}</td>
              <td className="py-1.5 text-left text-xs text-muted-foreground">{Math.round((r.count / Math.max(1, total)) * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
          <DistroTable
            rows={data.sources.map((s) => ({ key: s.key, label: getSourceLabelAr(s.key), count: s.count }))}
            total={totalSources}
            colorClass="bg-indigo-500"
            labelHeader="المصدر"
          />
        </div>

        {/* Countries */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-primary text-primary-foreground px-4 py-2 font-extrabold text-sm flex items-center gap-2">
            <Globe size={14} /> الزوار حسب البلد
          </div>
          <DistroTable
            rows={data.countries.map((c) => ({ key: c.key, label: c.key, count: c.count }))}
            total={Math.max(1, data.countries.reduce((s, x) => s + x.count, 0))}
            colorClass="bg-emerald-500"
            labelHeader="البلد"
          />
        </div>

        {/* Devices */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-primary text-primary-foreground px-4 py-2 font-extrabold text-sm flex items-center gap-2">
            <Smartphone size={14} /> الأجهزة
          </div>
          <DistroTable
            rows={data.devices.map((d) => ({ key: d.key, label: getDeviceLabelAr(d.key), count: d.count }))}
            total={Math.max(1, data.devices.reduce((s, x) => s + x.count, 0))}
            colorClass="bg-amber-500"
            labelHeader="الجهاز"
          />
        </div>
      </div>
    </div>
  );
}
