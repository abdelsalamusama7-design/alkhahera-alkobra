import { breakingItems as fallback } from "@/data/news";

// كلمات شائعة في العربية يتم تجاهلها عند حساب التشابه
const STOP_WORDS = new Set([
  "في", "من", "إلى", "الى", "على", "عن", "هل", "ما", "هو", "هي", "أن", "إن",
  "كان", "كانت", "قد", "لقد", "مع", "بين", "هذا", "هذه", "ذلك", "تلك", "ال",
  "أو", "او", "ثم", "كل", "بعد", "قبل", "عند", "حتى", "لا", "لم", "لن",
  "ولا", "أم", "أي", "أيها", "يا", "كما", "أيضا", "أيضًا", "غير", "بل",
  "ـ", "،", ".", "..", "...", "؟", "!",
]);

// تطبيع النص العربي: إزالة التشكيل + توحيد الألف والتاء
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670]/g, "") // تشكيل
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .toLowerCase();
}

function tokenize(text: string): Set<string> {
  const norm = normalizeArabic(text);
  const words = norm
    .split(/[\s\-—,.،؛:؟!"'"()\[\]\\\/]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

// عتبة التشابه — أي عنوانين بنسبة كلمات مشتركة ≥ 45% يُعتبران مكررين
const SIMILARITY_THRESHOLD = 0.45;

function dedupeSimilar(items: string[]): string[] {
  const result: { text: string; tokens: Set<string> }[] = [];
  for (const raw of items) {
    const text = (raw || "").trim().replace(/\s+/g, " ");
    if (!text) continue;
    const tokens = tokenize(text);
    if (tokens.size === 0) continue;
    const isDup = result.some((r) => jaccard(r.tokens, tokens) >= SIMILARITY_THRESHOLD);
    if (!isDup) result.push({ text, tokens });
  }
  return result.map((r) => r.text);
}

export function BreakingTicker({ items }: { items?: string[] }) {
  const source = items?.length ? items : fallback;
  const list = dedupeSimilar(source).slice(0, 12);

  return (
    <div className="bg-card border-y border-border">
      <div className="container mx-auto px-4 flex items-stretch">
        <div className="bg-breaking text-breaking-foreground px-4 py-2 font-extrabold text-sm flex items-center gap-2 shrink-0">
          <span className="inline-block h-2 w-2 rounded-full bg-white animate-pulse" />
          عاجل
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="whitespace-nowrap animate-ticker py-2 text-sm font-semibold text-primary">
            {list.map((item, i) => (
              <span key={i} className="mx-8">
                <span className="text-gold ml-2">•</span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
