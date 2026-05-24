import { AdsterraBanner } from "./AdsterraAd";

/**
 * إعلانات جانبية حقيقية من Adsterra على جانبي الصفحة (CPM — ربح بالمشاهدة).
 * تظهر من شاشات lg (≥ 1024px) فما فوق لزيادة الـ impressions.
 * كل جانب يعرض Skyscraper 160x600 — وحدة عالية الربح بالظهور.
 */
export function SideRailAds() {
  return (
    <>
      {/* الجانب الأيسر */}
      <aside
        className="hidden lg:flex fixed left-1 top-28 z-30 flex-col items-center gap-3 pointer-events-auto"
        aria-label="إعلان جانبي"
      >
        <AdsterraBanner adKey="85d785d2e3eb2b59240de17f347d15c9" width={160} height={600} />
      </aside>

      {/* الجانب الأيمن */}
      <aside
        className="hidden lg:flex fixed right-1 top-28 z-30 flex-col items-center gap-3 pointer-events-auto"
        aria-label="إعلان جانبي"
      >
        <AdsterraBanner adKey="85d785d2e3eb2b59240de17f347d15c9" width={160} height={600} />
      </aside>
    </>
  );
}
