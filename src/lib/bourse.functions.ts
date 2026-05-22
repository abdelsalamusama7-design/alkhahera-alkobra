import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Stock = { symbol: string; name: string; value: string; change: string; up: boolean };

// Top EGX stocks (Yahoo Finance symbols use .CA suffix for Egyptian listings)
const EGX_STOCKS: Array<{ symbol: string; name: string }> = [
  { symbol: "COMI.CA", name: "البنك التجاري الدولي" },
  { symbol: "TMGH.CA", name: "طلعت مصطفى" },
  { symbol: "EAST.CA", name: "الشرقية إيسترن" },
  { symbol: "HRHO.CA", name: "هيرميس القابضة" },
  { symbol: "SWDY.CA", name: "السويدي إليكتريك" },
  { symbol: "ETEL.CA", name: "المصرية للاتصالات" },
  { symbol: "ABUK.CA", name: "أبو قير للأسمدة" },
  { symbol: "FWRY.CA", name: "فوري" },
];

function fmt(n: number, digits = 2) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

async function yahooQuotes(symbols: string[]) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(","))}`;
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "Mozilla/5.0 (compatible; CairoNewsBot/1.0)",
    },
  });
  if (!res.ok) throw new Error(`yahoo ${res.status}`);
  const j: any = await res.json();
  const arr: any[] = j?.quoteResponse?.result ?? [];
  const map = new Map<string, any>();
  for (const q of arr) map.set(q.symbol, q);
  return map;
}

export const getBourseSection = createServerFn({ method: "GET" }).handler(async () => {
  const stocks: Stock[] = [];
  let indexQuote: Stock | null = null;

  try {
    const map = await yahooQuotes([...EGX_STOCKS.map((s) => s.symbol), "^CASE30"]);
    for (const s of EGX_STOCKS) {
      const q = map.get(s.symbol);
      if (!q || typeof q.regularMarketPrice !== "number") continue;
      const pct = Number(q.regularMarketChangePercent ?? 0);
      stocks.push({
        symbol: s.symbol.replace(".CA", ""),
        name: s.name,
        value: fmt(Number(q.regularMarketPrice)),
        change: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
        up: pct >= 0,
      });
    }
    const idx = map.get("^CASE30");
    if (idx && typeof idx.regularMarketPrice === "number") {
      const pct = Number(idx.regularMarketChangePercent ?? 0);
      indexQuote = {
        symbol: "EGX30",
        name: "مؤشر EGX 30",
        value: fmt(Number(idx.regularMarketPrice), 0),
        change: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
        up: pct >= 0,
      };
    }
  } catch (e) {
    console.error("bourse fetch failed", e);
  }

  // Latest bourse / economy news from DB
  const { data: economyNews } = await supabaseAdmin
    .from("articles")
    .select("id, slug, title, excerpt, cover_image, published_at, source, category:categories(slug,name)")
    .eq("is_published", true)
    .or("title.ilike.%بورصة%,title.ilike.%أسهم%,title.ilike.%سهم%,title.ilike.%مؤشر%,excerpt.ilike.%بورصة%")
    .order("published_at", { ascending: false })
    .limit(6);

  let news = economyNews ?? [];
  if (news.length < 4) {
    // Fallback to economy category latest
    const { data: catNews } = await supabaseAdmin
      .from("articles")
      .select("id, slug, title, excerpt, cover_image, published_at, source, category:categories!inner(slug,name)")
      .eq("is_published", true)
      .eq("category.slug", "economy")
      .order("published_at", { ascending: false })
      .limit(6);
    news = catNews ?? news;
  }

  return {
    index: indexQuote,
    stocks,
    news,
    updatedAt: new Date().toISOString(),
  };
});
