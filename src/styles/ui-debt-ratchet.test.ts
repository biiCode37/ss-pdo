import { readFileSync, readdirSync } from "node:fs";
import { resolve as pathResolve, sep } from "node:path";
import { describe, test, expect } from "vitest";

/**
 * Penjaga utang tampilan UI (refact_214) — lihat `.agents/rules/ui-consistency.md`.
 *
 * Cara kerja "ratchet": BASELINE adalah jumlah pelanggaran saat ini.
 * - Angka NAIK  → test gagal: kode baru menambah pelanggaran. Perbaiki kodenya, jangan naikkan baseline.
 * - Angka TURUN → test gagal: turunkan baseline ke angka baru agar perbaikan terkunci.
 * Baseline hanya boleh diubah ke angka yang LEBIH KECIL.
 */
const BASELINE = {
  // Diukur 07 Nov 2026 setelah refact_217 (ikon dirapikan).
  rawHexColor: 506,
  rgbHslFunction: 799,
  gradient: 0,
  gradientText: 0,
  inlineStyleObject: 1948,
  // refact_216: tipografi dinormalisasi ke skala, dikunci di nol.
  fontSizeBelow12px: 0,
  fontSizeOffScale: 0,
  fontWeightHeavy: 0,
  iconSizeOffScale: 0,
  legacyAccentColor: 0,
  textShadow: 0,
  backdropFilter: 29,
  // refact_218: radius & jarak dinormalisasi ke skala, dikunci di nol.
  radiusOffScale: 0,
  spacingOffScale: 0,
  // refact_221: status aktif (tab/segmen/chip/kapsul) wajib memakai --color-state-active-*.
  weakActiveState: 12, // sisa: modal input bus (tahap berikutnya), baris grafik TOA, kartu halaman
  // refact_221: warna teks mentah (hex/rgba) tidak teruji kontras di 2 tema — wajib token.
  rawTextColor: 37, // sisa: putih/hitam di atas latar solid (perlu tinjau konteks)
} as const;

type Metric = keyof typeof BASELINE;

const FONT_SIZE_SCALE = new Set([12, 13, 14, 16, 18, 20, 24, 28]);
const ICON_SIZE_SCALE = new Set([16, 20, 24]);
const RADIUS_SCALE = new Set([0, 8, 12, 16, 999]);
// Kelipatan 2 sampai 16, lalu kelipatan 4/8; nilai > 64px (lebar tata letak) tidak dihitung.
const SPACING_SCALE = new Set([0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64]);

const srcDir = pathResolve(__dirname, "..");
// Token primitif memang berisi hex; sheetColorUtils = SSOT warna Google Sheets (bukan UI).
const EXCLUDED = [
  ["styles", "tokens", ""].join(sep),
  ["utils", "sheetColorUtils.ts"].join(sep),
];

const files = (readdirSync(srcDir, { recursive: true }) as string[]).filter(
  (f) =>
    /\.(tsx?|css)$/.test(f) &&
    !/\.test\.|\.d\.ts$|__tests__/.test(f) &&
    !EXCLUDED.some((ex) => f.startsWith(ex)),
);
const sources = files.map((f) => ({
  file: f,
  isCss: f.endsWith(".css"),
  isTsx: f.endsWith(".tsx"),
  text: readFileSync(pathResolve(srcDir, f), "utf8"),
}));

const countMatches = (re: RegExp, pick: (s: (typeof sources)[number]) => boolean = () => true) =>
  sources.filter(pick).reduce((n, s) => n + (s.text.match(re)?.length ?? 0), 0);

/** Semua ukuran huruf literal (px) dari `fontSize:` (TS/TSX) dan `font-size:` (CSS). */
const fontSizesPx = (): number[] => {
  const out: number[] = [];
  const collect = (seg: string, needsUnit: boolean) => {
    if (seg.includes("var(")) return;
    for (const [, num, unit] of seg.matchAll(/(?<![\w.$-])(\d+(?:\.\d+)?)(px|rem)?(?![\w%.])/g)) {
      if (needsUnit && !unit) continue; // CSS tanpa satuan (mis. 0) bukan ukuran huruf
      out.push(unit === "rem" ? Number(num) * 16 : Number(num));
    }
  };
  for (const s of sources) {
    if (s.isCss) {
      for (const [, seg] of s.text.matchAll(/font-size:\s*([^;}]+)/g)) collect(seg, true);
      continue;
    }
    // Objek style JSX (termasuk ternary multi-baris) dan CSS di string template SweetAlert.
    for (const [, seg] of s.text.matchAll(/fontSize:([^,}]+)/g)) collect(seg, false);
    for (const [, seg] of s.text.matchAll(/font-size:\s*([^;}"'`<>]+)/g)) collect(seg, true);
    // Atribut SVG/JSX: fontSize="9" atau fontSize={9}.
    for (const [, n] of s.text.matchAll(/\bfontSize=(?:"|\{)(\d+(?:\.\d+)?)(?:"|\})/g)) out.push(Number(n));
  }
  return out;
};

/** Semua angka literal pada prop `size` (ikon lucide) di TSX. */
const iconSizes = (): number[] => {
  const out: number[] = [];
  for (const s of sources.filter((x) => x.isTsx)) {
    for (const [, expr] of s.text.matchAll(/\bsize=(?:\{([^}]*)\}|"(\d+)")/g)) {
      const raw = expr ?? "";
      for (const [n] of raw.matchAll(/\b\d+\b/g)) out.push(Number(n));
    }
    for (const [, n] of s.text.matchAll(/\bsize="(\d+)"/g)) out.push(Number(n));
  }
  return out;
};

