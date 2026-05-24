import { TimeAgo } from "@/components/site/TimeAgo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminListArticles, deleteArticle, findDuplicateCovers } from "@/lib/articles.functions";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ExternalLink, AlertTriangle } from "lucide-react";
import { DailyAdCtrPanel } from "@/components/admin/DailyAdCtrPanel";

export const Route = createFileRoute("/admin/")({
  component: AdminList,
});

function AdminList() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-articles", q],
    queryFn: () => adminListArticles({ data: { q: q || undefined, limit: 100 } }),
  });
  const { data: dupData } = useQuery({
    queryKey: ["admin-duplicate-covers"],
    queryFn: () => findDuplicateCovers(),
    staleTime: 60_000,
  });
  const duplicates = dupData?.duplicates ?? [];

  async function onDelete(id: string) {
    if (!confirm("هل تريد حذف هذا الخبر؟")) return;
    await deleteArticle({ data: { id } });
    qc.invalidateQueries({ queryKey: ["admin-articles"] });
  }

  const canDelete = can("delete_article");
  const canCreate = can("create_article");

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-extrabold text-primary">إدارة الأخبار</h1>
        {canCreate && <Link to="/admin/new"><Button>+ خبر جديد</Button></Link>}
      </div>

      <div className="mb-4">
        <DailyAdCtrPanel compact />
      </div>


      {duplicates.length > 0 && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <div className="flex items-center gap-2 mb-2 text-destructive font-bold">
            <AlertTriangle size={18} />
            تم اكتشاف {duplicates.length} صورة غلاف مكررة بين عدة مقالات
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {duplicates.slice(0, 10).map((g) => (
              <div key={g.cover} className="flex gap-3 items-start bg-background/60 rounded p-2">
                <img src={g.cover} alt="" className="w-16 h-16 object-cover rounded border border-border shrink-0" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">{g.articles.length} مقالات تستخدم نفس الصورة:</div>
                  <ul className="space-y-1">
                    {g.articles.map((a) => (
                      <li key={a.id} className="text-sm">
                        <Link to="/admin/edit/$id" params={{ id: a.id }} className="text-primary hover:underline line-clamp-1">
                          {a.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
            {duplicates.length > 10 && (
              <div className="text-xs text-muted-foreground text-center">…و {duplicates.length - 10} مجموعات أخرى</div>
            )}
          </div>
        </div>
      )}

      <Input placeholder="بحث بالعنوان..." value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-md" />
      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-right">
            <tr>
              <th className="p-3">العنوان</th>
              <th className="p-3 hidden md:table-cell">القسم</th>
              <th className="p-3 hidden md:table-cell">الحالة</th>
              <th className="p-3 hidden lg:table-cell">المشاهدات</th>
              <th className="p-3 hidden lg:table-cell">التاريخ</th>
              <th className="p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">جارٍ التحميل...</td></tr>}
            {!isLoading && data.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">لا توجد أخبار.</td></tr>}
            {data.map((a: any) => (
              <tr key={a.id} className="border-t border-border">
                <td className="p-3">
                  <div className="font-bold text-primary line-clamp-2 max-w-md">{a.title}</div>
                  {a.is_breaking && <Badge variant="destructive" className="mt-1">عاجل</Badge>}
                </td>
                <td className="p-3 hidden md:table-cell">{a.category?.name ?? "—"}</td>
                <td className="p-3 hidden md:table-cell">{a.is_published ? <span className="text-emerald-600 font-bold">منشور</span> : <span className="text-muted-foreground">مسودة</span>}</td>
                <td className="p-3 hidden lg:table-cell">{a.view_count}</td>
                <td className="p-3 hidden lg:table-cell text-muted-foreground"><TimeAgo iso={a.published_at} /></td>
                <td className="p-3">
                  <div className="flex gap-2">
                    {a.is_published && (
                      <Link to="/article/$slug" params={{ slug: a.slug }} target="_blank"><Button size="sm" variant="outline"><ExternalLink size={14} /></Button></Link>
                    )}
                    <Link to="/admin/edit/$id" params={{ id: a.id }}><Button size="sm" variant="outline"><Edit size={14} /></Button></Link>
                    {canDelete && (
                      <Button size="sm" variant="destructive" onClick={() => onDelete(a.id)}><Trash2 size={14} /></Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
