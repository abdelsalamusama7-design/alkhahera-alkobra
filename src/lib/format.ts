export function timeAgoAr(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return `منذ ${sec} ثانية`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `منذ ${min} دقيقة`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `منذ ${hr} ساعة`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `منذ ${d} يوم`;
  const m = Math.floor(d / 30);
  if (m < 12) return `منذ ${m} شهر`;
  return `منذ ${Math.floor(m / 12)} سنة`;
}

export function formatArabicDate(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleDateString("ar-EG-u-ca-gregory", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function slugify(text: string): string {
  return text
    .toString()
    .trim()
    .replace(/[\s\u00A0]+/g, "-")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
