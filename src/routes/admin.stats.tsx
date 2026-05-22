import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublishStats } from "@/lib/stats.functions";
import { BarChart3, FileText, CheckCircle2, FileEdit, Zap, Users, Eye, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/stats")({
  head: () => ({ meta: [{ title: "إحصائيات النشر — لوحة التحكم" }] }),
  component: StatsPage,
});

function fmt(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return d;
  }
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
      <div className={`${color} text-white rounded-lg p-2.5`}>{icon}</div>
      <div>
        <div className="text-2xl font-extrabold text-primary">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function StatsPage() {
  const fetchStats = useServerFn(getPublishStats);
  const { data, isLoading, error } = useQuery({
    queryKey: ["publish-stats"],
    queryFn: () => fetchStats(),
    refetchInterval: 60_000,
  });

  if (isLoading) return <div className="text-center py-10">جارٍ التحميل...</div>;
  if (error) return <div className="text-center py-10 text-breaking">{(error as Error).message}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-2">
        <BarChart3 className="text-gold" />
        <h1 className="text-xl font-extrabold text-primary">إحصائيات النشر</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatCard icon={<Eye size={20} />} label="إجمالي المشاهدات" value={data.totals.views} color="bg-indigo-600" />
        <StatCard icon={<FileText size={20} />} label="إجمالي المقالات" value={data.totals.articles} color="bg-primary" />
        <StatCard icon={<CheckCircle2 size={20} />} label="منشورة" value={data.totals.published} color="bg-emerald-600" />
        <StatCard icon={<FileEdit size={20} />} label="مسودات" value={data.totals.drafts} color="bg-amber-600" />
        <StatCard icon={<Zap size={20} />} label="عاجل" value={data.totals.breaking} color="bg-breaking" />
        <StatCard icon={<Users size={20} />} label="ناشرون" value={data.totals.authors} color="bg-gold" />
      </div>

      {/* Traffic chart — last 14 days */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-primary text-primary-foreground px-4 py-2 font-extrabold text-sm flex items-center gap-2">
          <TrendingUp size={14} /> حركة الزوار خلال آخر 14 يوم
        </div>
        <div className="p-4">
          {(() => {
            const maxViews = Math.max(1, ...data.daily.map((d) => d.views));
            const maxArticles = Math.max(1, ...data.daily.map((d) => d.articles));
            return (
              <div className="flex items-end gap-2 h-48">
                {data.daily.map((d) => {
                  const vh = (d.views / maxViews) * 100;
                  const ah = (d.articles / maxArticles) * 60;
                  const day = new Date(d.date).toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100">{d.views}</div>
                      <div className="w-full flex flex-col items-center justify-end h-full">
                        <div className="w-full bg-indigo-500 rounded-t" style={{ height: `${vh}%` }} title={`${d.views} مشاهدة`} />
                        <div className="w-full bg-gold" style={{ height: `${ah}%` }} title={`${d.articles} مقال`} />
                      </div>
                      <div className="text-[9px] text-muted-foreground whitespace-nowrap">{day}</div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <div className="flex items-center justify-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-indigo-500 inline-block rounded" /> مشاهدات</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gold inline-block rounded" /> مقالات منشورة</span>
          </div>
        </div>
      </div>

      {/* Top articles by views */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-primary text-primary-foreground px-4 py-2 font-extrabold text-sm flex items-center gap-2">
          <Eye size={14} /> الأكثر مشاهدة
        </div>
        <ol className="divide-y divide-border">
          {data.topArticles.map((a, i) => (
            <li key={a.id} className="px-4 py-2.5 flex items-center gap-3">
              <span className="text-gold font-extrabold w-6">{i + 1}</span>
              <Link to="/admin/article-stats/$slug" params={{ slug: a.slug }} className="flex-1 font-bold text-primary hover:text-gold truncate" title="عرض إحصائيات المقال">
                {a.title}
              </Link>
              <span className="text-xs text-muted-foreground hidden sm:inline">{a.author_name ?? "—"}</span>
              <span className="font-mono font-bold text-indigo-600 flex items-center gap-1">
                <Eye size={12} /> {a.view_count}
              </span>
            </li>
          ))}
          {data.topArticles.length === 0 && (
            <li className="px-4 py-6 text-center text-muted-foreground text-sm">لا يوجد بيانات بعد</li>
          )}
        </ol>
      </div>


      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-primary text-primary-foreground px-4 py-2 font-extrabold text-sm">
          الناشرون ({data.authors.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="px-3 py-2 text-right">الاسم</th>
                <th className="px-3 py-2 text-right">البريد</th>
                <th className="px-3 py-2 text-center">الإجمالي</th>
                <th className="px-3 py-2 text-center">منشور</th>
                <th className="px-3 py-2 text-center">مسودة</th>
                <th className="px-3 py-2 text-center">عاجل</th>
                <th className="px-3 py-2 text-center">مشاهدات</th>
                <th className="px-3 py-2 text-right">آخر نشر</th>
                <th className="px-3 py-2 text-right">أول نشر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.authors.map((a, i) => (
                <tr key={(a.author_id ?? "n") + i} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-bold text-primary">
                    {a.author_id ? (
                      <Link to="/admin/users/$id" params={{ id: a.author_id }} className="hover:text-gold">
                        {a.author_name}
                      </Link>
                    ) : (
                      a.author_name
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{a.email ?? "—"}</td>
                  <td className="px-3 py-2 text-center font-mono font-bold">{a.total}</td>
                  <td className="px-3 py-2 text-center font-mono text-emerald-600">{a.published}</td>
                  <td className="px-3 py-2 text-center font-mono text-amber-600">{a.drafts}</td>
                  <td className="px-3 py-2 text-center font-mono text-breaking">{a.breaking}</td>
                  <td className="px-3 py-2 text-center font-mono text-indigo-600">{a.views}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{fmt(a.last_published_at)}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{fmt(a.first_published_at)}</td>
                </tr>
              ))}
              {data.authors.length === 0 && (
                <tr><td colSpan={9} className="text-center py-6 text-muted-foreground">لا يوجد بيانات</td></tr>
              )}

            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-primary text-primary-foreground px-4 py-2 font-extrabold text-sm">
          آخر 50 مقالة
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="px-3 py-2 text-right">العنوان</th>
                <th className="px-3 py-2 text-right">الكاتب</th>
                <th className="px-3 py-2 text-center">الحالة</th>
                <th className="px-3 py-2 text-right">تاريخ النشر</th>
                <th className="px-3 py-2 text-right">تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.recent.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-bold text-primary max-w-md truncate">
                    <Link to="/article/$slug" params={{ slug: a.slug }} className="hover:text-gold">
                      {a.is_breaking && <span className="text-breaking ml-1">⚡</span>}
                      {a.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {a.author_id ? (
                      <Link to="/admin/users/$id" params={{ id: a.author_id }} className="hover:text-gold">
                        {a.author_name ?? "—"}
                      </Link>
                    ) : (
                      a.author_name ?? "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {a.is_published ? (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">منشور</span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">مسودة</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{fmt(a.published_at)}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{fmt(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
