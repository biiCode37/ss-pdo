# Warna Kartu Unit Berdasarkan Keterangan — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kartu unit (Input SS & Armada) diwarnai berdasarkan isi keterangan sepanjang hari (T.O merah, kendala lain oranye, OFF/LIBUR kuning), sementara angka ritase memakai satu warna netral tanpa perbandingan target.

**Architecture:** Satu fungsi klasifikasi murni `classifyUnitKeterangan` di `keteranganUtils.ts` menjadi SSOT status kartu. Satu komponen `UnitStatusBadge` dipakai `BusCard` dan `UnitCard`. Warna lewat token semantik baru `--color-unit-{off,kendala,to}-*` dan kelas CSS `.bus-card.unit-status-*`. Seluruh logika target ritase (`evaluateTripStatus`, prop `targetTrip` ke kartu, kelas `status-*`) dihapus.

**Tech Stack:** React 19 + TypeScript strict, Vitest (happy-dom), CSS token (`src/styles/tokens/semantic.css`), kamus teks `src/constants/texts/`.

**Spec:** `docs/superpowers/specs/2026-11-07-unit-card-keterangan-status-design.md`

## Global Constraints

- Warna kartu dinilai dari **seluruh** keterangan (S1 dan S2), **tidak** dari shift aktif.
- Prioritas lintas shift: **TO > KENDALA > OFF_LIBUR > NORMAL**.
- `isUnitOff` mengenali kata utuh `OFF` **atau** `LIBUR` (`/\b(?:OFF|LIBUR)\b/i`); "LIBURAN" tidak cocok.
- Dilarang hardcode teks UI di `.tsx` — semua lewat `src/constants/texts/` + uji di `texts.test.ts`.
- Dilarang hex/rgb mentah di kode baru — hanya `var(--color-*)`; token baru wajib lolos `color-contract.test.ts` (teks ≥ 4.5:1, border ≥ 3:1) di light & dark.
- Ritase = `(tripPergi + tripPulang) / 2` (1 rit = PP = 2 trip); jangan menampilkan trip mentah berlabel "Rit".
- Tidak menyentuh `sheetColorUtils.ts`, payload Google Sheets, database, atau Edge Function.
- **Jangan commit** di tiap task — pengguna yang memutuskan commit/PA. Ganti langkah commit dengan checkpoint test.
- Akhir pekerjaan: 4 quality gate (`color-contract`, `vitest run src/`, `pnpm run build`, `graphify update .`) + dokumentasi `refactor-ss-pdo/refact_209`.

---

### Task 1: Klasifikasi keterangan + LIBUR (`keteranganUtils`)

**Files:**
- Modify: `src/utils/keteranganUtils.ts` (`isUnitOff` ±baris 468–481, `hasMeaningfulNote` ±530–549, tambah fungsi baru di akhir file)
- Test: `src/utils/keteranganUtils.test.ts`

**Interfaces:**
- Produces:
  - `export type UnitKeteranganStatus = 'NORMAL' | 'OFF_LIBUR' | 'KENDALA' | 'TO';`
  - `export function classifyUnitKeterangan(raw?: string | null): UnitKeteranganStatus`
  - `export function shouldShowKeteranganStrip(raw?: string | null): boolean`
  - `isUnitOff` kini juga `true` untuk LIBUR.

- [ ] **Step 1: Tulis test yang gagal** — tambahkan di akhir `src/utils/keteranganUtils.test.ts` (sesuaikan import di baris atas file dengan `classifyUnitKeterangan`, `shouldShowKeteranganStrip`, `isUnitOff`, `hasMeaningfulNote` bila belum ada):

```ts
describe('isUnitOff — LIBUR', () => {
  it('mengenali LIBUR sebagai kata utuh', () => {
    expect(isUnitOff('LIBUR')).toBe(true);
    expect(isUnitOff('Libur')).toBe(true);
    expect(isUnitOff('S1: LIBUR')).toBe(true);
    expect(isUnitOff('S1: NP1 | S2: LIBUR')).toBe(true);
  });
  it('tidak mengenali LIBURAN', () => {
    expect(isUnitOff('LIBURAN KELUARGA')).toBe(false);
  });
});

describe('hasMeaningfulNote — LIBUR murni', () => {
  it('LIBUR murni tidak dianggap catatan bermakna (sudah diwakili badge)', () => {
    expect(hasMeaningfulNote('LIBUR')).toBe(false);
    expect(hasMeaningfulNote('Libur')).toBe(false);
  });
});

describe('classifyUnitKeterangan', () => {
  it('kosong / SGO / SO = NORMAL', () => {
    expect(classifyUnitKeterangan('')).toBe('NORMAL');
    expect(classifyUnitKeterangan(undefined)).toBe('NORMAL');
    expect(classifyUnitKeterangan('SGO')).toBe('NORMAL');
    expect(classifyUnitKeterangan('SO')).toBe('NORMAL');
  });
  it('OFF / LIBUR = OFF_LIBUR', () => {
    expect(classifyUnitKeterangan('OFF')).toBe('OFF_LIBUR');
    expect(classifyUnitKeterangan('LIBUR')).toBe('OFF_LIBUR');
    expect(classifyUnitKeterangan('S1: OFF')).toBe('OFF_LIBUR');
  });
  it('variasi T.O = TO', () => {
    for (const k of ['TO', 'T.O', 'TO EVDAL', 'T.O EVDAL', 'S2: T.O', 'BA.02 - TO']) {
      expect(classifyUnitKeterangan(k)).toBe('TO');
    }
  });
  it('keterangan lain = KENDALA', () => {
    for (const k of ['BA02 Lampu indikator', 'NP1 / Renop', 'SERVICE BERKALA', 'S1: PERBAIKAN RADIATOR', 'SAKIT']) {
      expect(classifyUnitKeterangan(k)).toBe('KENDALA');
    }
  });
  it('prioritas lintas shift: TO > KENDALA > OFF_LIBUR', () => {
    expect(classifyUnitKeterangan('S1: OFF | S2: BA02 Service')).toBe('KENDALA');
    expect(classifyUnitKeterangan('S1: NP1 | S2: T.O')).toBe('TO');
    expect(classifyUnitKeterangan('S1: OFF | S2: TO EVDAL')).toBe('TO');
    expect(classifyUnitKeterangan('S1: LIBUR | S2: OFF')).toBe('OFF_LIBUR');
  });
  it('tidak bergantung shift: keterangan hanya di S1 tetap terklasifikasi', () => {
    expect(classifyUnitKeterangan('S1: BA02 SAKIT')).toBe('KENDALA');
  });
});

describe('shouldShowKeteranganStrip', () => {
  it('status murni tanpa prefiks shift disembunyikan', () => {
    expect(shouldShowKeteranganStrip('OFF')).toBe(false);
    expect(shouldShowKeteranganStrip('T.O EVDAL')).toBe(false);
    expect(shouldShowKeteranganStrip('LIBUR')).toBe(false);
    expect(shouldShowKeteranganStrip('')).toBe(false);
  });
  it('status berprefiks shift ditampilkan agar jelas shift mana', () => {
    expect(shouldShowKeteranganStrip('S1: OFF')).toBe(true);
    expect(shouldShowKeteranganStrip('S2: T.O')).toBe(true);
  });
  it('catatan bermakna ditampilkan', () => {
    expect(shouldShowKeteranganStrip('BA02 Lampu indikator')).toBe(true);
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm vitest run src/utils/keteranganUtils.test.ts`
Expected: FAIL (`classifyUnitKeterangan is not a function` / assertion LIBUR gagal).

