import { TimeAgo } from "@/components/site/TimeAgo";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getArticleBySlug } from "@/lib/articles.functions";
import { logArticleView } from "@/lib/traffic.functions";
import { TopBar } from "@/components/site/TopBar";
import { Header } from "@/components/site/Header";
import { NavBar } from "@/components/site/NavBar";
import { AdBanner } from "@/components/site/AdBanner";
import { SponsoredLink } from "@/components/site/SponsoredLink";
import { AdSlot } from "@/components/site/AdSlot";
import { CoverImage } from "@/components/site/CoverImage";
import { Footer } from "@/components/site/Footer";
import { ArticleVoice } from "@/components/site/ArticleVoice";
import { formatArabicDate } from "@/lib/format";
import { Facebook, Twitter, Linkedin, Link2, Clock, User } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/article/$slug")({
  loader: async ({ params }) => {
    const res = await getArticleBySlug({ data: { slug: params.slug } });
    if (!res.article) throw notFound();
    return res;
  },
  head: ({ loaderData, params }) => {
    const a = loaderData?.article;
    if (!a) return { meta: [{ title: "خبر — القاهرة الكبرى" }] };
    const SITE = "https://kaheraalkobra.online";
    const url = `${SITE}/article/${params.slug}`;
    const desc = (a.excerpt ?? a.title ?? "").toString().slice(0, 160);
    const rawImg = a.cover_image || undefined;
    const img = rawImg
      ? (rawImg.startsWith("http") ? rawImg : `${SITE}${rawImg.startsWith("/") ? "" : "/"}${rawImg}`)
      : undefined;
    const categoryName = a.category?.name ?? "أخبار";
    const categorySlug = a.category?.slug;
    return {
      meta: [
        { title: `${a.title} — القاهرة الكبرى` },
        { name: "description", content: desc },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
        { name: "news_keywords", content: Array.isArray((a as any).tags) ? (a as any).tags.join(", ") : "" },
        { property: "og:title", content: a.title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:locale", content: "ar_EG" },
        { property: "article:published_time", content: a.published_at ?? "" },
        { property: "article:modified_time", content: (a as any).updated_at ?? a.published_at ?? "" },
        { property: "article:section", content: categoryName },
        ...(a.author_name ? [{ property: "article:author", content: a.author_name }] : []),
        ...(img ? [{ property: "og:image", content: img }] : []),
        ...(img ? [{ property: "og:image:alt", content: a.title }] : []),
        ...(img ? [{ name: "twitter:image", content: img }] : []),
        { name: "twitter:card", content: img ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: a.title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: a.title?.toString().slice(0, 110),
            description: desc,
            image: img ? [img] : undefined,
            datePublished: a.published_at,
            dateModified: (a as any).updated_at ?? a.published_at,
            inLanguage: "ar",
            isAccessibleForFree: true,
            articleSection: categoryName,
            keywords: Array.isArray((a as any).tags) ? (a as any).tags.join(", ") : undefined,
            author: a.author_name
              ? { "@type": "Person", name: a.author_name }
              : { "@type": "Organization", name: "القاهرة الكبرى", url: SITE },
            publisher: {
              "@type": "NewsMediaOrganization",
              name: "القاهرة الكبرى",
              url: SITE,
              logo: {
                "@type": "ImageObject",
                url: `${SITE}/favicon.png`,
              },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE },
              ...(categorySlug
                ? [{ "@type": "ListItem", position: 2, name: categoryName, item: `${SITE}/category/${categorySlug}` }]
                : []),
              { "@type": "ListItem", position: categorySlug ? 3 : 2, name: a.title, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: ArticlePage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-primary mb-2">الخبر غير موجود</h1>
        <Link to="/" className="text-gold hover:underline">العودة للرئيسية</Link>
      </div>
    </div>
  ),
});

function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent(url);
  const encT = encodeURIComponent(title);
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold text-primary ml-2">شارك:</span>
      <a target="_blank" rel="noopener" href={`https://www.facebook.com/sharer/sharer.php?u=${enc}`} className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground transition-colors" aria-label="فيسبوك"><Facebook size={16} /></a>
      <a target="_blank" rel="noopener" href={`https://twitter.com/intent/tweet?url=${enc}&text=${encT}`} className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground transition-colors" aria-label="تويتر"><Twitter size={16} /></a>
      <a target="_blank" rel="noopener" href={`https://wa.me/?text=${encT}%20${enc}`} className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground transition-colors" aria-label="واتساب">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5 0 1.5 1.1 2.9 1.2 3.1.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.8-1.4c1.5.9 3.3 1.4 5.2 1.4 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
      </a>
      <a target="_blank" rel="noopener" href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc}`} className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground transition-colors" aria-label="لينكدإن"><Linkedin size={16} /></a>
      <button onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground transition-colors" aria-label="نسخ الرابط">
        <Link2 size={16} />
      </button>
      {copied && <span className="text-xs text-emerald-600 font-bold">تم النسخ</span>}
    </div>
  );
}

function ArticlePage() {
  const { article, related } = Route.useLoaderData() as any;
  const params = Route.useParams();
  const { data } = useQuery({
    queryKey: ["article", params.slug],
    queryFn: () => getArticleBySlug({ data: { slug: params.slug } }),
    initialData: { article, related },
    staleTime: 60_000,
  });
  const a = data.article!;
  const url = typeof window !== "undefined" ? window.location.href : `https://alkhahera-alkobra.lovable.app/article/${a.slug}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    logArticleView({
      data: {
        slug: a.slug,
        referrer: document.referrer || null,
        path: window.location.pathname,
      },
    }).catch(() => {});
  }, [a.slug]);

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <TopBar />
      <Header />
      <NavBar />
      <AdBanner />

      <main className="flex-1">
        {/* HERO: صورة الغلاف بعرض كامل مع التدرّج والعنوان فوقها */}
        {a.cover_image && (
          <section className="relative w-full bg-black">
            <div className="relative w-full max-h-[70vh] overflow-hidden">
              <CoverImage
                src={a.cover_image}
                alt={a.title}
                ratio="16/9"
                smRatio="16/9"
                focus="top"
                priority
                sizeHint={1920}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 container mx-auto px-4 pb-6 md:pb-10">
                <div className="max-w-4xl">
                  {a.category && (
                    <Link
                      to="/category/$slug"
                      params={{ slug: a.category.slug }}
                      className="inline-block bg-gold text-gold-foreground px-3 py-1 text-xs font-extrabold rounded mb-3"
                    >
                      {a.category.name}
                    </Link>
                  )}
                  {a.is_breaking && (
                    <span className="inline-block bg-breaking text-white px-3 py-1 text-xs font-extrabold rounded mb-3 mr-2 animate-pulse">عاجل</span>
                  )}
                  <h1 className="text-2xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-lg">
                    {a.title}
                  </h1>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="container mx-auto px-4 py-6 md:py-8">
          <nav className="text-xs text-muted-foreground mb-4">
            <Link to="/" className="hover:text-gold">الرئيسية</Link>
            {a.category && (
              <>
                {" / "}
                <Link to="/category/$slug" params={{ slug: a.category.slug }} className="hover:text-gold">{a.category.name}</Link>
              </>
            )}
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* شريط مشاركة عمودي ثابت — ديسكتوب */}
            <aside className="hidden lg:flex lg:col-span-1 flex-col items-center">
              <div className="sticky top-24 flex flex-col gap-3 items-center">
                <VerticalShareButtons url={url} title={a.title} />
              </div>
            </aside>

            <article className="lg:col-span-8">
              {!a.cover_image && (
                <>
                  {a.category && (
                    <span className="inline-block bg-gold text-gold-foreground px-3 py-1 text-xs font-extrabold rounded mb-3">{a.category.name}</span>
                  )}
                  <h1 className="text-2xl md:text-4xl font-extrabold text-primary leading-tight mb-4">{a.title}</h1>
                </>
              )}

              {a.excerpt && (
                <p className="text-lg md:text-xl text-foreground/85 leading-relaxed mb-5 font-semibold border-r-4 border-gold pr-4">
                  {a.excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground border-y border-border py-3 mb-5">
                <div className="flex flex-wrap items-center gap-3">
                  {a.author_name && (
                    <span className="flex items-center gap-1"><User size={14} />{a.author_name}</span>
                  )}
                  {a.source && (
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded font-bold text-xs">
                      {a.source}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end text-xs leading-tight">
                  <span>نُشر في: {formatArabicDate(a.published_at)}</span>
                  {(a as any).updated_at && (a as any).updated_at !== a.published_at && (
                    <span className="text-muted-foreground/80">آخر تحديث: {formatArabicDate((a as any).updated_at)}</span>
                  )}
                  <span className="text-gold font-bold mt-0.5"><TimeAgo iso={a.published_at} /></span>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-3 mb-6">
                <ArticleVoice title={a.title} excerpt={a.excerpt} content={a.content} />
              </div>

              <AdSlot slot="article-top" className="my-4" />

              <div className="prose prose-lg max-w-none text-foreground leading-loose text-base md:text-lg whitespace-pre-line">
                {a.content || a.excerpt}
              </div>

              <AdSlot slot="article-middle" className="my-6" />

              {/* مشاركة أفقية — موبايل */}
              <div className="lg:hidden mt-6 pt-4 border-t border-border">
                <ShareButtons url={url} title={a.title} />
              </div>

              {Array.isArray((a as any).tags) && (a as any).tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {((a as any).tags as string[]).map((t) => (
                    <Link
                      key={t}
                      to="/search"
                      search={{ q: t } as any}
                      className="text-sm bg-muted hover:bg-gold hover:text-gold-foreground transition-colors px-4 py-1.5 rounded-full border border-border font-bold text-primary"
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              )}

              {a.source_url && (
                <div className="mt-6 text-sm">
                  <a href={a.source_url} target="_blank" rel="noopener" className="text-gold hover:underline font-bold">
                    ← المصدر الأصلي
                  </a>
                </div>
              )}

              <AdSlot slot="article-bottom" className="my-6" />

              {/* اقرأ أيضاً */}
              {data.related && data.related.length > 0 && (
                <section className="mt-10 pt-6 border-t-2 border-gold">
                  <h2 className="text-xl md:text-2xl font-extrabold text-primary mb-5">اقرأ أيضاً</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(data.related ?? []).slice(0, 4).map((r: any) => (
                      <Link key={r.id} to="/article/$slug" params={{ slug: r.slug }} className="block group">
                        <article className="flex gap-3 bg-card p-3 rounded-lg border border-border news-card hover:border-gold transition-colors h-full">
                          {r.cover_image && (
                            <img src={r.cover_image} alt={r.title} className="h-24 w-28 shrink-0 rounded object-cover" loading="lazy" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm md:text-base font-bold text-primary leading-snug line-clamp-3 group-hover:text-gold transition-colors">{r.title}</h3>
                            <div className="text-[11px] text-muted-foreground mt-2"><TimeAgo iso={r.published_at} /></div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </article>

            {/* العمود الجانبي */}
            <aside className="lg:col-span-3 space-y-6">
              <AdSlot slot="sidebar" />
              <div>
                <h2 className="text-base font-extrabold text-primary border-b-2 border-gold pb-2 mb-3">الأكثر قراءة</h2>
                <div className="space-y-3">
                  {(data.related ?? []).slice(0, 5).map((r: any, i: number) => (
                    <Link key={r.id} to="/article/$slug" params={{ slug: r.slug }} className="block group">
                      <article className="flex gap-2 items-start">
                        <span className="text-2xl font-extrabold text-gold/70 leading-none w-6 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-primary leading-snug line-clamp-3 group-hover:text-gold transition-colors">{r.title}</h3>
                          <div className="text-[10px] text-muted-foreground mt-1"><TimeAgo iso={r.published_at} /></div>
                        </div>
                      </article>
                    </Link>
                  ))}
                  {(!data.related || data.related.length === 0) && (
                    <p className="text-sm text-muted-foreground">لا توجد أخبار مرتبطة بعد.</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              headline: a.title,
              datePublished: a.published_at,
              image: a.cover_image ? [a.cover_image] : undefined,
              author: { "@type": "Person", name: a.author_name || a.source },
              publisher: { "@type": "Organization", name: "القاهرة الكبرى" },
            }),
          }}
        />
      </main>
      <Footer />
    </div>
  );
}

/** شريط مشاركة عمودي — يظهر على الديسكتوب فقط */
function VerticalShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent(url);
  const encT = encodeURIComponent(title);
  const btn = "p-2.5 rounded-full bg-card border border-border text-primary hover:bg-gold hover:text-gold-foreground hover:border-gold transition-all shadow-sm";
  return (
    <>
      <span className="text-[10px] font-bold text-muted-foreground mb-1">شارك</span>
      <a target="_blank" rel="noopener" href={`https://www.facebook.com/sharer/sharer.php?u=${enc}`} className={btn} aria-label="فيسبوك"><Facebook size={18} /></a>
      <a target="_blank" rel="noopener" href={`https://twitter.com/intent/tweet?url=${enc}&text=${encT}`} className={btn} aria-label="تويتر"><Twitter size={18} /></a>
      <a target="_blank" rel="noopener" href={`https://t.me/share/url?url=${enc}&text=${encT}`} className={btn} aria-label="تليجرام">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>
      </a>
      <a target="_blank" rel="noopener" href={`https://wa.me/?text=${encT}%20${enc}`} className={btn} aria-label="واتساب">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5 0 1.5 1.1 2.9 1.2 3.1.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.8-1.4c1.5.9 3.3 1.4 5.2 1.4 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
      </a>
      <a target="_blank" rel="noopener" href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc}`} className={btn} aria-label="لينكدإن"><Linkedin size={18} /></a>
      <button onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className={btn} aria-label="نسخ الرابط">
        <Link2 size={18} />
      </button>
      {copied && <span className="text-[10px] text-emerald-600 font-bold mt-1">تم النسخ</span>}
    </>
  );
}
