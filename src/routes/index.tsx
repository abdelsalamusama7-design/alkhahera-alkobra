import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import { useQuery } from "@tanstack/react-query";
import { useReadMode } from "@/hooks/use-read-mode";
import { TopBar } from "@/components/site/TopBar";
import { Header } from "@/components/site/Header";
import { NavBar } from "@/components/site/NavBar";
import { AdBanner } from "@/components/site/AdBanner";
import { SponsoredLink } from "@/components/site/SponsoredLink";
import { AdSlot } from "@/components/site/AdSlot";
import { AdsterraBanner, AdsterraNativeBanner, AdsterraAutoScript } from "@/components/site/AdsterraAd";
import { CoverImage } from "@/components/site/CoverImage";
import { BreakingTicker } from "@/components/site/BreakingTicker";
import { MarketsTicker } from "@/components/site/MarketsTicker";
import { BourseSection } from "@/components/site/BourseSection";
import { NewsCard } from "@/components/site/NewsCard";
import { HeroCarousel } from "@/components/site/HeroCarousel";
import { MarketsWidget, WeatherWidget, SportsWidget } from "@/components/site/Widgets";
import { GoldBar } from "@/components/site/GoldBar";
import { GoldWidget } from "@/components/site/GoldWidget";
import { Footer } from "@/components/site/Footer";
import { TopicsCircles } from "@/components/site/TopicsCircles";
import { HomeSection } from "@/components/site/HomeSection";
import { NewspaperPager } from "@/components/site/NewspaperPager";
import { getHomeBundle } from "@/lib/articles.functions";
import { getSiteSetting } from "@/lib/site-settings.functions";
import { listHomeSections, type HomeSectionConfig, type HomeSectionItem } from "@/lib/home-sections.functions";
import { heroNews, latestNews, reports, opinions, gallery, type NewsItem } from "@/data/news";
import { timeAgoAr } from "@/lib/format";

export const Route = createFileRoute("/")({
  loader: () => getHomeBundle(),
  head: () => ({
    meta: [
      { property: "og:url", content: "https://kaheraalkobra.online/" },
    ],
    links: [
      { rel: "canonical", href: "https://kaheraalkobra.online/" },
    ],
  }),
  component: Index,
});

function SectionTitle({ title, accent, to }: { title: string; accent?: string; to?: string }) {
  return (
    <div className="flex items-center justify-between mb-4 border-b-2 border-primary pb-2">
      <h2 className="text-xl md:text-2xl font-extrabold text-primary flex items-center gap-2">
        <span className="inline-block w-1.5 h-6 bg-gold rounded" />
        {title}
      </h2>
      {accent && to && (
        <Link to={to} className="text-xs font-bold text-gold hover:underline">{accent}</Link>
      )}
    </div>
  );
}

function dbToMock(row: any): NewsItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category?.name ?? "أخبار",
    source: row.source ?? "القاهرة الكبرى",
    timeAgo: timeAgoAr(row.published_at),
    image: row.cover_image || "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=800&h=500&q=80",
    excerpt: row.excerpt ?? undefined,
    isBreaking: row.is_breaking,
    slug: row.slug,
  };
}

