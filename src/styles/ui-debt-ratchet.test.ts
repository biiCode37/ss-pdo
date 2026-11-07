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
  // Diukur 07 Nov 2026 setelah refact_213.
  rawHexColor: 837,
  rgbHslFunction: 972,
  gradient: 28,
  gradientText: 6,
  inlineStyleObject: 2013,
  fontSizeBelow12px: 386,
  fontSizeOffScale: 619,
  fontWeightHeavy: 106,
  iconSizeOffScale: 274,
  legacyAccentColor: 264,
  textShadow: 0,
  backdropFilter: 34,
} as const;

type Metric = keyof typeof BASELINE;

const FONT_SIZE_SCALE = new Set([12, 13, 14, 16, 18, 20, 24, 28]);
const ICON_SIZE_SCALE = new Set([16, 20, 24]);

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
  for (const s of sources) {
    const segRe = s.isCss ? /font-size:\s*([^;}]+)/g : /fontSize:\s*([^,}\n]+)/g;
    for (const [, seg] of s.text.matchAll(segRe)) {
      if (seg.includes("var(")) continue;
      for (const [, num, unit] of seg.matchAll(/(?<![\w.-])(\d+(?:\.\d+)?)(px|rem)?(?![\w%])/g)) {
        if (s.isCss && !unit) continue; // CSS tanpa satuan (mis. 0) bukan ukuran huruf
        out.push(unit === "rem" ? Number(num) * 16 : Number(num));
      }
    }
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

const measure = (): Record<Metric, number> => {
  const sizes = fontSizesPx();
  return {
    rawHexColor: countMatches(/#[0-9a-fA-F]{3,8}\b/g),
    rgbHslFunction: countMatches(/\b(?:rgba?|hsla?)\(/g),
    gradient: countMatches(/gradient\(/g),
    gradientText: countMatches(/background-clip:\s*text|backgroundClip:\s*["']text|WebkitBackgroundClip/g),
    inlineStyleObject: countMatches(/style=\{\{/g, (s) => s.isTsx),
    fontSizeBelow12px: sizes.filter((px) => px < 12).length,
    fontSizeOffScale: sizes.filter((px) => !FONT_SIZE_SCALE.has(px)).length,
    fontWeightHeavy: countMatches(/(?:fontWeight:\s*["']?|font-weight:\s*)(?:800|900)\b/g),
    iconSizeOffScale: iconSizes().filter((n) => !ICON_SIZE_SCALE.has(n)).length,
    legacyAccentColor: countMatches(/--accent-color|#3ecf8e|#24b47e/gi),
    textShadow: countMatches(/textShadow|text-shadow/g),
    backdropFilter: countMatches(/backdropFilter|backdrop-filter/g),
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
