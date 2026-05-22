import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  DEFAULT_AD_CONFIG,
  getAdConfig,
  resetAdConfig,
  saveAdConfig,
  type AdConfig,
  type MonetagScript,
  type SmartlinkKey,
} from "@/lib/ad-config";
import { Plus, Trash2, RotateCcw, Save } from "lucide-react";

export const Route = createFileRoute("/admin/ad-settings")({
  head: () => ({ meta: [{ title: "إعدادات الإعلانات — لوحة التحكم" }] }),
  component: AdSettingsPage,
});

function AdSettingsPage() {
  const [cfg, setCfg] = useState<AdConfig>(DEFAULT_AD_CONFIG);

  useEffect(() => {
    setCfg(getAdConfig());
  }, []);

  const updateSmartlink = (k: SmartlinkKey, v: string) =>
    setCfg((c) => ({ ...c, smartlinks: { ...c.smartlinks, [k]: v } }));

  const updateMonetag = (i: number, patch: Partial<MonetagScript>) =>
    setCfg((c) => ({
      ...c,
      monetag: c.monetag.map((m, idx) => (idx === i ? { ...m, ...patch } : m)),
    }));

  const addMonetag = () =>
    setCfg((c) => ({
      ...c,
      monetag: [
        ...c.monetag,
        { id: `srv-${Date.now()}`, enabled: true, src: "", zone: "" },
      ],
    }));

  const removeMonetag = (i: number) =>
    setCfg((c) => ({ ...c, monetag: c.monetag.filter((_, idx) => idx !== i) }));

  const onSave = () => {
    saveAdConfig(cfg);
    toast.success("تم الحفظ. أعد تحميل الصفحة لتفعيل التغييرات.");
  };

  const onReset = () => {
    if (!confirm("استعادة الإعدادات الافتراضية؟")) return;
    resetAdConfig();
    setCfg(DEFAULT_AD_CONFIG);
    toast.success("تمت الاستعادة.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-primary">إعدادات الإعلانات</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReset}>
            <RotateCcw size={14} className="ml-1" /> استعادة الافتراضي
          </Button>
          <Button onClick={onSave}>
            <Save size={14} className="ml-1" /> حفظ
          </Button>
        </div>
      </div>

      {/* Monetag scripts */}
      <section className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">سكربتات Monetag (Multitag)</h2>
          <Button size="sm" variant="outline" onClick={addMonetag}>
            <Plus size={14} className="ml-1" /> إضافة سيرفر
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          domain + zone لكل سيرفر إعلاني. مثال: <code>quge5.com/88/tag.min.js</code> و zone <code>242128</code>.
        </p>
        <div className="space-y-3">
          {cfg.monetag.map((m, i) => (
            <div key={m.id} className="grid grid-cols-1 md:grid-cols-[1fr,180px,80px,40px] gap-2 items-end border border-border rounded p-3">
              <div>
                <Label className="text-xs">السكربت (src)</Label>
                <Input
                  value={m.src}
                  onChange={(e) => updateMonetag(i, { src: e.target.value })}
                  placeholder="https://quge5.com/88/tag.min.js"
                />
              </div>
              <div>
                <Label className="text-xs">Data-Zone</Label>
                <Input
                  value={m.zone}
                  onChange={(e) => updateMonetag(i, { zone: e.target.value })}
                  placeholder="242128"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={m.enabled}
                  onCheckedChange={(v) => updateMonetag(i, { enabled: v })}
                />
                <span className="text-xs">{m.enabled ? "مفعّل" : "معطّل"}</span>
              </div>
              <Button size="icon" variant="ghost" onClick={() => removeMonetag(i)}>
                <Trash2 size={14} className="text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Service Worker */}
      <section className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-lg font-bold mb-2">Service Worker (sw.js)</h2>
        <p className="text-xs text-muted-foreground mb-4">
          ⚠️ هذه القيم للعرض فقط — تعديل sw.js يتطلب تحديث الملف في <code>public/sw.js</code> وإعادة النشر.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Domain</Label>
            <Input
              value={cfg.sw.domain}
              onChange={(e) => setCfg((c) => ({ ...c, sw: { ...c.sw, domain: e.target.value } }))}
            />
          </div>
          <div>
            <Label className="text-xs">Zone ID</Label>
            <Input
              value={cfg.sw.zoneId}
              onChange={(e) => setCfg((c) => ({ ...c, sw: { ...c.sw, zoneId: e.target.value } }))}
            />
          </div>
        </div>
      </section>

      {/* Smartlinks */}
      <section className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-lg font-bold mb-4">روابط السمارت لينك</h2>
        <div className="space-y-3">
          {(Object.keys(cfg.smartlinks) as SmartlinkKey[]).map((k) => (
            <div key={k}>
              <Label className="text-xs">{k}</Label>
              <Input
                value={cfg.smartlinks[k]}
                onChange={(e) => updateSmartlink(k, e.target.value)}
                dir="ltr"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onReset}>
          <RotateCcw size={14} className="ml-1" /> استعادة الافتراضي
        </Button>
        <Button onClick={onSave}>
          <Save size={14} className="ml-1" /> حفظ
        </Button>
      </div>
    </div>
  );
}
