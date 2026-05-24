import { AdsterraBanner } from "./AdsterraAd";

/**
 * إعلانات جانبية (Skyscraper 160x600) على جانبي الصفحة.
 * تظهر فقط على الشاشات الواسعة جدًا (≥ 1640px) لضمان عدم تداخلها
 * مع حاوية المحتوى (container ≈ 1280px) — 160px لكل جانب + هامش.
 */
export function SideRailAds() {
  return (
    <>
      <aside
        className="hidden min-[1640px]:flex fixed left-2 top-28 z-30 flex-col items-center gap-3 pointer-events-auto"
        aria-label="إعلان جانبي"
      >
        <AdsterraBanner adKey="85d785d2e3eb2b59240de17f347d15c9" width={160} height={600} />
      </aside>

      <aside
        className="hidden min-[1640px]:flex fixed right-2 top-28 z-30 flex-col items-center gap-3 pointer-events-auto"
        aria-label="إعلان جانبي"
      >
        <AdsterraBanner adKey="85d785d2e3eb2b59240de17f347d15c9" width={160} height={600} />
      </aside>
    </>
  );
}

