// Client-safe label helpers for traffic analytics.
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
