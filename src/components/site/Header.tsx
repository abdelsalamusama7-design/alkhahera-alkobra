export function Header() {
  const board = [
    { role: "رئيس مجلس الإدارة", name: "المهندس حاتم حمدي" },
    { role: "نائب رئيس مجلس الإدارة", name: "شيماء حمدي" },
    { role: "رئيس تكنولوجيا المعلومات", name: "د عبدالسلام أسامة" },
  ];

  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 shrink-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-gradient-to-br from-gold to-amber-600 text-gold-foreground shadow-md">
              <svg viewBox="0 0 64 64" className="h-9 w-9" fill="currentColor" aria-hidden="true">
                {/* Pyramids + sun */}
                <circle cx="14" cy="20" r="6" />
                <path d="M2 54 L22 22 L42 54 Z" />
                <path d="M28 54 L48 18 L62 54 Z" />
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <h1 className="text-2xl md:text-3xl font-extrabold text-primary">
                القاهرة الكبرى
              </h1>
              <span className="text-[11px] text-muted-foreground">
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
