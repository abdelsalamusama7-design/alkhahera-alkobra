import { ExternalLink } from "lucide-react";
import { SMARTLINKS, type SmartLinkKind } from "@/lib/smartlinks";

type Props = {
  variant?: "card" | "inline";
  label?: string;
  /**
   * نوع السمارت لينك المستخدم:
   * - "BANNER" (افتراضي للكارد): بانرات المحتوى المموّل
   * - "CONTEXT_LINK": روابط داخل نصوص المقالات
   * - "DOWNLOAD_BTN": أزرار التحميل / الـ CTA
   */
  kind?: SmartLinkKind;
};

/**
 * إعلان مموّل (Adsterra Smartlink) — موزّع حسب المكان داخل الموقع.
 */
export function SponsoredLink({
  variant = "card",
  label = "محتوى مقترح لك",
  kind,
}: Props) {
  const resolvedKind: SmartLinkKind =
    kind ?? (variant === "inline" ? "CONTEXT_LINK" : "BANNER");
  const href = SMARTLINKS[resolvedKind];
  const dataAttr = resolvedKind.toLowerCase().replace("_", "-");

  if (variant === "inline") {
    return (
      <a
        href={href}
        target="_blank"
        rel="nofollow sponsored noopener"
        data-smartlink={dataAttr}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary underline underline-offset-4"
      >
        <span>{label || "إعلان"}</span>
        <ExternalLink size={12} />
      </a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored noopener"
      data-smartlink={dataAttr}
      className="block rounded-lg border border-dashed border-border bg-muted/40 hover:bg-muted transition-colors p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">إعلان</div>
          <div className="text-sm font-semibold text-foreground line-clamp-2">{label}</div>
        </div>
        <ExternalLink size={16} className="shrink-0 text-muted-foreground" />
      </div>
    </a>
  );
}
