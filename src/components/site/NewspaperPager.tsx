import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NewspaperPagerProps {
  pages: { title: string; node: ReactNode }[];
}

/**
 * عرض المحتوى كصفحات جريدة ورقية يمكن تقليبها.
 * يستخدم تحويلات CSS 3D لمحاكاة تقليب الصفحة، مع زاوية مطوية
 * (page curl) دائمة في الزاوية السفلية لتلميح المستخدم بأن الورق يُقلَّب.
 */
export function NewspaperPager({ pages }: NewspaperPagerProps) {
  const [current, setCurrent] = useState(0);
  const [flip, setFlip] = useState<null | { to: number; dir: 1 | -1 }>(null);
  const touchStart = useRef<number | null>(null);
  const total = pages.length;

  // أول مرة فقط: ومضة على الزاوية المطوية لتنبيه المستخدم
  const [hintPulse, setHintPulse] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setHintPulse(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const go = (dir: 1 | -1) => {
    if (flip) return;
    const to = current + dir;
    if (to < 0 || to >= total) return;
    setFlip({ to, dir });
    window.setTimeout(() => {
      setCurrent(to);
      setFlip(null);
    }, 850);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(dx) < 50) return;
    // RTL: السحب لليمين = الصفحة السابقة، لليسار = التالية
    if (dx > 0) go(-1);
    else go(1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(1);
      else if (e.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const next = flip ? pages[flip.to] : null;
  const curr = pages[current];

  return (
    <div
      className="container mx-auto px-2 sm:px-4 py-6"
      dir="rtl"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* شريط التنقل بين الصفحات */}
      <div className="flex items-center justify-between mb-3 bg-card border-2 border-primary/20 rounded-lg px-3 py-2 shadow-md">
        <button
          onClick={() => go(-1)}
          disabled={current === 0 || !!flip}
          className="flex items-center gap-1 text-sm font-bold text-primary hover:text-gold disabled:opacity-30"
          aria-label="الصفحة السابقة"
        >
          <ChevronRight size={18} />
          السابق
        </button>
        <div className="text-center">
          <div className="text-[11px] text-muted-foreground">صفحة</div>
          <div className="text-sm font-extrabold text-primary">
            {current + 1} / {total}
          </div>
          <div className="text-[10px] font-bold text-gold mt-0.5 line-clamp-1 max-w-[180px]">
            {curr.title}
          </div>
        </div>
        <button
          onClick={() => go(1)}
          disabled={current === total - 1 || !!flip}
          className="flex items-center gap-1 text-sm font-bold text-primary hover:text-gold disabled:opacity-30"
          aria-label="الصفحة التالية"
        >
          التالي
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* مؤشر النقاط */}
      <div className="flex items-center justify-center gap-1.5 mb-3">
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (flip || i === current) return;
              setFlip({ to: i, dir: i > current ? 1 : -1 });
              window.setTimeout(() => {
                setCurrent(i);
                setFlip(null);
              }, 850);
            }}
            className={`h-2 rounded-full transition-all ${
              i === current ? "w-6 bg-gold" : "w-2 bg-primary/30 hover:bg-primary/60"
            }`}
            aria-label={`الصفحة ${i + 1}`}
          />
        ))}
      </div>

      {/* مسرح الصفحة (perspective) */}
      <div
        className="relative mx-auto"
        style={{ perspective: "2200px" }}
      >
        {/* ظل الكتاب */}
        <div className="absolute inset-x-4 -bottom-3 h-6 bg-black/30 blur-xl rounded-full" />

        {/* الصفحة الثابتة الموجودة تحت (الصفحة التالية تظهر بعد التقليب) */}
        {flip && (
          <div className="absolute inset-0 bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
            <PageSheet title={next!.title}>{next!.node}</PageSheet>
          </div>
        )}

        {/* الصفحة المتحركة */}
        <div
          key={current}
          className="relative bg-card border border-border rounded-lg shadow-2xl overflow-hidden"
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: flip?.dir === 1 ? "left center" : "right center",
            transition: flip ? "transform 0.85s cubic-bezier(0.65, 0.05, 0.36, 1)" : "none",
            transform: flip
              ? flip.dir === 1
                ? "rotateY(180deg)"
                : "rotateY(-180deg)"
              : "rotateY(0deg)",
          }}
        >
          <div style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
            <PageSheet title={curr.title}>{curr.node}</PageSheet>
          </div>

          {/* زاوية الورق المطوية — تلميح بأن الصفحة تُقلَّب */}
          {!flip && (
            <button
              onClick={() => go(1)}
              disabled={current === total - 1}
              aria-label="اقلب الصفحة"
              className={`absolute bottom-0 left-0 w-16 h-16 sm:w-20 sm:h-20 cursor-pointer group disabled:opacity-40 disabled:cursor-not-allowed ${
                hintPulse ? "animate-page-curl-hint" : ""
              }`}
              style={{
                background:
                  "linear-gradient(135deg, transparent 50%, hsl(var(--muted) / 0.4) 50%, hsl(var(--card)) 60%, hsl(var(--muted)) 100%)",
                clipPath: "polygon(0 100%, 100% 100%, 0 0)",
                boxShadow: "inset 6px -6px 14px hsl(var(--background) / 0.5)",
                transition: "transform 0.3s ease",
              }}
            >
              <span className="sr-only">اقلب الصفحة</span>
            </button>
          )}
        </div>
      </div>

      {/* تلميح نصي */}
      <p className="text-center text-[11px] text-muted-foreground mt-4">
        اسحب الصفحة يمين/يسار، أو اضغط الزاوية المطوية لقلب الورقة 📰
      </p>
    </div>
  );
}

function PageSheet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="relative"
      style={{
        background:
          "repeating-linear-gradient(180deg, hsl(var(--card)) 0px, hsl(var(--card)) 38px, hsl(var(--muted) / 0.15) 39px, hsl(var(--card)) 40px)",
      }}
    >
      {/* رأس الصفحة الجريدي */}
      <div className="border-b-4 border-double border-primary px-4 sm:px-6 py-3 flex items-center justify-between bg-card">
        <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
          القاهرة الكبرى — وضع الجريدة
        </span>
        <span className="text-sm font-extrabold text-primary">{title}</span>
      </div>
      <div className="px-3 sm:px-6 py-5">{children}</div>
    </div>
  );
}