- [ ] **Step 3: Implementasi minimal** di `src/utils/keteranganUtils.ts`:

Ganti baris cek kata OFF di `isUnitOff`:

```ts
  // 2. Cek keberadaan kata OFF / LIBUR utuh (bukan substring seperti "OFFICER" / "LIBURAN")
  return /\b(?:OFF|LIBUR)\b/i.test(trimmed);
```

Ganti `PURE_STATUS_REGEX` di `hasMeaningfulNote`:

```ts
  const PURE_STATUS_REGEX = /^(?:S[12]:\s*)?(?:OFF|LIBUR|T\.?O(?:\s*EVDAL)?|SO|SGO)$/i;
```

Tambahkan di akhir file:

```ts
export type UnitKeteranganStatus = 'NORMAL' | 'OFF_LIBUR' | 'KENDALA' | 'TO';

const UNIT_STATUS_PRIORITY: Record<UnitKeteranganStatus, number> = {
  NORMAL: 0,
  OFF_LIBUR: 1,
  KENDALA: 2,
  TO: 3,
};

function classifyKeteranganPart(part: string): UnitKeteranganStatus {
  const trimmed = part.trim();
  if (!trimmed || /^(?:S[12]\s*[:.-]\s*)?(?:SO|SGO)$/i.test(trimmed)) return 'NORMAL';
  if (isUnitTo(trimmed)) return 'TO';
  if (isUnitOff(trimmed)) return 'OFF_LIBUR';
  return 'KENDALA';
}

/**
 * Status kartu unit dari SELURUH keterangan hari itu (S1 dan S2), bukan shift aktif.
 * Prioritas lintas shift: TO > KENDALA > OFF_LIBUR > NORMAL.
 */
export function classifyUnitKeterangan(raw?: string | null): UnitKeteranganStatus {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return 'NORMAL';
  return raw
    .split('|')
    .map(classifyKeteranganPart)
    .reduce<UnitKeteranganStatus>(
      (worst, s) => (UNIT_STATUS_PRIORITY[s] > UNIT_STATUS_PRIORITY[worst] ? s : worst),
      'NORMAL',
    );
}

/**
 * Strip keterangan di kartu: tampil bila catatan bermakna ATAU berprefiks shift (S1:/S2:),
 * agar warna kartu selalu punya penjelasan shift mana yang bermasalah.
 */
export function shouldShowKeteranganStrip(raw?: string | null): boolean {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return false;
  return hasMeaningfulNote(raw) || /\bS[12]\s*[:.-]/i.test(raw);
}
```

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm vitest run src/utils/keteranganUtils.test.ts`
Expected: PASS.

- [ ] **Step 5: Analisis dampak LIBUR & checkpoint**

`isUnitOff` dipakai lewat `isUnitOffOrToEvdal` di: `useBulkOperations.ts` (Set Jumlah Trip & Set Trip Terpilih mengosongkan/melewati LIBUR), `busListUtils.ts` (progres & unit boleh-input mengecualikan LIBUR), `unitAnalytics.ts` `detectTargetTrip` (LIBUR diabaikan), `busModalPreConfirm.ts` (simpan per unit LIBUR = trip kosong, sama seperti OFF), `BusCardSummary.tsx` (sembunyikan badge "Kosong" untuk LIBUR). Semua perilaku ini memang diinginkan (LIBUR = OFF).

Run: `pnpm vitest run src/utils src/components/busList`
Expected: PASS (bila test lama gagal karena memakai "LIBUR" sebagai keterangan operasional, perbaiki ekspektasinya sesuai aturan baru dan catat di REPAIR_REPORT).

---

### Task 2: Token warna status unit + CSS kartu

**Files:**
- Modify: `src/styles/tokens/semantic.css` (blok light setelah `--color-badge-ba-border` ±baris 71; blok dark setelah `--color-badge-ba-border` ±baris 144)
- Modify: `src/styles/tokens/color-contract.test.ts` (daftar kontrak)
- Modify: `src/index.css` (aturan `.bus-card.status-*` ±baris 406–414, `.bus-card.bus-card-non-sgo` ±2296–2299, `.unit-status-badge-*` ±2312–2322)

**Interfaces:**
- Produces: token `--color-unit-off-{bg,fg,border}`, `--color-unit-kendala-{bg,fg,border}`, `--color-unit-to-{bg,fg,border}`; kelas CSS `.bus-card.unit-status-off`, `.bus-card.unit-status-kendala`, `.bus-card.unit-status-to`, `.unit-status-badge-kendala`.

- [ ] **Step 1: Tulis kontrak (test gagal)** — di `color-contract.test.ts`, tambahkan ke array pasangan "Kontrak Aksi, Status, & Shift":

```ts
  ["unit-off-fg", "unit-off-bg"],
  ["unit-kendala-fg", "unit-kendala-bg"],
  ["unit-to-fg", "unit-to-bg"],
