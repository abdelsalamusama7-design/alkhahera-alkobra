import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getAdStatsRangeFn } from "@/lib/ad-placements.functions";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, BarChart, Bar,
} from "recharts";
import { BarChart3, Eye, MousePointerClick, Percent } from "lucide-react";

export const Route = createFileRoute("/admin/ad-stats")({
  head: () => ({ meta: [{ title: "إحصاءات الإعلانات اليومية — لوحة التحكم" }] }),
  component: AdStatsPage,
});

const SLOT_LABEL: Record<string, string> = {
  "home-top": "الرئيسية — أعلى",
  "home-middle": "الرئيسية — منتصف",
  "home-bottom": "الرئيسية — أسفل",
  "article-top": "المقال — أعلى",
  "article-middle": "المقال — منتصف",
  "article-bottom": "المقال — أسفل",
  sidebar: "الشريط الجانبي",
  header: "أعلى الموقع",
  footer: "أسفل الموقع",
};

// لوحة ألوان ثابتة عبر الرسم
const COLORS = [
  "hsl(220 90% 56%)",
  "hsl(160 70% 45%)",
  "hsl(30 90% 55%)",
  "hsl(340 80% 58%)",
  "hsl(270 70% 60%)",
  "hsl(190 80% 45%)",
  "hsl(50 90% 50%)",
  "hsl(0 75% 60%)",
  "hsl(120 50% 45%)",
  "hsl(290 60% 50%)",
];

