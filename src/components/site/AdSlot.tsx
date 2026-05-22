import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getActivePlacementsFn, type AdPlacementRow, type AdSlotKey } from "@/lib/ad-placements.functions";
import { SponsoredLink } from "./SponsoredLink";
import { AdsterraBanner } from "./AdsterraAd";

/**
 * يعرض كل الإعلانات المفعّلة لمكان (slot) معيّن — يقرأ من قاعدة البيانات.
 * يُعاد الجلب كل 5 دقائق ليلتقط أي استبدال تلقائي للإعلانات الميتة.
 */
export function AdSlot({ slot, className = "" }: { slot: AdSlotKey; className?: string }) {
  const fetchFn = useServerFn(getActivePlacementsFn);
  const { data } = useQuery({
    queryKey: ["ad-placements-active"],
    queryFn: () => fetchFn(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const items = (data ?? [])
    .filter((p) => p.slot === slot)
    .sort((a, b) => a.order_index - b.order_index);

  if (!items.length) return null;

  return (
    <div className={`flex flex-col gap-3 ${className}`} data-ad-slot={slot}>
      {items.map((p) => (
        <PlacementRender key={p.id} placement={p} />
      ))}
    </div>
  );
}

function PlacementRender({ placement: p }: { placement: AdPlacementRow }) {
  const cfg = p.config || {};
  switch (p.type) {
    case "smartlink-banner":
      return <SponsoredLink variant="card" label={cfg.label} />;
    case "smartlink-context":
      return <SponsoredLink variant="inline" kind="CONTEXT_LINK" label={cfg.label} />;
    case "smartlink-download":
      return <SponsoredLink variant="card" kind="DOWNLOAD_BTN" label={cfg.label || "حمّل الآن"} />;
    case "adsterra-banner":
      if (!cfg.adKey || !cfg.width || !cfg.height) return null;
      return <AdsterraBanner adKey={cfg.adKey} width={cfg.width} height={cfg.height} />;
    case "monetag-zone":
      return <MonetagZoneAd src={cfg.src} zone={cfg.zone} id={p.id} />;
    case "custom-html":
      if (!cfg.html) return null;
      return <div className="ad-custom" dangerouslySetInnerHTML={{ __html: cfg.html }} />;
    default:
      return null;
  }
}

function MonetagZoneAd({ src, zone, id }: { src?: string; zone?: string; id: string }) {
  useEffect(() => {
    if (!src || !zone) return;
    const attr = `data-monetag-placement="${id}"`;
    if (document.querySelector(`script[${attr}]`)) return;
    const s = document.createElement("script");
    s.src = src.startsWith("http") ? src : `https://${src}`;
    s.async = true;
    s.dataset.zone = zone;
    s.dataset.cfasync = "false";
    s.setAttribute("data-monetag-placement", id);
    document.body.appendChild(s);
    return () => {
      s.remove();
    };
  }, [src, zone, id]);
  return <div className="text-[10px] text-muted-foreground text-center opacity-50">إعلان</div>;
}
