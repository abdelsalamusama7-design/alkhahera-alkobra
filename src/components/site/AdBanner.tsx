import { Phone } from "lucide-react";

const AD_PHONE = "01113718006";

export function AdBanner() {
  return (
    <a
      href={`tel:${AD_PHONE}`}
      className="block bg-gold text-gold-foreground hover:brightness-105 transition-all duration-300"
      dir="rtl"
    >
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
        <Phone size={14} className="shrink-0 sm:size-4" strokeWidth={2.5} />
        <span className="font-bold text-xs sm:text-sm md:text-base">
          للإعلان هنا يرجى الاتصال على
        </span>
        <span
          className="font-extrabold text-xs sm:text-sm md:text-base underline underline-offset-4"
          dir="ltr"
        >
          {AD_PHONE}
        </span>
      </div>
    </a>
  );
}
