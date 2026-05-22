import logo from "@/assets/logo.png";
import { Search, LogIn, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/site/ThemeToggle";

export function Header() {
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
  const [q, setQ] = useState("");
  const board = [
    { role: "رئيس مجلس الإدارة", name: "المهندس حاتم حمدي" },
    { role: "نائب رئيس مجلس الإدارة", name: "الأستاذة شيماء حمدي" },
    { role: "رئيس تكنولوجيا المعلومات", name: "د عبدالسلام أسامة" },
  ];

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) navigate({ to: "/search", search: { q: q.trim() } as any });
  }

  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group w-full md:w-auto justify-center md:justify-start">
            <img
              src={logo}
              alt="القاهرة الكبرى - بوابة الأخبار المصرية والعربية"
              className="h-12 sm:h-14 md:h-16 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              loading="eager"
            />
            <span className="hidden md:inline-block h-10 w-px bg-border" />
            <span className="hidden md:inline text-[11px] text-muted-foreground tracking-wider">
              بوابة الأخبار المصرية والعربية
            </span>
          </a>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 w-full md:w-auto">
            {/* Search */}
            <form onSubmit={onSearch} className="flex items-center bg-muted border border-border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 transition-shadow w-full md:w-auto">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث عن خبر أو عنوان..."
                className="bg-transparent border-0 outline-none text-sm py-2 px-3 placeholder:text-muted-foreground flex-1 min-w-0 md:w-64"
              />
              <button
                type="submit"
                aria-label="بحث"
                className="px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
              >
                <Search size={16} />
              </button>
            </form>

            {/* Board */}
            <div className="hidden lg:flex items-center gap-4 text-right">
              {board.map((item) => (
                <div key={item.role} className="flex flex-col items-end">
                  <span className="text-[11px] text-muted-foreground">{item.role}</span>
                  <span className="text-sm font-bold text-primary">{item.name}</span>
                </div>
              ))}
            </div>

            {/* Auth + theme */}
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <ThemeToggle />
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin/ingest"
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Settings size={14} />
                      لوحة التحكم
                    </Link>
                  )}
                  <button
                    onClick={signOut}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <LogOut size={14} />
                    خروج
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <LogIn size={14} />
                  دخول
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