function formatDay(d: string) {
  // d = "YYYY-MM-DD"
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

function AdStatsPage() {
  const [days, setDays] = useState(14);
  const [metric, setMetric] = useState<"impressions" | "clicks">("impressions");

  const fn = useServerFn(getAdStatsRangeFn);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ad-stats-range", days],
    queryFn: () => fn({ data: { days } }),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  // يبني صف لكل يوم: { day, totalImp, totalClicks, [placementName]: value }
  const timelineRows = useMemo(() => {
    if (!data) return [];
    return data.days.map((d) => {
      const row: Record<string, any> = {
        day: formatDay(d),
        rawDay: d,
        totalImp: 0,
        totalClicks: 0,
      };
      let imp = 0;
      let clk = 0;
      for (const s of data.series) {
        const p = s.points.find((pt) => pt.day === d);
        row[`${s.name}__imp`] = p?.impressions ?? 0;
        row[`${s.name}__clk`] = p?.clicks ?? 0;
        row[s.name] = metric === "impressions" ? (p?.impressions ?? 0) : (p?.clicks ?? 0);
        imp += p?.impressions ?? 0;
        clk += p?.clicks ?? 0;
      }
      row.totalImp = imp;
      row.totalClicks = clk;
      return row;
    });
  }, [data, metric]);

  const grandTotals = useMemo(() => {
    if (!data) return { impressions: 0, clicks: 0, ctr: 0 };
    const t = data.series.reduce(
      (a, s) => ({
        impressions: a.impressions + s.totals.impressions,
        clicks: a.clicks + s.totals.clicks,
      }),
      { impressions: 0, clicks: 0 }
    );
    return {
      ...t,
      ctr: t.impressions > 0 ? (t.clicks / t.impressions) * 100 : 0,
    };
  }, [data]);

  const sortedSeries = useMemo(() => {
    if (!data) return [];
    return [...data.series].sort((a, b) => b.totals.impressions - a.totals.impressions);
  }, [data]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <BarChart3 size={22} /> إحصاءات الإعلانات اليومية
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            عرض ظهورات/نقرات كل مكان (placement) عبر آخر فترة، مع مخطط زمني واضح وCTR.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={String(days)} onValueChange={(v) => setDays(+v)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">آخر 7 أيام</SelectItem>
              <SelectItem value="14">آخر 14 يوم</SelectItem>
              <SelectItem value="30">آخر 30 يوم</SelectItem>
              <SelectItem value="60">آخر 60 يوم</SelectItem>
              <SelectItem value="90">آخر 90 يوم</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded border border-border overflow-hidden">
            <Button
              size="sm"
              variant={metric === "impressions" ? "default" : "ghost"}
              className="rounded-none"
              onClick={() => setMetric("impressions")}
            >
              <Eye size={14} className="ml-1" /> ظهور
            </Button>
            <Button
              size="sm"
              variant={metric === "clicks" ? "default" : "ghost"}
              className="rounded-none"
              onClick={() => setMetric("clicks")}
            >
              <MousePointerClick size={14} className="ml-1" /> نقرات
            </Button>
          </div>
        </div>
      </div>

      {/* ملخص الفترة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<Eye size={16} />} label={`ظهور (${days}ي)`} value={grandTotals.impressions.toLocaleString("ar-EG")} />
        <Stat icon={<MousePointerClick size={16} />} label={`نقرات (${days}ي)`} value={grandTotals.clicks.toLocaleString("ar-EG")} />
        <Stat icon={<Percent size={16} />} label="CTR إجمالي" value={`${grandTotals.ctr.toFixed(2)}%`} highlight />
        <Stat icon={<BarChart3 size={16} />} label="إعلانات نشطة بالبيانات" value={String(sortedSeries.length)} />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>}
      {isError && <p className="text-sm text-destructive">تعذّر تحميل البيانات.</p>}

      {data && (
        <>
          {/* مخطط زمني إجمالي */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h2 className="font-bold mb-3">المخطط الزمني الإجمالي</h2>
            <div className="h-[280px] w-full">
              <ResponsiveContainer>
                <LineChart data={timelineRows} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} reversed />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: any, name) => [Number(v).toLocaleString("ar-EG"), name === "totalImp" ? "ظهور" : "نقرات"]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => v === "totalImp" ? "ظهور" : "نقرات"} />
                  <Line type="monotone" dataKey="totalImp" stroke="hsl(220 90% 56%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="totalClicks" stroke="hsl(340 80% 58%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* مخطط زمني لكل placement */}
          <section className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h2 className="font-bold">{metric === "impressions" ? "الظهورات" : "النقرات"} لكل إعلان عبر الزمن</h2>
              <div className="text-[11px] text-muted-foreground">{sortedSeries.length} إعلان</div>
            </div>
            {sortedSeries.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">لا توجد بيانات في هذه الفترة.</p>
            ) : (
              <div className="h-[340px] w-full">
                <ResponsiveContainer>
                  <LineChart data={timelineRows} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} reversed />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: any) => Number(v).toLocaleString("ar-EG")}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {sortedSeries.slice(0, 10).map((s, i) => (
                      <Line
                        key={s.id}
                        type="monotone"
                        dataKey={s.name}
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {sortedSeries.length > 10 && (
              <p className="text-[11px] text-muted-foreground mt-2 text-center">
                عرض أعلى 10 إعلانات حسب الظهور — الجدول بالأسفل يعرض الكل.
              </p>
            )}
          </section>

          {/* مقارنة بين الـ placements */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h2 className="font-bold mb-3">إجمالي {metric === "impressions" ? "الظهور" : "النقرات"} لكل إعلان ({days} يوم)</h2>
            {sortedSeries.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">لا توجد بيانات.</p>
            ) : (
              <div className="h-[max(220px,calc(36px*var(--n)))] w-full" style={{ ["--n" as any]: sortedSeries.length }}>
                <ResponsiveContainer>
                  <BarChart
                    layout="vertical"
                    data={sortedSeries.map((s, i) => ({
                      name: s.name,
                      value: metric === "impressions" ? s.totals.impressions : s.totals.clicks,
                      fill: COLORS[i % COLORS.length],
                    }))}
                    margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: any) => Number(v).toLocaleString("ar-EG")}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* جدول تفصيلي */}
          <section className="bg-card border border-border rounded-lg p-4">
            <h2 className="font-bold mb-3">تفاصيل لكل إعلان</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="text-right">
                    <th className="px-2 py-2 font-medium">الإعلان</th>
                    <th className="px-2 py-2 font-medium">المكان</th>
                    <th className="px-2 py-2 font-medium">ظهور</th>
                    <th className="px-2 py-2 font-medium">نقرات</th>
                    <th className="px-2 py-2 font-medium">CTR%</th>
                    <th className="px-2 py-2 font-medium">متوسط ظهور/يوم</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSeries.map((s, i) => (
                    <tr key={s.id} className="border-t border-border/60">
                      <td className="px-2 py-2 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="line-clamp-1">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">{SLOT_LABEL[s.slot] ?? s.slot}</td>
                      <td className="px-2 py-2 tabular-nums">{s.totals.impressions.toLocaleString("ar-EG")}</td>
                      <td className="px-2 py-2 tabular-nums">{s.totals.clicks.toLocaleString("ar-EG")}</td>
                      <td className="px-2 py-2 tabular-nums font-bold text-primary">{s.ctr.toFixed(2)}%</td>
                      <td className="px-2 py-2 tabular-nums text-muted-foreground">
                        {(s.totals.impressions / days).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-xl font-extrabold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
