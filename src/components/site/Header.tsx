export function Header() {
  const admin = [
    { role: "رئيس مجلس الإدارة", name: "حاتم حمدي" },
    { role: "نائب رئيس مجلس الإدارة", name: "شيماء حمدي / محسن جيلاني" },
    { role: "رئيس التحرير", name: "إبراهيم شعبان" },
    { role: "مدير التحرير", name: "وائل عبد العزيز" },
  ];

  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 shrink-0">
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

          {/* Admin masthead */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-right">
            {admin.map((a) => (
              <div key={a.role} className="text-[11px] md:text-xs">
                <div className="text-gold font-semibold">{a.role}</div>
                <div className="text-primary font-bold text-sm">{a.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
