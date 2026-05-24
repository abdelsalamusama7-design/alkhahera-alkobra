import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CoverImage } from "./CoverImage";
import type { NewsItem } from "@/data/news";

/**
 * كاروسيل البطل — تصميم نسخة جريدة:
 *   ▸ شريط مصغّرات على اليسار (4 أخبار) يعمل كمؤشّر ويفتح الخبر مباشرة.
 *   ▸ شريحة كبيرة على اليمين (الخبر النشط) مع شريط عنوان سفلي بأكسنت أحمر.
 *   ▸ ترقيم رقمي للصفحات في الأسفل، تشغيل تلقائي مع إيقاف عند التحويم.
 */
export function HeroCarousel({ items, intervalMs = 5500 }: { items: NewsItem[]; intervalMs?: number }) {
  // أول 4 عناصر تظهر في شريط المصغّرات (مع تكرار العنصر النشط في الشريحة الكبيرة)
  const slides = items.slice(0, 4);
  const count = slides.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(t);
  }, [paused, count, intervalMs]);

  if (!count) return null;

  const active = slides[index];

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg bg-card shadow-sm grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-px bg-border"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      dir="rtl"
      aria-roledescription="carousel"
    >
      {/* ===== الشريط الجانبي للمصغّرات (يسار في RTL) ===== */}
      <ul className="hidden md:flex flex-col bg-card divide-y divide-border">
        {slides.map((item, i) => {
          const isActive = i === index;
          const inner = (
            <div
              className={`flex items-stretch gap-3 p-3 h-full transition-colors ${
                isActive ? "bg-muted/60" : "hover:bg-muted/40"
              }`}
            >
              <h3
                className={`flex-1 min-w-0 text-sm font-bold leading-snug line-clamp-3 self-center ${
                  isActive ? "text-primary" : "text-foreground"
                }`}
              >
                {item.title}
              </h3>
              <div className="w-24 h-20 shrink-0 overflow-hidden rounded">
                <CoverImage src={item.image} alt={item.title} ratio="4/3" sizeHint={240} />
              </div>
            </div>
          );
          return (
            <li key={item.id} className="flex-1 min-h-[88px]">
              {item.slug ? (
                <Link
                  to="/article/$slug"
                  params={{ slug: item.slug }}
                  onMouseEnter={() => setIndex(i)}
                  onFocus={() => setIndex(i)}
                  className="block h-full focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  {inner}
                </Link>
              ) : (
                <button
                  type="button"
                  onMouseEnter={() => setIndex(i)}
                  onFocus={() => setIndex(i)}
                  onClick={() => setIndex(i)}
                  className="block w-full text-right h-full"
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* ===== الشريحة الكبيرة (يمين) ===== */}
      <div className="relative bg-card min-h-[260px] sm:min-h-[360px] md:min-h-[460px]">
        {slides.map((item, i) => {
          const isActive = i === index;
          const inner = (
            <article className="absolute inset-0">
              <CoverImage
                src={item.image}
                alt={item.title}
                ratio="16/10"
                smRatio="16/9"
                focus="top"
                priority={i === 0}
                sizeHint={1400}
                imgClassName={`transition-transform duration-[6000ms] ease-out ${isActive ? "scale-105" : "scale-100"}`}
              >
                {/* gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* شارات علوية */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  {item.isBreaking && (
                    <span className="bg-breaking text-white px-2 py-1 text-[11px] font-bold rounded animate-pulse">
                      عاجل
                    </span>
                  )}
                  {item.category && (
                    <span className="bg-gold text-gold-foreground px-2 py-1 text-[11px] font-bold rounded">
                      {item.category}
                    </span>
                  )}
                </div>

                {/* شريط العنوان السفلي بأكسنت أحمر */}
                <div
                  className={`absolute bottom-0 inset-x-0 transition-all duration-700 ${
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                >
                  <div className="bg-black/70 backdrop-blur-sm px-4 sm:px-6 py-4 sm:py-5 flex items-stretch gap-3">
                    <span className="w-1 self-stretch bg-breaking rounded-sm shrink-0" aria-hidden />
                    <h2 className="text-white text-lg sm:text-2xl md:text-[26px] font-extrabold leading-tight line-clamp-2">
                      {item.title}
                    </h2>
                  </div>
                </div>
              </CoverImage>
            </article>
          );
          return (
            <div
              key={item.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
              aria-hidden={!isActive}
            >
              {item.slug ? (
                <Link to="/article/$slug" params={{ slug: item.slug }} className="block h-full">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </div>
          );
        })}

        {/* ترقيم رقمي للصفحات (RTL: 4 3 2 1) — في الأسفل يسار */}
        {count > 1 && (
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5" dir="ltr">
            {slides
              .map((_, i) => i)
              .reverse()
              .map((i) => {
                const isActive = i === index;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIndex(i);
                    }}
                    aria-label={`الخبر ${i + 1}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`h-7 w-7 rounded-full text-[12px] font-bold transition-all flex items-center justify-center ${
                      isActive
                        ? "bg-white text-black shadow"
                        : "bg-black/55 text-white/90 hover:bg-black/75"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
          </div>
        )}

        {/* شريط تقدّم علوي */}
        {count > 1 && (
          <>
            <div className="absolute top-0 inset-x-0 h-0.5 bg-white/15 z-20">
              <div
                key={`${index}-${paused}`}
                className="h-full bg-gold"
                style={{ animation: paused ? "none" : `heroProgress ${intervalMs}ms linear forwards` }}
              />
            </div>
            <style>{`@keyframes heroProgress { from { width: 0% } to { width: 100% } }`}</style>
          </>
        )}
      </div>

      {/* شريط مصغّرات أفقي للموبايل */}
      {count > 1 && (
        <div className="md:hidden flex bg-card border-t border-border">
          {slides.map((item, i) => {
            const isActive = i === index;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`flex-1 py-2 text-[11px] font-bold border-t-2 transition-colors ${
                  isActive ? "border-gold text-primary" : "border-transparent text-muted-foreground"
                }`}
                aria-current={isActive ? "true" : undefined}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      )}

      {active.slug && (
        <Link
          to="/article/$slug"
          params={{ slug: active.slug }}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        >
          {active.title}
        </Link>
      )}
    </div>
  );
}
