import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import { getMarkets } from "@/lib/markets.functions";

export function MarketsTicker() {
  const { data, isLoading } = useQuery({
    queryKey: ["markets"],
    queryFn: () => getMarkets(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const items = [...(data?.fx ?? []), ...(data?.crypto ?? []), ...(data?.stocks ?? [])];

  return (
    <div className="bg-primary text-primary-foreground border-y border-gold/40">
      <div className="container mx-auto px-4 flex items-stretch">
        <div className="bg-gold text-gold-foreground px-4 py-2 font-extrabold text-sm flex items-center gap-2 shrink-0">
          <DollarSign size={14} />
          الأسواق
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold opacity-80">
            <BarChart3 size={12} /> مباشر
          </span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          {items.length === 0 ? (
            <div className="py-2 text-xs text-center opacity-80">
              {isLoading ? "جارٍ تحميل أسعار العملات والبورصة..." : "تعذّر تحميل بيانات الأسواق الآن"}
            </div>
          ) : (
            <div className="whitespace-nowrap animate-ticker py-2 text-sm font-semibold">
              {[...items, ...items].map((m, i) => (
                <span key={i} className="mx-6 inline-flex items-center gap-2">
                  <span className="text-gold font-bold">{m.name}</span>
                  <span className="font-mono font-extrabold">{m.value}</span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold ${
                      m.up ? "text-emerald-400" : "text-red-300"
                    }`}
                  >
                    {m.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {m.change}
                  </span>
                  <span className="text-gold/50">•</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
