import { ExternalLink } from "lucide-react";

const SMARTLINK = "https://www.effectivecpmnetwork.com/v8vg96x9d?key=6715491877160494188216c66ef54b85";

type Props = {
  variant?: "card" | "inline";
  label?: string;
};

/**
 * إعلان مموّل (Adsterra Smartlink) — استخدام محدود ومتباعد.
 */
export function SponsoredLink({ variant = "card", label = "محتوى مقترح لك" }: Props) {
  if (variant === "inline") {
    return (
      <a
        href={SMARTLINK}
        target="_blank"
        rel="nofollow sponsored noopener"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary underline underline-offset-4"
      >
        <span>إعلان</span>
        <ExternalLink size={12} />
      </a>
    );
  }
  return (
    <a
      href={SMARTLINK}
      target="_blank"
      rel="nofollow sponsored noopener"
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
