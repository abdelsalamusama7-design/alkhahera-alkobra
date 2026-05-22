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
  head: ({ loaderData }) => {
    const a = loaderData?.article;
    if (!a) return { meta: [{ title: "خبر — القاهرة الكبرى" }] };
    return {
      meta: [
        { title: `${a.title} — القاهرة الكبرى` },
        { name: "description", content: a.excerpt ?? a.title },
        { property: "og:title", content: a.title },
        { property: "og:description", content: a.excerpt ?? a.title },
        { property: "og:type", content: "article" },
        ...(a.cover_image ? [{ property: "og:image", content: a.cover_image }] : []),
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

      <main className="flex-1 container mx-auto px-4 py-8">
        <nav className="text-xs text-muted-foreground mb-4">
          <Link to="/" className="hover:text-gold">الرئيسية</Link>
          {a.category && (
            <>
              {" / "}
              <Link to="/category/$slug" params={{ slug: a.category.slug }} className="hover:text-gold">{a.category.name}</Link>
            </>
          )}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <article className="lg:col-span-2">
            {a.category && (
              <span className="inline-block bg-gold text-gold-foreground px-3 py-1 text-xs font-extrabold rounded mb-3">{a.category.name}</span>
            )}
            {a.is_breaking && (
              <span className="inline-block bg-breaking text-white px-3 py-1 text-xs font-extrabold rounded mb-3 mr-2">عاجل</span>
            )}
            <h1 className="text-2xl md:text-4xl font-extrabold text-primary leading-tight mb-4">{a.title}</h1>
            {a.excerpt && <p className="text-lg text-muted-foreground leading-relaxed mb-6">{a.excerpt}</p>}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-y border-border py-3 mb-6">
              {a.author_name && <span className="flex items-center gap-1"><User size={14} />{a.author_name}</span>}
              <span className="flex items-center gap-1"><Clock size={14} />{formatArabicDate(a.published_at)} • <TimeAgo iso={a.published_at} /></span>
              <span className="font-semibold">{a.source}</span>
            </div>

            <ArticleVoice title={a.title} excerpt={a.excerpt} content={a.content} />

            {a.cover_image && (
              <figure className="mb-6 -mx-3 sm:mx-0">
                <CoverImage
                  src={a.cover_image}
                  alt={a.title}
                  ratio="4/3"
                  smRatio="16/9"
                  focus="top"
                  priority
                  sizeHint={1600}
                  className="sm:rounded-lg"
                />
              </figure>
            )}

            <div className="prose prose-lg max-w-none text-foreground leading-loose text-base md:text-lg whitespace-pre-line">
              {a.content || a.excerpt}
            </div>

            <div className="my-6">
              <SponsoredLink label="اقرأ المزيد من المحتوى المختار لك" />
            </div>

            {Array.isArray((a as any).tags) && (a as any).tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {((a as any).tags as string[]).map((t) => (
                  <Link
                    key={t}
                    to="/search"
                    search={{ q: t } as any}
                    className="text-xs bg-muted hover:bg-gold hover:text-gold-foreground transition-colors px-3 py-1 rounded-full border border-border font-bold text-primary"
                  >
                    #{t}
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

            <div className="mt-8 pt-6 border-t border-border">
              <ShareButtons url={url} title={a.title} />
            </div>
          </article>

          <aside className="lg:col-span-1">
            <h2 className="text-lg font-extrabold text-primary border-b-2 border-gold pb-2 mb-4">أخبار ذات صلة</h2>
            <div className="space-y-4">
              {(data.related ?? []).map((r: any) => (
                <Link key={r.id} to="/article/$slug" params={{ slug: r.slug }} className="block group">
                  <article className="flex gap-3 bg-card p-3 rounded-md border border-border news-card">
                    {r.cover_image && <img src={r.cover_image} alt={r.title} className="h-20 w-24 shrink-0 rounded object-cover" loading="lazy" />}
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
          </aside>
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
