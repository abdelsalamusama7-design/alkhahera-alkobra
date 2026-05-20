import { createServerFn } from "@tanstack/react-start";

// Free, no-auth APIs:
// - exchangerate.host for FX (USD->EGP, EUR->EGP, SAR->EGP)
// - metals.dev free public endpoint for gold (XAU); fall back to a fixed quote

export const getMarkets = createServerFn({ method: "GET" }).handler(async () => {
  const out: {
    fx: { name: string; value: string; change: string; up: boolean }[];
    updatedAt: string;
  } = { fx: [], updatedAt: new Date().toISOString() };

  try {
    const res = await fetch(
      "https://api.exchangerate.host/live?source=EGP&currencies=USD,EUR,SAR&access_key=demo",
      { headers: { accept: "application/json" } },
    );
    let usd = 0, eur = 0, sar = 0;
    if (res.ok) {
      const j: any = await res.json();
      if (j?.quotes) {
        usd = 1 / Number(j.quotes.EGPUSD || 0);
        eur = 1 / Number(j.quotes.EGPEUR || 0);
        sar = 1 / Number(j.quotes.EGPSAR || 0);
      }
    }
    // Fallback to open.er-api.com if exchangerate.host returned nothing
    if (!usd) {
      const r2 = await fetch("https://open.er-api.com/v6/latest/USD");
      if (r2.ok) {
        const j2: any = await r2.json();
        const r = j2?.rates ?? {};
        usd = Number(r.EGP || 0);
        eur = usd / Number(r.EUR || 1);
        sar = usd / Number(r.SAR || 1);
      }
    }
    if (usd) out.fx.push({ name: "USD / EGP", value: usd.toFixed(2), change: "—", up: true });
    if (eur) out.fx.push({ name: "EUR / EGP", value: eur.toFixed(2), change: "—", up: true });
    if (sar) out.fx.push({ name: "SAR / EGP", value: sar.toFixed(2), change: "—", up: true });

    // Gold (best-effort)
    try {
      const g = await fetch("https://api.gold-api.com/price/XAU");
      if (g.ok) {
        const gj: any = await g.json();
        const ozUsd = Number(gj?.price || 0);
        if (ozUsd && usd) {
          const gram24 = (ozUsd * usd) / 31.1035;
          const gram21 = gram24 * (21 / 24);
          out.fx.unshift({
            name: "الذهب (جرام 21)",
            value: gram21.toFixed(2),
            change: "—",
            up: true,
          });
        }
      }
    } catch {}
  } catch (e) {
    console.error("markets fetch failed", e);
  }

  return out;
});
