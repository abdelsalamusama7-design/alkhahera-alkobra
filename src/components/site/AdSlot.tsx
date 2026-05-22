import { useEffect, useState } from "react";
import {
  getPlacementsBySlot,
  type AdPlacement,
  type AdSlotKey,
} from "@/lib/ad-placements";
import { SponsoredLink } from "./SponsoredLink";
import { AdsterraBanner } from "./AdsterraAd";

/**
 * يعرض كل الإعلانات المفعّلة لمكان (slot) معيّن.
 * يستمع لحدث `ad-placements-changed` لتحديث فوري بعد الحفظ.
 */
export function AdSlot({ slot, className = "" }: { slot: AdSlotKey; className?: string }) {
  const [items, setItems] = useState<AdPlacement[]>([]);

  useEffect(() => {
    const load = () => setItems(getPlacementsBySlot(slot));
    load();
    window.addEventListener("ad-placements-changed", load);
    return () => window.removeEventListener("ad-placements-changed", load);
  }, [slot]);

  if (!items.length) return null;

  return (
    <div className={`flex flex-col gap-3 ${className}`} data-ad-slot={slot}>
      {items.map((p) => (
        <PlacementRender key={p.id} placement={p} />
      ))}
    </div>
  );
}

function PlacementRender({ placement: p }: { placement: AdPlacement }) {
  switch (p.type) {
    case "smartlink-banner":
      return <SponsoredLink variant="card" label={p.label} />;
    case "smartlink-context":
      return <SponsoredLink variant="inline" kind="CONTEXT_LINK" label={p.label} />;
    case "smartlink-download":
      return <SponsoredLink variant="card" kind="DOWNLOAD_BTN" label={p.label || "حمّل الآن"} />;
    case "adsterra-banner":
      if (!p.adKey || !p.width || !p.height) return null;
      return <AdsterraBanner adKey={p.adKey} width={p.width} height={p.height} />;
    case "monetag-zone":
      return <MonetagZoneAd src={p.src} zone={p.zone} id={p.id} />;
    case "custom-html":
      if (!p.html) return null;
      return <div className="ad-custom" dangerouslySetInnerHTML={{ __html: p.html }} />;
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
