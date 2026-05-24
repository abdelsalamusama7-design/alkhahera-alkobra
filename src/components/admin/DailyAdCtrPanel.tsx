import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3 } from "lucide-react";
import { getDailyAdStatsFn } from "@/lib/ad-placements.functions";

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

/**
 * يعرض ملخص يومي (CTR%, ظهور, نقرات) لكل إعلان في اليوم الحالي.
 * يتجدد كل دقيقة.
 */
export function DailyAdCtrPanel({ compact = false }: { compact?: boolean }) {
  const fn = useServerFn(getDailyAdStatsFn);
  const { data = [], isLoading } = useQuery({
    queryKey: ["ad-stats-daily"],
    queryFn: () => fn(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const today = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const rows = [...data].sort((a, b) => b.impressions - a.impressions);
  const totals = rows.reduce(
    (acc, r) => {
      acc.impressions += r.impressions;
      acc.clicks += r.clicks;
      return acc;
    },
    { impressions: 0, clicks: 0 }
  );
  const totalCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

  return (
    <section className={`bg-card border border-border rounded-lg ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-primary" />
          <h2 className="font-bold text-base">CTR اليوم لكل إعلان</h2>
        </div>
        <div className="text-[11px] text-muted-foreground">{today}</div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <Mini label="ظهور اليوم" value={totals.impressions.toLocaleString("ar-EG")} />
        <Mini label="نقرات اليوم" value={totals.clicks.toLocaleString("ar-EG")} />
        <Mini label="CTR إجمالي اليوم" value={`${totalCtr.toFixed(2)}%`} highlight />
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">جارٍ التحميل…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">لا توجد بيانات لليوم بعد.</p>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs">
            <thead className="text-muted-foreground">
              <tr className="text-right">
                <th className="px-2 py-1.5 font-medium">الإعلان</th>
                <th className="px-2 py-1.5 font-medium">المكان</th>
                <th className="px-2 py-1.5 font-medium">ظهور</th>
                <th className="px-2 py-1.5 font-medium">نقرات</th>
                <th className="px-2 py-1.5 font-medium">CTR%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="px-2 py-1.5 font-medium text-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${r.enabled ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                      <span className="line-clamp-1">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground">
                    {SLOT_LABEL[r.slot] ?? r.slot}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {r.impressions.toLocaleString("ar-EG")}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {r.clicks.toLocaleString("ar-EG")}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums font-bold text-primary">
                    {r.ctr.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Mini({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-muted/40 rounded p-2">
      <div className="text-[10px] text-muted-foreground mb-0.5">{label}</div>
      <div className={`text-sm font-extrabold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
