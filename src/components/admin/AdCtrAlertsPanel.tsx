import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertTriangle, Shuffle, EyeOff, RefreshCw } from "lucide-react";
import { getCtrAlertsFn, autoSwapPlacementFn } from "@/lib/ad-placements.functions";

export function AdCtrAlertsPanel() {
  const [days, setDays] = useState(3);
  const [minImpressions, setMinImpressions] = useState(100);
  const [ctrThreshold, setCtrThreshold] = useState(0.5);
  const qc = useQueryClient();

  const fetchAlerts = useServerFn(getCtrAlertsFn);
  const swapFn = useServerFn(autoSwapPlacementFn);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["ad-ctr-alerts", days, minImpressions, ctrThreshold],
    queryFn: () => fetchAlerts({ data: { days, minImpressions, ctrThreshold } }),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });

  const swapM = useMutation({
    mutationFn: (id: string) => swapFn({ data: { id } }),
    onSuccess: (res: any) => {
      if (res.swapped) {
        toast.success(`تم استبدال "${res.disabled}" بـ "${res.activated}"`);
      } else {
        toast.warning(`تم تعطيل "${res.disabled}" — لا يوجد بديل احتياطي بنفس المكان`);
      }
      qc.invalidateQueries({ queryKey: ["ad-placements-all"] });
      qc.invalidateQueries({ queryKey: ["ad-placements-active"] });
      qc.invalidateQueries({ queryKey: ["ad-ctr-alerts"] });
    },
    onError: (e: any) => toast.error(e?.message || "فشل الاستبدال"),
  });

  const alerts = data?.alerts ?? [];

  return (
    <section className="bg-card border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" />
          <h2 className="text-lg font-bold">تنبيهات CTR المنخفض</h2>
          {alerts.length > 0 && (
            <span className="bg-amber-500/15 text-amber-600 text-xs px-2 py-0.5 rounded-full font-bold">
              {alerts.length}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={14} className={`ml-1 ${isFetching ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">الفترة (يوم)</Label>
          <Input type="number" min={1} max={30} value={days}
            onChange={(e) => setDays(Math.max(1, Math.min(30, Number(e.target.value) || 1)))} />
        </div>
        <div>
          <Label className="text-xs">حد أدنى للظهور</Label>
          <Input type="number" min={1} value={minImpressions}
            onChange={(e) => setMinImpressions(Math.max(1, Number(e.target.value) || 1))} />
        </div>
        <div>
          <Label className="text-xs">حد CTR (%)</Label>
          <Input type="number" step="0.1" min={0} max={100} value={ctrThreshold}
            onChange={(e) => setCtrThreshold(Math.max(0, Number(e.target.value) || 0))} />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">جارٍ الفحص…</p>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-emerald-600 font-medium">
          ✓ لا توجد تنبيهات. كل الإعلانات النشطة فوق الحد المحدد.
        </p>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 p-3 bg-amber-500/5 border border-amber-500/30 rounded-md flex-wrap"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{a.name}</div>
                <div className="text-xs text-muted-foreground">
                  <code>{a.slot}</code> • ظهور: {a.impressions.toLocaleString("ar-EG")} •
                  نقرات: {a.clicks.toLocaleString("ar-EG")} •
                  <span className="text-amber-600 font-bold"> CTR {a.ctr.toFixed(2)}%</span>
                </div>
              </div>
              <Button
                size="sm"
                variant={a.hasFallback ? "default" : "outline"}
                onClick={() => {
                  const msg = a.hasFallback
                    ? `استبدال "${a.name}" تلقائيًا ببديل احتياطي؟`
                    : `لا يوجد بديل احتياطي. سيتم تعطيل "${a.name}" فقط. تأكيد؟`;
                  if (confirm(msg)) swapM.mutate(a.id);
                }}
                disabled={swapM.isPending}
              >
                {a.hasFallback ? <Shuffle size={14} className="ml-1" /> : <EyeOff size={14} className="ml-1" />}
                {a.hasFallback ? "استبدل تلقائيًا" : "تعطيل"}
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        البديل الاحتياطي = إعلان مُعطّل في نفس المكان (slot) ومُعلَّم كـ "احتياطي".
      </p>
    </section>
  );
}
