import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCategories, saveArticle } from "@/lib/articles.functions";
import { uploadArticleImage } from "@/lib/upload";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";

type Initial = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content?: string | null;
  cover_image?: string | null;
  category_id?: string | null;
  author_name?: string | null;
  source?: string | null;
  source_url?: string | null;
  is_breaking?: boolean;
  is_published?: boolean;
};

export function ArticleForm({ initial, onSaved }: { initial?: Initial; onSaved: (id: string) => void }) {
  const { can } = useAuth();
  const canPublish = can("publish_article");
  const canBreaking = can("mark_breaking");
  const [form, setForm] = useState<Initial>({
    is_published: true,
    is_breaking: false,
    source: "القاهرة الكبرى",
    ...initial,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { data: cats = [] } = useQuery({ queryKey: ["cats"], queryFn: () => listCategories() });

  function set<K extends keyof Initial>(k: K, v: Initial[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setErr(null);
    try {
      const url = await uploadArticleImage(f);
      set("cover_image", url);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const saved = await saveArticle({
        data: {
          id: form.id,
          title: form.title || "",
          slug: form.slug || undefined,
          excerpt: form.excerpt || null,
          content: form.content || null,
          cover_image: form.cover_image || null,
          category_id: form.category_id || null,
          author_name: form.author_name || null,
          source: form.source || "القاهرة الكبرى",
          source_url: form.source_url || null,
          is_breaking: !!form.is_breaking,
          is_published: form.is_published !== false,
        },
      });
      onSaved((saved as any).id);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-lg p-6 space-y-4 max-w-3xl">
      <div className="space-y-1">
        <Label>العنوان *</Label>
        <Input required value={form.title || ""} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>القسم</Label>
          <select value={form.category_id || ""} onChange={(e) => set("category_id", e.target.value || null)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">— بدون —</option>
            {cats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label>الكاتب</Label>
          <Input value={form.author_name || ""} onChange={(e) => set("author_name", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>الملخص</Label>
        <Textarea rows={2} value={form.excerpt || ""} onChange={(e) => set("excerpt", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>المحتوى</Label>
        <Textarea rows={10} value={form.content || ""} onChange={(e) => set("content", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>صورة الغلاف</Label>
        <div className="flex items-center gap-3">
          <Input value={form.cover_image || ""} onChange={(e) => set("cover_image", e.target.value)} placeholder="رابط الصورة أو ارفع ملف" />
          <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:bg-primary/90">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} رفع
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
        </div>
        {form.cover_image && <img src={form.cover_image} alt="" className="mt-2 max-h-40 rounded" />}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>المصدر</Label>
          <Input value={form.source || ""} onChange={(e) => set("source", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>رابط المصدر</Label>
          <Input type="url" value={form.source_url || ""} onChange={(e) => set("source_url", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>الـ Slug (اختياري)</Label>
        <Input value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated" />
      </div>
      <div className="flex items-center gap-6 flex-wrap">
        {canBreaking && (
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={!!form.is_breaking} onChange={(e) => set("is_breaking", e.target.checked)} />
            خبر عاجل
          </label>
        )}
        {canPublish ? (
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={form.is_published !== false} onChange={(e) => set("is_published", e.target.checked)} />
            منشور
          </label>
        ) : (
          <span className="text-xs text-muted-foreground">سيتم حفظ الخبر كمسودة بانتظار مراجعة المحرر.</span>
        )}
      </div>
      {err && <div className="text-sm text-breaking">{err}</div>}
      <Button type="submit" disabled={saving || uploading} className="w-full md:w-auto">
        {saving ? "جارٍ الحفظ..." : "حفظ"}
      </Button>
    </form>
  );
}
