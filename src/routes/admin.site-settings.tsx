import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { getSiteSetting, setSiteSetting } from "@/lib/site-settings.functions";

export const Route = createFileRoute("/admin/site-settings")({
  head: () => ({ meta: [{ title: "إعدادات الموقع — لوحة التحكم" }] }),
  component: SiteSettingsPage,
});

const PRESETS = [12, 24, 36, 48];

function SiteSettingsPage() {
  const get = useServerFn(getSiteSetting);
  const set = useServerFn(setSiteSetting);
  const [count, setCount] = useState<number>(24);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    get({ data: { key: "topics_circles_count" } }).then((r) => {
      const v = typeof r.value === "number" ? r.value : Number(r.value);
      if (!Number.isNaN(v) && v > 0) setCount(v);
    });
  }, [get]);

  const onSave = async () => {
    setSaving(true);
    try {
      await set({ data: { key: "topics_circles_count", value: count } });
      toast.success("تم الحفظ. سيتم تطبيق التغيير على الصفحة الرئيسية.");
    } catch (e: any) {
      toast.error(e?.message ?? "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl" className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary mb-2">إعدادات الموقع</h1>
        <p className="text-sm text-muted-foreground">
          إعدادات بسيطة تتحكم في طريقة عرض الصفحة الرئيسية.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div>
          <Label className="font-bold mb-2 block">
            عدد دوائر «أهم أحداث العالم»
          </Label>
          <p className="text-xs text-muted-foreground mb-3">
            الحد الأقصى للعناصر التي تظهر في شريط الدوائر أعلى الصفحة الرئيسية.
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {PRESETS.map((p) => (
              <Button
                key={p}
                type="button"
                variant={count === p ? "default" : "outline"}
                size="sm"
                onClick={() => setCount(p)}
              >
                {p}
              </Button>
            ))}
          </div>

          <input
            type="number"
            min={3}
            max={60}
            value={count}
            onChange={(e) => setCount(Math.max(3, Math.min(60, Number(e.target.value) || 0)))}
            className="w-32 h-10 px-3 rounded-md border border-input bg-background text-sm"
          />
        </div>

        <Button onClick={onSave} disabled={saving}>
          <Save size={14} className="ml-1" />
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </Button>
      </div>
    </div>
  );
}
