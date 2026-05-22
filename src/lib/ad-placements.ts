/**
 * نظام إدارة "أماكن الإعلانات" (Ad Placements).
 * كل إعلان يُربط بـ "slot" (مكان) داخل الموقع.
 * تُحفظ القائمة في localStorage تحت `ad_placements_v1`.
 */

export const AD_SLOTS = [
  { key: "home-top", label: "الرئيسية — أعلى" },
  { key: "home-middle", label: "الرئيسية — منتصف" },
  { key: "home-bottom", label: "الرئيسية — أسفل" },
  { key: "article-top", label: "المقال — أعلى" },
  { key: "article-middle", label: "المقال — منتصف" },
  { key: "article-bottom", label: "المقال — أسفل" },
  { key: "sidebar", label: "الشريط الجانبي" },
  { key: "header", label: "أعلى الموقع (Header)" },
  { key: "footer", label: "أسفل الموقع (Footer)" },
] as const;

export type AdSlotKey = (typeof AD_SLOTS)[number]["key"];

export type AdPlacementType =
  | "smartlink-banner"   // كرت سمارت لينك بانر (يدوّر عشوائيًا)
  | "smartlink-context"  // رابط نصي (CONTEXT_LINK)
  | "smartlink-download" // زر CTA (DOWNLOAD_BTN)
  | "adsterra-banner"    // بانر Adsterra (adKey + width + height)
  | "monetag-zone"       // سكربت Monetag بـ data-zone مخصص
  | "custom-html";       // HTML خام

export type AdPlacement = {
  id: string;
  name: string;
  slot: AdSlotKey;
  type: AdPlacementType;
  enabled: boolean;
  order: number;
  // حقول خاصة بكل نوع — كلها اختيارية
  adKey?: string;      // Adsterra
  width?: number;      // Adsterra
  height?: number;     // Adsterra
  src?: string;        // Monetag script src
  zone?: string;       // Monetag data-zone
  html?: string;       // custom-html
  label?: string;      // ظاهر داخل بانر السمارت لينك
};

const STORAGE_KEY = "ad_placements_v1";

export const DEFAULT_PLACEMENTS: AdPlacement[] = [
  {
    id: "default-home-mid",
    name: "بانر سمارت لينك — منتصف الرئيسية",
    slot: "home-middle",
    type: "smartlink-banner",
    enabled: true,
    order: 0,
    label: "عروض حصرية اليوم — اطّلع الآن",
  },
  {
    id: "default-article-mid",
    name: "بانر سمارت لينك — منتصف المقال",
    slot: "article-middle",
    type: "smartlink-banner",
    enabled: true,
    order: 0,
    label: "محتوى مقترح لك",
  },
];

export function getPlacements(): AdPlacement[] {
  if (typeof window === "undefined") return DEFAULT_PLACEMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLACEMENTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_PLACEMENTS;
    return parsed as AdPlacement[];
  } catch {
    return DEFAULT_PLACEMENTS;
  }
}

export function savePlacements(list: AdPlacement[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  // إشعار المكوّنات للتحديث الفوري
  window.dispatchEvent(new CustomEvent("ad-placements-changed"));
}

export function getPlacementsBySlot(slot: AdSlotKey): AdPlacement[] {
  return getPlacements()
    .filter((p) => p.slot === slot && p.enabled)
    .sort((a, b) => a.order - b.order);
}

export function resetPlacements() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("ad-placements-changed"));
}
