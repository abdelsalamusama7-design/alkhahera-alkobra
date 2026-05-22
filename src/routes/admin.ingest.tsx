import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { adminIngestRss } from "@/lib/rss.functions";
import { postAllToFacebook } from "@/lib/social.functions";
import { Button } from "@/components/ui/button";
import { Rss, Loader2, Facebook } from "lucide-react";

export const Route = createFileRoute("/admin/ingest")({ component: IngestPage });

function IngestPage() {
  const [running, setRunning] = useState(false);
  const [fbRunning, setFbRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [fbResult, setFbResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fbErr, setFbErr] = useState<string | null>(null);

  async function run() {
    setRunning(true); setErr(null); setResult(null);
    try {
      const r = await adminIngestRss();
      setResult(r);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setRunning(false);
    }
  }

  async function runFacebook() {
    setFbRunning(true); setFbErr(null); setFbResult(null);
    try {
      const r = await postAllToFacebook();
      setFbResult(r);
    } catch (e: any) {
      setFbErr(e.message);
    } finally {
      setFbRunning(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* RSS Ingestion */}
      <section>
        <h1 className="text-2xl font-extrabold text-primary mb-2 flex items-center gap-2">
          <Rss size={20} /> سحب الأخبار من المصادر
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          يتم السحب من اليوم السابع، المصري اليوم، MSN عربي، BBC عربي، والجزيرة — ثم تُعاد صياغة كل خبر تلقائيًا
          بأسلوب احترافي وعناوين جذابة (Hook) عبر الذكاء الاصطناعي قبل النشر. الأخبار المكررة تُتجاهل تلقائياً.
        </p>
        <Button onClick={run} disabled={running} size="lg">
          {running ? <><Loader2 size={16} className="animate-spin ml-2" /> جارٍ السحب وإعادة الصياغة...</> : "ابدأ السحب والصياغة الآن"}
        </Button>
        {err && <div className="mt-4 text-sm text-breaking bg-breaking/10 border border-breaking p-3 rounded">{err}</div>}
        {result && (
          <div className="mt-6 bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="text-emerald-600 font-bold">
              ✓ تم — أُضيف {result.inserted} خبر، أُعيدت صياغة {result.rewritten ?? 0}، تم تجاهل {result.skipped} مكرر
            </div>
            {(result.facebookPosted !== undefined || result.facebookFailed !== undefined) && (
              <div className="flex items-center gap-2 text-sm border-t border-border pt-3">
                <Facebook size={16} className="text-blue-600" />
                <span>
                  {result.facebookPosted > 0 ? (
                    <span className="text-emerald-600 font-semibold">نُشر {result.facebookPosted} على الفيسبوك</span>
                  ) : (
                    <span className="text-muted-foreground">لم يُنشر على الفيسبوك</span>
                  )}
                  {result.facebookFailed > 1 && (
                    <span className="text-breaking mr-2">({result.facebookFailed} فشل)</span>
                  )}
                </span>
              </div>
            )}
            {result.facebookErrors?.length > 0 && (
              <div>
                <div className="text-sm font-bold text-breaking">أخطاء الفيسبوك:</div>
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                  {result.facebookErrors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
            {result.errors?.length > 0 && (
              <div>
                <div className="text-sm font-bold text-breaking">أخطاء:</div>
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                  {result.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Facebook Manual Posting */}
      <section className="border-t border-border pt-6">
        <h2 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
          <Facebook size={20} className="text-blue-600" /> النشر على صفحة الفيسبوك
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          انشر أحدث الأخبار غير المنشورة يدويًا على صفحة الفيسبوك. يتم نشر 5 أخبار كحد أقصى في كل مرة.
        </p>
        <Button onClick={runFacebook} disabled={fbRunning} size="lg" variant="outline">
          {fbRunning ? <><Loader2 size={16} className="animate-spin ml-2" /> جارٍ النشر...</> : "انشر على الفيسبوك الآن"}
        </Button>
        {fbErr && <div className="mt-4 text-sm text-breaking bg-breaking/10 border border-breaking p-3 rounded">{fbErr}</div>}
        {fbResult && (
          <div className="mt-6 bg-card border border-border rounded-lg p-4 space-y-2">
            <div className="text-emerald-600 font-bold">
              ✓ تم — نُشر {fbResult.posted} خبر، فشل {fbResult.failed}
            </div>
            {fbResult.errors?.length > 0 && (
              <div>
                <div className="text-sm font-bold text-breaking">أخطاء:</div>
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                  {fbResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
