import { Phone } from "lucide-react";

const AD_PHONE = "01113718006";

export function AdBanner() {
  return (
    <a
      href={`tel:${AD_PHONE}`}
      className="block bg-gold text-gold-foreground hover:brightness-105 transition-all duration-300"
      dir="rtl"
    >
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-center gap-2 sm:gap-3">
        <Phone size={16} className="shrink-1" strokeWidth={2.5} />
        <span className="font-bold text-sm sm:text-base whitespace-nowrap">
          للإعلان هنا يرجى الاتصال على
        </span>
        <span
          className="font-extrabold text-sm sm:text-base underline underline-offset-4 whitespace-nowrap"
          dir="ltr"
        >
          {AD_PHONE}
        </span>
      </div>
    </a>
  );
}
