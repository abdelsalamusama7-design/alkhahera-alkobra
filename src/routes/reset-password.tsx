import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/site/TopBar";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "إعادة تعيين كلمة السر — القاهرة الكبرى" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        // user clicked the link; session is set, ready to update password
      }
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password !== confirm) {
      setErr("كلمتا السر غير متطابقتين");
      return;
    }
    if (password.length < 6) {
      setErr("كلمة السر يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate({ to: "/login" }), 2000);
    } catch (e: any) {
      setErr(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <TopBar />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 flex items-center justify-center">
        <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-extrabold text-primary mb-1">
            إعادة تعيين كلمة السر
          </h1>
          <p className="text-xs text-muted-foreground mb-6">
            أدخل كلمة السر الجديدة أدناه.
          </p>
          {success ? (
            <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-4">
              تم تحديث كلمة السر بنجاح. جارٍ التحويل إلى تسجيل الدخول...
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1">
                <Label>كلمة السر الجديدة</Label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>تأكيد كلمة السر</Label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              {err && <div className="text-sm text-breaking">{err}</div>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "جارٍ..." : "تحديث كلمة السر"}
              </Button>
            </form>
          )}
          <div className="mt-4 text-center text-sm">
            <Link to="/login" className="text-gold hover:underline">
              تسجيل الدخول
            </Link>
          </div>
          <div className="mt-2 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:underline">
              ← العودة للصفحة الرئيسية
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
