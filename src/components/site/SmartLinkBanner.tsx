import { ExternalLink } from "lucide-react";

export const SMARTLINK_URL =
  "https://www.effectivecpmnetwork.com/nqb3nvwtw?key=9aef419a4e1ff39475291adaa00a73f1";

export function SmartLinkBanner({ className = "" }: { className?: string }) {
  return (
    <a
      href={SMARTLINK_URL}
      target="_blank"
      rel="noopener noreferrer sponsored"
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