```

dan sebelum loop `for (const [index, theme] ...)` tambahkan:

```ts
// Kontrak Kartu Status Unit: teks kartu di atas latar status (4.5:1) & garis tepi status vs permukaan (3:1)
for (const status of ["unit-off", "unit-kendala", "unit-to"]) {
  for (const fg of ["text-primary", "text-secondary"]) {
    contracts.push([fg, `${status}-bg`, 4.5]);
  }
  for (const bg of surfaces) {
    contracts.push([`${status}-border`, bg, 3]);
  }
}
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm vitest run src/styles/tokens/color-contract.test.ts`
Expected: FAIL (`Token --color-unit-off-fg tidak ditemukan`).

- [ ] **Step 3: Tambah token** — blok light (`semantic.css`, setelah `--color-badge-ba-border`):

```css
  /* Status kartu unit dari keterangan (refact_209) */
  --color-unit-off-bg: var(--p-amber-100);
  --color-unit-off-fg: var(--p-amber-800);
  --color-unit-off-border: var(--p-amber-800);
  --color-unit-kendala-bg: var(--p-orange-200);
  --color-unit-kendala-fg: var(--p-orange-800);
  --color-unit-kendala-border: var(--p-orange-800);
  --color-unit-to-bg: var(--p-red-100);
  --color-unit-to-fg: var(--p-red-800);
  --color-unit-to-border: var(--p-red-700);
```

Blok dark (setelah `--color-badge-ba-border` versi dark):

```css
  /* Status kartu unit dari keterangan (refact_209) */
  --color-unit-off-bg: var(--p-amber-950);
  --color-unit-off-fg: var(--p-amber-300);
  --color-unit-off-border: var(--p-amber-300);
  --color-unit-kendala-bg: var(--p-orange-950);
  --color-unit-kendala-fg: var(--p-orange-300);
  --color-unit-kendala-border: var(--p-orange-300);
  --color-unit-to-bg: var(--p-red-950);
  --color-unit-to-fg: var(--p-red-300);
  --color-unit-to-border: var(--p-red-300);
```

(Pra-cek kontras dengan rumus test: light fg/bg ≥ 5.6, teks primer ≥ 14, border vs surface ≥ 6.1; dark fg/bg ≥ 7.7, border vs surface ≥ 7.9. Jika `unit-kendala` light gagal, ganti `--color-unit-kendala-bg` ke `var(--p-orange-50)`.)

- [ ] **Step 4: CSS kartu** — di `src/index.css` hapus blok:

```css
.bus-card.status-kendala { ... }
.bus-card.status-warning { ... }
.bus-card.status-achieved { ... }
```

dan blok `.bus-card.bus-card-non-sgo { ... }`. Ganti dengan (letakkan di posisi blok status lama):

```css
/* Status kartu unit dari keterangan sepanjang hari (refact_209) */
.bus-card.unit-status-off {
  background: var(--color-unit-off-bg);
  border-left-color: var(--color-unit-off-border);
}
.bus-card.unit-status-kendala {
  background: var(--color-unit-kendala-bg);
  border-left-color: var(--color-unit-kendala-border);
}
.bus-card.unit-status-to {
  background: var(--color-unit-to-bg);
  border-left-color: var(--color-unit-to-border);
}
```

Ganti isi `.unit-status-badge-off` dan `.unit-status-badge-to`, lalu tambah `-kendala` (badge solid terbalik agar menonjol di atas latar kartu berwarna):

```css
.unit-status-badge-off {
  background: var(--color-unit-off-fg);
  color: var(--color-unit-off-bg);
  border: 1px solid var(--color-unit-off-border);
}

.unit-status-badge-to {
  background: var(--color-unit-to-fg);
  color: var(--color-unit-to-bg);
  border: 1px solid var(--color-unit-to-border);
}

