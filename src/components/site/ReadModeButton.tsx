import { useEffect, useState } from "react";
import { BookOpen, BookOpenCheck } from "lucide-react";
import { useReadMode } from "@/hooks/use-read-mode";

const BASE_OFFSET = 12; // px — مطابق لـ bottom-3
const GAP = 12; // مسافة أمان بين الأزرار

export function ReadModeButton() {
  const { isReadMode, toggleReadMode } = useReadMode();
  // إزاحة ديناميكية من الأسفل — تتغير بناءً على مكان زر "الأخبار باختصار"
  const [bottomOffset, setBottomOffset] = useState<number>(BASE_OFFSET);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const compute = () => {
      const shorts = document.querySelector<HTMLElement>("[data-shorts-fab]");
      if (!shorts) {
        setBottomOffset(BASE_OFFSET);
        return;
      }
      const rect = shorts.getBoundingClientRect();
      // مسافة قاع زر الأخبار باختصار من قاع نافذة العرض
      const shortsBottomFromViewport = window.innerHeight - rect.bottom;
      // ارتفاع زر الأخبار باختصار
      const shortsHeight = rect.height;
      // إجمالي: نرفع زر القراءة فوق زر الأخبار باختصار
      const next = Math.max(BASE_OFFSET, shortsBottomFromViewport + shortsHeight + GAP);
      setBottomOffset(next);
    };

    compute();

    const shorts = document.querySelector<HTMLElement>("[data-shorts-fab]");
    let ro: ResizeObserver | undefined;
    if (shorts && "ResizeObserver" in window) {
      ro = new ResizeObserver(compute);
      ro.observe(shorts);
    }
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, []);

  return (
    <button
      data-no-ad="true"
      onClick={toggleReadMode}
      title={isReadMode ? "إلغاء وضع القراءة" : "تفعيل وضع القراءة (إخفاء الإعلانات)"}
      style={{ bottom: `${bottomOffset}px` }}
      className={`
        fixed right-3 sm:right-4 z-[60]
        flex items-center gap-2
        px-3 py-2 rounded-full shadow-xl backdrop-blur-md
        transition-all duration-300 ease-out
        border-2
        ${isReadMode
          ? "bg-primary/95 text-primary-foreground border-primary scale-105"
          : "bg-card/95 text-foreground border-border hover:border-primary/60 hover:scale-105"
        }
      `}
      dir="rtl"
    >
      {isReadMode ? (
        <BookOpenCheck size={18} className="shrink-1" />
      ) : (
        <BookOpen size={18} className="shrink-1" />
      )}
      <span className="text-xs font-bold whitespace-nowrap hidden sm:inline">
        {isReadMode ? "وضع القراءة مفعل" : "وضع القراءة"}
      </span>
    </button>
  );
}
