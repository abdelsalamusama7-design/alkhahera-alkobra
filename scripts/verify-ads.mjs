#!/usr/bin/env node
/**
 * فحص تلقائي قبل النشر للتأكد من إعدادات الإعلانات:
 *   1. public/sw.js يحتوي على domain + zoneId المتوقعَين.
 *   2. DEFAULT_AD_CONFIG في src/lib/ad-config.ts يضم كل سيرفرات Monetag
 *      المتوقعة بـ src + data-zone صحيحة.
 *   3. <MonetagScripts /> مركّب داخل src/routes/__root.tsx (مسؤول عن حقن
 *      السكربتات بالـ data-zone الصحيحة عند التشغيل).
 *   4. كل روابط السمارت لينك المعرّفة غير فارغة وتبدأ بـ https://
 *
 * يُشغَّل تلقائيًا قبل `vite build` عبر سكربت prebuild في package.json.
 * أي فشل يوقف البناء (exit 1).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ============ القيم المتوقعة (المصدر الموثوق) ============
const EXPECTED_SW = { domain: "3nbf4.com", zoneId: "11044543" };
const EXPECTED_MONETAG = [
  { src: "quge5.com/88/tag.min.js", zone: "242128" },
  { src: "al5sm.com/tag.min.js", zone: "11044569" },
];
// =========================================================

const errors = [];
const ok = [];

function read(rel) {
  const p = resolve(root, rel);
  if (!existsSync(p)) {
    errors.push(`ملف مفقود: ${rel}`);
    return null;
  }
  return readFileSync(p, "utf8");
}

// ---------- 1) sw.js ----------
const sw = read("public/sw.js");
if (sw) {
  if (!new RegExp(`"domain"\\s*:\\s*"${EXPECTED_SW.domain}"`).test(sw)) {
    errors.push(`public/sw.js: domain لا يساوي "${EXPECTED_SW.domain}"`);
  } else ok.push(`sw.js domain = ${EXPECTED_SW.domain}`);

  if (!new RegExp(`"zoneId"\\s*:\\s*${EXPECTED_SW.zoneId}\\b`).test(sw)) {
    errors.push(`public/sw.js: zoneId لا يساوي ${EXPECTED_SW.zoneId}`);
  } else ok.push(`sw.js zoneId = ${EXPECTED_SW.zoneId}`);
}

// ---------- 2) ad-config.ts (DEFAULT_AD_CONFIG.monetag) ----------
const adCfg = read("src/lib/ad-config.ts");
if (adCfg) {
  for (const { src, zone } of EXPECTED_MONETAG) {
    const srcRe = new RegExp(`src:\\s*"https?://${src.replace(/\./g, "\\.")}"`);
    const zoneRe = new RegExp(`zone:\\s*"${zone}"`);
    if (!srcRe.test(adCfg)) errors.push(`ad-config: سيرفر ${src} غير موجود`);
    else ok.push(`ad-config src: ${src}`);
    if (!zoneRe.test(adCfg)) errors.push(`ad-config: zone ${zone} غير موجود`);
    else ok.push(`ad-config zone: ${zone}`);
  }

  // كل روابط السمارت لينك https://
  const smartlinkBlock = adCfg.match(/smartlinks:\s*{([\s\S]*?)}/);
  if (smartlinkBlock) {
    const links = [...smartlinkBlock[1].matchAll(/(\w+):\s*"([^"]*)"/g)];
    if (links.length === 0) errors.push("ad-config: smartlinks فارغة");
    for (const [, key, url] of links) {
      if (!/^https:\/\//.test(url)) {
        errors.push(`smartlink ${key} ليس https: ${url}`);
      }
    }
    ok.push(`smartlinks count = ${links.length}`);
  }
}

// ---------- 3) __root.tsx يستخدم MonetagScripts ----------
const rootTsx = read("src/routes/__root.tsx");
if (rootTsx) {
  if (!/MonetagScripts/.test(rootTsx)) {
    errors.push("__root.tsx: مكوّن <MonetagScripts /> غير مركّب");
  } else ok.push("MonetagScripts مركّب في __root");

  if (!/from\s+["']@\/components\/site\/MonetagScripts["']/.test(rootTsx)) {
    errors.push("__root.tsx: import MonetagScripts مفقود");
  }

  for (const { src, zone } of EXPECTED_MONETAG) {
    const fullSrc = `https://${src}`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const tagRe = new RegExp(`<script[\\s\\S]*?src=["']${fullSrc}["'][\\s\\S]*?data-zone=["']${zone}["'][\\s\\S]*?>`);
    if (!tagRe.test(rootTsx)) {
      errors.push(`__root.tsx: سكربت ${src} غير موجود في head مع data-zone=${zone}`);
    } else ok.push(`head multitag: ${src} data-zone=${zone}`);
  }
}

// ---------- 4) المكوّن نفسه يقرأ من getAdConfig ----------
const monetagComp = read("src/components/site/MonetagScripts.tsx");
if (monetagComp) {
  if (!/getAdConfig/.test(monetagComp)) {
    errors.push("MonetagScripts: لا يقرأ من getAdConfig()");
  }
  if (!/dataset\.zone/.test(monetagComp)) {
    errors.push("MonetagScripts: لا يضبط data-zone على السكربت");
  }
}

// ---------- تقرير ----------
console.log("\n🔎 فحص إعدادات الإعلانات قبل البناء\n");
for (const m of ok) console.log("  ✓ " + m);
if (errors.length) {
  console.log("\n❌ فشل الفحص:");
  for (const e of errors) console.log("  ✗ " + e);
  console.log(`\nفشل البناء — صحّح القيم في public/sw.js أو src/lib/ad-config.ts.\n`);
  process.exit(1);
}
console.log("\n✅ كل إعدادات الإعلانات سليمة.\n");
