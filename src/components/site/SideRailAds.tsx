import { AdsterraBanner } from "./AdsterraAd";

/**
 * إعلانات جانبية ثابتة (Skyscraper) على يمين ويسار الصفحة.
 * تظهر فقط على الشاشات الكبيرة (≥ 1280px) لتجنّب التداخل مع المحتوى.
 */
export function SideRailAds() {
  return (
    <>
      {/* الجانب الأيسر */}
      <aside
        className="hidden xl:flex fixed left-2 top-32 z-30 flex-col items-center gap-2 pointer-events-auto"
        aria-label="إعلان جانبي"
      >
        <AdsterraBanner adKey="85d785d2e3eb2b59240de17f347d15c9" width={160} height={600} />
      </aside>

      {/* الجانب الأيمن */}
      <aside
        className="hidden xl:flex fixed right-2 top-32 z-30 flex-col items-center gap-2 pointer-events-auto"
        aria-label="إعلان جانبي"
      >
        <AdsterraBanner adKey="9fa4dda683744d44af1745cccfc0f432" width={160} height={300} />
      </aside>
    </>
  );
}
