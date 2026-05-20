import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { listArticles, listCategories } from "@/lib/articles.functions";
import { TopBar } from "@/components/site/TopBar";
import { Header } from "@/components/site/Header";
import { NavBar } from "@/components/site/NavBar";
import { Footer } from "@/components/site/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { timeAgoAr } from "@/lib/format";

type SearchParams = { q?: string; cat?: string; from?: string; to?: string; breaking?: string };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: (s.q as string) || "",
    cat: (s.cat as string) || "",
    from: (s.from as string) || "",
    to: (s.to as string) || "",
    breaking: (s.breaking as string) || "",
  }),
  head: () => ({ meta: [{ title: "البحث — القاهرة الكبرى" }] }),
  component: SearchPage,
});

function SearchPage() {
  const navigate = Route.useNavigate();
  const sp = Route.useSearch();
  const [q, setQ] = useState(sp.q || "");
  const [cat, setCat] = useState(sp.cat || "");
  const [from, setFrom] = useState(sp.from || "");
  const [to, setTo] = useState(sp.to || "");
  const [breaking, setBreaking] = useState(sp.breaking === "1");

  // sync URL <-> state
  useEffect(() => { setQ(sp.q || ""); setCat(sp.cat || ""); setFrom(sp.from || ""); setTo(sp.to || ""); setBreaking(sp.breaking === "1"); }, [sp.q, sp.cat, sp.from, sp.to, sp.breaking]);

  const { data: cats = [] } = useQuery({ queryKey: ["cats"], queryFn: () => listCategories() });
  const { data, isFetching } = useQuery({
    queryKey: ["search", sp.q, sp.cat, sp.from, sp.to, sp.breaking],
    queryFn: () => listArticles({
      data: {
        q: sp.q || undefined,
        categorySlug: sp.cat || undefined,
        from: sp.from ? new Date(sp.from).toISOString() : undefined,
        to: sp.to ? new Date(sp.to).toISOString() : undefined,
        breakingOnly: sp.breaking === "1",
        limit: 40,
      },
    }),
    placeholderData: (prev) => prev,
  });

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    navigate({
      search: {
        q: q || undefined,
        cat: cat || undefined,
        from: from || undefined,
        to: to || undefined,
        breaking: breaking ? "1" : undefined,
      } as any,
    });
  }

  // live search on q change with debounce
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== (sp.q || "")) apply();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <TopBar />
      <Header />
      <NavBar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-extrabold text-primary mb-4 flex items-center gap-2"><Search size={20} /> البحث في الموقع</h1>
        <form onSubmit={apply} className="bg-card border border-border rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="كلمة مفتاحية..." className="md:col-span-2" />
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">كل الأقسام</option>
            {cats.map((c: any) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <label className="flex items-center gap-2 text-sm font-bold text-primary md:col-span-2">
            <input type="checkbox" checked={breaking} onChange={(e) => setBreaking(e.target.checked)} />
            العاجل فقط
          </label>
          <Button type="submit" className="md:col-span-3">بحث</Button>
        </form>

        <div className="text-sm text-muted-foreground mb-4">
          {isFetching ? "جاري البحث..." : `${data?.total ?? 0} نتيجة`}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.items ?? []).map((a: any) => (
            <Link key={a.id} to="/article/$slug" params={{ slug: a.slug }} className="block">
              <article className="news-card group overflow-hidden rounded-md bg-card border border-border h-full">
                {a.cover_image && (
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={a.cover_image} alt={a.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                )}
                <div className="p-3">
                  {a.category && <div className="text-[10px] font-bold text-gold mb-1">{a.category.name}</div>}
                  <h3 className="text-sm font-bold text-primary leading-snug line-clamp-3 group-hover:text-gold transition-colors">{a.title}</h3>
                  <div className="mt-2 text-[11px] text-muted-foreground">{timeAgoAr(a.published_at)}</div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
