import type { NewsItem } from "@/data/news";
import { Clock } from "lucide-react";

type Props = {
  item: NewsItem;
  size?: "large" | "medium" | "compact" | "hero";
};

export function NewsCard({ item, size = "medium" }: Props) {
  if (size === "hero") {
    return (
      <article className="news-card group relative overflow-hidden rounded-lg bg-card shadow-sm">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute bottom-0 right-0 left-0 p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              {item.isBreaking && (
                <span className="bg-breaking px-2 py-1 text-xs font-bold rounded">عاجل</span>
              )}
              <span className="bg-gold text-gold-foreground px-2 py-1 text-xs font-bold rounded">
                {item.category}
              </span>
            </div>
            <h2 className="text-xl md:text-3xl font-extrabold leading-tight mb-2 group-hover:text-gold transition-colors">
              {item.title}
            </h2>
            {item.excerpt && (
              <p className="text-sm md:text-base opacity-90 line-clamp-2 mb-2">{item.excerpt}</p>
            )}
            <div className="flex items-center gap-3 text-xs opacity-80">
              <span>{item.source}</span>
              <span className="flex items-center gap-1"><Clock size={12} /><span suppressHydrationWarning>{item.timeAgo}</span></span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (size === "compact") {
    return (
      <article className="news-card group flex gap-3 bg-card p-3 rounded-md border border-border">
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          className="h-20 w-24 shrink-0 rounded object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-gold mb-1">{item.category}</div>
          <h3 className="text-sm font-bold text-primary leading-snug line-clamp-3 group-hover:text-gold transition-colors">
            {item.title}
          </h3>
          <div className="text-[10px] text-muted-foreground mt-1"><span suppressHydrationWarning>{item.timeAgo}</span></div>
        </div>
      </article>
    );
  }

  if (size === "large") {
    return (
      <article className="news-card group overflow-hidden rounded-lg bg-card border border-border">
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute top-3 right-3 bg-primary text-primary-foreground px-2 py-1 text-xs font-bold rounded">
            {item.category}
          </span>
        </div>
        <div className="p-4">
          <h3 className="text-base md:text-lg font-extrabold text-primary leading-snug line-clamp-3 group-hover:text-gold transition-colors">
            {item.title}
          </h3>
          {item.excerpt && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.excerpt}</p>
          )}
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-semibold text-primary/70">{item.source}</span>
            <span className="flex items-center gap-1"><Clock size={12} /><span suppressHydrationWarning>{item.timeAgo}</span></span>
          </div>
        </div>
      </article>
    );
  }

  // medium (default)
  return (
    <article className="news-card group overflow-hidden rounded-md bg-card border border-border">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute top-2 right-2 bg-primary/90 text-primary-foreground px-2 py-0.5 text-[10px] font-bold rounded">
          {item.category}
        </span>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-bold text-primary leading-snug line-clamp-3 group-hover:text-gold transition-colors min-h-[3.6em]">
          {item.title}
        </h3>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{item.source}</span>
          <span className="flex items-center gap-1"><Clock size={11} /><span suppressHydrationWarning>{item.timeAgo}</span></span>
        </div>
      </div>
    </article>
  );
}
