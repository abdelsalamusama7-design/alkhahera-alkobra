import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  listAllPlacementsFn,
  upsertPlacementFn,
  deletePlacementFn,
  checkAdsNowFn,
  resetAdCountersFn,
  type AdPlacementRow,
  type AdPlacementType,
} from "@/lib/ad-placements.functions";
import {
  Plus, Trash2, Save, ArrowUp, ArrowDown, Eye, EyeOff,
  ShieldCheck, AlertTriangle, HelpCircle, RefreshCw, BarChart3, RotateCcw,
} from "lucide-react";
import { DailyAdCtrPanel } from "@/components/admin/DailyAdCtrPanel";

export const Route = createFileRoute("/admin/ads")({
  head: () => ({ meta: [{ title: "إدارة الإعلانات — لوحة التحكم" }] }),
  component: AdsManager,
});

const AD_SLOTS = [
  { key: "home-top", label: "الرئيسية — أعلى" },
  { key: "home-middle", label: "الرئيسية — منتصف" },
  { key: "home-bottom", label: "الرئيسية — أسفل" },
  { key: "article-top", label: "المقال — أعلى" },
  { key: "article-middle", label: "المقال — منتصف" },
  { key: "article-bottom", label: "المقال — أسفل" },
  { key: "sidebar", label: "الشريط الجانبي" },
  { key: "header", label: "أعلى الموقع" },
  { key: "footer", label: "أسفل الموقع" },
] as const;

const TYPE_LABELS: Record<AdPlacementType, string> = {
  "smartlink-banner": "بانر سمارت لينك (تدوير)",
  "smartlink-context": "رابط نصي مموّل",
  "smartlink-download": "زر CTA / تحميل",
  "adsterra-banner": "بانر Adsterra",
  "monetag-zone": "Monetag Zone (سكربت)",
  "custom-html": "HTML مخصص",
};

type Draft = {
  id?: string;
  name: string;
  slot: string;
  type: AdPlacementType;
  enabled: boolean;
  order_index: number;
  is_fallback: boolean;
  config: Record<string, any>;
};

