import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listDrafts, updateDraft, approveDraft, rejectDraft, deleteDraft } from "@/lib/drafts.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, X, Trash2, Save, Eye } from "lucide-react";

export const Route = createFileRoute("/admin/drafts")({
  head: () => ({ meta: [{ title: "مراجعة المسودات — لوحة التحكم" }] }),
  component: DraftsPage,
});

type Draft = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  source: string | null;
  source_url: string | null;
  tags: string[];
  original_title: string | null;
  original_excerpt: string | null;
  status: string;
  created_at: string;
};

function DraftsPage() {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [items, setItems] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await listDrafts({ data: { status } });
      setItems(r as Draft[]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [status]);

  async function approve(id: string) {
    setBusy(id);
    try { await approveDraft({ data: { id } }); await load(); }
    catch (e: any) { alert(e.message); }
    finally { setBusy(null); }
  }
  async function reject(id: string) {
    setBusy(id);
    try { await rejectDraft({ data: { id } }); await load(); }
    catch (e: any) { alert(e.message); }
    finally { setBusy(null); }
  }
  async function del(id: string) {
    if (!confirm("حذف المسودة نهائياً؟")) return;
    setBusy(id);
    try { await deleteDraft({ data: { id } }); await load(); }
    finally { setBusy(null); }
  }
  async function saveEdit() {
    if (!editing) return;
    setBusy(editing.id);
    try {
      await updateDraft({ data: {
        id: editing.id,
        title: editing.title,
        excerpt: editing.excerpt ?? "",
        content: editing.content ?? "",
        tags: editing.tags ?? [],
        cover_image: editing.cover_image,
      } });
      setEditing(null);
      await load();
    } catch (e: any) { alert(e.message); }
    finally { setBusy(null); }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-extrabold text-primary">مراجعة الأخبار قبل النشر</h1>
        <p className="text-sm text-muted-foreground mt-1">عدّل العنوان والمقدمة والمحتوى ثم وافق للنشر. الأخبار المرفوضة تبقى للأرشيف.</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 text-sm font-bold border-b-2 ${status === s ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            {s === "pending" ? "بانتظار المراجعة" : s === "approved" ? "موافَق عليها" : "مرفوضة"}
            <span className="mr-2 text-xs">({status === s ? items.length : ""})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 size={16} className="animate-spin" /> جارٍ التحميل...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">لا توجد مسودات</div>
      ) : (
        <div className="grid gap-3">
          {items.map((d) => (
            <div key={d.id} className="bg-card border border-border rounded-lg p-4 flex gap-4">
              {d.cover_image && (
                <img src={d.cover_image} alt="" className="w-32 h-24 object-cover rounded shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <h3 className="font-bold text-base">{d.title}</h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{d.source} · {new Date(d.created_at).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{d.excerpt}</p>
                {d.original_title && d.original_title !== d.title && (
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer">العنوان الأصلي</summary>
                    <p className="text-xs mt-1 p-2 bg-muted rounded">{d.original_title}</p>
                  </details>
                )}
                {d.tags?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {d.tags.map((t) => <span key={t} className="text-xs bg-muted px-2 py-0.5 rounded">{t}</span>)}
                  </div>
                )}
                {status === "pending" && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Button size="sm" onClick={() => approve(d.id)} disabled={busy === d.id} className="bg-emerald-600 hover:bg-emerald-700">
                      <Check size={14} className="ml-1" /> موافقة ونشر
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(d)}>
                      <Eye size={14} className="ml-1" /> معاينة وتعديل
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reject(d.id)} disabled={busy === d.id}>
                      <X size={14} className="ml-1" /> رفض
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => del(d.id)} disabled={busy === d.id}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )}
                {status !== "pending" && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="ghost" onClick={() => del(d.id)}><Trash2 size={14} className="ml-1" /> حذف</Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl" onClick={() => setEditing(null)}>
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">معاينة وتعديل</h2>
              <button onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <label className="text-xs font-bold">العنوان</label>
            <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <label className="text-xs font-bold">المقدمة</label>
            <textarea className="w-full bg-muted border border-border rounded p-2 text-sm" rows={3} value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} />
            <label className="text-xs font-bold">المحتوى</label>
            <textarea className="w-full bg-muted border border-border rounded p-2 text-sm" rows={12} value={editing.content ?? ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
            <label className="text-xs font-bold">رابط الصورة</label>
            <Input value={editing.cover_image ?? ""} onChange={(e) => setEditing({ ...editing, cover_image: e.target.value })} dir="ltr" />
            <label className="text-xs font-bold">الوسوم (مفصولة بفاصلة)</label>
            <Input value={(editing.tags ?? []).join("، ")} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(/[,،]/).map((s) => s.trim()).filter(Boolean) })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)}>إلغاء</Button>
              <Button onClick={saveEdit} disabled={busy === editing.id}><Save size={14} className="ml-1" /> حفظ</Button>
              <Button onClick={async () => { await saveEdit(); await approve(editing.id); }} className="bg-emerald-600 hover:bg-emerald-700">
                <Check size={14} className="ml-1" /> حفظ ونشر
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
