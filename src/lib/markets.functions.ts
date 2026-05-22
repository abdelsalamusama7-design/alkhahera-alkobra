import { createServerFn } from "@tanstack/react-start";

// Live market data. Primary: Alpha Vantage (keyed, cached 1h due to 25 req/day).
// Fallbacks: ExchangeRate-API for FX, Yahoo Finance for stocks/gold, CoinGecko for crypto.

type Quote = { name: string; value: string; change: string; up: boolean };

// In-memory cache for Alpha Vantage
const avCache = new Map<string, { ts: number; data: any }>();
const AV_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours (free tier: 25 req/day)

async function alphaVantage(params: Record<string, string>): Promise<any | null> {
  const key = process.env.ALPHAVANTAGE_API_KEY;
  if (!key) return null;
  const cacheKey = JSON.stringify(params);
  const cached = avCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < AV_TTL_MS) return cached.data;
  try {
    const qs = new URLSearchParams({ ...params, apikey: key }).toString();
    const res = await fetch(`https://www.alphavantage.co/query?${qs}`);
    if (!res.ok) return cached?.data ?? null;
    const j: any = await res.json();
    if (j?.Note || j?.Information || j?.["Error Message"]) {
      return cached?.data ?? null;
    }
    avCache.set(cacheKey, { ts: Date.now(), data: j });
    return j;
  } catch {
    return cached?.data ?? null;
  }
}

async function avFxRate(from: string, to: string): Promise<number | null> {
  const j = await alphaVantage({ function: "CURRENCY_EXCHANGE_RATE", from_currency: from, to_currency: to });
  const rate = Number(j?.["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"]);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

async function avGlobalQuote(symbol: string): Promise<{ price: number; pct: number } | null> {
  const j = await alphaVantage({ function: "GLOBAL_QUOTE", symbol });
  const q = j?.["Global Quote"];
  const price = Number(q?.["05. price"]);
  const pctStr = String(q?.["10. change percent"] ?? "").replace("%", "");
  const pct = Number(pctStr);
  if (!Number.isFinite(price) || price <= 0) return null;
  return { price, pct: Number.isFinite(pct) ? pct : 0 };
}

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

async function fetchCrypto(): Promise<Quote[]> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,ripple,tether&vs_currencies=usd&include_24hr_change=true",
      { headers: { accept: "application/json" } },
    );
    if (!res.ok) return [];
    const j: any = await res.json();
    const map: { id: string; name: string; digits: number }[] = [
      { id: "bitcoin", name: "بيتكوين", digits: 0 },
      { id: "ethereum", name: "إيثيريوم", digits: 0 },
      { id: "binancecoin", name: "BNB", digits: 0 },
      { id: "solana", name: "سولانا", digits: 2 },
      { id: "ripple", name: "ريبل (XRP)", digits: 4 },
      { id: "tether", name: "تيثر USDT", digits: 2 },
    ];
    const out: Quote[] = [];
    for (const c of map) {
      const row = j?.[c.id];
      if (!row || typeof row.usd !== "number") continue;
      const pct = Number(row.usd_24h_change ?? 0);
      out.push({
        name: c.name,
        value: `$${fmt(row.usd, c.digits)}`,
        change: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
        up: pct >= 0,
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function fetchFxFromExchangeRateApi(): Promise<Quote[]> {
  const key = process.env.EXCHANGERATE_API_KEY;
  if (!key) return [];
  try {
    const r = await fetch(`https://v6.exchangerate-api.com/v6/${key}/latest/USD`);
    if (!r.ok) return [];
    const j: any = await r.json();
    if (j?.result !== "success") return [];
    const rates = j.conversion_rates ?? {};
    const usd = Number(rates.EGP || 0);
    const eur = usd / Number(rates.EUR || 1);
    const sar = usd / Number(rates.SAR || 1);
    const out: Quote[] = [];
    if (usd) out.push({ name: "USD / EGP", value: fmt(usd), change: "—", up: true });
    if (eur) out.push({ name: "EUR / EGP", value: fmt(eur), change: "—", up: true });
    if (sar) out.push({ name: "SAR / EGP", value: fmt(sar), change: "—", up: true });
    return out;
  } catch {
    return [];
  }
}

export const getMarkets = createServerFn({ method: "GET" }).handler(async () => {
  const out: {
    fx: Quote[];
    stocks: Quote[];
    crypto: Quote[];
    updatedAt: string;
  } = { fx: [], stocks: [], crypto: [], updatedAt: new Date().toISOString() };

  // Primary FX: Alpha Vantage for USD/EGP (most accurate), then ExchangeRate-API for others
  const [avUsdEgp, avSpy] = await Promise.all([
    avFxRate("USD", "EGP"),
    avGlobalQuote("SPY"),
  ]);

  const primaryFx = await fetchFxFromExchangeRateApi();
  if (primaryFx.length) out.fx.push(...primaryFx);

  // Override USD/EGP with Alpha Vantage value if available
  if (avUsdEgp) {
    const idx = out.fx.findIndex((f) => f.name === "USD / EGP");
    const row: Quote = { name: "USD / EGP", value: fmt(avUsdEgp), change: "—", up: true };
    if (idx >= 0) out.fx[idx] = row; else out.fx.push(row);
  }


  try {
    const symbols = ["USDEGP=X", "EURRGP=X", "SAREGP=X", "GC=F", "^CASE30", "^GSPC", "^IXIC"];
    const [q, crypto] = await Promise.all([yahooQuotes(symbols), fetchCrypto()]);
    out.crypto = crypto;

    // Use ExchangeRate-API USD rate first if available; else Yahoo
    const usd = q.get("USDEGP=X");
    const usdRateFromPrimary = Number((primaryFx.find((f) => f.name === "USD / EGP")?.value || "0").replace(/,/g, ""));
    const usdRate = usdRateFromPrimary || Number(usd?.regularMarketPrice || 0);

    // Gold (USD/oz) -> EGP/gram 21k
    const gold = q.get("GC=F");
    if (gold && usdRate) {
      const ozUsd = Number(gold.regularMarketPrice);
      const gram21 = (ozUsd * usdRate * 21) / (31.1035 * 24);
      const pct = Number(gold.regularMarketChangePercent ?? 0);
      out.fx.unshift({
        name: "الذهب (جرام 21)",
        value: fmt(gram21),
        change: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
        up: pct >= 0,
      });
    }

    // Only add Yahoo FX if primary failed
    if (primaryFx.length === 0) {
      const fxRows = [
        ["USD / EGP", "USDEGP=X"],
        ["EUR / EGP", "EURRGP=X"],
        ["SAR / EGP", "SAREGP=X"],
      ] as const;
      for (const [name, sym] of fxRows) {
        const r = toQuote(name, q.get(sym));
        if (r) out.fx.push(r);
      }
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

    // Override S&P 500 with Alpha Vantage (SPY ETF) if available — more reliable change%
    if (avSpy) {
      const row: Quote = {
        name: "S&P 500",
        value: fmt(avSpy.price * 10, 2), // SPY ~= S&P/10
        change: `${avSpy.pct >= 0 ? "+" : ""}${avSpy.pct.toFixed(2)}%`,
        up: avSpy.pct >= 0,
      };
      const idx = out.stocks.findIndex((s) => s.name === "S&P 500");
      if (idx >= 0) out.stocks[idx] = row; else out.stocks.push(row);
    }

  } catch (e) {
    console.error("markets fetch failed", e);
    if (out.crypto.length === 0) {
      out.crypto = await fetchCrypto();
    }
  }

  // Last-ditch FX fallback
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
