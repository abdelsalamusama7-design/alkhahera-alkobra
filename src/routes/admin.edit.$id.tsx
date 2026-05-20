import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminGetArticle } from "@/lib/articles.functions";
import { ArticleForm } from "@/components/site/ArticleForm";

export const Route = createFileRoute("/admin/edit/$id")({
  component: EditArticle,
});

function EditArticle() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-article", id],
    queryFn: () => adminGetArticle({ data: { id } }),
  });
  if (isLoading) return <div className="text-center p-8">جارٍ التحميل...</div>;
  if (!data) return <div className="text-center p-8 text-breaking">الخبر غير موجود</div>;
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-primary mb-4">تعديل الخبر</h1>
      <ArticleForm initial={data as any} onSaved={() => navigate({ to: "/admin" })} />
    </div>
  );
}
