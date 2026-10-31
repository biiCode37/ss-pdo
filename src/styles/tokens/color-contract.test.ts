import { readFileSync } from "node:fs";
import { resolve as pathResolve } from "node:path";
import { test, expect } from "vitest";

const primitivesRaw = readFileSync(
  pathResolve(__dirname, "./primitives.css"),
  "utf8",
);
const semanticRaw = readFileSync(
  pathResolve(__dirname, "./semantic.css"),
  "utf8",
);

const declarations = (css: string): Record<string, string> => {
  const map: Record<string, string> = {};
  for (const match of css.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    map[`--${match[1]}`] = match[2].trim();
  }
  return map;
};

const primitives = declarations(primitivesRaw);
const bodies = semanticRaw.split(':root[data-theme="dark"]');

const resolve = (name: string, lookup: Record<string, string>): string => {
  let val = lookup[name];
  if (!val) throw new Error(`Token ${name} tidak ditemukan.`);
  while (val.startsWith("var(")) {
    const inner = val.slice(4, -1).trim();
    val = lookup[inner] || primitives[inner];
    if (!val) throw new Error(`Token ${inner} tidak ditemukan.`);
  }
  return val;
};

const luminance = (hex: string): number => {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) {
    throw new Error(`Kontrak ini hanya menerima format HEX opaque: ${hex}`);
  }
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

const ratio = (fg: string, bg: string): number => {
  const [lo, hi] = [luminance(fg), luminance(bg)].sort((a, b) => a - b);
  return (hi + 0.05) / (lo + 0.05);
};

const surfaces = [
  "surface-canvas",
  "surface-default",
  "surface-subtle",
  "surface-raised",
];

const contracts: [string, string, number][] = [];

// Kontrak Teks Standar (Minimum WCAG AA: 4.5:1)
for (const fg of ["text-primary", "text-secondary", "text-muted", "link"]) {
  for (const bg of surfaces) {
    contracts.push([fg, bg, 4.5]);
  }
}

// Kontrak Aksi, Status, & Shift (Minimum WCAG AA: 4.5:1)
for (const [fg, bg] of [
  ["action-primary-fg", "action-primary-bg"],
  ["action-primary-fg", "action-primary-hover"],
  ["action-primary-fg", "action-primary-pressed"],
  ["action-secondary-fg", "action-secondary-bg"],
  ["selection-fg", "selection-bg"],
  ["success-fg", "success-bg"],
  ["warning-fg", "warning-bg"],
  ["error-fg", "error-bg"],
  ["info-fg", "info-bg"],
  ["danger-fg", "danger-bg"],
  ["danger-fg", "danger-hover"],
  ["shift-1-fg", "shift-1-bg"],
  ["shift-2-fg", "shift-2-bg"],
  ["role-fg", "role-bg"],
  ["role-superadmin-fg", "role-superadmin-bg"],
  ["role-admin-fg", "role-admin-bg"],
  ["role-korwil-fg", "role-korwil-bg"],
  ["role-korlap-fg", "role-korlap-bg"],
  ["role-pdo-fg", "role-pdo-bg"],
  ["status-off-fg", "status-off-bg"],
  ["badge-ba-fg", "badge-ba-bg"],
  ["disabled-fg", "disabled-bg"],
]) {
  contracts.push([fg, bg, 4.5]);
}

// Kontrak Non-Teks: Batas Kontrol, Fokus Ring, dan Grafik (Minimum WCAG 1.4.11: 3:1)
for (const fg of [
  "border-control",
  "focus-ring",
  "chart-1",
  "chart-2",
  "chart-total",
]) {
  for (const bg of surfaces) {
    contracts.push([fg, bg, 3]);
  }
}

for (const [index, theme] of ["light", "dark"].entries()) {
  const values = { ...primitives, ...declarations(bodies[index]) };
  for (const [fg, bg, minimum] of contracts) {
    test(`${theme} ${fg} on ${bg} >= ${minimum}:1`, () => {
      const actual = ratio(
        resolve(`--color-${fg}`, values),
        resolve(`--color-${bg}`, values),
      );
      expect(actual).toBeGreaterThanOrEqual(minimum);
    });
  }
}
