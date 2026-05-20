import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listCategories } from "@/lib/articles.functions";
import { saveCategory, deleteCategory } from "@/lib/categories.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({ component: CategoriesAdmin });

function CategoriesAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["cats"], queryFn: () => listCategories() });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await saveCategory({ data: { name, slug, sort_order: data.length } });
      setName(""); setSlug("");
      qc.invalidateQueries({ queryKey: ["cats"] });
    } catch (e: any) { setErr(e.message); }
  }

  async function remove(id: string) {
    if (!confirm("حذف القسم؟ الأخبار التابعة ستبقى بدون قسم.")) return;
    await deleteCategory({ data: { id } });
    qc.invalidateQueries({ queryKey: ["cats"] });
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-primary mb-4">إدارة الأقسام</h1>
      <form onSubmit={add} className="bg-card border border-border rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <Input placeholder="اسم القسم" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input placeholder="slug (a-z, 0-9, -)" value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9-]+" />
        <Button type="submit">إضافة</Button>
        {err && <div className="text-sm text-breaking md:col-span-4">{err}</div>}
      </form>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-right">
            <tr><th className="p-3">الاسم</th><th className="p-3">Slug</th><th className="p-3">إجراءات</th></tr>
          </thead>
          <tbody>
            {data.map((c: any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 font-bold text-primary">{c.name}</td>
                <td className="p-3 text-muted-foreground">{c.slug}</td>
                <td className="p-3"><Button size="sm" variant="destructive" onClick={() => remove(c.id)}><Trash2 size={14} /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
