import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, CheckCircle2, ClipboardCheck, Map, FileText, Globe, ArrowLeft, Save } from "lucide-react";

const STORAGE_KEY = "sitemap_last_confirmed_at";
const BASE_URL = "https://kaheraalkobra.online";

export const Route = createFileRoute("/admin/sitemap-guide")({
  head: () => ({
    meta: [
      { title: "دليل رفع Sitemap — Google Search Console" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SitemapGuidePage,
});

function SitemapGuidePage() {
  const [lastConfirmed, setLastConfirmed] = useState<string | null>(null);
  const [sitemapInput, setSitemapInput] = useState("sitemap.xml");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setLastConfirmed(stored);
  }, []);

  const handleConfirm = () => {
    const now = new Date().toLocaleString("ar-EG", {
      dateStyle: "long",
      timeStyle: "short",
    });
    localStorage.setItem(STORAGE_KEY, now);
    setLastConfirmed(now);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const steps = [
    {
      num: 1,
      title: "افتح Google Search Console",
      desc: "سجّل دخول بحساب Google المرتبط بالموقع، واختار الموقع من القائمة.",
      link: {
        href: `https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(BASE_URL + "/")}`,
        label: "فتح GSC — Sitemaps",
      },
    },
    {
      num: 2,
      title: "اذهب لقسم Sitemaps",
      desc: "من القائمة الجانبية اختار "Sitemaps" أو "خرائط الموقع".",
      link: {
        href: `https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(BASE_URL + "/")}`,
        label: "فتح قسم Sitemaps",
      },
    },
    {
      num: 3,
      title: "أدخل رابط Sitemap",
      desc: "انسخ الرابط التالي والصقه في خانة "أضف خريطة موقع جديدة".",
      action: (
        <div className="flex gap-2 mt-2">
          <Input
            dir="ltr"
            readOnly
            value={`${BASE_URL}/sitemap.xml`}
            className="font-mono text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(`${BASE_URL}/sitemap.xml`)}
          >
            {copied ? <CheckCircle2 size={14} className="ml-1" /> : <ClipboardCheck size={14} className="ml-1" />}
            {copied ? "تم النسخ" : "نسخ"}
          </Button>
        </div>
      ),
    },
    {
      num: 4,
      title: "اضغط إرسال",
      desc: "بعد اللصق، اضغط "إرسال" (Submit). جوجل بيعالج الـ sitemap ويظهرلك حالة "نجاح" أو "تمت المعالجة".",
    },
    {
      num: 5,
      title: "تحقق من الحالة",
      desc: "انتظر قليلاً واضغط "تحديث" في GSC. إذا ظهرت حالة "Success" أو "Processed" يبقى كل شيء تمام.",
    },
  ];

  return (
    <div dir="rtl" className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
          <Map size={22} /> دليل رفع Sitemap في Google Search Console
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          خطوات مرتبة بسيطة لرفع sitemap.xml على GSC. انسخ الرابط والصقه مباشرة.
        </p>
      </div>

      {/* Last confirmed badge */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={20} className="text-primary" />
          <div>
            <div className="text-sm font-bold text-primary">آخر مرة تأكدت فيها</div>
            <div className="text-xs text-muted-foreground">
              {lastConfirmed ?? "لم يُسجل بعد — أكمل الخطوات ثم اضغط "تم التأكد الآن""}
            </div>
          </div>
        </div>
        <Button size="sm" onClick={handleConfirm} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Save size={14} className="ml-1" /> تم التأكد الآن
        </Button>
      </div>

      {/* Steps */}
      <section className="bg-card border border-border rounded-lg overflow-hidden">
        <ul className="divide-y divide-border">
          {steps.map((s) => (
            <li key={s.num} className="p-4 flex items-start gap-4">
              <div className="shrink-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-extrabold text-sm">
                {s.num}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">{s.title}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</div>
                {s.link && (
                  <a
                    href={s.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2"
                  >
                    <Button size="sm" variant="outline">
                      <ExternalLink size={14} className="ml-1" /> {s.link.label}
                    </Button>
                  </a>
                )}
                {s.action}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Quick links */}
      <section className="bg-card border border-border rounded-lg p-4 space-y-3">
        <h2 className="font-extrabold text-primary flex items-center gap-2">
          <Globe size={18} /> روابط سريعة
        </h2>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(BASE_URL + "/")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="outline">
              <Map size={14} className="ml-1" /> GSC — Sitemaps
            </Button>
          </a>
          <a
            href={`https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(BASE_URL + "/")}&id=${encodeURIComponent(BASE_URL + "/")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="outline">
              <FileText size={14} className="ml-1" /> فحص الصفحة الرئيسية
            </Button>
          </a>
          <a href={`${BASE_URL}/sitemap.xml`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">
              <ExternalLink size={14} className="ml-1" /> عرض sitemap.xml
            </Button>
          </a>
          <a href={`${BASE_URL}/robots.txt`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">
              <ExternalLink size={14} className="ml-1" /> عرض robots.txt
            </Button>
          </a>
        </div>
      </section>

      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <ArrowLeft size={12} /> بعد ما تخلص الخطوات، اضغط "تم التأكد الآن" عشان يسجل التاريخ.
      </div>
    </div>
  );
}
