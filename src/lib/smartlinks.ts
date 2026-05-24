/**
 * توزيع السمارت لينك حسب المكان داخل الموقع.
 * القيم تُقرأ من إعدادات لوحة التحكم (localStorage) مع fallback للقيم الافتراضية.
 */
import { DEFAULT_AD_CONFIG, getAdConfig, type SmartlinkKey } from "./ad-config";

export type SmartLinkKind = SmartlinkKey;

export const SMARTLINKS = DEFAULT_AD_CONFIG.smartlinks;

export function getSmartLink(kind: SmartLinkKind): string {
  return getAdConfig().smartlinks[kind] ?? DEFAULT_AD_CONFIG.smartlinks[kind];
}

const BANNER_POOL: SmartLinkKind[] = ["BANNER", "BANNER_2", "BANNER_3", "BANNER_4", "BANNER_5", "BANNER_6"];
export function pickBannerKind(): SmartLinkKind {
  return BANNER_POOL[Math.floor(Math.random() * BANNER_POOL.length)];
}
