import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Newspaper, FolderTree, Plus, Rss, Users, BarChart3, Globe, Megaphone } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "لوحة التحكم — القاهرة الكبرى" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading, isStaff, can, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading) return <div className="p-8 text-center" dir="rtl">جارٍ التحميل...</div>;
  if (!user) return null;
  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" dir="rtl">
        <div className="text-center bg-card border border-border rounded-lg p-8 max-w-md">
          <h1 className="text-xl font-extrabold text-primary mb-2">ليس لديك صلاحية الوصول</h1>
          <p className="text-sm text-muted-foreground mb-4">يجب أن يمنحك مسؤول النظام دوراً مناسباً.</p>
          <Button onClick={() => signOut().then(() => navigate({ to: "/login" }))}>تسجيل الخروج</Button>
        </div>
      </div>
    );
  }

  const nav = [
    { to: "/admin", label: "الأخبار", icon: Newspaper, exact: true, show: true },
    { to: "/admin/new", label: "خبر جديد", icon: Plus, show: can("create_article") },
    { to: "/admin/stats", label: "الإحصائيات", icon: BarChart3, show: can("view_publish_stats") },
    { to: "/admin/traffic", label: "مصادر الزيارات", icon: Globe, show: can("view_publish_stats") },
    { to: "/admin/categories", label: "الأقسام", icon: FolderTree, show: can("manage_categories") },
    { to: "/admin/users", label: "المستخدمون", icon: Users, show: can("manage_users") },
    { to: "/admin/ingest", label: "سحب RSS", icon: Rss, show: can("ingest_rss") },
    { to: "/admin/ad-settings", label: "إعدادات الإعلانات", icon: Megaphone, show: true },
  ].filter((n) => n.show);


  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-extrabold text-lg">القاهرة الكبرى — لوحة التحكم</Link>
          <div className="flex items-center gap-3">
            <span className="text-xs opacity-80 hidden sm:inline">{user.email}</span>
            <Button size="sm" variant="secondary" onClick={() => signOut().then(() => navigate({ to: "/login" }))}>
              <LogOut size={14} className="ml-1" /> خروج
            </Button>
          </div>
        </div>
        <nav className="container mx-auto px-4 flex gap-1 overflow-x-auto">
          {nav.map((n) => {
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to as any}
                className={`px-4 py-2 text-sm font-bold whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${active ? "border-gold text-gold" : "border-transparent hover:text-gold"}`}
              >
                <Icon size={14} /> {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
