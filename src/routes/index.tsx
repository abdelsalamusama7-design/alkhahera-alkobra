import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/site/TopBar";
import { Header } from "@/components/site/Header";
import { NavBar } from "@/components/site/NavBar";
import { BreakingTicker } from "@/components/site/BreakingTicker";
import { NewsCard } from "@/components/site/NewsCard";
import { MarketsWidget, WeatherWidget, SportsWidget } from "@/components/site/Widgets";
import { Footer } from "@/components/site/Footer";
import { heroNews, latestNews, reports, opinions, gallery } from "@/data/news";

export const Route = createFileRoute("/")({
  component: Index,
});

function SectionTitle({ title, accent }: { title: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between mb-4 border-b-2 border-primary pb-2">
      <h2 className="text-xl md:text-2xl font-extrabold text-primary flex items-center gap-2">
        <span className="inline-block w-1.5 h-6 bg-gold rounded" />
        {title}
      </h2>
      {accent && (
        <a href="#" className="text-xs font-bold text-gold hover:underline">
          {accent}
        </a>
      )}
    </div>
  );
}

function Index() {
  const [hero, ...sideHero] = heroNews;
  const mostRead = latestNews.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <TopBar />
      <Header />
      <NavBar />
      <BreakingTicker />

      <main className="flex-1">
        {/* HERO */}
        <section className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <NewsCard item={hero} size="hero" />
            </div>
            <div className="flex flex-col gap-4">
              {sideHero.map((n) => (
                <NewsCard key={n.id} item={n} size="large" />
              ))}
            </div>
          </div>
        </section>

        {/* LATEST GRID */}
        <section className="container mx-auto px-4 py-6">
          <SectionTitle title="آخر الأخبار" accent="عرض المزيد" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {latestNews.map((n) => (
              <NewsCard key={n.id} item={n} />
            ))}
          </div>
        </section>

        {/* WIDGETS ROW */}
        <section className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <WeatherWidget />
            <MarketsWidget />
            <SportsWidget />
          </div>
        </section>

        {/* REPORTS + MOST READ */}
        <section className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SectionTitle title="تقارير وحوارات" />
              <article className="news-card group overflow-hidden rounded-lg bg-card border border-border">
                <div className="relative aspect-[16/8] overflow-hidden">
                  <img
                    src={reports[0].image}
                    alt={reports[0].title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-3 right-3 bg-gold text-gold-foreground px-3 py-1 text-xs font-extrabold rounded">
                    تقرير خاص
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl md:text-2xl font-extrabold text-primary leading-snug group-hover:text-gold transition-colors">
                    {reports[0].title}
                  </h3>
                  {reports[0].excerpt && (
                    <p className="text-sm md:text-base text-muted-foreground mt-3 leading-relaxed">
                      {reports[0].excerpt}
                    </p>
                  )}
                  <div className="mt-4 text-xs text-muted-foreground">
                    {reports[0].source} • {reports[0].timeAgo}
                  </div>
                </div>
              </article>
            </div>

            <aside>
              <SectionTitle title="الأكثر قراءة" />
              <ol className="space-y-3">
                {mostRead.map((n, i) => (
                  <li key={n.id} className="flex items-start gap-3 bg-card p-3 rounded-md border border-border news-card group">
                    <span className="text-3xl font-extrabold text-gold leading-none w-8 shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-gold mb-1">{n.category}</div>
                      <h4 className="text-sm font-bold text-primary leading-snug line-clamp-3 group-hover:text-gold transition-colors">
                        {n.title}
                      </h4>
                    </div>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </section>

        {/* OPINIONS */}
        <section className="container mx-auto px-4 py-6">
          <SectionTitle title="آراء الكتّاب" accent="جميع المقالات" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {opinions.map((o) => (
              <article key={o.id} className="news-card group bg-card border border-border rounded-lg p-4 flex gap-4 items-start">
                <img
                  src={o.image}
                  alt={o.source}
                  loading="lazy"
                  className="h-16 w-16 rounded-full object-cover border-2 border-gold shrink-0"
                />
                <div>
                  <div className="text-xs font-bold text-gold">{o.source}</div>
                  <h3 className="text-base font-bold text-primary mt-1 leading-snug group-hover:text-gold transition-colors line-clamp-3">
                    {o.title}
                  </h3>
                  <div className="text-[11px] text-muted-foreground mt-2">{o.timeAgo}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* GALLERY */}
        <section className="container mx-auto px-4 py-6">
          <SectionTitle title="الصور الملهمة" accent="عرض الكل" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {gallery.map((g) => (
              <figure key={g.id} className="relative overflow-hidden rounded-md group news-card">
                <img
                  src={g.image}
                  alt={g.caption}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent text-white text-sm font-bold p-3">
                  {g.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </main>

      <Footer />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsMediaOrganization",
            name: "القاهرة الكبرى",
            url: "https://cairo-elkobra.com",
            description: "بوابة الأخبار المصرية والعربية - القاهرة الكبرى",
          }),
        }}
      />
    </div>
  );
}
