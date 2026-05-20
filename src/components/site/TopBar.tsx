import { Search, Facebook, Twitter, Youtube, Instagram } from "lucide-react";

export function TopBar() {
  const today = new Date().toLocaleDateString("ar-EG-u-ca-gregory", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-primary text-primary-foreground text-xs">
      <div className="container mx-auto flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <a href="#" aria-label="Facebook" className="hover:text-gold transition-colors"><Facebook size={14} /></a>
          <a href="#" aria-label="Twitter" className="hover:text-gold transition-colors"><Twitter size={14} /></a>
          <a href="#" aria-label="Instagram" className="hover:text-gold transition-colors"><Instagram size={14} /></a>
          <a href="#" aria-label="YouTube" className="hover:text-gold transition-colors"><Youtube size={14} /></a>
          <span className="mx-2 h-3 w-px bg-white/30" />
          <span className="opacity-90">{today}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline opacity-90">القاهرة • 21°</span>
          <button aria-label="بحث" className="opacity-90 hover:text-gold transition-colors">
            <Search size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
