import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { NewsCard } from "@/components/site/NewsCard";
import { TopicsCircles } from "@/components/site/TopicsCircles";
import type { NewsItem } from "@/data/news";

type Props = {
  title: string;
  items: NewsItem[];
  layout: "grid" | "list" | "circles";
  columns: number;
  displayedCount: number;
  totalAvailable: number;
  onLoadMore: () => void;
  numbered?: boolean;
  accentEmoji?: string;
  accentBadge?: string;
};

function colClass(c: number) {
  // tailwind-safe explicit map
  const map: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  };
  return map[c] ?? map[4];
}

function ItemLink({ item, children }: { item: NewsItem; children: React.ReactNode }) {
  if ((item as any).externalUrl) {
    return <a href={(item as any).externalUrl} target="_blank" rel="noreferrer noopener" className="block h-full">{children}</a>;
  }
  if (item.slug) {
    return <Link to="/article/$slug" params={{ slug: item.slug }} className="block h-full">{children}</Link>;
  }
  return <div>{children}</div>;
}

export function HomeSection({
  title, items, layout, columns, displayedCount, totalAvailable, onLoadMore, numbered, accentEmoji, accentBadge,
}: Props) {
  if (!items.length) return null;
  const shown = items.slice(0, displayedCount);
  const hasMore = displayedCount < totalAvailable;

  if (layout === "circles") {
    return (
      <TopicsCircles
        items={shown}
        title={title}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
      />
    );
  }

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4 border-b-2 border-primary pb-2">
        <h2 className="text-xl md:text-2xl font-extrabold text-primary flex items-center gap-2">
          {accentEmoji ? <span className="text-2xl" aria-hidden>{accentEmoji}</span> : <span className="inline-block w-1.5 h-6 bg-gold rounded" />}
          {title}
          {accentBadge && (
            <span className="text-[10px] font-bold bg-gold/20 text-gold-foreground border border-gold px-2 py-0.5 rounded-full mr-1">{accentBadge}</span>
          )}
        </h2>
      </div>

      {layout === "list" ? (
        <ol className="space-y-3">
          {shown.map((n, i) => (
            <ItemLink key={n.id ?? i} item={n}>
              <li className="flex items-start gap-3 bg-card p-3 rounded-md border border-border news-card group">
                <span className="text-3xl font-extrabold text-gold leading-none w-8 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-gold mb-1">{n.category}</div>
                  <h4 className="text-sm font-bold text-primary leading-snug line-clamp-3 group-hover:text-gold transition-colors">{n.title}</h4>
                </div>
              </li>
            </ItemLink>
          ))}
        </ol>
      ) : (
        <div className={`grid ${colClass(columns)} gap-3`}>
          {shown.map((n, i) => (
            <ItemLink key={n.id ?? i} item={n}>
              <div className="relative news-card h-full">
                {numbered && (
                  <span className="absolute top-2 right-2 z-10 bg-gold text-gold-foreground text-[11px] font-extrabold rounded-full h-6 min-w-6 px-1.5 flex items-center justify-center shadow">#{i + 1}</span>
                )}
                <NewsCard item={n} />
              </div>
            </ItemLink>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-4 flex justify-center">
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
