import { useState } from "react";
import { Menu, Search, LogIn, LogOut, Settings } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listCategories } from "@/lib/articles.functions";
import { useAuth } from "@/hooks/use-auth";

export function NavBar() {
  const navigate = useNavigate();
  const { user, signOut, isStaff } = useAuth();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { data: cats = [] } = useQuery({
    queryKey: ["cats-nav"],
    queryFn: () => listCategories(),
    staleTime: 5 * 60_000,
  });

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/search", search: { q } as any });
  }

  return (
    <nav className="bg-primary text-primary-foreground sticky top-0 z-40 shadow-md">
      <div className="container mx-auto px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 flex-wrap min-w-0">

        {/* Mobile label */}
        <span className="md:hidden text-sm font-bold py-3">الأقسام</span>

        <div className={`flex-1 items-center overflow-x-auto ${open ? "flex flex-col md:flex-row md:flex-wrap order-3 w-full" : "hidden md:flex"}`}>
          <Link to="/" onClick={() => setOpen(false)} className="w-full md:w-auto px-4 py-3 min-h-[44px] text-sm font-bold whitespace-nowrap hover:bg-white/10 hover:text-gold transition-colors md:border-l border-white/10 text-right">
            الرئيسية
          </Link>
          {cats.map((c: any) => (
            <Link
              key={c.id}
              to="/category/$slug"
              params={{ slug: c.slug }}
              onClick={() => setOpen(false)}
              className="w-full md:w-auto px-4 py-3 min-h-[44px] text-sm font-bold whitespace-nowrap hover:bg-white/10 hover:text-gold transition-colors md:border-l border-white/10 text-right"
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* Mobile auth links */}
        {open && (
          <div className="md:hidden w-full flex flex-col gap-1 py-2 border-t border-white/10 order-4">
            {user ? (
              <>
                {isStaff && (
                  <Link
                    to="/admin/ingest"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 min-h-[44px] text-sm font-semibold hover:bg-white/10 transition-colors"
                  >
                    <Settings size={16} />
                    لوحة التحكم
                  </Link>
                )}
                <button
                  onClick={() => { setOpen(false); signOut(); }}
                  className="flex items-center gap-2 px-4 py-3 min-h-[44px] text-sm font-semibold hover:bg-white/10 transition-colors w-full text-right"
                >
                  <LogOut size={16} />
                  خروج
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-3 min-h-[44px] text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                <LogIn size={16} />
                دخول
              </Link>
            )}
          </div>
        )}

        <form onSubmit={onSearch} className="hidden md:flex items-center bg-white/10 rounded-md px-2 shrink-0">
          <Search size={14} className="text-white/70" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث..."
            className="bg-transparent border-0 outline-none text-sm py-1.5 px-2 placeholder:text-white/60 w-40"
          />
        </form>
        <button className="md:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2 shrink-0 rounded-md hover:bg-white/10 transition-colors" aria-label="القائمة" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <Menu size={24} />
        </button>
      </div>
    </nav>
  );
}
