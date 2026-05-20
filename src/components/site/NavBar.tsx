import { Menu, ChevronDown } from "lucide-react";

const links = [
  { label: "الرئيسية", href: "/" },
  { label: "أخبار", href: "#" },
  { label: "تقارير", href: "#" },
  { label: "اقتصاد", href: "#" },
  { label: "رياضة", href: "#" },
  { label: "منوعات", href: "#" },
  { label: "سياسة", href: "#" },
  { label: "حوادث", href: "#" },
  { label: "فن", href: "#" },
];

export function NavBar() {
  return (
    <nav className="bg-primary text-primary-foreground sticky top-0 z-40 shadow-md">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center overflow-x-auto">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="px-4 py-3 text-sm font-bold whitespace-nowrap hover:bg-white/10 hover:text-gold transition-colors border-l border-white/10 last:border-l-0"
            >
              {l.label}
            </a>
          ))}
          <button className="px-4 py-3 text-sm font-bold flex items-center gap-1 hover:bg-white/10 hover:text-gold transition-colors">
            المزيد <ChevronDown size={14} />
          </button>
        </div>
        <button className="md:hidden p-2" aria-label="القائمة">
          <Menu size={20} />
        </button>
      </div>
    </nav>
  );
}
