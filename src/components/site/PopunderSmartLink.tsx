import { useEffect } from "react";
import { SMARTLINKS } from "@/lib/smartlinks";

/**
 * Popunder Smartlinks:
 * - الأول (POPUNDER) يفتح عند أول ضغطة من الزائر.
 * - الثاني (POPUNDER_2) يفتح عند الضغطة الثانية في نفس الجلسة.
 * كل لينك مرة واحدة لكل جلسة (sessionStorage).
 *
 * يتم استثناء الضغطات اللي على روابط سمارت لينك أخرى (data-smartlink).
 */
const SESSION_KEY_1 = "__pu_fired__";
const SESSION_KEY_2 = "__pu2_fired__";

function openPopunder(url: string) {
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (w) {
    try {
      w.blur();
      window.focus();
    } catch {}
  }
}

export function PopunderSmartLink() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest("[data-smartlink]")) return;

      try {
        if (!sessionStorage.getItem(SESSION_KEY_1)) {
          sessionStorage.setItem(SESSION_KEY_1, "1");
          openPopunder(SMARTLINKS.POPUNDER);
          return;
        }
        if (!sessionStorage.getItem(SESSION_KEY_2)) {
          sessionStorage.setItem(SESSION_KEY_2, "1");
          openPopunder(SMARTLINKS.POPUNDER_2);
          return;
        }
        window.removeEventListener("click", handler, true);
      } catch {}
    };

    window.addEventListener("click", handler, true);
    return () => window.removeEventListener("click", handler, true);
  }, []);

  return null;
}
