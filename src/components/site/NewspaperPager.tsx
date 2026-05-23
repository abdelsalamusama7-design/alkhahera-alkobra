import { useEffect, useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NewspaperPagerProps {
  pages: { title: string; node: ReactNode }[];
}

/**
 * تجربة مجلة حقيقية:
 * - اسحب الصفحة بإصبعك/الماوس فتتبع حركتك (Drag to peel).
 * - اضغط على الحافة اليمنى/اليسرى لقلب الصفحة.
 * - أزرار سابق/تالي + اختصارات لوحة المفاتيح.
 * RTL: السحب لليسار = الصفحة التالية، لليمين = السابقة.
 */
export function NewspaperPager({ pages }: NewspaperPagerProps) {
  const [current, setCurrent] = useState(0);
  const [animTo, setAnimTo] = useState<null | { to: number; dir: 1 | -1 }>(null);
  const total = pages.length;

  const stageRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<null | {
    dir: 1 | -1; // اتجاه القلب المحتمل
    progress: number; // 0..1 مقدار التقدّم
    width: number;
    startX: number;
    pointerId: number;
  }>(null);

  const [hintPulse, setHintPulse] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setHintPulse(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const commitFlip = (dir: 1 | -1) => {
    const to = current + dir;
    if (to < 0 || to >= total) return;
    setAnimTo({ to, dir });
    window.setTimeout(() => {
      setCurrent(to);
      setAnimTo(null);
    }, 600);
  };

  const go = (dir: 1 | -1) => {
    if (animTo || drag) return;
    commitFlip(dir);
  };

  // ===== Drag handlers (Pointer Events: تعمل على اللمس والماوس) =====
  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (animTo) return;
    const el = stageRef.current;
    if (!el) return;
    // تجاهل النقر على الأزرار داخل الصفحة
    const target = e.target as HTMLElement;
    if (target.closest("a, button, input, textarea, select")) return;
    const rect = el.getBoundingClientRect();
    el.setPointerCapture(e.pointerId);
    setDrag({
      dir: 1,
      progress: 0,
      width: rect.width,
      startX: e.clientX,
      pointerId: e.pointerId,
    });
  };

  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    // RTL: dx سالب = اتجاه التالي، dx موجب = السابق
    const dir: 1 | -1 = dx < 0 ? 1 : -1;
    const possible =
      (dir === 1 && current < total - 1) || (dir === -1 && current > 0);
    if (!possible) {
      setDrag({ ...drag, dir, progress: 0 });
      return;
    }
    const progress = Math.min(1, Math.abs(dx) / drag.width);
    setDrag({ ...drag, dir, progress });
  };

  const endDrag = (e: RPointerEvent<HTMLDivElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const { dir, progress } = drag;
    const el = stageRef.current;
    try {
      el?.releasePointerCapture(e.pointerId);
    } catch {}
    setDrag(null);
    if (progress > 0.25) {
      commitFlip(dir);
    }
  };

  // ===== Tap on edge =====
  const onStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (animTo || drag) return;
    const target = e.target as HTMLElement;
    if (target.closest("a, button, input, textarea, select")) return;
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const edge = rect.width * 0.18;
    // RTL: يمين = السابق، يسار = التالي
    if (x < edge) go(1);
    else if (x > rect.width - edge) go(-1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(1);
      else if (e.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const curr = pages[current];
  const nextPage = animTo ? pages[animTo.to] : drag && drag.progress > 0 ? pages[current + drag.dir] : null;

  // زاوية القلب
  const rotation = animTo
    ? animTo.dir === 1
      ? -170
      : 170
    : drag
    ? drag.dir === 1
      ? -drag.progress * 170
      : drag.progress * 170
    : 0;

  // أصل التحويل
  const origin = animTo
    ? animTo.dir === 1
      ? "left center"
      : "right center"
    : drag
    ? drag.dir === 1
      ? "left center"
      : "right center"
    : "center center";

  const isFlipping = !!animTo;
  const isDragging = !!drag;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6" dir="rtl">
      {/* شريط التنقل */}
      <div className="flex items-center justify-between mb-3 bg-card border-2 border-primary/20 rounded-lg px-3 py-2 shadow-md">
        <button
          onClick={() => go(-1)}
          disabled={current === 0 || isFlipping || isDragging}
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
          disabled={current === total - 1 || isFlipping || isDragging}
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
              if (isFlipping || isDragging || i === current) return;
              const dir: 1 | -1 = i > current ? 1 : -1;
              setAnimTo({ to: i, dir });
              window.setTimeout(() => {
                setCurrent(i);
                setAnimTo(null);
              }, 600);
            }}
            className={`h-2 rounded-full transition-all ${
              i === current ? "w-6 bg-gold" : "w-2 bg-primary/30 hover:bg-primary/60"
            }`}
            aria-label={`الصفحة ${i + 1}`}
          />
        ))}
      </div>

      {/* مسرح الصفحة */}
      <div className="relative mx-auto select-none" style={{ perspective: "2400px" }}>
        {/* ظل الكتاب */}
        <div className="absolute inset-x-4 -bottom-3 h-6 bg-black/30 blur-xl rounded-full pointer-events-none" />

        <div
          ref={stageRef}
          className="relative touch-pan-y"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClick={onStageClick}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          {/* الصفحة التالية (تظهر تحت أثناء القلب) */}
          {nextPage && (
            <div className="absolute inset-0 bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
              <PageSheet title={nextPage.title}>{nextPage.node}</PageSheet>
            </div>
          )}

          {/* الصفحة الحالية المتحركة */}
          <div
            key={current}
            className="relative bg-card border border-border rounded-lg shadow-2xl overflow-hidden will-change-transform"
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: origin,
              transition: isFlipping
                ? "transform 0.6s cubic-bezier(0.65, 0.05, 0.36, 1), box-shadow 0.6s"
                : isDragging
                ? "none"
                : "transform 0.35s ease, box-shadow 0.35s",
              transform: `rotateY(${rotation}deg)`,
              boxShadow:
                isDragging || isFlipping
                  ? "0 30px 60px -20px rgba(0,0,0,0.45), 0 10px 25px -5px rgba(0,0,0,0.3)"
                  : "0 10px 30px -10px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
              <PageSheet title={curr.title}>{curr.node}</PageSheet>

              {/* تدرج إضاءة أثناء السحب — يحاكي انحناء الورق */}
              {(isDragging || isFlipping) && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      drag?.dir === 1 || animTo?.dir === 1
                        ? "linear-gradient(to left, rgba(0,0,0,0.35), rgba(0,0,0,0) 40%)"
                        : "linear-gradient(to right, rgba(0,0,0,0.35), rgba(0,0,0,0) 40%)",
                  }}
                />
              )}
            </div>

            {/* زاوية الورق المطوية في الراحة — تلميح بصري */}
            {!isFlipping && !isDragging && current < total - 1 && (
              <div
                aria-hidden
                className={`absolute bottom-0 left-0 w-14 h-14 sm:w-16 sm:h-16 pointer-events-none ${
                  hintPulse ? "animate-pulse" : ""
                }`}
                style={{
                  background:
                    "linear-gradient(135deg, transparent 50%, color-mix(in oklab, var(--muted) 40%, transparent) 50%, var(--card) 60%, var(--muted) 100%)",
                  clipPath: "polygon(0 100%, 100% 100%, 0 0)",
                  boxShadow:
                    "inset 6px -6px 14px color-mix(in oklab, var(--background) 50%, transparent)",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* تلميح نصي */}
      <p className="text-center text-[11px] text-muted-foreground mt-4">
        اسحب الصفحة بإصبعك لتقليب الورق، أو اضغط على حافة الصفحة 📖
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
          "repeating-linear-gradient(180deg, var(--card) 0px, var(--card) 38px, color-mix(in oklab, var(--muted) 15%, transparent) 39px, var(--card) 40px)",
      }}
    >
      <div className="border-b-4 border-double border-primary px-4 sm:px-6 py-3 flex items-center justify-between bg-card">
        <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
          القاهرة الكبرى — وضع المجلة
        </span>
        <span className="text-sm font-extrabold text-primary">{title}</span>
      </div>
      <div className="px-3 sm:px-6 py-5">{children}</div>
    </div>
  );
}
