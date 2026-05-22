import logo from "@/assets/logo.png";

export function Header() {
  const board = [
    { role: "رئيس مجلس الإدارة", name: "المهندس حاتم حمدي" },
    { role: "نائب رئيس مجلس الإدارة", name: "الأستاذة شيماء حمدي" },
    { role: "رئيس تكنولوجيا المعلومات", name: "د عبدالسلام أسامة" },
  ];

  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 shrink-0 group">
            <img
              src={logo}
              alt="القاهرة الكبرى - بوابة الأخبار المصرية والعربية"
              className="h-14 md:h-16 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              loading="eager"
            />
            <span className="hidden md:inline-block h-10 w-px bg-border" />
            <span className="hidden md:inline text-[11px] text-muted-foreground tracking-wider">
              بوابة الأخبار المصرية والعربية
            </span>
          </a>

          {/* Board */}
          <div className="flex items-center gap-4 text-right">
            {board.map((item) => (
              <div key={item.role} className="flex flex-col items-end">
                <span className="text-[11px] text-muted-foreground">{item.role}</span>
                <span className="text-sm font-bold text-primary">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
