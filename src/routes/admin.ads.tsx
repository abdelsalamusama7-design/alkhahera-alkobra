import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  AD_SLOTS,
  DEFAULT_PLACEMENTS,
  getPlacements,
  resetPlacements,
  savePlacements,
  type AdPlacement,
  type AdPlacementType,
} from "@/lib/ad-placements";
import { Plus, Trash2, RotateCcw, Save, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin/ads")({
  head: () => ({ meta: [{ title: "إدارة الإعلانات — لوحة التحكم" }] }),
  component: AdsManager,
});

const TYPE_LABELS: Record<AdPlacementType, string> = {
  "smartlink-banner": "بانر سمارت لينك (تدوير)",
  "smartlink-context": "رابط نصي مموّل",
  "smartlink-download": "زر CTA / تحميل",
  "adsterra-banner": "بانر Adsterra (iframe)",
  "monetag-zone": "Monetag Zone (سكربت)",
  "custom-html": "HTML مخصص",
};

function newPlacement(): AdPlacement {
  return {
    id: `pl-${Date.now()}`,
    name: "إعلان جديد",
    slot: "home-middle",
    type: "smartlink-banner",
    enabled: true,
    order: 0,
    label: "",
  };
}

function AdsManager() {
  const [list, setList] = useState<AdPlacement[]>([]);

  useEffect(() => {
    setList(getPlacements());
  }, []);

  const update = (id: string, patch: Partial<AdPlacement>) =>
    setList((l) => l.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const remove = (id: string) => {
    if (!confirm("حذف هذا الإعلان؟")) return;
    setList((l) => l.filter((p) => p.id !== id));
  };

  const add = () => setList((l) => [...l, newPlacement()]);

  const move = (id: string, dir: -1 | 1) => {
    setList((l) => {
      const item = l.find((p) => p.id === id);
      if (!item) return l;
      const same = l.filter((p) => p.slot === item.slot).sort((a, b) => a.order - b.order);
      const idx = same.findIndex((p) => p.id === id);
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= same.length) return l;
      const a = same[idx];
      const b = same[swapIdx];
      return l.map((p) => {
        if (p.id === a.id) return { ...p, order: b.order };
        if (p.id === b.id) return { ...p, order: a.order };
        return p;
      });
    });
  };

  const onSave = () => {
    savePlacements(list);
    toast.success("تم الحفظ. التغييرات نشطة فورًا.");
  };

  const onReset = () => {
    if (!confirm("استعادة الإعلانات الافتراضية وحذف كل التعديلات؟")) return;
    resetPlacements();
    setList(DEFAULT_PLACEMENTS);
    toast.success("تمت الاستعادة.");
  };

  // تجميع حسب الـ slot للعرض
  const grouped = AD_SLOTS.map((s) => ({
    slot: s,
    items: list
      .filter((p) => p.slot === s.key)
      .sort((a, b) => a.order - b.order),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-primary">إدارة الإعلانات وأماكنها</h1>
          <p className="text-xs text-muted-foreground mt-1">
            أضف/عدّل/احذف إعلانات لكل مكان داخل الموقع. التغييرات تظهر فورًا بعد الحفظ.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={add}>
            <Plus size={14} className="ml-1" /> إعلان جديد
          </Button>
          <Button variant="outline" onClick={onReset}>
            <RotateCcw size={14} className="ml-1" /> استعادة الافتراضي
          </Button>
          <Button onClick={onSave}>
            <Save size={14} className="ml-1" /> حفظ
          </Button>
        </div>
      </div>

      {grouped.map(({ slot, items }) => (
        <section key={slot.key} className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{slot.label}</h2>
            <code className="text-[10px] text-muted-foreground">slot: {slot.key}</code>
          </div>

          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">لا توجد إعلانات في هذا المكان.</p>
          ) : (
            <div className="space-y-3">
              {items.map((p) => (
                <PlacementEditor
                  key={p.id}
                  placement={p}
                  onChange={(patch) => update(p.id, patch)}
                  onRemove={() => remove(p.id)}
                  onMoveUp={() => move(p.id, -1)}
                  onMoveDown={() => move(p.id, 1)}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      <div className="flex justify-end">
        <Button onClick={onSave} size="lg">
          <Save size={14} className="ml-1" /> حفظ كل التغييرات
        </Button>
      </div>
    </div>
  );
}

function PlacementEditor({
  placement: p,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  placement: AdPlacement;
  onChange: (patch: Partial<AdPlacement>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className={`border border-border rounded p-3 ${p.enabled ? "" : "opacity-60"}`}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Input
          value={p.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="flex-1 min-w-[200px] font-bold"
          placeholder="اسم الإعلان"
        />
        <div className="flex items-center gap-1 text-xs">
          {p.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
          <Switch checked={p.enabled} onCheckedChange={(v) => onChange({ enabled: v })} />
        </div>
        <Button size="icon" variant="ghost" onClick={onMoveUp} title="أعلى">
          <ArrowUp size={14} />
        </Button>
        <Button size="icon" variant="ghost" onClick={onMoveDown} title="أسفل">
          <ArrowDown size={14} />
        </Button>
        <Button size="icon" variant="ghost" onClick={onRemove}>
          <Trash2 size={14} className="text-destructive" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">المكان (Slot)</Label>
          <Select value={p.slot} onValueChange={(v) => onChange({ slot: v as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AD_SLOTS.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">النوع</Label>
          <Select value={p.type} onValueChange={(v) => onChange({ type: v as AdPlacementType })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* حقول حسب النوع */}
        {(p.type === "smartlink-banner" ||
          p.type === "smartlink-context" ||
          p.type === "smartlink-download") && (
          <div className="md:col-span-2">
            <Label className="text-xs">نص الإعلان (label)</Label>
            <Input
              value={p.label ?? ""}
              onChange={(e) => onChange({ label: e.target.value })}
              placeholder="مثال: عروض حصرية اليوم"
            />
          </div>
        )}

        {p.type === "adsterra-banner" && (
          <>
            <div className="md:col-span-2">
              <Label className="text-xs">Ad Key</Label>
              <Input
                value={p.adKey ?? ""}
                onChange={(e) => onChange({ adKey: e.target.value })}
                placeholder="85d785d2e3eb2b59240de17f347d15c9"
                dir="ltr"
              />
            </div>
            <div>
              <Label className="text-xs">العرض</Label>
              <Input
                type="number"
                value={p.width ?? ""}
                onChange={(e) => onChange({ width: +e.target.value })}
                placeholder="300"
              />
            </div>
            <div>
              <Label className="text-xs">الارتفاع</Label>
              <Input
                type="number"
                value={p.height ?? ""}
                onChange={(e) => onChange({ height: +e.target.value })}
                placeholder="250"
              />
            </div>
          </>
        )}

        {p.type === "monetag-zone" && (
          <>
            <div>
              <Label className="text-xs">Script src</Label>
              <Input
                value={p.src ?? ""}
                onChange={(e) => onChange({ src: e.target.value })}
                placeholder="https://quge5.com/88/tag.min.js"
                dir="ltr"
              />
            </div>
            <div>
              <Label className="text-xs">Data-Zone</Label>
              <Input
                value={p.zone ?? ""}
                onChange={(e) => onChange({ zone: e.target.value })}
                placeholder="242128"
                dir="ltr"
              />
            </div>
          </>
        )}

        {p.type === "custom-html" && (
          <div className="md:col-span-2">
            <Label className="text-xs">HTML</Label>
            <Textarea
              value={p.html ?? ""}
              onChange={(e) => onChange({ html: e.target.value })}
              rows={5}
              dir="ltr"
              placeholder="<div>...</div>"
            />
          </div>
        )}
      </div>
    </div>
  );
}