.unit-status-badge-kendala {
  background: var(--color-unit-kendala-fg);
  color: var(--color-unit-kendala-bg);
  border: 1px solid var(--color-unit-kendala-border);
}
```

- [ ] **Step 5: Jalankan, pastikan lulus**

Run: `pnpm vitest run src/styles/tokens/color-contract.test.ts`
Expected: PASS (seluruh kontrak, light & dark).

---

### Task 3: Kamus teks badge + komponen `UnitStatusBadge`

**Files:**
- Modify: `src/constants/texts/text_dashboard.ts` (objek `BUS_CARD_ACTIONS`)
- Create: `src/components/ui/UnitStatusBadge.tsx`
- Test: `src/components/ui/UnitStatusBadge.test.tsx`, `src/constants/texts/texts.test.ts`

**Interfaces:**
- Consumes: `classifyUnitKeterangan`, `isUnitOff` (Task 1); kelas `.unit-status-badge-*` (Task 2).
- Produces: `export const UNIT_STATUS_CARD_CLASS: Record<UnitKeteranganStatus, string>`; `export function UnitStatusBadge({ keterangan }: { keterangan?: string | null }): JSX.Element | null`; teks `TEXT_DASHBOARD.BUS_CARD_ACTIONS.UNIT_STATUS_LABEL`.

- [ ] **Step 1: Tulis test gagal** — `src/components/ui/UnitStatusBadge.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UnitStatusBadge, UNIT_STATUS_CARD_CLASS } from './UnitStatusBadge';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('UnitStatusBadge', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (keterangan: string) => {
    act(() => root.render(<UnitStatusBadge keterangan={keterangan} />));
    return container.querySelector('.unit-status-badge');
  };

  it('OFF → badge kuning "OFF"', () => {
    const b = render('OFF');
    expect(b?.classList.contains('unit-status-badge-off')).toBe(true);
    expect(b?.textContent).toBe('OFF');
  });
  it('LIBUR → badge kuning "LIBUR"', () => {
    expect(render('Libur')?.textContent).toBe('LIBUR');
  });
  it('T.O EVDAL → badge merah "T.O"', () => {
    const b = render('T.O EVDAL');
    expect(b?.classList.contains('unit-status-badge-to')).toBe(true);
    expect(b?.textContent).toBe('T.O');
  });
  it('BA02 → badge oranye "KENDALA"', () => {
    const b = render('BA02 Lampu indikator');
    expect(b?.classList.contains('unit-status-badge-kendala')).toBe(true);
    expect(b?.textContent).toBe('KENDALA');
  });
  it('kosong → tidak ada badge', () => {
    expect(render('')).toBeNull();
  });
  it('peta kelas kartu', () => {
    expect(UNIT_STATUS_CARD_CLASS).toEqual({
      NORMAL: '',
      OFF_LIBUR: 'unit-status-off',
      KENDALA: 'unit-status-kendala',
      TO: 'unit-status-to',
    });
  });
});
```

Tambahkan di `texts.test.ts` (di blok yang sudah menguji `UNIT_STATUS_TOOLTIP`, ±baris 69):

```ts
    expect(TEXT_DASHBOARD.BUS_CARD_ACTIONS.UNIT_STATUS_LABEL).toEqual({
      OFF: 'OFF',
      LIBUR: 'LIBUR',
      TO: 'T.O',
      KENDALA: 'KENDALA',
    });
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm vitest run src/components/ui/UnitStatusBadge.test.tsx src/constants/texts/texts.test.ts`
Expected: FAIL (modul tidak ada / properti `UNIT_STATUS_LABEL` undefined).

- [ ] **Step 3: Implementasi** — di `text_dashboard.ts`, dalam `BUS_CARD_ACTIONS` tepat setelah `UNIT_STATUS_TOOLTIP`:

```ts
    UNIT_STATUS_LABEL: {
      OFF: 'OFF',
      LIBUR: 'LIBUR',
      TO: 'T.O',
      KENDALA: 'KENDALA',
    },
```

Buat `src/components/ui/UnitStatusBadge.tsx`:

```tsx
import {
  classifyUnitKeterangan,
  type UnitKeteranganStatus,
} from "@/utils/keteranganUtils";
import { TEXT_DASHBOARD } from "@/constants/texts";

/** Kelas kartu per status keterangan sepanjang hari (lihat `.bus-card.unit-status-*` di index.css). */
export const UNIT_STATUS_CARD_CLASS: Record<UnitKeteranganStatus, string> = {
  NORMAL: "",
  OFF_LIBUR: "unit-status-off",
  KENDALA: "unit-status-kendala",
  TO: "unit-status-to",
};

const LABELS = TEXT_DASHBOARD.BUS_CARD_ACTIONS.UNIT_STATUS_LABEL;

