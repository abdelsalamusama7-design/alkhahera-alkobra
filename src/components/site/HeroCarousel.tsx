import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, ChevronRight, ChevronLeft } from "lucide-react";
import { CoverImage } from "./CoverImage";
import type { NewsItem } from "@/data/news";

/**
 * كاروسيل البطل المتحرك — يعرض عدة أخبار متنوعة بانتقال سلس وتشغيل تلقائي.
 * يتوقف تلقائياً عند تحويم الفأرة، ويدعم الأسهم والنقاط.
 */
export function HeroCarousel({ items, intervalMs = 5000 }: { items: NewsItem[]; intervalMs?: number }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = items.length;

  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(t);
  }, [paused, count, intervalMs]);

  if (!count) return null;

  const go = (i: number) => setIndex(((i % count) + count) % count);

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-lg bg-card shadow-sm group/hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      dir="rtl"
      aria-roledescription="carousel"
    >
      {items.map((item, i) => {
        const active = i === index;
        const inner = (
          <article className="absolute inset-0">
            <CoverImage
              src={item.image}
              alt={item.title}
              ratio="16/10"
              smRatio="16/9"
              focus="top"
              priority={i === 0}
              sizeHint={1600}
              imgClassName={`transition-transform duration-[6000ms] ease-out ${active ? "scale-105" : "scale-100"}`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
              <div
                className={`absolute bottom-0 right-0 left-0 p-5 sm:p-6 text-white transition-all duration-700 ${
                  active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {item.isBreaking && (
                    <span className="bg-breaking px-2 py-1 text-xs font-bold rounded animate-pulse">عاجل</span>
                  )}
                  <span className="bg-gold text-gold-foreground px-2 py-1 text-xs font-bold rounded">
                    {item.category}
                  </span>
                </div>
                <h2 className="text-xl md:text-3xl font-extrabold leading-tight mb-2 line-clamp-2">
                  {item.title}
                </h2>
                {item.excerpt && (
                  <p className="text-sm md:text-base opacity-90 line-clamp-2 mb-2">{item.excerpt}</p>
                )}
                <div className="flex items-center gap-3 text-xs opacity-80">
                  <span>{item.source}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    <span suppressHydrationWarning>{item.timeAgo}</span>
                  </span>
                </div>
              </div>
            </CoverImage>
          </article>
        );
        return (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              active ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
            aria-hidden={!active}
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

      {/* Arrows */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-gold hover:text-gold-foreground text-white rounded-full p-2 backdrop-blur-sm opacity-0 group-hover/hero:opacity-100 transition-opacity"
            aria-label="السابق"
          >
            <ChevronRight size={20} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-gold hover:text-gold-foreground text-white rounded-full p-2 backdrop-blur-sm opacity-0 group-hover/hero:opacity-100 transition-opacity"
            aria-label="التالي"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(i); }}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-gold" : "w-1.5 bg-white/60 hover:bg-white"
                }`}
                aria-label={`الخبر ${i + 1}`}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="absolute top-0 inset-x-0 h-0.5 bg-white/20 z-20">
            <div
              key={`${index}-${paused}`}
              className="h-full bg-gold"
              style={{
                animation: paused ? "none" : `heroProgress ${intervalMs}ms linear forwards`,
              }}
            />
          </div>
          <style>{`@keyframes heroProgress { from { width: 0% } to { width: 100% } }`}</style>
        </>
      )}
    </div>
  );
}
