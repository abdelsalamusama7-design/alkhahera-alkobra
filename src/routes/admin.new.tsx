import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArticleForm } from "@/components/site/ArticleForm";

export const Route = createFileRoute("/admin/new")({
  component: NewArticle,
});

function NewArticle() {
  const navigate = useNavigate();
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-primary mb-4">إنشاء خبر جديد</h1>
      <ArticleForm onSaved={() => navigate({ to: "/admin" })} />
    </div>
  );
}
