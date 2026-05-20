export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-12">
      <div className="container mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h4 className="text-gold font-extrabold mb-3">القاهرة الكبرى</h4>
          <p className="text-sm opacity-80 leading-relaxed">
            بوابتك الإخبارية الأولى لمتابعة آخر أخبار مصر والعالم العربي على مدار الساعة.
          </p>
        </div>
        <div>
          <h4 className="text-gold font-bold mb-3">الأقسام</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><a href="#" className="hover:text-gold">أخبار</a></li>
            <li><a href="#" className="hover:text-gold">سياسة</a></li>
            <li><a href="#" className="hover:text-gold">اقتصاد</a></li>
            <li><a href="#" className="hover:text-gold">رياضة</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-gold font-bold mb-3">روابط</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><a href="#" className="hover:text-gold">من نحن</a></li>
            <li><a href="#" className="hover:text-gold">سياسة الخصوصية</a></li>
            <li><a href="#" className="hover:text-gold">اتصل بنا</a></li>
            <li><a href="#" className="hover:text-gold">إعلن معنا</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-gold font-bold mb-3">تواصل معنا</h4>
          <p className="text-sm opacity-80">القاهرة، جمهورية مصر العربية</p>
          <p className="text-sm opacity-80 mt-1">info@cairo-elkobra.com</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4 text-center text-xs opacity-70">
          © {new Date().getFullYear()} القاهرة الكبرى — جميع الحقوق محفوظة
        </div>
      </div>
    </footer>
  );
}
