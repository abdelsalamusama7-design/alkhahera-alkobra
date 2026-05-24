/**
 * إعدادات الإعلانات (Monetag / Adsterra) القابلة للتعديل من لوحة التحكم.
 * تُحفظ في localStorage تحت المفتاح `ad_config_v1`.
 * أي تغيير يأخذ فعله بعد إعادة تحميل الصفحة.
 */

export type SmartlinkKey =
  | "DOWNLOAD_BTN"
  | "CONTEXT_LINK"
  | "POPUNDER"
  | "POPUNDER_2"
  | "POPUNDER_3"
  | "BANNER"
  | "BANNER_2"
  | "BANNER_3"
  | "BANNER_4"
  | "BANNER_5"
  | "BANNER_6";

export type MonetagScript = {
  id: string;
  enabled: boolean;
  /** مثل: quge5.com/88/tag.min.js — بدون https:// */
  src: string;
  /** Zone ID (data-zone) */
  zone: string;
};

export type AdConfig = {
  smartlinks: Record<SmartlinkKey, string>;
  /** سكربتات Monetag Multitag المحقونة في <head> */
  monetag: MonetagScript[];
  /** Service Worker (sw.js) — للعرض فقط، يتطلب نشر الملف يدويًا */
  sw: { domain: string; zoneId: string };
};

export const DEFAULT_AD_CONFIG: AdConfig = {
  smartlinks: {
    DOWNLOAD_BTN: "https://revolthem.com/nqb3nvwtw?key=9aef419a4e1ff39475291adaa00a73f1",
    CONTEXT_LINK: "https://revolthem.com/fceqmdxp?key=6fc3e626e4860e73fbf29950c6bab95f",
    POPUNDER: "https://revolthem.com/fcak1w86u?key=238a4e91256cf9754a69ff2edfdecbef",
    POPUNDER_2: "https://omg10.com/4/11044564",
    POPUNDER_3: "https://revolthem.com/x6q7d9p2?key=a4c1b2f3e5d8e9f0a1b2c3d4e5f6a7b8",
    BANNER: "https://revolthem.com/s6d4ai0a?key=220c7b8cdc8ee230678ab45b46bde510",
    BANNER_2: "https://omg10.com/4/11044499",
    BANNER_3: "https://omg10.com/4/11044494",
    BANNER_4: "https://omg10.com/4/11044495",
    BANNER_5: "https://revolthem.com/m1n2o3p4?key=b5d2c3f4e6f7g8h9i0j1k2l3m4n5o6p7",
    BANNER_6: "https://omg10.com/4/11044601",
  },
  monetag: [
    { id: "quge5", enabled: false, src: "https://quge5.com/88/tag.min.js", zone: "242128" },
    { id: "quge5-242145", enabled: false, src: "https://quge5.com/88/tag.min.js", zone: "242145" },
    { id: "al5sm", enabled: false, src: "https://al5sm.com/tag.min.js", zone: "11044569" },
  ],
  sw: { domain: "3nbf4.com", zoneId: "11044543" },
};

const STORAGE_KEY = "ad_config_v1";

export function getAdConfig(): AdConfig {
  if (typeof window === "undefined") return DEFAULT_AD_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AD_CONFIG;
    const parsed = JSON.parse(raw) as Partial<AdConfig>;
    const savedMonetag = Array.isArray(parsed.monetag) && parsed.monetag.length ? parsed.monetag : [];
    const monetag = savedMonetag.length
      ? [
          ...savedMonetag,
          ...DEFAULT_AD_CONFIG.monetag.filter((m) => !savedMonetag.some((saved) => saved.id === m.id)),
        ]
      : DEFAULT_AD_CONFIG.monetag;
    return {
      smartlinks: { ...DEFAULT_AD_CONFIG.smartlinks, ...(parsed.smartlinks ?? {}) },
      monetag,
      sw: { ...DEFAULT_AD_CONFIG.sw, ...(parsed.sw ?? {}) },
    };
  } catch {
    return DEFAULT_AD_CONFIG;
  }
}

export function saveAdConfig(cfg: AdConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function resetAdConfig() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
