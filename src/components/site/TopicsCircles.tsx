import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { NewsItem } from "@/data/news";

export function TopicsCircles({
  items,
  title,
  hasMore,
  onLoadMore,
}: {
  items: NewsItem[];
  title?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Dedupe by slug/id, title, and image to avoid repeated circles
  const seen = new Set<string>();
  const unique = (items ?? []).filter((n) => {
    const keys = [n.slug, n.id, n.title?.trim(), n.image].filter(Boolean) as string[];
    if (keys.some((k) => seen.has(k))) return false;
    keys.forEach((k) => seen.add(k));
    return true;
  });

  if (!unique.length) return null;

  const scroll = (dir: "next" | "prev") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    // In RTL, "next" (right arrow visually on left) should reveal older items
    el.scrollBy({ left: dir === "next" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-4 relative" dir="rtl">
        {title && (
          <div className="flex items-center gap-2 mb-3 px-10">
            <span className="inline-block w-1.5 h-5 bg-gold rounded" />
            <h2 className="text-sm md:text-base font-extrabold text-primary">{title}</h2>
          </div>
        )}
        {/* Prev arrow (visual right in RTL) */}
        <button
          type="button"
          aria-label="السابق"
          onClick={() => scroll("prev")}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background/90 border border-border shadow flex items-center justify-center hover:bg-gold hover:text-gold-foreground transition"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div
          ref={scrollerRef}
          className="flex gap-5 overflow-x-auto scroll-smooth px-10 no-scrollbar"
          style={{ scrollbarWidth: "none" }}
        >
          {unique.map((n) => {
            const content = (
              <div className="flex flex-col items-center gap-2 shrink-0 w-20 md:w-24 group">
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden border-2 border-border group-hover:border-gold transition shadow-sm">
                  <img
                    src={n.image}
                    alt={n.title}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <span className="text-xs md:text-sm font-extrabold text-primary text-center leading-tight line-clamp-2 group-hover:text-gold transition-colors">
                  {n.title}
                </span>
              </div>
            );
            return n.slug ? (
              <Link key={n.id} to="/article/$slug" params={{ slug: n.slug }}>
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>

        {/* Next arrow (visual left in RTL) */}
        <button
          type="button"
          aria-label="التالي"
          onClick={() => scroll("next")}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background/90 border border-border shadow flex items-center justify-center hover:bg-gold hover:text-gold-foreground transition"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {hasMore && onLoadMore && (
        <div className="container mx-auto px-4 pb-4 flex justify-center" dir="rtl">
          <button
            type="button"
            data-no-ad="true"
            onClick={onLoadMore}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gold/10 border border-gold text-gold text-sm font-bold hover:bg-gold hover:text-gold-foreground transition"
          >
            <Loader2 className="h-4 w-4" />
            المزيد
          </button>
        </div>
      )}
    </section>
  );
}