/** Badge kategori kartu unit. Warna tidak pernah jadi satu-satunya penanda (WCAG 1.4.1). */
export function UnitStatusBadge({ keterangan }: { keterangan?: string | null }) {
  const status = classifyUnitKeterangan(keterangan);
  if (status === "NORMAL") return null;

  const label =
    status === "TO"
      ? LABELS.TO
      : status === "KENDALA"
        ? LABELS.KENDALA
        : /\bOFF\b/i.test(keterangan || "")
          ? LABELS.OFF
          : LABELS.LIBUR;
  const variant = status === "TO" ? "to" : status === "KENDALA" ? "kendala" : "off";

  return (
    <span
      className={`unit-status-badge unit-status-badge-${variant}`}
      title={TEXT_DASHBOARD.BUS_CARD_ACTIONS.UNIT_STATUS_TOOLTIP(keterangan || "")}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm vitest run src/components/ui/UnitStatusBadge.test.tsx src/constants/texts/texts.test.ts`
Expected: PASS.

---

### Task 4: Kartu Input SS (`BusCard`) — warna, badge, strip sepanjang hari

**Files:**
- Modify: `src/components/busCard/BusCard.tsx`
- Delete: `src/components/busCard/busCardStyles.ts`
- Modify: `src/components/busCard/index.ts` (hapus `export * from "./busCardStyles";`)
- Test: `src/components/busCard/BusCard.test.tsx`

**Interfaces:**
- Consumes: `UnitStatusBadge`, `UNIT_STATUS_CARD_CLASS` (Task 3); `classifyUnitKeterangan`, `shouldShowKeteranganStrip` (Task 1).

- [ ] **Step 1: Tulis/ubah test (gagal)** — di `BusCard.test.tsx`:

Ganti isi test `'does not render blue BA badge in card header when unit has BA note'` menjadi:

```tsx
  it('unit dengan catatan BA tampil sebagai KENDALA (badge oranye + kelas kartu)', async () => {
    await act(async () => {
      root.render(
        <BusCard
          {...defaultProps}
          bus={{ ...defaultProps.bus, keterangan: 'BA.02 Pramudi Meriang' }}
          isShiftConfirmed={true}
        />
      );
    });

    expect(container.querySelector('.unit-status-badge-kendala')?.textContent).toBe('KENDALA');
    expect(container.querySelector('.bus-card')?.classList.contains('unit-status-kendala')).toBe(true);
    expect(container.textContent).toContain('Pramudi Meriang');
  });
```

Pada test `'does NOT render T.O badge for unit with BA.02 KENDALA MESIN ...'` ganti baris `expect(container.querySelector('.unit-status-badge')).toBeNull();` menjadi:

```tsx
    expect(container.querySelector('.unit-status-badge-kendala')?.textContent).toBe('KENDALA');
```

Tambahkan describe baru di akhir describe utama:

```tsx
  describe('Warna kartu dari keterangan sepanjang hari (bukan shift aktif)', () => {
    const renderWith = async (keterangan: string, activeShift: 1 | 2) => {
      await act(async () => {
        root.render(
          <BusCard
            {...defaultProps}
            activeCategory="ALL"
            activeShift={activeShift}
            bus={{ ...defaultProps.bus, keterangan }}
            isShiftConfirmed={true}
          />
        );
      });
      return container.querySelector('.bus-card') as HTMLElement;
    };

    it('S1: OFF tetap kuning saat shift aktif = 2, dengan badge & strip', async () => {
      const card = await renderWith('S1: OFF', 2);
      expect(card.classList.contains('unit-status-off')).toBe(true);
      expect(container.querySelector('.unit-status-badge-off')?.textContent).toBe('OFF');
      expect(container.textContent).toContain('S1');
    });

    it('LIBUR = kuning dengan badge LIBUR', async () => {
      const card = await renderWith('LIBUR', 1);
      expect(card.classList.contains('unit-status-off')).toBe(true);
      expect(container.querySelector('.unit-status-badge-off')?.textContent).toBe('LIBUR');
    });

    it('S1: NP1 | S2: T.O = merah (prioritas TO)', async () => {
      const card = await renderWith('S1: NP1 | S2: T.O', 1);
      expect(card.classList.contains('unit-status-to')).toBe(true);
      expect(container.querySelector('.unit-status-badge-to')?.textContent).toBe('T.O');
    });

    it('S1: OFF | S2: BA02 Service = oranye (prioritas KENDALA atas OFF)', async () => {
      const card = await renderWith('S1: OFF | S2: BA02 Service', 1);
      expect(card.classList.contains('unit-status-kendala')).toBe(true);
    });

    it('tanpa keterangan: tidak ada kelas status maupun badge', async () => {
      const card = await renderWith('', 1);
      expect(card.className).not.toMatch(/unit-status-/);
      expect(container.querySelector('.unit-status-badge')).toBeNull();
    });
  });
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm vitest run src/components/busCard/BusCard.test.tsx`
Expected: FAIL (kelas `unit-status-*` & badge KENDALA belum ada; "S1: OFF" di shift 2 belum kuning).

- [ ] **Step 3: Implementasi `BusCard.tsx`**

Import — ganti:

```tsx
import { hasMeaningfulNote, isUnitOff, isUnitTo } from "@/utils/keteranganUtils";
```

menjadi:

```tsx
import { classifyUnitKeterangan, shouldShowKeteranganStrip } from "@/utils/keteranganUtils";
import { UnitStatusBadge, UNIT_STATUS_CARD_CLASS } from "@/components/ui/UnitStatusBadge";
```

Hapus `getBusCardStyles,` dari import `./index`. Hapus `isNonSgo,` dari destrukturisasi `useBusCardModal` (hook tetap mengembalikannya, tidak diubah). Ganti blok `const { lockedClass, statusClass } = getBusCardStyles({...});` dengan:

```tsx
  const keteranganHariIni = formData.keterangan ?? bus.keterangan;
  // Warna kartu = riwayat keterangan SEPANJANG HARI (S1+S2), bukan shift aktif.
  const unitStatusClass = UNIT_STATUS_CARD_CLASS[classifyUnitKeterangan(keteranganHariIni)];
```

Ganti `className={\`bus-card glass ${statusClass} ${lockedClass}\`.trim()}` dengan:

```tsx
      className={`bus-card glass ${unitStatusClass}`.trim()}
```

Ganti seluruh blok `{isNonSgo && ( isUnitOff(activeShiftStatus) ? (...) : isUnitTo(activeShiftStatus) ? (...) : null )}` dengan:

```tsx
            <UnitStatusBadge keterangan={keteranganHariIni} />
```

Ganti kondisi strip `{hasMeaningfulNote(formData.keterangan) && (` dengan:

```tsx
      {shouldShowKeteranganStrip(keteranganHariIni) && (
```

dan di dalam strip ganti `<FormattedNoteText text={formData.keterangan} />` dengan `<FormattedNoteText text={keteranganHariIni} />`. Pada style strip yang sama ganti warna mentah:

```tsx
            color: "var(--color-text-primary)",
```

(menggantikan `color: "var(--warning-text)"`), hapus baris `background: "rgba(245, 158, 11, 0.04)",`, dan ganti warna ikon `color: "var(--orange-color)"` menjadi `color: "var(--color-text-secondary)"` — latar kartu sudah membawa warna status.

Hapus file `src/components/busCard/busCardStyles.ts` dan baris `export * from "./busCardStyles";` di `src/components/busCard/index.ts`.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm vitest run src/components/busCard`
Expected: PASS. (Test lama OFF/T.O badge tetap lulus karena kelas `.unit-status-badge-off/-to` dan teks "OFF"/"T.O" dipertahankan.)

---

### Task 5: Ritase netral di Input SS + hapus logika target

**Files:**
- Modify: `src/components/busCard/BusCardSummary.tsx`
- Modify: `src/components/busCard/types.ts` (hapus `targetTrip`)
- Modify: `src/components/busCard/BusCard.tsx` (hapus prop `targetTrip`)
- Modify: `src/components/busList/BusList.tsx` (hapus `targetTrip` dari destrukturisasi & prop kartu)
- Modify: `src/components/busList/useBulkOperations.ts` (hapus `targetTrip` dari objek return)
- Modify: `src/utils/unitAnalytics.ts` (hapus `TripStatus` & `evaluateTripStatus`)
- Modify: `src/constants/texts/text_dashboard.ts`, `src/constants/texts/texts.test.ts`
- Test: `src/components/busCard/BusCardSummary.test.tsx`, `src/utils/unitAnalytics.test.ts`

**Interfaces:**
- Produces: `BusCardSummaryProps` tanpa `targetTrip`; `BusCardProps` tanpa `targetTrip`; `useBulkOperations` return tanpa `targetTrip` (tetap dipakai internal untuk isian awal modal).

- [ ] **Step 1: Tulis test gagal** — ganti seluruh isi `src/components/busCard/BusCardSummary.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BusCardSummary } from './BusCardSummary';
import type { BusData } from '@/services/googleSheets';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const makeBus = (tripPergi: string, tripPulang: string): BusData => ({
  rowIndex: 6, unit: 'BUS-01', tripPergi, tripPulang,
  toaShift1: '', toaShift2: '', manualShift1: '', manualShift2: '', totalToa: '',
  kmAwal1: '', kmAkhir1: '', kmAwal2: '', kmAkhir2: '', keterangan: '', originalRow: [],
});

describe('BusCardSummary — ritase satu warna netral', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderAll = (p: string, q: string) => {
    act(() => {
      root.render(
        <BusCardSummary formData={{}} bus={makeBus(p, q)} tabName="Tgl 9" activeCategory="ALL" onOpenTripModal={() => {}} />,
      );
    });
    return container.querySelector<HTMLElement>('.bus-metric-value');
  };

  it.each([['8', '8'], ['8', '7'], ['7', '8'], ['8', '5'], ['3', '3']])(
    '%s/%s tampil dengan warna netral yang sama',
    (p, q) => {
      expect(renderAll(p, q)?.style.color).toBe('var(--color-text-primary)');
    },
  );

  it('menampilkan ritase PP (8/7 → 7.5) tanpa ikon peringatan', () => {
    const el = renderAll('8', '7');
    expect(el?.textContent).toContain('7.5');
    expect(el?.textContent).not.toContain('⚠️');
  });

  it('mode fokus trip: badge berisi trip tanpa label "Rit" dan warna netral', () => {
    act(() => {
      root.render(
        <BusCardSummary formData={{}} bus={makeBus('8', '7')} tabName="Tgl 9" activeCategory="trip" onOpenTripModal={() => {}} />,
      );
    });
    const badge = container.firstElementChild as HTMLElement;
    expect(badge.textContent).toContain('8/7');
    expect(badge.textContent).not.toContain('Rit');
    expect(badge.style.color).toBe('var(--color-text-primary)');
  });
});
```

Di `src/utils/unitAnalytics.test.ts`, hapus blok `describe('evaluateTripStatus (perbandingan dalam satuan ritase PP)', ...)` dan hapus `evaluateTripStatus,` dari import.

Di `texts.test.ts`, hapus baris:

```ts
    expect(TEXT_DASHBOARD.BUS_CARD_ACTIONS.RITASE_IMBALANCED_CARD(8, 5)).toBe('Selisih trip lebih dari 1 (cek kembali): 8/5 Trip');
```

dan tambahkan:

```ts
    expect(TEXT_DASHBOARD.BUS_CARD_ACTIONS.TRIP_BADGE_NORMAL(8, 7)).toBe('8/7');
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm vitest run src/components/busCard/BusCardSummary.test.tsx src/constants/texts/texts.test.ts`
Expected: FAIL (warna masih bervariasi; `TRIP_BADGE_NORMAL` masih "8/7 Rit").

- [ ] **Step 3: Implementasi**

`text_dashboard.ts` (`BUS_CARD_ACTIONS`): hapus `RITASE_DEFICIT_TOOLTIP`, `FULL_TARGET_TOOLTIP`, `RITASE_TARGET_TOOLTIP`, `TRIP_BADGE_DEFICIT`, `TRIP_BADGE_ACHIEVED`, `RITASE_DEFICIT_CARD`, `RITASE_IMBALANCED_CARD`, `RITASE_TARGET_CARD`. Ubah:

```ts
    TRIP_BADGE_NORMAL: (p: string | number, q: string | number) => `${p}/${q}`,
```

`BusCardSummary.tsx`:
- Hapus `import { evaluateTripStatus } from "@/utils/unitAnalytics";`, prop `targetTrip` dari interface & parameter.
- Ganti blok perhitungan trip (mulai `const targetP = ...` sampai `const tripStatusTitle = ...;`) dengan:

```tsx
  const hasTrip =
    String(pergiVal ?? "").trim() !== "" || String(pulangVal ?? "").trim() !== "";
  // ponytail: 1 Ritase = 2 Trip (PP)
  const totalRit =
    (parseIndonesianNumber(pergiVal, 0) + parseIndonesianNumber(pulangVal, 0)) / 2;
  const totalRitDisplay = String(totalRit);
  const tripStatusTitle = TEXT_DASHBOARD.BUS_CARD_ACTIONS.DEFAULT_TRIP_TITLE;
```

- Badge mode fokus trip: ganti tiga ekspresi warna (`backgroundColor`, `color`, `border`) dengan:

```tsx
            backgroundColor: hasTrip ? "var(--color-surface-subtle)" : "var(--color-error-bg)",
            color: hasTrip ? "var(--color-text-primary)" : "var(--color-error-fg)",
            border: `1px solid ${hasTrip ? "var(--color-border-subtle)" : "var(--color-error-border)"}`,
```

  dan isi teks badge:

```tsx
            Trip:{" "}
            {hasTrip
              ? TEXT_DASHBOARD.BUS_CARD_ACTIONS.TRIP_BADGE_NORMAL(pergiVal || 0, pulangVal || 0)
              : TEXT_DASHBOARD.BUS_CARD_ACTIONS.EMPTY_BADGE}
```

- Kolom Ritase (mode ALL): ganti style warna menjadi `color: "var(--color-text-primary)",` dan hapus `{isBelowTarget && "⚠️ "}`.

`types.ts`: hapus baris `targetTrip?: { pergi: number; pulang: number } | null;`.
`BusCard.tsx`: hapus `targetTrip,` dari parameter dan kedua `targetTrip={targetTrip}` pada `<BusCardSummary>`.
`BusList.tsx`: hapus `targetTrip,` dari destrukturisasi `useBulkOperations` dan `targetTrip={targetTrip}` pada `<BusCard>`.
`useBulkOperations.ts`: hapus `targetTrip,` dari objek return (variabel `targetTrip` tetap dipakai `useEffect` isian awal).
`unitAnalytics.ts`: hapus `export interface TripStatus {...}` dan `export function evaluateTripStatus(...) {...}`.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm exec tsc -b && pnpm vitest run src/components/busCard src/components/busList src/utils/unitAnalytics.test.ts src/constants/texts`
Expected: tsc exit 0; semua PASS (tsc akan menunjuk sisa pemakai `targetTrip`/`evaluateTripStatus` bila terlewat — `UnitCard`, `UnitDetailModal`, `UnitSummaryDashboard` ditangani Task 6; jika tsc gagal hanya di file tersebut, kerjakan Task 6 lalu ulangi langkah ini).

---

### Task 6: Halaman Armada (`UnitCard`, `UnitSummaryDashboard`, `UnitDetailModal`)

**Files:**
- Modify: `src/components/UnitCard.tsx`
- Modify: `src/components/UnitSummaryDashboard.tsx` (hapus `targetTrip` ±baris 40–44, 94, 117)
- Modify: `src/components/UnitDetailModal.tsx` (prop `targetTrip` ±baris 14, 33; perhitungan ±74–77; badge ±445–461)
- Modify: `src/constants/texts/text_unit_detail.ts` (hapus `TARGET_ACHIEVED`), `src/constants/texts/texts.test.ts` (hapus baris ±343)
- Test: `src/components/__tests__/UnitCard.test.tsx`, `src/components/__tests__/UnitDetailModal.test.tsx`

**Interfaces:**
- Consumes: `UnitStatusBadge`, `UNIT_STATUS_CARD_CLASS` (Task 3); `classifyUnitKeterangan`, `shouldShowKeteranganStrip` (Task 1).
- Produces: `UnitCard` props `{ item, onSelectUnit }`; `UnitDetailModal` tanpa prop `targetTrip`.

- [ ] **Step 1: Ubah test (gagal)** — di `UnitCard.test.tsx`:
  - Pada test OFF (±baris 157–158) ganti assert kelas menjadi:

```tsx
    expect(container.querySelector('.bus-card')?.classList.contains('unit-status-off')).toBe(true);
```

  - Pada test T.O (±baris 185–186) ganti menjadi:

```tsx
      expect(container.querySelector('.bus-card')?.classList.contains('unit-status-to')).toBe(true);
```

  - Pada test "Belum Terisi" (±baris 206) ganti menjadi:

```tsx
    expect(container.querySelector('.bus-card')?.className).not.toMatch(/unit-status-/);
```

  - Tambahkan test (pakai helper `createMockUnit` & pola render yang sama di file):

```tsx
  it('unit berketerangan kendala (BA02) berwarna oranye dan tetap menampilkan badge shift', async () => {
    const mockItem = createMockUnit({ keterangan: 'BA02 Service Berkala', shiftStatus: 'SHIFT_1_ONLY' });
    await act(async () => {
      root.render(<UnitCard item={mockItem} onSelectUnit={() => {}} />);
    });
    expect(container.querySelector('.bus-card')?.classList.contains('unit-status-kendala')).toBe(true);
    expect(container.querySelector('.unit-status-badge-kendala')?.textContent).toBe('KENDALA');
    expect(container.textContent).toContain(TEXT_DASHBOARD.UNIT_CARD.STATUS_SHIFT_1_ONLY);
  });

  it('ritase tampil sebagai ritase PP dengan warna netral', async () => {
    const mockItem = createMockUnit({ tripPergi: '8', tripPulang: '7' });
    await act(async () => {
      root.render(<UnitCard item={mockItem} onSelectUnit={() => {}} />);
    });
    const value = container.querySelector<HTMLElement>('.bus-metric-value');
    expect(value?.textContent).toContain('7.5');
    expect(value?.style.color).toBe('var(--color-text-primary)');
  });
```

  (Jika `createMockUnit` tidak menerima `keterangan`, tambahkan field tersebut ke objek default helper di file test ini.)

  Di `UnitDetailModal.test.tsx` (±baris 102 & 114): hapus prop `targetTrip={{ pergi: 2, pulang: 2 }}` dan ganti assert `TARGET_ACHIEVED` menjadi:

```tsx
    expect(document.body.textContent).not.toContain('Target Tercapai');
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm vitest run src/components/__tests__/UnitCard.test.tsx src/components/__tests__/UnitDetailModal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

`UnitCard.tsx`:
- Import: ganti `import { hasMeaningfulNote, isUnitOff, isUnitTo } from "../utils/keteranganUtils";` dengan

```tsx
import { classifyUnitKeterangan, shouldShowKeteranganStrip } from "../utils/keteranganUtils";
import { parseIndonesianNumber } from "../utils/numberUtils";
import { UnitStatusBadge, UNIT_STATUS_CARD_CLASS } from "./ui/UnitStatusBadge";
```

  hapus `import { evaluateTripStatus } from "../utils/unitAnalytics";`.
- `Props`: hapus `targetTrip`. Signature: `function UnitCardComponent({ item, onSelectUnit }: Props)`.
- `renderStatusBadge(status, rawNote)`: hapus dua cabang `if (isUnitOff(note)) {...}` dan `if (isUnitTo(note)) {...}` beserta variabel `note` (badge kategori dipindah ke JSX).
- Ganti `const isNonSgo = ...;` dengan:

```tsx
  const unitStatus = classifyUnitKeterangan(noteText);
```

- Ganti blok perhitungan trip (`const pergiVal ...` s.d. `const tripTitle = ...;`) dengan:

```tsx
  const pergiVal = (item.tripPergi || "").trim();
  const pulangVal = (item.tripPulang || "").trim();
  const hasTrip = pergiVal !== "" || pulangVal !== "";
  // ponytail: 1 Ritase = 2 Trip (PP)
  const ritase = (parseIndonesianNumber(pergiVal, 0) + parseIndonesianNumber(pulangVal, 0)) / 2;
```

- `className`: `` className={`bus-card glass ${UNIT_STATUS_CARD_CLASS[unitStatus]}`.trim()} ``
- Area badge kanan header:

```tsx
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <UnitStatusBadge keterangan={noteText} />
          {(unitStatus === "NORMAL" || unitStatus === "KENDALA") &&
            renderStatusBadge(item.shiftStatus)}
        </div>
```

  dan ubah signature `function renderStatusBadge(status: UnitShiftStatus)`.
- Kolom Ritase:

```tsx
        <div className="bus-metric-col">
          <span className="bus-metric-label">{TEXT_DASHBOARD.UNIT_CARD.LABEL_RITASE}</span>
          <span
            className="bus-metric-value"
            style={{ color: hasTrip ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
          >
            {hasTrip ? (
              <>
                {String(ritase)}
                <span className="bus-metric-unit">{TEXT_DASHBOARD.UNIT_CARD.RIT_UNIT}</span>
              </>
            ) : (
              <span className="bus-metric-empty">-</span>
            )}
          </span>
        </div>
```

- Strip catatan: ganti `{noteText && hasMeaningfulNote(noteText) && (` dengan `{shouldShowKeteranganStrip(noteText) && (`.

`UnitSummaryDashboard.tsx`: hapus `const targetTrip = useMemo(...)` (±40–44), kedua `targetTrip={targetTrip}`, dan import `detectTargetTrip`/`useMemo` bila tak terpakai lagi.

`UnitDetailModal.tsx`: hapus prop `targetTrip` (interface & destrukturisasi), hapus `pergiNum`, `pulangNum`, `hasTargetTrip`, `isTargetAchieved` (±74–77), dan seluruh blok `{hasTargetTrip && (<span ...>...</span>)}` (±445–461).

`text_unit_detail.ts`: hapus `TARGET_ACHIEVED: 'Target Tercapai',`. `texts.test.ts`: hapus `expect(TEXT_UNIT_DETAIL.TARGET_ACHIEVED).toBe('Target Tercapai');`.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm exec tsc -b && pnpm vitest run src/components src/constants/texts`
Expected: tsc exit 0; PASS.

---

### Task 7: Uji alur LIBUR di Input SS

**Files:**
- Test: `src/components/busList/BusList.test.tsx`

**Interfaces:**
- Consumes: `isUnitOff` dengan LIBUR (Task 1) lewat `useBulkOperations` & `busListUtils`.

- [ ] **Step 1: Tulis test** — tambahkan di describe `'Kosongkan trip lewat modal massal ...'` atau describe utama `BusList.test.tsx`:

```tsx
  it('Set Jumlah Trip mengosongkan trip unit LIBUR (diperlakukan seperti OFF)', async () => {
    const { updateBulkBusData } = await import('@/services/googleSheets');
    vi.mocked(alertUtils.showBulkTripModal).mockResolvedValue({ tripPergi: '7', tripPulang: '7' });
    const fleet = [
      createMockBus({ rowIndex: 6, unit: 'BUS-01' }),
      createMockBus({ rowIndex: 7, unit: 'BUS-02', keterangan: 'LIBUR' }),
    ];

    await act(async () => {
      root.render(<BusList {...defaultProps} data={fleet} />);
    });
    const btn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Set Jumlah Trip'),
    );
    await act(async () => {
      btn!.click();
    });

    expect(updateBulkBusData).toHaveBeenCalledWith(
      'sheet-123',
      'Tgl 9',
      [
        { rowIndex: 6, updates: { tripPergi: '7', tripPulang: '7' } },
        { rowIndex: 7, updates: { tripPergi: '', tripPulang: '' } },
      ],
      defaultProps.headerMap,
    );
  });

  it('unit LIBUR tidak dihitung pada target bar progres', async () => {
    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          data={[
            createMockBus({ rowIndex: 6, unit: 'BUS-01' }),
            createMockBus({ rowIndex: 7, unit: 'BUS-02', keterangan: 'Libur' }),
          ]}
          isShiftConfirmed={true}
        />,
      );
    });
    expect(container.textContent).toContain('/1 Unit');
    expect(container.textContent).not.toContain('/2 Unit');
  });
```

- [ ] **Step 2: Jalankan**

Run: `pnpm vitest run src/components/busList/BusList.test.tsx`
Expected: PASS (implementasi sudah dari Task 1). Jika gagal, telusuri pengecualian di `busListUtils.isUnitAllowedForInput`.

---

### Task 8: Quality gate, verifikasi visual, dokumentasi

**Files:**
- Create: `refactor-ss-pdo/refact_209/AUDIT_BUGS.md`, `refactor-ss-pdo/refact_209/REPAIR_REPORT.md`

- [ ] **Step 1: Cari sisa referensi**

Run: `rg -n "evaluateTripStatus|getBusCardStyles|bus-card-non-sgo|status-achieved|status-warning|status-kendala|TARGET_ACHIEVED|RITASE_DEFICIT|RITASE_IMBALANCED|RITASE_TARGET|FULL_TARGET_TOOLTIP|TRIP_BADGE_DEFICIT|TRIP_BADGE_ACHIEVED" src`
Expected: tidak ada hasil.

- [ ] **Step 2: 4 quality gate**

Run berurutan:
1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` → semua lulus
2. `pnpm vitest run src/` → 0 gagal
3. `pnpm run build` → exit 0
4. `graphify update .`

- [ ] **Step 3: Verifikasi visual (bila dev server & sesi login tersedia)** — buka Input SS & Armada di mode terang dan gelap, pastikan kartu OFF/LIBUR kuning, T.O merah, kendala oranye, badge terbaca, ritase satu warna. Jika tidak bisa login di browser bawaan, catat "belum diverifikasi visual" di REPAIR_REPORT.

- [ ] **Step 4: Dokumentasi `refact_209`** (format skill `refact-doc`): temuan minimal —
  - `BUG-UI-209-01` target ritase per rute tidak mencerminkan pola rolling lapangan → ritase netral.
  - `BUG-UI-209-02` kartu tidak membedakan unit berketerangan sepanjang hari → klasifikasi + warna kartu.
  - `BUG-DATA-209-03` `isUnitOff` tidak mengenali LIBUR → Set Jumlah Trip mengisi trip unit LIBUR & progres menghitungnya.
  - `BUG-UI-209-04` kartu Armada menampilkan trip "8/7" berlabel "Rit" → ritase PP.
  Sertakan Before vs After, Case Skenario Lapangan, dan angka nyata 4 gate.

- [ ] **Step 5: Serahkan** — laporkan hasil; jangan commit tanpa perintah pengguna (PA/commit).
