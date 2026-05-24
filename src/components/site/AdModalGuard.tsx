import { useEffect } from "react";

/**
 * AdModalGuard
 * ------------
 * بعض شبكات الإعلانات (Monetag/Adsterra) بتحقن مودالات زي
 * "Download is ready" مباشرة في الـ DOM — أحيانًا بدون زر إغلاق
 * واضح أو بحجم مش مناسب للموبايل وبيتداخل مع عناصر الواجهة.
 *
 * هذا المكوّن:
 *  1) يرصد أي عنصر fixed يتم حقنه ويحتوي على نص "download is ready"
 *     (أو selectors شائعة لشبكات الإعلانات).
 *  2) يضبط حجمه ليكون responsive (max-width / max-height / تمركز).
 *  3) يضمن وجود زر إغلاق (×) واضح أعلى يمين المودال حتى لو
 *     السكربت ما حطّش واحد، مع منع التداخل (z-index/overflow).
 */
export function AdModalGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const STYLE_ID = "ad-modal-guard-style";
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        [data-ad-modal-guarded="true"]{
          position: fixed !important;
          inset: auto !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          width: min(92vw, 380px) !important;
          max-width: 92vw !important;
          max-height: 80vh !important;
          overflow: auto !important;
          z-index: 2147483000 !important;
          border-radius: 12px !important;
          box-shadow: 0 20px 60px rgba(0,0,0,.35) !important;
          background: #fff !important;
        }
        [data-ad-modal-guarded="true"] *{
          max-width: 100% !important;
        }
        [data-ad-modal-guarded="true"] img,
        [data-ad-modal-guarded="true"] iframe{
          height: auto !important;
          max-width: 100% !important;
        }
        .ad-modal-guard-close{
          position: absolute !important;
          top: 6px !important;
          right: 6px !important;
          width: 34px !important;
          height: 34px !important;
          border-radius: 9999px !important;
          background: #111 !important;
          color: #fff !important;
          border: 2px solid #fff !important;
          font-size: 20px !important;
          line-height: 1 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          z-index: 2147483647 !important;
          box-shadow: 0 2px 8px rgba(0,0,0,.4) !important;
          padding: 0 !important;
        }
        @media (max-width: 480px){
          [data-ad-modal-guarded="true"]{
            width: 94vw !important;
            max-height: 75vh !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const looksLikeDownloadModal = (el: HTMLElement): boolean => {
      const txt = (el.innerText || el.textContent || "").toLowerCase();
      if (!txt) return false;
      // علامات شائعة في مودالات Monetag/Adsterra
      return (
        txt.includes("download is ready") ||
        txt.includes("your download is ready") ||
        txt.includes("download now") ||
        (txt.includes("download") && txt.includes("ready"))
      );
    };

    const guard = (el: HTMLElement) => {
      if (el.dataset.adModalGuarded === "true") return;
      el.dataset.adModalGuarded = "true";

      // النوافذ الإعلانية من نوع "Download is ready" بتخطف الضغطات وتحوّل لمواقع خارجية.
      // الأفضل إزالتها فورًا بدل ترك زر Continue ظاهر للمستخدم.
      try {
        el.remove();
        return;
      } catch {
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("pointer-events", "none", "important");
        return;
      }

      // زر إغلاق مضمون
      if (!el.querySelector(".ad-modal-guard-close")) {
        const btn = document.createElement("button");
        btn.className = "ad-modal-guard-close";
        btn.type = "button";
        btn.setAttribute("aria-label", "إغلاق الإعلان");
        btn.textContent = "×";
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            el.remove();
          } catch {
            el.style.display = "none";
          }
        });
        el.appendChild(btn);
      }
    };

    const scan = (root: ParentNode) => {
      const candidates = [
        ...(root instanceof HTMLElement ? [root] : []),
        ...Array.from(root.querySelectorAll<HTMLElement>(
        'div, section, aside, [class*="modal"], [class*="popup"], [id*="modal"], [id*="popup"]'
        )),
      ];
      candidates.forEach((el) => {
        if (el.dataset.adModalGuarded === "true") return;
        const cs = window.getComputedStyle(el);
        if (cs.position !== "fixed") return;
        const rect = el.getBoundingClientRect();
        // تجاهل أشرطة صغيرة جدًا (social-bar) أو عناصر فاضية
        if (rect.width < 200 || rect.height < 150) return;
        if (!looksLikeDownloadModal(el)) return;
        guard(el);
      });
    };

    // فحص دوري أول ما الصفحة تشتغل
    const initial = window.setTimeout(() => scan(document.body), 500);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) scan((n as HTMLElement));
        });
      }
      // scan شامل خفيف
      scan(document.body);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(initial);
      observer.disconnect();
    };
  }, []);

  return null;
}
