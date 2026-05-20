import { breakingItems as fallback } from "@/data/news";

export function BreakingTicker({ items }: { items?: string[] }) {
  const list = items?.length ? items : fallback;
  return (
    <div className="bg-card border-y border-border">
      <div className="container mx-auto px-4 flex items-stretch">
        <div className="bg-breaking text-breaking-foreground px-4 py-2 font-extrabold text-sm flex items-center gap-2 shrink-0">
          <span className="inline-block h-2 w-2 rounded-full bg-white animate-pulse" />
          عاجل
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="whitespace-nowrap animate-ticker py-2 text-sm font-semibold text-primary">
            {list.map((item, i) => (
              <span key={i} className="mx-8">
                <span className="text-gold ml-2">•</span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
