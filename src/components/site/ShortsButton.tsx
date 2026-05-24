import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Play, X, ChevronUp, ChevronDown, Share2 } from "lucide-react";
import { getHomeBundle } from "@/lib/articles.functions";

type Short = {
  id: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  slug: string;
  source?: string | null;
  category?: { name?: string } | null;
};

export function ShortsButton() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["home"],
    queryFn: () => getHomeBundle(),
    refetchInterval: 5 * 60_000,
    enabled: open,
  });

  const items: Short[] = ([
    ...((data as any)?.worldTop ?? []),
    ...((data as any)?.latest ?? []),
    ...((data as any)?.hero ?? []),
  ]
    .filter((a: any) => a?.slug && a?.cover_image)
    .reduce((acc: Short[], a: any) => {
      if (!acc.find((x) => x.id === a.id)) acc.push(a);
      return acc;
    }, [])
    .slice(0, 20));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") setIndex((i) => Math.min(items.length - 1, i + 1));
      if (e.key === "ArrowUp") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, items.length]);

  const current = items[index];

  const handleShare = async () => {
    if (!current) return;
    const url = `${window.location.origin}/article/${current.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: current.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="أخبار باختصار"
        data-shorts-fab
        className="fixed bottom-20 left-3 sm:bottom-24 sm:left-4 z-40 flex items-center gap-2 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-full p-2 sm:pl-2 sm:pr-4 sm:py-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        dir="rtl"
      >
        <span className="hidden sm:inline text-sm font-extrabold whitespace-nowrap">الأخبار باختصار</span>
        <span className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
          <Play className="h-5 w-5 fill-white" />
        </span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center"
          dir="rtl"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="إغلاق"
            className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Vertical nav arrows */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
            <button
              type="button"
              data-no-ad="true"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              aria-label="السابق"
              className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-lg transition"
            >
              <ChevronUp className="h-6 w-6" />
            </button>
            <button
              type="button"
              data-no-ad="true"
              onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
              disabled={index >= items.length - 1}
              aria-label="التالي"
              className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-lg transition"
            >
              <ChevronDown className="h-6 w-6" />
            </button>
          </div>


          {/* Card */}
          {current ? (
            <article
              ref={containerRef}
              className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-hidden rounded-2xl bg-neutral-900 text-white flex flex-col shadow-2xl"
            >
              {/* Brand bar */}
              <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full px-3 py-1.5 transition"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  شارك
                </button>
                <span className="text-lg font-extrabold text-white drop-shadow">القاهرة الكبرى</span>
              </div>

              {/* Image */}
              <div className="relative w-full aspect-video bg-neutral-800 shrink-0">
                <img
                  src={current.cover_image!}
                  alt={current.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <h2 className="text-xl md:text-2xl font-extrabold leading-snug text-white">
                  {current.title}
                </h2>
                {current.excerpt && (
                  <p className="text-sm md:text-base text-neutral-300 leading-relaxed line-clamp-6">
                    {current.excerpt}
                  </p>
                )}
              </div>

              {/* CTA */}
              <div className="p-4 border-t border-white/10">
                <Link
                  to="/article/$slug"
                  params={{ slug: current.slug }}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 rounded-lg transition"
                >
                  <span>قراءة الخبر</span>
                  <ChevronUp className="h-4 w-4 rotate-90" />
                </Link>
              </div>

              {/* Progress */}
              <div className="absolute top-16 inset-x-4 z-10 flex gap-1">
                {items.slice(0, Math.min(items.length, 10)).map((_, i) => (
                  <div
                    key={i}
                    className={`h-0.5 flex-1 rounded-full ${i === index ? "bg-red-500" : "bg-white/30"}`}
                  />
                ))}
              </div>
            </article>
          ) : (
            <div className="text-white text-center">
              <p>جاري التحميل...</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
