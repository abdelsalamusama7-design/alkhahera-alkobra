import { createServerFn } from "@tanstack/react-start";

// Live data via Yahoo Finance public quote endpoint (no key required).
// Symbols:
//   USDEGP=X, EURRGP=X, SAREGP=X  -> FX vs Egyptian Pound
//   GC=F                          -> Gold futures (USD/oz)
//   ^CASE30                       -> EGX 30 index (Egyptian stock market)
//   ^GSPC, ^IXIC                  -> S&P500 & Nasdaq (global stocks)

type Quote = { name: string; value: string; change: string; up: boolean };

async function yahooQuotes(symbols: string[]) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(","))}`;
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent":
        "Mozilla/5.0 (compatible; CairoNewsBot/1.0; +https://alkhahera-alkobra.lovable.app)",
    },
  });
  if (!res.ok) throw new Error(`yahoo ${res.status}`);
  const j: any = await res.json();
  const arr: any[] = j?.quoteResponse?.result ?? [];
  const map = new Map<string, any>();
  for (const q of arr) map.set(q.symbol, q);
  return map;
}

function fmt(n: number, digits = 2) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function toQuote(name: string, q: any, digits = 2, transform?: (n: number) => number): Quote | null {
  if (!q || typeof q.regularMarketPrice !== "number") return null;
  const raw = transform ? transform(q.regularMarketPrice) : q.regularMarketPrice;
  const pct = Number(q.regularMarketChangePercent ?? 0);
  return {
    name,
    value: fmt(raw, digits),
    change: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
    up: pct >= 0,
  };
}

export const getMarkets = createServerFn({ method: "GET" }).handler(async () => {
  const out: {
    fx: Quote[];
    stocks: Quote[];
    updatedAt: string;
  } = { fx: [], stocks: [], updatedAt: new Date().toISOString() };

  try {
    const symbols = ["USDEGP=X", "EURRGP=X", "SAREGP=X", "GC=F", "^CASE30", "^GSPC", "^IXIC"];
    const q = await yahooQuotes(symbols);

    const usd = q.get("USDEGP=X");
    const usdRate = Number(usd?.regularMarketPrice || 0);

    // Gold (USD/oz) -> EGP/gram 21k
    const gold = q.get("GC=F");
    if (gold && usdRate) {
      const ozUsd = Number(gold.regularMarketPrice);
      const gram21 = (ozUsd * usdRate * 21) / (31.1035 * 24);
      const pct = Number(gold.regularMarketChangePercent ?? 0);
      out.fx.push({
        name: "الذهب (جرام 21)",
        value: fmt(gram21),
        change: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
        up: pct >= 0,
      });
    }

    const fxRows = [
      ["USD / EGP", "USDEGP=X"],
      ["EUR / EGP", "EURRGP=X"],
      ["SAR / EGP", "SAREGP=X"],
    ] as const;
    for (const [name, sym] of fxRows) {
      const r = toQuote(name, q.get(sym));
      if (r) out.fx.push(r);
    }

    const stockRows = [
      ["EGX 30", "^CASE30", 0],
      ["S&P 500", "^GSPC", 2],
      ["ناسداك", "^IXIC", 2],
    ] as const;
    for (const [name, sym, d] of stockRows) {
      const r = toQuote(name, q.get(sym), d);
      if (r) out.stocks.push(r);
    }
  } catch (e) {
    console.error("markets fetch failed", e);
  }

  // Fallback FX via open.er-api.com if Yahoo blocked
  if (out.fx.length === 0) {
    try {
      const r = await fetch("https://open.er-api.com/v6/latest/USD");
      if (r.ok) {
        const j: any = await r.json();
        const rates = j?.rates ?? {};
        const usd = Number(rates.EGP || 0);
        const eur = usd / Number(rates.EUR || 1);
        const sar = usd / Number(rates.SAR || 1);
        if (usd) out.fx.push({ name: "USD / EGP", value: fmt(usd), change: "—", up: true });
        if (eur) out.fx.push({ name: "EUR / EGP", value: fmt(eur), change: "—", up: true });
        if (sar) out.fx.push({ name: "SAR / EGP", value: fmt(sar), change: "—", up: true });
      }
    } catch {}
  }

  return out;
});
