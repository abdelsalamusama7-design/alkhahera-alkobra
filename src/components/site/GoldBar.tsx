import { useQuery } from "@tanstack/react-query";
import { getGoldPrices } from "@/lib/gold.functions";

function fmt(n: number) {
  return new Intl.NumberFormat("ar-EG").format(n);
}

export function GoldBar() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["gold-prices"],
    queryFn: () => getGoldPrices(),
    refetchInterval: 60 * 60_000,
    staleTime: 30 * 60_000,
  });

  if (isLoading || isError || !data) return null;

  const items: { k: string; v: number; unit: string }[] = [
    { k: "عيار 24", v: data.gram24, unit: "ج.م/جرام" },
    { k: "عيار 21", v: data.gram21, unit: "ج.م/جرام" },
    { k: "عيار 18", v: data.gram18, unit: "ج.م/جرام" },
    { k: "الأونصة", v: data.ounce, unit: "ج.م" },
    { k: "الجنيه الذهب", v: data.pound, unit: "ج.م" },
    { k: "نصف الجنيه", v: data.halfPound, unit: "ج.م" },
    { k: "ربع الجنيه", v: data.quarterPound, unit: "ج.م" },
    { k: "سبيكة 50ج", v: data.ingot50, unit: "ج.م" },
    { k: "سبيكة 100ج", v: data.ingot100, unit: "ج.م" },
  ].filter((x) => x.v > 0);

  return (
    <div className="bg-gradient-to-l from-gold/20 via-gold/10 to-transparent border-y border-gold/40" dir="rtl">
      <div className="container mx-auto px-4 py-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span className="font-extrabold text-gold flex items-center gap-1 shrink-0">
          <span aria-hidden>🪙</span> أسعار الذهب اليوم
        </span>
        {items.map((it) => (
          <span key={it.k} className="font-bold text-primary whitespace-nowrap">
            {it.k}: <span className="text-gold">{fmt(it.v)}</span>
            <span className="text-muted-foreground text-xs mr-1">{it.unit}</span>
          </span>
        ))}
        {typeof data.chp === "number" && (
          <span className={`text-xs font-bold ${data.chp >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {data.chp >= 0 ? "▲" : "▼"} {Math.abs(data.chp).toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
}