function AdsManager() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllPlacementsFn);
  const upsertFn = useServerFn(upsertPlacementFn);
  const deleteFn = useServerFn(deletePlacementFn);
  const checkFn = useServerFn(checkAdsNowFn);
  const resetFn = useServerFn(resetAdCountersFn);

  const { data: serverList = [], isLoading } = useQuery({
    queryKey: ["ad-placements-all"],
    queryFn: () => listFn(),
  });

  const totals = serverList.reduce(
    (acc, r: any) => {
      acc.impressions += Number(r.impressions ?? 0);
      acc.clicks += Number(r.clicks ?? 0);
      return acc;
    },
    { impressions: 0, clicks: 0 }
  );
  const totalCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newItems, setNewItems] = useState<Draft[]>([]);

  const getDraft = (row: AdPlacementRow): Draft => drafts[row.id] ?? row;
  const updateDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? serverList.find((r) => r.id === id)!), ...patch } }));
  };

  const upsertM = useMutation({
    mutationFn: (payload: Draft) =>
      upsertFn({
        data: {
          id: payload.id,
          name: payload.name,
          slot: payload.slot,
          type: payload.type,
          enabled: payload.enabled,
          order_index: payload.order_index,
          is_fallback: payload.is_fallback,
          config: payload.config,
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ad-placements-all"] }),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ad-placements-all"] }),
  });

  const checkM = useMutation({
    mutationFn: () => checkFn(),
    onSuccess: (res: any) => {
      toast.success(
        `فحص: ${res.checked} • فشل: ${res.failed} • عُطِّل: ${res.disabled} • فُعِّل احتياطي: ${res.activatedFallbacks}`
      );
      qc.invalidateQueries({ queryKey: ["ad-placements-all"] });
      qc.invalidateQueries({ queryKey: ["ad-placements-active"] });
    },
    onError: (e: any) => toast.error(e?.message || "فشل الفحص"),
  });

  const resetM = useMutation({
    mutationFn: (id?: string) => resetFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم تصفير العدّادات.");
      qc.invalidateQueries({ queryKey: ["ad-placements-all"] });
    },
    onError: (e: any) => toast.error(e?.message || "فشل التصفير"),
  });

  const saveAll = async () => {
    try {
      for (const d of Object.values(drafts)) await upsertM.mutateAsync(d);
      for (const n of newItems) await upsertM.mutateAsync(n);
      setDrafts({});
      setNewItems([]);
      toast.success("تم الحفظ.");
    } catch (e: any) {
      toast.error(e?.message || "فشل الحفظ");
    }
  };

  const addNew = () => {
    setNewItems((l) => [
      ...l,
      {
        name: "إعلان جديد",
        slot: "home-middle",
        type: "smartlink-banner",
        enabled: true,
        order_index: 0,
        is_fallback: false,
        config: { label: "" },
      },
    ]);
  };

  const updateNew = (idx: number, patch: Partial<Draft>) => {
    setNewItems((l) => l.map((n, i) => (i === idx ? { ...n, ...patch } : n)));
  };

  const removeNew = (idx: number) => setNewItems((l) => l.filter((_, i) => i !== idx));

  const onDelete = async (id: string) => {
    if (!confirm("حذف هذا الإعلان نهائيًا؟")) return;
    await deleteM.mutateAsync(id);
    toast.success("تم الحذف.");
  };

  const moveOrder = async (row: AdPlacementRow, dir: -1 | 1) => {
    await upsertM.mutateAsync({ ...row, order_index: row.order_index + dir });
  };

  const grouped = AD_SLOTS.map((s) => ({
    slot: s,
    items: serverList.filter((p) => p.slot === s.key).sort((a, b) => a.order_index - b.order_index),
    newOnes: newItems
      .map((n, i) => ({ n, i }))
      .filter(({ n }) => n.slot === s.key),
  }));

  const hasChanges = Object.keys(drafts).length > 0 || newItems.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-primary">إدارة الإعلانات وأماكنها</h1>
          <p className="text-xs text-muted-foreground mt-1">
            الإعلانات محفوظة في قاعدة البيانات ويُفحص شغّالها يوميًا تلقائيًا. الميت يتعطّل ويتم تفعيل بديل احتياطي بنفس المكان.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => checkM.mutate()} disabled={checkM.isPending}>
            <RefreshCw size={14} className={`ml-1 ${checkM.isPending ? "animate-spin" : ""}`} />
            فحص الإعلانات الآن
          </Button>
          <Button variant="outline" onClick={addNew}>
            <Plus size={14} className="ml-1" /> إعلان جديد
          </Button>
          <Button onClick={saveAll} disabled={!hasChanges || upsertM.isPending}>
            <Save size={14} className="ml-1" /> حفظ التغييرات
          </Button>
        </div>
      </div>

      {/* لوحة إحصاءات إجمالية */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="إجمالي الظهور" value={totals.impressions.toLocaleString("ar-EG")} icon={<BarChart3 size={16} />} />
        <StatCard label="إجمالي النقرات" value={totals.clicks.toLocaleString("ar-EG")} icon={<BarChart3 size={16} />} />
        <StatCard label="معدل النقر (CTR)" value={`${totalCtr.toFixed(2)}%`} icon={<BarChart3 size={16} />} />
        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("تصفير عدّادات كل الإعلانات؟")) resetM.mutate(undefined);
            }}
            disabled={resetM.isPending}
          >
            <RotateCcw size={14} className="ml-1" />
            تصفير كل العدّادات
          </Button>
        </div>
      </div>

      <DailyAdCtrPanel />

      {isLoading && <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>}

      {grouped.map(({ slot, items, newOnes }) => (
        <section key={slot.key} className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{slot.label}</h2>
            <code className="text-[10px] text-muted-foreground">slot: {slot.key}</code>
          </div>

          {items.length === 0 && newOnes.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">لا توجد إعلانات.</p>
          ) : (
            <div className="space-y-3">
              {items.map((row) => {
                const d = getDraft(row);
                const impressions = Number((row as any).impressions ?? 0);
                const clicks = Number((row as any).clicks ?? 0);
                return (
                  <PlacementEditor
                    key={row.id}
                    draft={d}
                    health={{
                      status: row.health_status,
                      lastChecked: row.last_checked_at,
                      lastError: row.last_error,
                      failCount: row.fail_count,
                    }}
                    stats={{ impressions, clicks }}
                    onChange={(patch) => updateDraft(row.id, patch)}
                    onRemove={() => onDelete(row.id)}
                    onMoveUp={() => moveOrder(row, -1)}
                    onMoveDown={() => moveOrder(row, 1)}
                    onResetCounters={() => {
                      if (confirm(`تصفير عدّادات "${row.name}"؟`)) resetM.mutate(row.id);
                    }}
                  />
                );
              })}
              {newOnes.map(({ n, i }) => (
                <PlacementEditor
                  key={`new-${i}`}
                  draft={n}
                  isNew
                  onChange={(patch) => updateNew(i, patch)}
                  onRemove={() => removeNew(i)}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={saveAll} size="lg" disabled={upsertM.isPending}>
            <Save size={14} className="ml-1" /> حفظ كل التغييرات
          </Button>
        </div>
      )}
    </div>
  );
}

function HealthBadge({ status, lastChecked, lastError, failCount }: {
  status: string;
  lastChecked: string | null;
  lastError: string | null;
  failCount: number;
}) {
  const map = {
    ok: { Icon: ShieldCheck, color: "text-green-600", text: "يعمل" },
    failed: { Icon: AlertTriangle, color: "text-destructive", text: `فشل (${failCount}×)` },
    unknown: { Icon: HelpCircle, color: "text-muted-foreground", text: "لم يُفحص" },
  } as const;
  const m = (map as any)[status] ?? map.unknown;
  const Icon = m.Icon;
  const when = lastChecked ? new Date(lastChecked).toLocaleString("ar-EG") : "—";
  return (
    <div className={`flex items-center gap-1 text-xs ${m.color}`} title={`${when}${lastError ? ` — ${lastError}` : ""}`}>
      <Icon size={14} />
      <span>{m.text}</span>
    </div>
  );
}


function StatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-extrabold text-primary">{value}</div>
    </div>
  );
}

function PlacementEditor({
  draft: p, onChange, onRemove, onMoveUp, onMoveDown, isNew, health, stats, onResetCounters,
}: {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isNew?: boolean;
  health?: { status: string; lastChecked: string | null; lastError: string | null; failCount: number };
  stats?: { impressions: number; clicks: number };
  onResetCounters?: () => void;
}) {
  const cfg = p.config || {};
  const setCfg = (patch: Record<string, any>) => onChange({ config: { ...cfg, ...patch } });
  const ctr = stats && stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0;

  return (
    <div className={`border border-border rounded p-3 ${p.enabled ? "" : "opacity-60"} ${isNew ? "border-primary border-dashed" : ""}`}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Input
          value={p.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="flex-1 min-w-[200px] font-bold"
          placeholder="اسم الإعلان"
        />
        {health && <HealthBadge {...health} />}
        {p.is_fallback && (
          <span className="text-[10px] bg-yellow-500/20 text-yellow-700 px-2 py-0.5 rounded">احتياطي</span>
        )}
        <div className="flex items-center gap-1 text-xs">
          {p.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
          <Switch checked={p.enabled} onCheckedChange={(v) => onChange({ enabled: v })} />
        </div>
        {onMoveUp && (
          <Button size="icon" variant="ghost" onClick={onMoveUp} title="أعلى">
            <ArrowUp size={14} />
          </Button>
        )}
        {onMoveDown && (
          <Button size="icon" variant="ghost" onClick={onMoveDown} title="أسفل">
            <ArrowDown size={14} />
          </Button>
        )}
        <Button size="icon" variant="ghost" onClick={onRemove}>
          <Trash2 size={14} className="text-destructive" />
        </Button>
      </div>

      {stats && (
        <div className="flex items-center gap-4 text-xs mb-3 flex-wrap bg-muted/40 rounded px-3 py-2">
          <span><BarChart3 size={12} className="inline ml-1" /> ظهور: <strong className="text-primary">{stats.impressions.toLocaleString("ar-EG")}</strong></span>
          <span>نقرات: <strong className="text-primary">{stats.clicks.toLocaleString("ar-EG")}</strong></span>
          <span>CTR: <strong className="text-primary">{ctr.toFixed(2)}%</strong></span>
          {onResetCounters && (
            <Button size="sm" variant="ghost" className="ms-auto h-6 px-2 text-[10px]" onClick={onResetCounters}>
              <RotateCcw size={12} className="ml-1" /> تصفير
            </Button>
          )}
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">المكان</Label>
          <Select value={p.slot} onValueChange={(v) => onChange({ slot: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {AD_SLOTS.map((s) => (
                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">النوع</Label>
          <Select value={p.type} onValueChange={(v) => onChange({ type: v as AdPlacementType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 md:col-span-2">
          <Switch checked={!!p.is_fallback} onCheckedChange={(v) => onChange({ is_fallback: v })} />
          <Label className="text-xs">إعلان احتياطي (يُفعَّل تلقائيًا عند فشل إعلان آخر في نفس المكان)</Label>
        </div>

        {(p.type === "smartlink-banner" || p.type === "smartlink-context" || p.type === "smartlink-download") && (
          <div className="md:col-span-2">
            <Label className="text-xs">نص الإعلان</Label>
            <Input
              value={cfg.label ?? ""}
              onChange={(e) => setCfg({ label: e.target.value })}
              placeholder="مثال: عروض حصرية اليوم"
            />
          </div>
        )}

        {p.type === "adsterra-banner" && (
          <>
            <div className="md:col-span-2">
              <Label className="text-xs">Ad Key</Label>
              <Input dir="ltr" value={cfg.adKey ?? ""} onChange={(e) => setCfg({ adKey: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">العرض</Label>
              <Input type="number" value={cfg.width ?? ""} onChange={(e) => setCfg({ width: +e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">الارتفاع</Label>
              <Input type="number" value={cfg.height ?? ""} onChange={(e) => setCfg({ height: +e.target.value })} />
            </div>
          </>
        )}

        {p.type === "monetag-zone" && (
          <>
            <div>
              <Label className="text-xs">Script src</Label>
              <Input dir="ltr" value={cfg.src ?? ""} onChange={(e) => setCfg({ src: e.target.value })} placeholder="https://quge5.com/88/tag.min.js" />
            </div>
            <div>
              <Label className="text-xs">Data-Zone</Label>
              <Input dir="ltr" value={cfg.zone ?? ""} onChange={(e) => setCfg({ zone: e.target.value })} placeholder="242128" />
            </div>
          </>
        )}

        {p.type === "custom-html" && (
          <div className="md:col-span-2">
            <Label className="text-xs">HTML</Label>
            <Textarea dir="ltr" rows={5} value={cfg.html ?? ""} onChange={(e) => setCfg({ html: e.target.value })} />
          </div>
        )}
      </div>
    </div>
  );
}
