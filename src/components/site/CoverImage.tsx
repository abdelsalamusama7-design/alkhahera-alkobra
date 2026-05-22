import { useState } from "react";
import { cn } from "@/lib/utils";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&h=750&q=80";

type Ratio = "16/9" | "16/10" | "4/3" | "1/1" | "3/2" | "16/8";

type Props = {
  src?: string | null;
  alt: string;
  ratio?: Ratio;
  /** نسبة بديلة على شاشات sm وأعلى */
  smRatio?: Ratio;
  /** يفضّل الجزء العلوي من الصورة (مناسب للوجوه/العناوين فوق) */
  focus?: "top" | "center" | "bottom";
  /** أولوية تحميل الصورة الرئيسية */
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  /** عرض تقريبي بالبكسل لتوليد srcset (افتراضي 1200) */
  sizeHint?: number;
  /** أبعاد إضافية تُغلّف الصورة (مثلًا overlay/badges) */
  children?: React.ReactNode;
};

const RATIO_CLASS: Record<Ratio, string> = {
  "16/9": "aspect-[16/9]",
  "16/10": "aspect-[16/10]",
  "16/8": "aspect-[16/8]",
  "4/3": "aspect-[4/3]",
  "3/2": "aspect-[3/2]",
  "1/1": "aspect-square",
};
const SM_RATIO_CLASS: Record<Ratio, string> = {
  "16/9": "sm:aspect-[16/9]",
  "16/10": "sm:aspect-[16/10]",
  "16/8": "sm:aspect-[16/8]",
  "4/3": "sm:aspect-[4/3]",
  "3/2": "sm:aspect-[3/2]",
  "1/1": "sm:aspect-square",
};

const FOCUS_CLASS: Record<NonNullable<Props["focus"]>, string> = {
  top: "object-top",
  center: "object-center",
  bottom: "object-bottom",
};

/** يحسّن روابط Unsplash تلقائيًا بالتركيز على الوجوه والحواف. */
function optimizeSrc(src: string, width: number, ratio: Ratio): string {
  try {
    const u = new URL(src);
    if (u.hostname.includes("images.unsplash.com")) {
      const [rw, rh] = ratio.split("/").map(Number);
      const h = Math.round((width * rh) / rw);
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "crop");
      if (!u.searchParams.get("crop")) u.searchParams.set("crop", "faces,edges");
      u.searchParams.set("w", String(width));
      u.searchParams.set("h", String(h));
      if (!u.searchParams.get("q")) u.searchParams.set("q", "80");
      return u.toString();
    }
    return src;
  } catch {
    return src;
  }
}

function buildSrcSet(src: string, ratio: Ratio): string | undefined {
  try {
    const u = new URL(src);
    if (!u.hostname.includes("images.unsplash.com")) return undefined;
    return [400, 800, 1200, 1600]
      .map((w) => `${optimizeSrc(src, w, ratio)} ${w}w`)
      .join(", ");
  } catch {
    return undefined;
  }
}

export function CoverImage({
  src,
  alt,
  ratio = "16/9",
  smRatio,
  focus = "top",
  priority = false,
  className,
  imgClassName,
  sizeHint = 1200,
  children,
}: Props) {
  const initial = src && src.trim() ? src : FALLBACK_IMG;
  const [current, setCurrent] = useState(initial);
  const [loaded, setLoaded] = useState(false);

  const optimized = optimizeSrc(current, sizeHint, ratio);
  const srcSet = buildSrcSet(current, ratio);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-muted",
        RATIO_CLASS[ratio],
        smRatio ? SM_RATIO_CLASS[smRatio] : null,
        className,
      )}
    >
      {/* skeleton */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-muted to-muted/60 animate-pulse",
          loaded && "opacity-0 transition-opacity duration-300",
        )}
        aria-hidden
      />
      <img
        src={optimized}
        srcSet={srcSet}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (current !== FALLBACK_IMG) {
            setCurrent(FALLBACK_IMG);
            setLoaded(false);
          } else {
            setLoaded(true);
          }
        }}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-transform duration-500",
          FOCUS_CLASS[focus],
          loaded ? "opacity-100" : "opacity-0",
          imgClassName,
        )}
      />
      {children}
    </div>
  );
}
