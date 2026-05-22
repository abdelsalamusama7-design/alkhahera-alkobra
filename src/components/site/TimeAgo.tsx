import { useEffect, useState } from "react";
import { timeAgoAr } from "@/lib/format";

/**
 * Renders a stable placeholder during SSR/initial hydration, then upgrades to
 * the live "منذ X دقيقة" string on the client. Prevents hydration mismatches
 * when the SSR render and client render straddle a time boundary.
 */
export function TimeAgo({ iso, className }: { iso: string | Date; className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setMounted((m) => !m && true), 60_000);
    return () => clearInterval(t);
  }, []);
  return (
    <time className={className} suppressHydrationWarning>
      {mounted ? timeAgoAr(iso) : ""}
    </time>
  );
}
