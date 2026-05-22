/**
 * توزيع السمارت لينك حسب المكان داخل الموقع.
 * كل لينك بيتراقب لوحده في لوحة Adsterra عشان تعرف "المنطقة الذهبية".
 *
 * 1) DOWNLOAD_BTN  → أزرار التحميل / المعاينة / الأزرار الكبيرة (CTA)
 * 2) CONTEXT_LINK  → الروابط داخل نصوص المقالات (Anchor text)
 * 3) POPUNDER      → فتح في تاب جديد عند أول ضغطة من الزائر (Redirect)
 * 4) BANNER        → بانرات المحتوى المموّل العامة (Sidebar / Cards)
 */
export const SMARTLINKS = {
  DOWNLOAD_BTN:
    "https://revolthem.com/nqb3nvwtw?key=9aef419a4e1ff39475291adaa00a73f1",
  CONTEXT_LINK:
    "https://revolthem.com/fceqmdxp?key=6fc3e626e4860e73fbf29950c6bab95f",
  POPUNDER:
    "https://revolthem.com/fcak1w86u?key=238a4e91256cf9754a69ff2edfdecbef",
  POPUNDER_2: "https://omg10.com/4/11044564",
  BANNER:
    "https://revolthem.com/s6d4ai0a?key=220c7b8cdc8ee230678ab45b46bde510",
} as const;

export type SmartLinkKind = keyof typeof SMARTLINKS;

export function getSmartLink(kind: SmartLinkKind): string {
  return SMARTLINKS[kind];
}
