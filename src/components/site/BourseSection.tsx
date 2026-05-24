import { TimeAgo } from "@/components/site/TimeAgo";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, BarChart3, Clock } from "lucide-react";
import { getBourseSection } from "@/lib/bourse.functions";
import { CoverImage } from "./CoverImage";

export function BourseSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["bourse-section"],
    queryFn: () => getBourseSection(),
    refetchInterval: 90_000,
    staleTime: 60_000,
  });

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4 border-b-2 border-primary pb-2">
        <h2 className="text-xl md:text-2xl font-extrabold text-primary flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-gold" />
          أخبار البورصة
        </h2>
        {data?.index && (
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="text-muted-foreground">{data.index.name}:</span>
            <span className="text-primary">{data.index.value}</span>
            <span
              className={`flex items-center gap-1 ${data.index.up ? "text-emerald-600" : "text-red-600"}`}
            >
              {data.index.up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {data.index.change}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stocks list */}
        <aside className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="bg-primary text-primary-foreground px-4 py-2 text-sm font-extrabold flex items-center justify-between">
              <span>أبرز الأسهم</span>
              <span className="text-[10px] opacity-80">تحديث لحظي</span>
            </div>
            <ul className="divide-y divide-border">
              {isLoading && !data && (
                <li className="p-4 text-sm text-muted-foreground">جارٍ تحميل بيانات السوق...</li>
              )}
              {data?.stocks.length === 0 && !isLoading && (
                <li className="p-4 text-sm text-muted-foreground">السوق مغلق حالياً.</li>
              )}
              {data?.stocks.map((s) => (
                <li key={s.symbol} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-primary truncate">{s.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{s.symbol}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-primary">{s.value}</div>
                    <div
                      className={`text-[11px] font-bold flex items-center gap-1 justify-end ${
                        s.up ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {s.change}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* News */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data?.news ?? []).map((n: any) => (
              <Link
                key={n.id}
                to="/article/$slug"
                params={{ slug: n.slug }}
                className="news-card group bg-card border border-border rounded-lg overflow-hidden flex flex-col"
              >
                <CoverImage
                  src={n.cover_image}
                  alt={n.title}
                  ratio="16/10"
                  smRatio="16/9"
                  focus="top"
                  sizeHint={800}
                  imgClassName="group-hover:scale-105"
                >
                  <span className="absolute top-2 right-2 bg-gold text-gold-foreground px-2 py-0.5 text-[10px] font-extrabold rounded">
                    بورصة
                  </span>
                </CoverImage>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="text-sm md:text-base font-bold text-primary leading-snug group-hover:text-gold transition-colors line-clamp-3">
                    {n.title}
                  </h3>
                  {n.excerpt && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{n.excerpt}</p>
                  )}
                  <div className="mt-auto pt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <TimeAgo iso={n.published_at} />
                    {n.source && <span className="mx-1">•</span>}
                    {n.source && <span>{n.source}</span>}
                  </div>
                </div>
              </Link>
            ))}
            {(!data?.news || data.news.length === 0) && (
              <div className="md:col-span-2 text-sm text-muted-foreground bg-card border border-border rounded-lg p-6 text-center">
                لا توجد أخبار بورصة متاحة حالياً.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