/** Nilai `px` non-negatif literal pada properti radius atau jarak (JSX, CSS, dan CSS di string template). */
const pxValues = (jsxProp: string, cssProp: string): number[] => {
  const out: number[] = [];
  const jsxRe = new RegExp(`\\b(?:${jsxProp}):([^,}]+)`, "g");
  const cssRe = new RegExp(`(?<![\\w-])(?:${cssProp}):\\s*([^;}"'\`<>]+)`, "g");
  for (const s of sources) {
    const segs = [...s.text.matchAll(cssRe)].map((m) => m[1]);
    if (!s.isCss) segs.push(...[...s.text.matchAll(jsxRe)].map((m) => m[1]));
    for (const seg of segs) {
      if (/var\(|calc|\$\{|env\(|clamp|min\(|max\(/.test(seg)) continue;
      for (const [, n] of seg.matchAll(/(?<![\w.$-])(\d+(?:\.\d+)?)px(?![\w.])/g)) out.push(Number(n));
    }
  }
  return out;
};

/**
 * Penanda status aktif yang lemah (refact_221):
 * - JSX: `background: <kondisi aktif> ? <nilai> : ...` dengan nilai selain token aksi/aktif/status semantik.
 * - CSS: aturan `.active`, `[aria-pressed="true"]`, `[aria-selected="true"]`, `[aria-current]`
 *   yang latarnya bukan --color-state-active-bg / --color-action-primary-bg / --color-danger-bg.
 */
const weakActiveStates = (): number => {
  const VAL = String.raw`("[^"]*"|'[^']*'|[^:,{}]+?)`;
  const jsxRe = new RegExp(String.raw`(?:background|backgroundColor):\s*([^?,{}]+?)\?\s*` + VAL + String.raw`\s*:`, "g");
  const ACTIVE_COND = /active|Active|selected|Selected|formatType|selectedShift|activeTab/;
  const OK_ON = /state-active-bg|action-primary-bg|(error|warning|success|danger|info|role|unit)-(bg|fg|border)|239, ?68, ?68|ef4444|f87171/;
  const OK_CSS_BG = /state-active-bg|action-primary-bg|danger-bg|transparent|none/;
  let n = 0;
  for (const s of sources) {
    if (s.isCss) {
      const css = s.text.replace(/\/\*[\s\S]*?\*\//g, "");
      for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (!/\.active\b|aria-pressed="true"|aria-selected="true"|aria-current/.test(sel)) continue;
        const bg = body.match(/background(?:-color)?:\s*([^;]+)/)?.[1];
        if (bg && !OK_CSS_BG.test(bg)) n++;
      }
      continue;
    }
    for (const [, cond, on] of s.text.matchAll(jsxRe)) {
      if (ACTIVE_COND.test(cond) && !OK_ON.test(on)) n++;
    }
  }
  return n;
};

const measure = (): Record<Metric, number> => {
  const sizes = fontSizesPx();
  const radii = pxValues(
    "borderRadius|border(?:Top|Bottom)(?:Left|Right)Radius",
    "border-radius|border-(?:top|bottom)-(?:left|right)-radius",
  );
  const spaces = pxValues(
    "(?:padding|margin|gap|rowGap|columnGap)(?:Top|Bottom|Left|Right|Inline|Block)?",
    "(?:padding|margin|gap|row-gap|column-gap)(?:-(?:top|bottom|left|right))?",
  );
  return {
    rawHexColor: countMatches(/#[0-9a-fA-F]{3,8}\b/g),
    rgbHslFunction: countMatches(/\b(?:rgba?|hsla?)\(/g),
    gradient: countMatches(/gradient\(/g),
    gradientText: countMatches(/background-clip:\s*text|backgroundClip:\s*["']text|WebkitBackgroundClip/g),
    inlineStyleObject: countMatches(/style=\{\{/g, (s) => s.isTsx),
    fontSizeBelow12px: sizes.filter((px) => px < 12).length,
    fontSizeOffScale: sizes.filter((px) => !FONT_SIZE_SCALE.has(px)).length,
    fontWeightHeavy: countMatches(/(?:fontWeight:\s*["']?|fontWeight=["{]|font-weight:\s*)(?:800|900)\b/g),
    iconSizeOffScale: iconSizes().filter((n) => !ICON_SIZE_SCALE.has(n)).length,
    legacyAccentColor: countMatches(/--accent-color|#3ecf8e|#24b47e/gi),
    weakActiveState: weakActiveStates(),
    rawTextColor: countMatches(/(?<![\w-])color:\s*["']?(?:#[0-9a-fA-F]{3,8}\b|rgba?\()/g),
    textShadow: countMatches(/textShadow|text-shadow/g),
    backdropFilter: countMatches(/backdropFilter|backdrop-filter/g),
    radiusOffScale: radii.filter((px) => !RADIUS_SCALE.has(px)).length,
    spacingOffScale: spaces.filter((px) => px <= 64 && px >= 1 && !SPACING_SCALE.has(px)).length,
  };
};

describe("ratchet utang tampilan UI", () => {
  const current = measure();

  test.each(Object.keys(BASELINE) as Metric[])("%s tidak bertambah", (metric) => {
    const base = BASELINE[metric];
    const now = current[metric];
    expect(
      now,
      `${metric} naik dari ${base} ke ${now}. Perbaiki kode baru sesuai .agents/rules/ui-consistency.md — jangan menaikkan baseline.`,
    ).toBeLessThanOrEqual(base);
    expect(
      now,
      `${metric} turun dari ${base} ke ${now}. Bagus! Kunci perbaikan: ubah BASELINE.${metric} menjadi ${now} di ui-debt-ratchet.test.ts.`,
    ).toBe(base);
  });

  test("pemindai benar-benar membaca kode sumber", () => {
    expect(sources.length).toBeGreaterThan(100);
  });
});
