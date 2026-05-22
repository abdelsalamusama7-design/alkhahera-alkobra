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
            <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-[#0a1410] ring-1 ring-gold/30 shadow-[0_4px_20px_rgba(0,0,0,0.15)] overflow-hidden transition-transform group-hover:scale-105">
              <img
                src={logo}
                alt="شعار القاهرة الكبرى"
                className="h-full w-full object-contain p-1.5"
                loading="eager"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <h1 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight">
                القاهرة الكبرى
              </h1>
              <span className="text-[11px] text-muted-foreground tracking-wider">
                بوابة الأخبار المصرية والعربية
              </span>
            </div>
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
