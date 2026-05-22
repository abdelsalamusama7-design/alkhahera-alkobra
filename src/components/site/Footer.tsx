import { ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-12">
      <div className="container mx-auto px-4 py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
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
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-gold font-bold mb-1">للإعلان في الجريدة</p>
            <a href="tel:01113718006" className="text-sm font-bold hover:text-gold transition-colors" dir="ltr">
              01113718006
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4 text-center text-xs opacity-70 space-y-1">
          <p>© {new Date().getFullYear()} القاهرة الكبرى — جميع الحقوق محفوظة</p>
          <p className="flex items-center justify-center gap-2 flex-wrap">
            <span>تنفيذ وتصميم</span>
            <a
              href="https://www.instatech.site"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/30 hover:bg-gold hover:text-primary hover:scale-105 hover:shadow-md transition-all duration-300 text-xs font-semibold"
            >
              Insta-Tech-Labs
              <ExternalLink size={12} strokeWidth={2.5} />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
