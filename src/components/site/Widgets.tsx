import { TrendingUp, TrendingDown, Cloud, Sun, BarChart3, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMarkets } from "@/lib/markets.functions";

type Row = { name: string; value: string; change: string; up: boolean };

function Section({ title, icon, rows, isLoading }: { title: string; icon: React.ReactNode; rows: Row[]; isLoading: boolean }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between">
        <h3 className="font-extrabold text-sm flex items-center gap-2">{icon}{title}</h3>
        {isLoading ? <RefreshCw size={14} className="animate-spin text-gold" /> : <span className="text-[10px] text-gold font-bold">مباشر</span>}
      </div>
      <ul className="divide-y divide-border">
        {rows.length === 0 && (
          <li className="px-4 py-3 text-xs text-muted-foreground text-center">جارٍ تحميل البيانات...</li>
        )}
        {rows.map((m) => (
          <li key={m.name} className="px-4 py-2.5 flex items-center justify-between text-sm">
            <span className="font-semibold text-primary">{m.name}</span>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-primary">{m.value}</span>
              <span className={`flex items-center gap-1 text-xs font-bold w-20 justify-end ${m.up ? "text-emerald-600" : "text-breaking"}`}>
                {m.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {m.change}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketsWidget() {
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["markets"],
    queryFn: () => getMarkets(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const fx = data?.fx ?? [];
  const stocks = data?.stocks ?? [];
  const updated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="space-y-4">
      <Section title="العملات والذهب" icon={<TrendingUp size={16} className="text-gold" />} rows={fx} isLoading={isLoading} />
      <Section title="البورصة والأسهم" icon={<BarChart3 size={16} className="text-gold" />} rows={stocks} isLoading={isLoading} />
      {updated && (
        <div className="text-[10px] text-muted-foreground text-center">آخر تحديث: {updated} — يتم التحديث تلقائيًا كل دقيقة</div>
      )}
    </div>
  );
}

export function WeatherWidget() {
  const hours = [
    { h: "10 ص", t: 23, icon: Sun },
    { h: "9 ص", t: 23, icon: Sun },
    { h: "8 ص", t: 22, icon: Sun },
    { h: "7 ص", t: 21, icon: Cloud },
    { h: "6 ص", t: 21, icon: Cloud },
  ];
  return (
    <div className="bg-gradient-to-br from-primary to-blue-900 text-white rounded-lg p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs opacity-80">القاهرة الكبرى — مصر</div>
        <Sun className="text-gold" size={20} />
      </div>
      <div className="flex items-end gap-2 mb-3">
        <div className="text-5xl font-extrabold">21°</div>
        <div className="text-sm opacity-80 mb-2">صافي / شروق 5:58 ص</div>
      </div>
      <div className="flex justify-between border-t border-white/20 pt-3">
        {hours.map((h) => {
          const Icon = h.icon;
          return (
            <div key={h.h} className="text-center text-xs">
              <div className="opacity-80 mb-1">{h.h}</div>
              <Icon size={18} className="mx-auto text-gold" />
              <div className="font-bold mt-1">{h.t}°</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SportsWidget() {
  const matches = [
    { home: "تشيلسي", away: "توتنهام", score: "2 - 1", date: "النهائي • 19 مايو" },
    { home: "بورنموث", away: "مانشستر سيتي", score: "1 - 1", date: "النهائي • 19 مايو" },
    { home: "كريستال بالاس", away: "أرسنال", score: "6:00 م", date: "24 مايو" },
  ];
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between">
        <h3 className="font-extrabold text-sm">الدوري الإنجليزي الممتاز</h3>
        <span className="text-gold text-xs font-bold">PL</span>
      </div>
      <ul className="divide-y divide-border">
        {matches.map((m, i) => (
          <li key={i} className="px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-primary">{m.home}</span>
              <span className="font-mono font-extrabold text-gold mx-3">{m.score}</span>
              <span className="font-bold text-primary">{m.away}</span>
            </div>
            <div className="text-[11px] text-muted-foreground text-center mt-1">{m.date}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
