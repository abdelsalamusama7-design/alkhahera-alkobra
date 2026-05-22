import { Search, Facebook, Youtube } from "lucide-react";

const FACEBOOK_URL = "https://www.facebook.com/people/%D8%A7%D9%84%D9%82%D8%A7%D9%87%D8%B1%D8%A9-%D8%A7%D9%84%D9%83%D8%A8%D8%B1%D9%89/61588527261746/";
const YOUTUBE_URL = "https://www.youtube.com/channel/UCDiyTZpB_Q3ZPjVPRqjvqYg";
const TIKTOK_URL = "https://www.tiktok.com/@kaheraalkobra";

function TiktokIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82a4.28 4.28 0 0 1-2.6-1.46V14.5a5.5 5.5 0 1 1-5.5-5.5c.28 0 .55.02.82.07v2.86a2.66 2.66 0 1 0 1.84 2.53V2h2.84a4.28 4.28 0 0 0 2.6 3.82z" />
    </svg>
  );
}

export function TopBar() {
  const today = new Date().toLocaleDateString("ar-EG-u-ca-gregory", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-primary text-primary-foreground text-xs">
      <div className="container mx-auto flex items-center justify-between gap-2 px-3 sm:px-4 py-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-gold transition-colors shrink-0"><Facebook size={14} /></a>
          <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-gold transition-colors shrink-0"><Youtube size={14} /></a>
          <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:text-gold transition-colors shrink-0"><TiktokIcon size={14} /></a>
          <span className="hidden sm:inline mx-2 h-3 w-px bg-white/30 shrink-0" />
          <span className="hidden sm:inline opacity-90 truncate">{today}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden md:inline opacity-90">القاهرة • 21°</span>
          <button aria-label="بحث" className="opacity-90 hover:text-gold transition-colors">
            <Search size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
