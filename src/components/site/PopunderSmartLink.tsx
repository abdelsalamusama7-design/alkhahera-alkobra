import { useEffect } from "react";
import { SMARTLINKS } from "@/lib/smartlinks";

/**
 * Popunder Smartlink:
 * يفتح اللينك في تاب جديد عند أول تفاعل (Click) من الزائر،
 * مرة واحدة فقط لكل جلسة (sessionStorage).
 *
 * يتم استثناء الضغطات اللي على روابط سمارت لينك أخرى (data-smartlink)
 * لتجنّب تعارض الإحصائيات.
 */
const SESSION_KEY = "__pu_fired__";

export function PopunderSmartLink() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {}

    let fired = false;

    const handler = (e: MouseEvent) => {
      if (fired) return;
      const target = e.target as HTMLElement | null;
      // تجاهل لو الضغط على عنصر سمارت لينك ظاهر
      if (target && target.closest("[data-smartlink]")) return;
      fired = true;
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {}

      // افتح في تاب جديد (popunder سلوكي مبسّط)
      const w = window.open(SMARTLINKS.POPUNDER, "_blank", "noopener,noreferrer");
      if (w) {
        try {
          w.blur();
          window.focus();
        } catch {}
      }

      window.removeEventListener("click", handler, true);
    };

    window.addEventListener("click", handler, true);
    return () => window.removeEventListener("click", handler, true);
  }, []);

  return null;
}
