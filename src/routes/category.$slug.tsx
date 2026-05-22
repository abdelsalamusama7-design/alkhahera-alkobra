import { TimeAgo } from "@/components/site/TimeAgo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listArticles, listCategories } from "@/lib/articles.functions";
import { TopBar } from "@/components/site/TopBar";
import { Header } from "@/components/site/Header";
import { NavBar } from "@/components/site/NavBar";
import { AdBanner } from "@/components/site/AdBanner";
import { CoverImage } from "@/components/site/CoverImage";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const [list, cats] = await Promise.all([
      listArticles({ data: { categorySlug: params.slug, limit: 30 } }),
      listCategories(),
    ]);
    const cat = cats.find((c: any) => c.slug === params.slug);
    return { list, catName: cat?.name ?? params.slug };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.catName ?? "قسم"} — القاهرة الكبرى` }],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const params = Route.useParams();
  const initial = Route.useLoaderData() as any;
  const { data } = useQuery({
    queryKey: ["cat", params.slug],
    queryFn: () => listArticles({ data: { categorySlug: params.slug, limit: 30 } }),
    initialData: initial.list,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <TopBar />
      <Header />
      <NavBar />
      <AdBanner />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-primary border-b-2 border-gold pb-2 mb-6">{initial.catName}</h1>
        {data.items.length === 0 ? (
          <p className="text-muted-foreground">لا توجد أخبار في هذا القسم بعد.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((a: any) => (
              <Link key={a.id} to="/article/$slug" params={{ slug: a.slug }} className="block">
                <article className="news-card group overflow-hidden rounded-md bg-card border border-border h-full">
                  {a.cover_image && (
                    <CoverImage
                      src={a.cover_image}
                      alt={a.title}
                      ratio="16/10"
                      smRatio="16/9"
                      focus="top"
                      sizeHint={800}
                      imgClassName="group-hover:scale-105"
                    />
                  )}
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-primary leading-snug line-clamp-3 group-hover:text-gold transition-colors">{a.title}</h3>
                    <div className="mt-2 text-[11px] text-muted-foreground"><TimeAgo iso={a.published_at} /></div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
