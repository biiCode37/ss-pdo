import { readFileSync, readdirSync } from "node:fs";
import { resolve as pathResolve, relative, sep } from "node:path";
import { describe, test, expect } from "vitest";

// Kontrak indikator fokus (refact_213): satu cincin fokus untuk kolom teks,
// tanpa border biru + outline berjarak yang tampil sebagai dua cincin.
const srcDir = pathResolve(__dirname, "../..");
const read = (p: string) => readFileSync(pathResolve(srcDir, p), "utf8");

const actionsCss = read("styles/components/actions.css");
const formsCss = read("styles/components/forms.css");
const indexCss = read("index.css");

/** Ambil isi blok CSS pertama yang selektornya persis `selector`. */
const ruleBody = (css: string, selector: string): string | null => {
  const idx = css.indexOf(`${selector} {`);
  if (idx === -1) return null;
  const start = css.indexOf("{", idx);
  return css.slice(start + 1, css.indexOf("}", start));
};

describe("kontrak cincin fokus kolom teks", () => {
  test("ada satu aturan fokus kolom teks dengan outline menimpa border", () => {
    // :is() (bukan :where) supaya spesifisitas (0,2,1) mengalahkan aturan global (0,1,0).
    const match = formsCss.match(
      /:is\(input:not\([^{]*textarea\):focus-visible\s*\{([^}]*)\}/,
    );
    expect(match, "aturan fokus kolom teks tidak ditemukan di forms.css").not.toBeNull();
    const body = match![1];
    expect(body).toMatch(/outline:\s*2px solid var\(--color-focus-ring\)/);
    expect(body).toMatch(/outline-offset:\s*-2px/);
  });

  test("aturan global tetap menjaga fokus tombol, tautan, checkbox", () => {
    expect(actionsCss).toMatch(
      /:where\(button, a\[href\], input, select, textarea, \[tabindex\]\):focus-visible\s*\{[^}]*outline-offset:\s*2px/,
    );
  });

  test("aturan fokus lama yang menggambar cincin kedua sudah dihapus", () => {
    expect(ruleBody(indexCss, ".input-field:focus")).toBeNull();
    expect(ruleBody(formsCss, ".ui-input:focus")).toBeNull();
    expect(indexCss).not.toContain(".swal-bus-input-container input:focus");
    expect(indexCss).not.toMatch(/box-shadow:\s*0 0 0 3px var\(--color-selection-bg\)/);
  });

  test("kolom SweetAlert memakai cincin yang sama dan mematikan glow bawaan", () => {
    const body = indexCss.match(
      /div:where\(\.swal2-container\)[^{]*:focus\s*\{([^}]*)\}/,
    );
    expect(body, "override fokus SweetAlert tidak ditemukan").not.toBeNull();
    expect(body![1]).toMatch(/box-shadow:\s*none !important/);
    expect(body![1]).toMatch(/outline:\s*2px solid var\(--color-focus-ring\) !important/);
    expect(body![1]).toMatch(/outline-offset:\s*-2px !important/);
  });

  test("input fokus tunggal tidak selalu berbingkai biru", () => {
    const styles = read("components/busCard/modal/singleFocus/singleFocusStyles.ts");
    const primary = styles.slice(0, styles.indexOf("};"));
    expect(primary).not.toContain("--accent-color");
    expect(primary).toContain("var(--color-border-control)");
  });
});

describe("tidak ada elemen interaktif yang menghapus indikator fokus", () => {
  // ModalShell: wadah dialog tabIndex=-1 (fokus terprogram, bukan kontrol).
  // UserPickerModal & AddRouteModal: kolom tanpa border di dalam pembungkus;
  // cincin dipindah ke pembungkus .ui-input-group:focus-within.
  const groupFiles = [
    ["components", "pageManagement", "UserPickerModal.tsx"],
    ["components", "routeSelector", "AddRouteModal.tsx"],
  ];
  const allowed = new Set([
    ["components", "ui", "ModalShell.tsx"].join(sep),
    ...groupFiles.map((p) => p.join(sep)),
  ]);

  const tsxFiles = (readdirSync(srcDir, { recursive: true }) as string[]).filter(
    (f) => f.endsWith(".tsx") && !f.includes(".test."),
  );

  test("outline: none hanya ada di file yang dikecualikan", () => {
    const offenders = tsxFiles.filter(
      (f) =>
        /outline:\s*["']none["']/.test(read(f)) &&
        !allowed.has(relative(srcDir, pathResolve(srcDir, f))),
    );
    expect(offenders).toEqual([]);
  });

  test("kolom dalam pembungkus menampilkan cincin di pembungkus", () => {
    for (const p of groupFiles) {
      expect(read(p.join("/")), p.join("/")).toContain('className="ui-input-group"');
    }
    expect(formsCss).toMatch(/\.ui-input-group:focus-within\s*\{[^}]*outline:\s*2px solid var\(--color-focus-ring\)/);
  });
});
