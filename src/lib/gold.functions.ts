import { createServerFn } from "@tanstack/react-start";

type GoldPrices = {
  updatedAt: string;
  currency: "EGP";
  gram24: number;
  gram21: number;
  gram18: number;
  ounce: number;
  ch?: number;
  chp?: number;
};

let cache: { data: GoldPrices; ts: number } | null = null;
const TTL_MS = 60 * 60 * 1000; // 1 hour

const FALLBACK: GoldPrices = {
  updatedAt: new Date(0).toISOString(),
  currency: "EGP",
  ounce: 0,
  gram24: 0,
  gram21: 0,
  gram18: 0,
};

export const getGoldPrices = createServerFn({ method: "GET" }).handler(async (): Promise<GoldPrices> => {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.data;

  const key = process.env.GOLDAPI_KEY;
  if (!key) {
    console.error("GOLDAPI_KEY not set");
    return cache?.data ?? FALLBACK;
  }

  try {
    const res = await fetch("https://www.goldapi.io/api/XAU/EGP", {
      headers: { "x-access-token": key, "Content-Type": "application/json" },
    });
    if (!res.ok) {
      console.error(`GoldAPI ${res.status} ${res.statusText}`);
      return cache?.data ?? FALLBACK;
    }
    const j: any = await res.json();
    const ounce = Number(j.price);
    const gram24 = ounce / 31.1035;
    const data: GoldPrices = {
      updatedAt: new Date().toISOString(),
      currency: "EGP",
      ounce: Math.round(ounce),
      gram24: Math.round(gram24),
      gram21: Math.round((gram24 * 21) / 24),
      gram18: Math.round((gram24 * 18) / 24),
      ch: typeof j.ch === "number" ? j.ch : undefined,
      chp: typeof j.chp === "number" ? j.chp : undefined,
    };
    cache = { data, ts: Date.now() };
    return data;
  } catch (e) {
    console.error("GoldAPI fetch failed", e);
    return cache?.data ?? FALLBACK;
  }
});
