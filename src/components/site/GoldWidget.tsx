import { useQuery } from "@tanstack/react-query";
import { getGoldPrices } from "@/lib/gold.functions";

function fmt(n: number) {
  return new Intl.NumberFormat("ar-EG").format(n);
}

export function GoldWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["gold-prices"],
    queryFn: () => getGoldPrices(),
    refetchInterval: 60 * 60_000,
    staleTime: 30 * 60_000,
  });

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="bg-gradient-to-l from-gold to-gold/70 text-gold-foreground px-4 py-2 font-extrabold flex items-center justify-between">
        <span className="flex items-center gap-2"><span aria-hidden>🪙</span> أسعار الذهب</span>
        {typeof data?.chp === "number" && (
          <span className="text-xs bg-background/30 px-2 py-0.5 rounded-full">
            {data.chp >= 0 ? "▲" : "▼"} {Math.abs(data.chp).toFixed(2)}%
          </span>
        )}
      </div>
      <div className="p-4 space-y-2 text-sm">
        {isLoading || !data ? (
          <div className="text-muted-foreground text-center py-4">جاري التحميل...</div>
        ) : (
          <>
            {[
              { k: "عيار 24", v: data.gram24 },
              { k: "عيار 21", v: data.gram21 },
              { k: "عيار 18", v: data.gram18 },
            ].map((it) => (
              <div key={it.k} className="flex items-center justify-between border-b border-border/50 last:border-0 pb-2 last:pb-0">
                <span className="font-bold text-primary">{it.k}</span>
                <span className="font-extrabold text-gold">
                  {fmt(it.v)} <span className="text-xs text-muted-foreground font-normal">ج.م</span>
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
              <span>الأونصة</span>
              <span>{fmt(data.ounce)} ج.م</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
