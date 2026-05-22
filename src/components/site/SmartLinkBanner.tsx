import { ExternalLink } from "lucide-react";
import { SMARTLINKS } from "@/lib/smartlinks";

// لينك مخصص لأزرار التحميل / الـ CTA الكبيرة
export const SMARTLINK_URL = SMARTLINKS.DOWNLOAD_BTN;

export function SmartLinkBanner({ className = "" }: { className?: string }) {
  return (
    <a
      href={SMARTLINK_URL}
      target="_blank"
      rel="noopener noreferrer sponsored"
      data-smartlink="download-btn"
      className={`block rounded-xl border border-gold/40 bg-gradient-to-l from-primary to-primary/80 text-primary-foreground px-4 py-4 sm:py-5 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs text-gold/90 font-semibold">محتوى مُموّل</span>
          <span className="text-sm sm:text-base font-extrabold">
            عروض حصرية اليوم — اضغط للاطلاع الآن
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold text-primary text-xs font-bold">
          عرض
          <ExternalLink size={12} strokeWidth={2.5} />
        </span>
      </div>
    </a>
  );
}
