import { useState } from "react";
import { Menu, Search, LogIn, LogOut, Settings } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listCategories } from "@/lib/articles.functions";
import { useAuth } from "@/hooks/use-auth";

export function NavBar() {
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
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
      <div className="container mx-auto px-4 flex items-center justify-between gap-3">
        <div className={`flex-1 items-center overflow-x-auto ${open ? "flex flex-wrap" : "hidden md:flex"}`}>
          <Link to="/" className="px-4 py-3 text-sm font-bold whitespace-nowrap hover:bg-white/10 hover:text-gold transition-colors border-l border-white/10">
            الرئيسية
          </Link>
          {cats.map((c: any) => (
            <Link
              key={c.id}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="px-4 py-3 text-sm font-bold whitespace-nowrap hover:bg-white/10 hover:text-gold transition-colors border-l border-white/10"
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* Mobile auth links */}
        {open && (
          <div className="md:hidden w-full flex flex-col gap-2 py-2 border-t border-white/10 mt-1">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin/ingest"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors"
                  >
                    <Settings size={14} />
                    لوحة التحكم
                  </Link>
                )}
                <button
                  onClick={() => { setOpen(false); signOut(); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors w-full text-right"
                >
                  <LogOut size={14} />
                  خروج
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                <LogIn size={14} />
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
        <button className="md:hidden p-2" aria-label="القائمة" onClick={() => setOpen((v) => !v)}>
          <Menu size={20} />
        </button>
      </div>
    </nav>
  );
}
