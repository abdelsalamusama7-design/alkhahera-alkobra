import { useEffect, useMemo, useRef } from "react";

/**
 * إعلان Adsterra من نوع iframe banner (يستخدم atOptions).
 * نستخدم srcdoc لعزل كل وحدة عن غيرها لأن atOptions متغيّر عام.
 */
export function AdsterraBanner({
  adKey,
  width,
  height,
  className = "",
}: {
  adKey: string;
  width: number;
  height: number;
  className?: string;
}) {
  const srcDoc = useMemo(
    () => `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;}</style></head><body><script type="text/javascript">atOptions={'key':'${adKey}','format':'iframe','height':${height},'width':${width},'params':{}};<\/script><script src="https://revolthem.com/${adKey}/invoke.js"><\/script></body></html>`,
    [adKey, width, height],
  );

  return (
    <div
      className={`flex justify-center items-center w-full ${className}`}
      aria-label="إعلان"
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground absolute -mt-5 opacity-60">إعلان</div>
      <iframe
        title={`ad-${adKey}`}
        srcDoc={srcDoc}
        width={width}
        height={height}
        scrolling="no"
        frameBorder={0}
        style={{ border: 0, maxWidth: "100%", display: "block" }}
      />
    </div>
  );
}

/**
 * Native Banner من Adsterra (revolthem) — يحقن السكريبت + الحاوية مباشرة.
 */
export function AdsterraNativeBanner({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const SCRIPT_SRC =
    "https://revolthem.com/dbf351f3e01b6365cb52a64dcb501d76/invoke.js";

  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.querySelector("script[data-adsterra-native]")) return;
    const s = document.createElement("script");
    s.async = true;
    s.setAttribute("data-cfasync", "false");
    s.setAttribute("data-adsterra-native", "1");
    s.src = SCRIPT_SRC;
    ref.current.appendChild(s);
  }, []);

  return (
    <div ref={ref} className={`w-full ${className}`} aria-label="إعلان">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 opacity-60 text-center">إعلان</div>
      <div id="container-dbf351f3e01b6365cb52a64dcb501d76" />
    </div>
  );
}

/**
 * سكريبت Adsterra الإضافي (الذي يأتي بدون atOptions) — يُحقن مرة واحدة على مستوى الصفحة.
 */
export function AdsterraAutoScript() {
  useEffect(() => {
    const SRC = "https://revolthem.com/23/69/3b/23693b5835c86a1a38730b0da960426b.js";
    if (document.querySelector(`script[src="${SRC}"]`)) return;
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    document.body.appendChild(s);
  }, []);
  return null;
}
