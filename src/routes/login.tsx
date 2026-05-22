import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/site/TopBar";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "تسجيل الدخول — القاهرة الكبرى" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || email.split("@")[0] },
            emailRedirectTo: window.location.origin + "/admin/ingest",
          },
        });
        if (error) throw error;
        setErr("تم إنشاء الحساب بنجاح. يمكنك الآن تسجيل الدخول.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin/ingest" });
      }
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
            {mode === "login" ? "تسجيل الدخول للوحة التحكم" : "إنشاء حساب جديد"}
          </h1>
          <p className="text-xs text-muted-foreground mb-6">
            هذه الصفحة مخصّصة لإدارة الموقع والمحرّرين.
          </p>
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1">
                <Label>الاسم</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div className="space-y-1">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>كلمة السر</Label>
                {mode === "login" && (
                  <Link to="/forgot-password" className="text-xs text-gold hover:underline">
                    نسيت كلمة السر؟
                  </Link>
                )}
              </div>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {err && <div className="text-sm text-breaking">{err}</div>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "جارٍ..." : mode === "login" ? "دخول" : "إنشاء حساب"}
            </Button>
          </form>
          <div className="mt-4 text-sm text-center">
            {mode === "login" ? (
              <button onClick={() => setMode("signup")} className="text-gold hover:underline">
                ليس لديك حساب؟ سجّل الآن
              </button>
            ) : (
              <button onClick={() => setMode("login")} className="text-gold hover:underline">
                لديك حساب؟ سجّل الدخول
              </button>
            )}
          </div>
          <div className="mt-4 text-center">
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
