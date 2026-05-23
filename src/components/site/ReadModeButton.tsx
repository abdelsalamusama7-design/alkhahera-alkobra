import { BookOpen, BookOpenCheck } from "lucide-react";
import { useReadMode } from "@/hooks/use-read-mode";

export function ReadModeButton() {
  const { isReadMode, toggleReadMode } = useReadMode();

  return (
    <button
      onClick={toggleReadMode}
      title={isReadMode ? "إلغاء وضع القراءة" : "تفعيل وضع القراءة (إخفاء الإعلانات)"}
      className={`
        fixed left-3 bottom-3 sm:left-4 sm:bottom-6 z-[60]
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
