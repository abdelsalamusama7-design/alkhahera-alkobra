import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listRssSources, upsertRssSource, deleteRssSource, toggleRssSource } from "@/lib/rss-sources.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, Save, X, ArrowUp, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/admin/rss-sources")({
  head: () => ({ meta: [{ title: "إدارة مصادر RSS — لوحة التحكم" }] }),
  component: RssSourcesPage,
});

type Source = {
  id: string;
  name: string;
  url: string;
  category_slug: string;
  source_label: string;
  enabled: boolean;
  auto_publish: boolean;
  max_items: number;
  sort_order: number;
  last_fetched_at: string | null;
  last_inserted_count: number;
  last_error: string | null;
  total_inserted: number;
};

const EMPTY: Omit<Source, "id" | "last_fetched_at" | "last_inserted_count" | "last_error" | "total_inserted"> & { id?: string } = {
  name: "",
  url: "",
  category_slug: "world",
  source_label: "",
  enabled: true,
  auto_publish: false,
  max_items: 8,
  sort_order: 100,
};

function RssSourcesPage() {
  const [items, setItems] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await listRssSources();
      setItems(r as Source[]);
      setErr(null);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      await upsertRssSource({
        data: {
          ...(editing.id ? { id: editing.id } : {}),
          name: editing.name,
          url: editing.url,
          category_slug: editing.category_slug,
          source_label: editing.source_label,
          enabled: !!editing.enabled,
          auto_publish: !!editing.auto_publish,
          max_items: Number(editing.max_items) || 8,
          sort_order: Number(editing.sort_order) || 0,
        },
      });
      setEditing(null);
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(id: string, field: "enabled" | "auto_publish", value: boolean) {
    setItems((p) => p.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
    try { await toggleRssSource({ data: { id, field, value } }); }
    catch (e: any) { alert(e.message); load(); }
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = items.findIndex((x) => x.id === id);
    const swap = items[idx + dir];
    if (!swap) return;
    const a = items[idx], b = swap;
    await upsertRssSource({ data: { id: a.id, name: a.name, url: a.url, category_slug: a.category_slug, source_label: a.source_label, enabled: a.enabled, auto_publish: a.auto_publish, max_items: a.max_items, sort_order: b.sort_order } });
    await upsertRssSource({ data: { id: b.id, name: b.name, url: b.url, category_slug: b.category_slug, source_label: b.source_label, enabled: b.enabled, auto_publish: b.auto_publish, max_items: b.max_items, sort_order: a.sort_order } });
    load();
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا المصدر؟")) return;
    await deleteRssSource({ data: { id } });
    load();
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-primary">إدارة مصادر RSS</h1>
          <p className="text-sm text-muted-foreground mt-1">فعّل/عطّل المصادر، تحكّم بعدد الأخبار، وحدّد أيها يُنشر تلقائياً وأيها يذهب للمراجعة.</p>
        </div>
        <Button onClick={() => setEditing({ ...EMPTY })}><Plus size={16} className="ml-1" /> مصدر جديد</Button>
      </div>

      {err && <div className="text-sm text-breaking bg-breaking/10 border border-breaking p-3 rounded">{err}</div>}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 size={16} className="animate-spin" /> جارٍ التحميل...</div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs">
              <tr>
                <th className="p-2 text-right">الاسم</th>
                <th className="p-2 text-right">المصدر</th>
                <th className="p-2 text-right">القسم</th>
                <th className="p-2">العدد</th>
                <th className="p-2">مُفعّل</th>
                <th className="p-2">نشر تلقائي</th>
                <th className="p-2">آخر سحب</th>
                <th className="p-2">إجمالي</th>
                <th className="p-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s, i) => (
                <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-2 max-w-[200px]">
                    <div className="font-bold truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{s.url}</div>
                    {s.last_error && <div className="text-xs text-breaking truncate">⚠ {s.last_error}</div>}
                  </td>
                  <td className="p-2">{s.source_label}</td>
                  <td className="p-2"><code className="text-xs">{s.category_slug}</code></td>
                  <td className="p-2 text-center">{s.max_items}</td>
                  <td className="p-2 text-center">
                    <input type="checkbox" checked={s.enabled} onChange={(e) => toggle(s.id, "enabled", e.target.checked)} className="cursor-pointer" />
                  </td>
                  <td className="p-2 text-center">
                    <input type="checkbox" checked={s.auto_publish} onChange={(e) => toggle(s.id, "auto_publish", e.target.checked)} className="cursor-pointer" />
                  </td>
                  <td className="p-2 text-center text-xs whitespace-nowrap">
                    {s.last_fetched_at ? (
                      <>
                        <div>{new Date(s.last_fetched_at).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}</div>
                        <div className="text-emerald-600">+{s.last_inserted_count}</div>
                      </>
                    ) : "—"}
                  </td>
                  <td className="p-2 text-center font-bold">{s.total_inserted}</td>
                  <td className="p-2">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => move(s.id, -1)} disabled={i === 0} className="p-1 hover:text-primary disabled:opacity-30"><ArrowUp size={14} /></button>
                      <button onClick={() => move(s.id, 1)} disabled={i === items.length - 1} className="p-1 hover:text-primary disabled:opacity-30"><ArrowDown size={14} /></button>
                      <button onClick={() => setEditing({ ...s })} className="p-1 hover:text-primary">تعديل</button>
                      <button onClick={() => remove(s.id)} className="p-1 hover:text-breaking"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">لا توجد مصادر بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl" onClick={() => setEditing(null)}>
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing.id ? "تعديل مصدر" : "مصدر جديد"}</h2>
              <button onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold">الاسم الكامل</label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <label className="text-xs font-bold">رابط RSS</label>
              <Input value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value })} dir="ltr" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold">اسم المصدر المنشور</label>
                  <Input value={editing.source_label} onChange={(e) => setEditing({ ...editing, source_label: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold">slug القسم</label>
                  <Input value={editing.category_slug} onChange={(e) => setEditing({ ...editing, category_slug: e.target.value })} dir="ltr" />
                </div>
                <div>
                  <label className="text-xs font-bold">عدد الأخبار/سحب</label>
                  <Input type="number" min={1} max={50} value={editing.max_items} onChange={(e) => setEditing({ ...editing, max_items: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold">ترتيب</label>
                  <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={!!editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} /> مُفعّل
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={!!editing.auto_publish} onChange={(e) => setEditing({ ...editing, auto_publish: e.target.checked })} /> نشر تلقائي (بدون مراجعة)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)}>إلغاء</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin ml-1" /> : <Save size={14} className="ml-1" />} حفظ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