function Index() {
  const { isReadMode } = useReadMode();
  const initial = Route.useLoaderData();
  const { data = initial } = useQuery({
    queryKey: ["home"],
    queryFn: () => getHomeBundle(),
    initialData: initial,
    refetchInterval: 5 * 60_000,
  });
  const { data: circlesSetting } = useQuery({
    queryKey: ["site-setting", "topics_circles_count"],
    queryFn: () => getSiteSetting({ data: { key: "topics_circles_count" } }),
    staleTime: 5 * 60_000,
  });
  const { data: sectionsData } = useQuery({
    queryKey: ["home-sections-public"],
    queryFn: () => listHomeSections(),
    staleTime: 5 * 60_000,
  });
  const sectionConfigs: HomeSectionConfig[] = sectionsData?.sections ?? [];
  const pinnedItems: HomeSectionItem[] = sectionsData?.items ?? [];
  const configFor = (key: string, fallback: Partial<HomeSectionConfig>): HomeSectionConfig =>
    (sectionConfigs.find((s) => s.key === key) as HomeSectionConfig) ?? ({
      key, title: key, enabled: true, layout: "grid", columns: 4,
      display_count: 8, load_more_step: 8, max_count: 48, sort_order: 0,
      ...fallback,
    } as HomeSectionConfig);
  const pinsToNews = (key: string): NewsItem[] =>
    pinnedItems.filter((p) => p.section_key === key).map((p) => {
      if (p.kind === "article" && p.article) {
        return {
          id: p.article.id, slug: p.article.slug, title: p.article.title,
          image: p.article.cover_image ?? "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=800&h=500&q=80",
          source: p.article.source ?? "القاهرة الكبرى", category: "مثبّت", timeAgo: "",
        } as NewsItem;
      }
      return {
        id: p.id, title: p.custom_title ?? "",
        image: p.custom_image ?? "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=800&h=500&q=80",
        source: p.custom_source ?? "", category: "مخصّص", timeAgo: "",
        externalUrl: p.custom_url ?? undefined,
      } as NewsItem;
    });

  const cfgCircles = configFor("circles", { layout: "circles", display_count: 12, max_count: 48 });
  const cfgTrending = configFor("trending", { columns: 6, display_count: 6, max_count: 48 });
  const cfgLatest = configFor("latest", { columns: 4, display_count: 8, max_count: 48 });
  const cfgMoreLatest = configFor("more_latest", { columns: 4, display_count: 8, max_count: 48 });
  const cfgMostRead = configFor("most_read", { layout: "list", display_count: 5, max_count: 20 });

  // Backward-compat: original site setting can still override circles max
  const maxCircles = (() => {
    const v = circlesSetting?.value;
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n) && n > 1) return Math.min(60, Math.max(3, n));
    return cfgCircles.max_count;
  })();
  const [circlesShown, setCirclesShown] = useState(cfgCircles.display_count);
  const [trendingShown, setTrendingShown] = useState(cfgTrending.display_count);
  const [latestShown, setLatestShown] = useState(cfgLatest.display_count);
  const [moreLatestShown, setMoreLatestShown] = useState(cfgMoreLatest.display_count);
  const [mostReadShown, setMostReadShown] = useState(cfgMostRead.display_count);

  const heroDb = data.hero.map(dbToMock);
  const latestDb = data.latest.map(dbToMock);
  const mostReadDb = data.mostRead.map(dbToMock);
  const trendingDb = (data.trending ?? []).map(dbToMock);
  const worldTopDb = ((data as any).worldTop ?? []).map(dbToMock);
  const breakingDb = data.breaking.map((b: any) => b.title);

  // Global dedupe helper across sections (by id/slug/title/image)
  const dedupe = (arr: NewsItem[], used: Set<string>) =>
    arr.filter((n) => {
      const keys = [n.id, n.slug, n.title?.trim(), n.image].filter(Boolean) as string[];
      if (keys.some((k) => used.has(k))) return false;
      keys.forEach((k) => used.add(k));
      return true;
    });

  const usedKeys = new Set<string>();

  const heroListRaw = heroDb.length ? heroDb : heroNews;
  const heroList = dedupe(heroListRaw, usedKeys);
  const latestListRaw = latestDb.length ? latestDb : latestNews;
  const latestList = dedupe(latestListRaw, usedKeys);
  const trendingList = dedupe(trendingDb, usedKeys);
  const worldTopList = dedupe(worldTopDb, new Set<string>()); // circles use their own scope
  const mostRead = dedupe(mostReadDb.length ? mostReadDb : latestNews, usedKeys).slice(0, 5);

  const [hero, ...sideHero] = heroList;
  // كاروسيل البطل: نخلط أخبار من فئات متنوّعة (هيرو + ترند + آخر الأخبار) عشان كل ما يتحرّك يطلع خبر جديد بفئة مختلفة
  const heroCarouselItems = (() => {
    const seen = new Set<string>();
    const pool: NewsItem[] = [];
    const pushUnique = (arr: NewsItem[]) => {
      for (const n of arr) {
        const k = n.id || n.slug || n.title;
        if (!k || seen.has(k)) continue;
        seen.add(k);
        pool.push(n);
      }
    };
    pushUnique(heroList);
    pushUnique(trendingList);
    pushUnique(latestList);
    return pool.slice(0, 7);
  })();
  const fallbackTitles = [...heroDb, ...latestDb].slice(0, 10).map((n) => n.title);
  const breakingItems = breakingDb.length
    ? breakingDb
    : fallbackTitles.length
      ? fallbackTitles
      : ["تصفّح أحدث الأخبار من لوحة التحكم — اسحب RSS لإضافة محتوى حقيقي."];

  function ItemLink({ item, children }: { item: any; children: ReactNode }) {
    if (item.slug) return <Link to="/article/$slug" params={{ slug: item.slug }} className="block h-full">{children}</Link>;
    return <div>{children}</div>;
  }

  // ===== وضع القراءة: عرض كصفحات جريدة ورقية =====
  if (isReadMode) {
    const readerPages: { title: string; node: ReactNode }[] = [
      {
        title: "الصفحة الأولى",
        node: (
          <div className="space-y-5">
            <HeroCarousel
              items={heroCarouselItems.length ? heroCarouselItems : [hero].filter(Boolean)}
              intervalMs={5500}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sideHero.slice(0, 2).map((n: NewsItem) => (
                <ItemLink key={n.id} item={n}>
                  <NewsCard item={n} />
                </ItemLink>
              ))}
            </div>
          </div>
        ),
      },
      ...(trendingList.length
        ? [
            {
              title: "ترند الآن",
              node: (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {trendingList.slice(0, 9).map((n: NewsItem, i: number) => (
                    <ItemLink key={n.id} item={n}>
                      <div className="relative news-card h-full">
                        <span className="absolute top-2 right-2 z-10 bg-gold text-gold-foreground text-[11px] font-extrabold rounded-full h-6 min-w-6 px-1.5 flex items-center justify-center shadow">
                          #{i + 1}
                        </span>
                        <NewsCard item={n} />
                      </div>
                    </ItemLink>
                  ))}
                </div>
              ),
            },
          ]
        : []),
      {
        title: "آخر الأخبار",
        node: (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {latestList.slice(0, 9).map((n: NewsItem) => (
              <ItemLink key={n.id} item={n}>
                <NewsCard item={n} />
              </ItemLink>
            ))}
          </div>
        ),
      },
      {
        title: "المزيد من الأخبار",
        node: (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {latestList.slice(9, 18).map((n: NewsItem) => (
              <ItemLink key={n.id} item={n}>
                <NewsCard item={n} />
              </ItemLink>
            ))}
          </div>
        ),
      },
      {
        title: "الأكثر قراءة",
        node: (
          <ol className="space-y-3">
            {mostRead.map((n: NewsItem, i: number) => (
              <ItemLink key={n.id} item={n}>
                <li className="flex items-start gap-3 bg-card p-3 rounded-md border border-border news-card group">
                  <span className="text-3xl font-extrabold text-gold leading-none w-8 shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-gold mb-1">{n.category}</div>
                    <h4 className="text-base font-bold text-primary leading-snug group-hover:text-gold transition-colors">
                      {n.title}
                    </h4>
                  </div>
                </li>
              </ItemLink>
            ))}
          </ol>
        ),
      },
      {
        title: "آراء الكتّاب",
        node: (
          <div className="space-y-3">
            {opinions.map((o) => (
              <article
                key={o.id}
                className="news-card bg-card border border-border rounded-lg p-4 flex gap-4 items-start"
              >
                <img
                  src={o.image}
                  alt={o.source}
                  loading="lazy"
                  className="h-14 w-14 rounded-full object-cover border-2 border-gold shrink-0"
                />
                <div>
                  <div className="text-xs font-bold text-gold">{o.source}</div>
                  <h3 className="text-base font-bold text-primary mt-1 leading-snug">{o.title}</h3>
                </div>
              </article>
            ))}
          </div>
        ),
      },
    ];

    return (
      <div className="min-h-screen flex flex-col bg-background" dir="rtl">
        <TopBar />
        <Header />
        <NavBar />
        <BreakingTicker items={breakingItems} />
        <main className="flex-1">
          <NewspaperPager pages={readerPages} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <TopBar />
      <Header />
      <NavBar />
      <BreakingTicker items={breakingItems} />
      <MarketsTicker />
      <GoldBar />
      {!isReadMode && <AdBanner />}
      {!isReadMode && <AdsterraAutoScript />}

      {/* البانر العلوي 728x90/320x50 أُزيل — 245 impression بـ $0 ربح. استبدلناه بـ Native Banner داخل المحتوى لأنه أعلى CTR. */}

      <main className="flex-1">
        <TopicsCircles
          items={[...worldTopList, ...trendingList, ...latestList].slice(0, Math.min(displayedCount, maxCircles))}
          title="أهم أحداث العالم"
          hasMore={displayedCount < Math.min(maxCircles, [...worldTopList, ...trendingList, ...latestList].length)}
          onLoadMore={() => setDisplayedCount((c) => c + circlesStep)}
        />
        


        <section className="container mx-auto px-4 py-6">
          <HeroCarousel
            items={[
              ...(heroCarouselItems.length ? heroCarouselItems : [hero].filter(Boolean)),
              ...sideHero,
            ]}
            intervalMs={5500}
          />
        </section>

        {trendingList.length > 0 && (
          <section className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4 border-b-2 border-gold pb-2">
              <h2 className="text-xl md:text-2xl font-extrabold text-primary flex items-center gap-2">
                <span className="text-2xl" aria-hidden>🔥</span>
                ترند الآن
                <span className="text-[10px] font-bold bg-gold/20 text-gold-foreground border border-gold px-2 py-0.5 rounded-full mr-1">آخر 48 ساعة</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {trendingList.map((n: NewsItem, i: number) => (
                <ItemLink key={n.id} item={n}>
                  <div className="relative news-card h-full">
                    <span className="absolute top-2 right-2 z-10 bg-gold text-gold-foreground text-[11px] font-extrabold rounded-full h-6 min-w-6 px-1.5 flex items-center justify-center shadow">#{i + 1}</span>
                    <NewsCard item={n} />
                  </div>
                </ItemLink>
              ))}
            </div>
          </section>
        )}

        <section className="container mx-auto px-4 py-6">
          <SectionTitle title="آخر الأخبار" accent="عرض المزيد" to="/search" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {latestList.slice(0, 8).map((n: NewsItem) => (
              <ItemLink key={n.id} item={n}><NewsCard item={n} /></ItemLink>
            ))}
          </div>
        </section>

        {!isReadMode && (
          <section className="container mx-auto px-4">
            <AdSlot slot="home-middle" className="mt-3" />
          </section>
        )}



        {/* Brand strip */}
        <section className="container mx-auto px-4 py-6">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary to-primary/90 p-6 sm:p-8">
            <div className="absolute inset-1 bg-card rounded-[10px]" />
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-125" />
                <img
                  src={logo}
                  alt="القاهرة الكبرى"
                  className="relative h-16 sm:h-20 md:h-24 w-auto object-contain drop-shadow-md"
                  loading="lazy"
                />
              </div>
              <div className="w-px h-12 bg-border hidden sm:block" />
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-2xl md:text-3xl font-extrabold text-primary leading-tight">القاهرة الكبرى</span>
                <span className="text-sm text-muted-foreground mt-1 tracking-wide">بوابة الأخبار المصرية والعربية</span>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {latestList.slice(8, 16).map((n: NewsItem) => (
              <ItemLink key={n.id} item={n}><NewsCard item={n} /></ItemLink>
            ))}
          </div>
        </section>

        {!isReadMode && (
          /* Native Banner — يندمج مع شكل الموقع */
          <section className="container mx-auto px-4 py-6">
            <AdsterraNativeBanner />
          </section>
        )}

        {!isReadMode && (
          /* بانر 468x60 */
          <section className="container mx-auto px-4 py-3 flex justify-center">
            <AdsterraBanner adKey="ffd24356f30f4d3b5eaa1598770263e5" width={468} height={60} />
          </section>
        )}

        <BourseSection />


        <section className="container mx-auto px-4 py-6">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <GoldWidget />
            <WeatherWidget />
            <MarketsWidget />
            <SportsWidget />
          </div>
        </section>

        <section className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SectionTitle title="تقارير وحوارات" />
              <article className="news-card group overflow-hidden rounded-lg bg-card border border-border">
                <CoverImage
                  src={reports[0].image}
                  alt={reports[0].title}
                  ratio="16/9"
                  smRatio="16/8"
                  focus="top"
                  sizeHint={1600}
                  imgClassName="group-hover:scale-105"
                >
                  <span className="absolute top-3 right-3 bg-gold text-gold-foreground px-3 py-1 text-xs font-extrabold rounded">تقرير خاص</span>
                </CoverImage>
                <div className="p-6">
                  <h3 className="text-xl md:text-2xl font-extrabold text-primary leading-snug group-hover:text-gold transition-colors">{reports[0].title}</h3>
                  {reports[0].excerpt && <p className="text-sm md:text-base text-muted-foreground mt-3 leading-relaxed">{reports[0].excerpt}</p>}
                  <div className="mt-4 text-xs text-muted-foreground"><span suppressHydrationWarning>{reports[0].source} • {reports[0].timeAgo}</span></div>
                </div>
              </article>
            </div>

            <aside>
              <SectionTitle title="الأكثر قراءة" />
              <ol className="space-y-3">
                {mostRead.map((n: NewsItem, i: number) => (
                  <ItemLink key={n.id} item={n}>
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
              {!isReadMode && (
                <div className="mt-4 flex justify-center">
                  <AdsterraBanner adKey="91f05df6cbf845d8e04afcfd101061c8" width={300} height={250} />
                </div>
              )}
            </aside>

          </div>
        </section>

        <section className="container mx-auto px-4 py-6">
          <SectionTitle title="آراء الكتّاب" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {opinions.map((o) => (
              <article key={o.id} className="news-card group bg-card border border-border rounded-lg p-4 flex gap-4 items-start">
                <img src={o.image} alt={o.source} loading="lazy" className="h-16 w-16 rounded-full object-cover border-2 border-gold shrink-0" />
                <div>
                  <div className="text-xs font-bold text-gold">{o.source}</div>
                  <h3 className="text-base font-bold text-primary mt-1 leading-snug group-hover:text-gold transition-colors line-clamp-3">{o.title}</h3>
                  <div className="text-[11px] text-muted-foreground mt-2"><span suppressHydrationWarning>{o.timeAgo}</span></div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-6">
          <SectionTitle title="الصور الملهمة" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {gallery.map((g) => (
              <figure key={g.id} className="relative overflow-hidden rounded-md group news-card">
                <img src={g.image} alt={g.caption} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent text-white text-sm font-bold p-3">{g.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>

      </main>


      <Footer />
    </div>
  );
}
