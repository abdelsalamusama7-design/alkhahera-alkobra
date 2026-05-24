import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getActivePlacementsFn,
  trackAdEventFn,
  type AdPlacementRow,
} from "@/lib/ad-placements.functions";
import { SponsoredLink } from "./SponsoredLink";
import { AdsterraBanner } from "./AdsterraAd";

/**
 * Flash Ad — يفتح بعد 20 ثانية من دخول الزائر بملء الشاشة.
 * • زر X لإغلاقه فورًا.
 * • يُغلق تلقائيًا بعد 3 ثوانٍ.
 * • يعرض إعلان من منصة الربح (slot=flash, name=flash ad).
 * • يُجدّد نفسه تلقائيًا (remount + إعادة جلب) إن لم يتم تسجيل ظهور خلال ثانيتين (يعتبره عطلًا).
 * • يظهر مرة واحدة لكل جلسة لتجنّب الإزعاج.
 */

const SESSION_FLAG = "kk_flash_ad_shown_v1";
const SHOW_DELAY_MS = 20_000;
const AUTO_CLOSE_MS = 3_000;
const BROKEN_TIMEOUT_MS = 2_000;
const MAX_RETRIES = 3;

export function FlashAdOverlay() {
  const [open, setOpen] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const retriesRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_FLAG) === "1") return;
    } catch {}

    const t = window.setTimeout(() => {
      setOpen(true);
      try { sessionStorage.setItem(SESSION_FLAG, "1"); } catch {}
    }, SHOW_DELAY_MS);

    return () => window.clearTimeout(t);
  }, []);

  // إغلاق تلقائي بعد 3 ثوانٍ من الفتح
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => setOpen(false), AUTO_CLOSE_MS);
    return () => window.clearTimeout(t);
  }, [open, renderKey]);

  // غلق بزر Esc كذلك
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="إعلان فلاش"
      data-no-ad="true"
      className="fixed inset-0 z-[2147483600] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <button
        type="button"
        data-no-ad="true"
        aria-label="إغلاق الإعلان"
        onClick={() => setOpen(false)}
        className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-transform border-4 border-gold"
      >
        <X size={26} strokeWidth={3} />
      </button>

      <div className="relative w-full max-w-3xl">
        <FlashAdContent
          key={renderKey}
          onBroken={() => {
            if (retriesRef.current >= MAX_RETRIES) return;
            retriesRef.current += 1;
            setRenderKey((k) => k + 1);
          }}
        />
      </div>
    </div>
  );
}

function FlashAdContent({ onBroken }: { onBroken: () => void }) {
  const fetchFn = useServerFn(getActivePlacementsFn);
  const { data, isError } = useQuery({
    queryKey: ["ad-placements-active"],
    queryFn: () => fetchFn(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const placement = (data ?? []).find((p) => (p.slot as string) === "flash");

  // كشف عطل: إن لم يصل impression خلال مهلة قصيرة، أعد التركيب
  const impressionRef = useRef(false);
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!impressionRef.current) onBroken();
    }, BROKEN_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [onBroken, placement?.id]);

  if (isError || !placement) {
    return <FallbackAd onShown={() => { impressionRef.current = true; }} />;
  }

  return (
    <TrackedFlashAd
      placement={placement}
      onShown={() => { impressionRef.current = true; }}
    />
  );
}

function TrackedFlashAd({
  placement,
  onShown,
}: {
  placement: AdPlacementRow;
  onShown: () => void;
}) {
  const trackFn = useServerFn(trackAdEventFn);

  useEffect(() => {
    onShown();
    trackFn({ data: { id: placement.id, kind: "impression" } }).catch(() => {});
  }, [placement.id, trackFn, onShown]);

  const onClickCapture = () => {
    trackFn({ data: { id: placement.id, kind: "click" } }).catch(() => {});
  };

  return (
    <div
      onClickCapture={onClickCapture}
      data-ad-id={placement.id}
      data-ad-slot="flash"
      className="rounded-2xl overflow-hidden bg-card border-2 border-gold shadow-2xl"
    >
      <div className="bg-gold text-gold-foreground text-xs font-extrabold px-4 py-2 text-center tracking-wider">
        إعلان مموَّل
      </div>
      <div className="p-6 md:p-8">
        <FlashRender placement={placement} />
      </div>
    </div>
  );
}

function FlashRender({ placement: p }: { placement: AdPlacementRow }) {
  const cfg = p.config || {};
  switch (p.type) {
    case "smartlink-banner":
      return <SponsoredLink variant="card" label={cfg.label || "عروض حصرية الآن"} />;
    case "smartlink-context":
      return <SponsoredLink variant="inline" kind="CONTEXT_LINK" label={cfg.label} />;
    case "smartlink-download":
      return <SponsoredLink variant="card" kind="DOWNLOAD_BTN" label={cfg.label || "حمّل الآن"} />;
    case "adsterra-banner":
      if (!cfg.adKey || !cfg.width || !cfg.height) return <FallbackAd onShown={() => {}} />;
      return <AdsterraBanner adKey={cfg.adKey} width={cfg.width} height={cfg.height} />;
    case "custom-html":
      if (!cfg.html) return <FallbackAd onShown={() => {}} />;
      return <div dangerouslySetInnerHTML={{ __html: cfg.html }} />;
    default:
      return <FallbackAd onShown={() => {}} />;
  }
}

function FallbackAd({ onShown }: { onShown: () => void }) {
  useEffect(() => { onShown(); }, [onShown]);
  return (
    <div className="rounded-2xl overflow-hidden bg-card border-2 border-gold shadow-2xl">
      <div className="bg-gold text-gold-foreground text-xs font-extrabold px-4 py-2 text-center tracking-wider">
        إعلان مموَّل
      </div>
      <div className="p-6">
        <SponsoredLink variant="card" label="عروض ومكافآت حصرية اليوم — جرّب الآن واربح فورًا" />
      </div>
    </div>
  );
}
