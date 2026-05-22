import { useEffect } from "react";
import { getAdConfig } from "@/lib/ad-config";

/**
 * يحقن سكربتات Monetag Multitag حسب الإعدادات المحفوظة في localStorage.
 * يعمل على العميل فقط بعد التهيئة.
 */
export function MonetagScripts() {
  useEffect(() => {
    const cfg = getAdConfig();
    const injected: HTMLScriptElement[] = [];

    cfg.monetag.forEach((m) => {
      if (!m.enabled || !m.src || !m.zone) return;
      // تجنب الحقن المكرر
      const existing = document.querySelector(
        `script[data-monetag-id="${m.id}"]`
      );
      if (existing) return;

      const s = document.createElement("script");
      s.src = m.src.startsWith("http") ? m.src : `https://${m.src}`;
      s.async = true;
      s.dataset.zone = m.zone;
      s.dataset.cfasync = "false";
      s.dataset.monetagId = m.id;
      document.body.appendChild(s);
      injected.push(s);
    });

    return () => {
      injected.forEach((s) => s.remove());
    };
  }, []);

  return null;
}
