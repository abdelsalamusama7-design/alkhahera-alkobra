// Server-only helpers for traffic analytics: UA parsing + referrer source detection.

const SEARCH_HOSTS = [
  "google.", "bing.", "yahoo.", "duckduckgo.", "yandex.", "baidu.",
  "ecosia.", "qwant.", "naver.", "ask.com",
];
const SOCIAL_HOSTS = [
  "facebook.", "fb.com", "fb.me", "twitter.", "x.com", "t.co",
  "instagram.", "linkedin.", "lnkd.in", "youtube.", "youtu.be",
  "tiktok.", "reddit.", "whatsapp.", "wa.me", "telegram.", "t.me",
  "pinterest.", "snapchat.", "threads.net",
];

export type SourceType = "direct" | "search" | "social" | "referral";
export type DeviceType = "mobile" | "tablet" | "desktop" | "bot" | "unknown";

export function classifyReferrer(referrer: string | null | undefined, currentHost?: string | null): {
  source_type: SourceType;
  referrer_host: string | null;
} {
  if (!referrer) return { source_type: "direct", referrer_host: null };
  let host = "";
  try { host = new URL(referrer).hostname.toLowerCase(); } catch { return { source_type: "direct", referrer_host: null }; }
  if (!host) return { source_type: "direct", referrer_host: null };
  if (currentHost && host === currentHost.toLowerCase()) {
    return { source_type: "direct", referrer_host: host };
  }
  if (SEARCH_HOSTS.some((h) => host.includes(h))) return { source_type: "search", referrer_host: host };
  if (SOCIAL_HOSTS.some((h) => host.includes(h))) return { source_type: "social", referrer_host: host };
  return { source_type: "referral", referrer_host: host };
}

export function detectDevice(ua: string | null | undefined): DeviceType {
  if (!ua) return "unknown";
  const s = ua.toLowerCase();
  if (/bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp/.test(s)) return "bot";
  if (/ipad|tablet|playbook|silk(?!.*mobile)/.test(s)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini/.test(s)) return "mobile";
  return "desktop";
}

export function getSourceLabelAr(s: string): string {
  switch (s) {
    case "search": return "بحث";
    case "social": return "وسائل التواصل";
    case "referral": return "إحالات";
    case "direct": return "مباشر";
    default: return s;
  }
}

export function getDeviceLabelAr(d: string): string {
  switch (d) {
    case "mobile": return "موبايل";
    case "tablet": return "تابلت";
    case "desktop": return "حاسوب";
    case "bot": return "بوت";
    default: return "غير معروف";
  }
}
