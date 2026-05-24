import { useQuery } from "@tanstack/react-query";
import { getGoldPrices } from "@/lib/gold.functions";
import { useEffect, useRef, useState } from "react";

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

  const [flashChp, setFlashChp] = useState(false);
  const prevChp = useRef<number | null>(null);

  useEffect(() => {
    if (data && typeof data.chp === "number" && prevChp.current !== null && prevChp.current !== data.chp) {
      setFlashChp(true);
      const t = setTimeout(() => setFlashChp(false), 2000);
      return () => clearTimeout(t);
    }
    if (data && typeof data.chp === "number") {
      prevChp.current = data.chp;
    }
  }, [data?.chp]);

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

  const chpVal = typeof data.chp === "number" ? data.chp : 1;
  const chpPositive = chpVal >= 1;
  const chpNegative = chpVal <= -1;
  const chpColor = chpPositive ? "text-emerald-600" : chpNegative ? "text-red-600" : "text-muted-foreground";

  const row = (
    <div className="flex items-center gap-x-8 shrink-0 pl-8">
      {items.map((it, idx) => (
        <span key={`${it.k}-${idx}`} className="font-bold text-primary whitespace-nowrap text-sm">
          {it.k}: <span className="text-gold">{fmt(it.v)}</span>
          <span className="text-muted-foreground text-xs mr-1">{it.unit}</span>
        </span>
      ))}
      {typeof data.chp === "number" && (
        <span className={`text-xs font-bold whitespace-nowrap inline-block rounded px-1 ${chpColor} ${flashChp ? "chp-flash" : ""}`}>
          {chpPositive ? "▲" : chpNegative ? "▼" : "●"} {Math.abs(data.chp).toFixed(2)}%
        </span>
      )}
    </div>
  );

  return (
    <div className="bg-gradient-to-l from-gold/20 via-gold/10 to-transparent border-y border-gold/40 overflow-hidden marquee-pause" dir="rtl">
      <div className="container mx-auto px-4 py-2 flex items-center gap-3">
        <span className="font-extrabold text-gold flex items-center gap-1 shrink-0 text-sm border-l border-gold/40 pl-3">
          <span aria-hidden>🪙</span> أسعار الذهب اليوم
        </span>
        <div className="flex-1 overflow-hidden relative">
          <div className="flex animate-marquee-rtl w-max" dir="ltr">
            <div dir="rtl">{row}</div>
            <div dir="rtl" aria-hidden>{row}</div>
          </div>
        </div>
      </div>
    </div>
  );
}


