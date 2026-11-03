# Implementasi Optimalisasi UI/UX & Mekanisme Reorder Halaman Plotting

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengoptimalkan antarmuka kartu unit plotting dengan menghapus bulatan checkbox idle, menggantikannya dengan conditional checkmark halus saat terpilih, serta menghadirkan modal penempatan urutan relatif (*Relative Placement Order Modal*) baik untuk 1 unit maupun rombongan (*multi-unit block shift*).

**Architecture:** Modul murni terisolasi `plottingOrderUtils.ts` menangani kalkulasi perpindahan array dan normalisasi 1..N. Komponen baru `PlottingOrderModal.tsx` menyediakan antarmuka modal pemilihan posisi (TOP, BOTTOM, ABOVE, BELOW unit acuan). `PlottingUnitCard.tsx` disederhanakan tanpa checkbox lingkaran dan memiliki badge nomor urutan interaktif. `DailyPlottingPage.tsx` mengintegrasikan alur seleksi kartu dan floating action bar `[ ⇅ Atur Posisi (N) ]`.

**Tech Stack:** React 19, TypeScript (Strict), Vitest, Happy-DOM, Lucide React, Semantic CSS Tokens (`semantic.css`).

## Global Constraints
- **Strictdevmode:** Seluruh pengerjaan wajib berada di branch `devmode`.
- **No Hardcoded Colors:** Seluruh warna wajib merujuk ke CSS variables `var(--color-...)` dari `semantic.css`.
- **Central Texts:** Dilarang keras hardcode UI strings; seluruh teks antarmuka wajib melalui `src/constants/texts/text_plotting.ts`.
- **Preserve Formula & Safe Payload:** Dilarang menyentuh rumus spreadsheet.
- **TDD & Zero Regression:** Setiap task wajib menyertakan unit test dengan 100% lulus sebelum commit.

---

### Task 1: Logika Pemindahan Array Urutan Relatif (`plottingOrderUtils.ts`)

**Files:**
- Create: `src/utils/plottingOrderUtils.ts`
- Test: `src/utils/plottingOrderUtils.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type RelativePlacement = 'TOP' | 'BOTTOM' | 'ABOVE' | 'BELOW';

  export function reorderUnitsRelative(
    currentUnits: UnitPlottingItem[],
    unitsToMove: string[],
    placement: RelativePlacement,
    referenceUnit?: string
  ): UnitPlottingItem[];
  ```

- [ ] **Step 1: Write the failing test**

```ts
// src/utils/plottingOrderUtils.test.ts
import { describe, it, expect } from 'vitest';
import { reorderUnitsRelative } from './plottingOrderUtils';
import type { UnitPlottingItem } from '@/types/supabase';

describe('plottingOrderUtils - reorderUnitsRelative', () => {
  const sample: UnitPlottingItem[] = [
    { unit: 'U1', order: 1, start_point: 'A', target_ritase: 7.5, status: 'READY' },
    { unit: 'U2', order: 2, start_point: 'A', target_ritase: 7.5, status: 'READY' },
    { unit: 'U3', order: 3, start_point: 'A', target_ritase: 7.5, status: 'READY' },
    { unit: 'U4', order: 4, start_point: 'A', target_ritase: 7.5, status: 'READY' },
    { unit: 'U5', order: 5, start_point: 'A', target_ritase: 7.5, status: 'READY' },
  ];

  it('memindahkan 1 unit ke paling depan (TOP)', () => {
    const res = reorderUnitsRelative(sample, ['U4'], 'TOP');
    expect(res.map((u) => u.unit)).toEqual(['U4', 'U1', 'U2', 'U3', 'U5']);
    expect(res.map((u) => u.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('memindahkan 1 unit ke paling belakang (BOTTOM)', () => {
    const res = reorderUnitsRelative(sample, ['U2'], 'BOTTOM');
    expect(res.map((u) => u.unit)).toEqual(['U1', 'U3', 'U4', 'U5', 'U2']);
    expect(res.map((u) => u.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('memindahkan 1 unit tepat di atas unit acuan (ABOVE)', () => {
    const res = reorderUnitsRelative(sample, ['U5'], 'ABOVE', 'U2');
    expect(res.map((u) => u.unit)).toEqual(['U1', 'U5', 'U2', 'U3', 'U4']);
    expect(res.map((u) => u.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('memindahkan 1 unit tepat di bawah unit acuan (BELOW)', () => {
    const res = reorderUnitsRelative(sample, ['U1'], 'BELOW', 'U3');
    expect(res.map((u) => u.unit)).toEqual(['U2', 'U3', 'U1', 'U4', 'U5']);
    expect(res.map((u) => u.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('memindahkan rombongan multi-unit dengan mempertahankan urutan relatif (Preserve Relative Order)', () => {
    const res = reorderUnitsRelative(sample, ['U2', 'U4'], 'BELOW', 'U5');
    expect(res.map((u) => u.unit)).toEqual(['U1', 'U3', 'U5', 'U2', 'U4']);
    expect(res.map((u) => u.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('memindahkan rombongan multi-unit ke paling depan (TOP)', () => {
    const res = reorderUnitsRelative(sample, ['U3', 'U5'], 'TOP');
    expect(res.map((u) => u.unit)).toEqual(['U3', 'U5', 'U1', 'U2', 'U4']);
    expect(res.map((u) => u.order)).toEqual([1, 2, 3, 4, 5]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/utils/plottingOrderUtils.test.ts`  
Expected: FAIL (Cannot find module './plottingOrderUtils')

- [ ] **Step 3: Write minimal implementation**

```ts
// src/utils/plottingOrderUtils.ts
import type { UnitPlottingItem } from '@/types/supabase';

export type RelativePlacement = 'TOP' | 'BOTTOM' | 'ABOVE' | 'BELOW';

export function reorderUnitsRelative(
  currentUnits: UnitPlottingItem[],
  unitsToMove: string[],
  placement: RelativePlacement,
  referenceUnit?: string
): UnitPlottingItem[] {
  if (unitsToMove.length === 0) return currentUnits;

  const moveSet = new Set(unitsToMove);
  // Ambil elemen yang dipindah dengan menjaga urutan aslinya
  const movingItems = currentUnits.filter((u) => moveSet.has(u.unit));
  // Sisa elemen yang tidak dipindah
  const remaining = currentUnits.filter((u) => !moveSet.has(u.unit));

  let result: UnitPlottingItem[] = [];

  if (placement === 'TOP') {
    result = [...movingItems, ...remaining];
  } else if (placement === 'BOTTOM') {
    result = [...remaining, ...movingItems];
  } else if (referenceUnit) {
    const refIdx = remaining.findIndex((u) => u.unit === referenceUnit);
    if (refIdx === -1) {
      result = [...remaining, ...movingItems];
    } else if (placement === 'ABOVE') {
      result = [
        ...remaining.slice(0, refIdx),
        ...movingItems,
        ...remaining.slice(refIdx),
      ];
    } else {
      // BELOW
      result = [
        ...remaining.slice(0, refIdx + 1),
        ...movingItems,
        ...remaining.slice(refIdx + 1),
      ];
    }
  } else {
    result = [...remaining, ...movingItems];
  }

  // Normalisasi order 1..N
  return result.map((item, idx) => ({
    ...item,
    order: idx + 1,
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/utils/plottingOrderUtils.test.ts`  
Expected: PASS 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/utils/plottingOrderUtils.ts src/utils/plottingOrderUtils.test.ts
git commit -m "feat: logika pemindahan urutan relatif plotting"
```

---

### Task 2: Kamus Teks Sentral Penataan Urutan (`text_plotting.ts`)

**Files:**
- Modify: `src/constants/texts/text_plotting.ts`
- Test: `src/constants/texts/texts.test.ts`

- [ ] **Step 1: Write the failing test**

Tambahkan uji pada `src/constants/texts/texts.test.ts` untuk memastikan properti kamus `ORDER_MODAL` dan `ACTIONS.BULK_REORDER` ada dan berupa fungsi/string valid.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/constants/texts/texts.test.ts`  
Expected: FAIL

- [ ] **Step 3: Update `src/constants/texts/text_plotting.ts`**

Tambahkan entri teks:
```ts
  ORDER_MODAL: {
    TITLE_SINGLE: (unit: string, currentOrder: number) => `Atur Posisi ${unit} (#${currentOrder})`,
    TITLE_MULTI: (count: number) => `Atur Posisi ${count} Unit Terpilih`,
    QUICK_TOP: '⤒ Paling Depan (#1)',
    QUICK_BOTTOM: '⤓ Paling Belakang',
    RELATIVE_HEADER: 'Atau selipkan posisi relatif:',
    DIR_ABOVE: 'Di Atas Unit',
    DIR_BELOW: 'Di Bawah Unit',
    REF_LABEL: 'Pilih Unit Acuan:',
    REF_PLACEHOLDER: '-- Pilih unit acuan target --',
    SUBMIT: 'Terapkan Posisi',
  },
```
Dan di `ACTIONS`:
```ts
    BULK_REORDER: (count: number) => `⇅ Atur Posisi (${count})`,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/constants/texts/texts.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/constants/texts/text_plotting.ts src/constants/texts/texts.test.ts
git commit -m "feat: kamus teks modal penempatan urutan plotting"
```

---

### Task 3: Komponen Modal `PlottingOrderModal.tsx`

**Files:**
- Create: `src/components/plotting/PlottingOrderModal.tsx`
- Test: `src/components/plotting/PlottingOrderModal.test.tsx`

**Interfaces:**
- Consumes: `TEXT_PLOTTING`, `reorderUnitsRelative`, `UnitPlottingItem`
- Produces: `PlottingOrderModal` component

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/plotting/PlottingOrderModal.test.tsx
// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlottingOrderModal } from './PlottingOrderModal';
import type { UnitPlottingItem } from '@/types/supabase';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('PlottingOrderModal Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  const sampleUnits: UnitPlottingItem[] = [
    { unit: 'U1', order: 1, start_point: 'A', target_ritase: 7.5, status: 'READY' },
    { unit: 'U2', order: 2, start_point: 'A', target_ritase: 7.5, status: 'READY' },
    { unit: 'U3', order: 3, start_point: 'A', target_ritase: 7.5, status: 'READY' },
  ];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('memanggil onApplyMove dengan TOP saat tombol paling depan ditekan', () => {
    const handleApply = vi.fn();
    act(() => {
      root.render(
        <PlottingOrderModal
          isOpen={true}
          unitsToMove={['U3']}
          allBaseUnits={sampleUnits}
          onClose={vi.fn()}
          onApplyMove={handleApply}
        />
      );
    });

    const btnTop = container.querySelector('[data-testid="btn-order-top"]') as HTMLButtonElement;
    act(() => btnTop.click());
    expect(handleApply).toHaveBeenCalledWith(['U3'], 'TOP', undefined);
  });

  it('mengecualikan unit yang sedang dipindahkan dari dropdown unit acuan', () => {
    act(() => {
      root.render(
        <PlottingOrderModal
          isOpen={true}
          unitsToMove={['U2']}
          allBaseUnits={sampleUnits}
          onClose={vi.fn()}
          onApplyMove={vi.fn()}
        />
      );
    });

    const select = container.querySelector('[data-testid="select-ref-unit"]') as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toContain('U1');
    expect(options).toContain('U3');
    expect(options).not.toContain('U2');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/plotting/PlottingOrderModal.test.tsx`  
Expected: FAIL

- [ ] **Step 3: Implement `PlottingOrderModal.tsx`**

Buat modal mobile-first dengan:
- Tombol TOP / BOTTOM
- Segmented radio buttons "Di Atas Unit" vs "Di Bawah Unit"
- Select dropdown berisikan armada acuan yang difilter
- Tombol Batal & Terapkan Posisi.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/plotting/PlottingOrderModal.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/plotting/PlottingOrderModal.tsx src/components/plotting/PlottingOrderModal.test.tsx
git commit -m "feat: komponen modal penempatan urutan relatif plotting"
```

---

### Task 4: Optimalisasi `PlottingUnitCard.tsx` (Clean Selection & Interactive Order Badge)

**Files:**
- Modify: `src/components/plotting/PlottingUnitCard.tsx`
- Modify: `src/components/plotting/PlottingUnitCard.test.tsx`

**Perubahan:**
1. Hapus icon lingkaran checkbox idle `[O]` abu-abu.
2. Ketika `isSelectedForMultiSelect === true`, tampilkan badge centang mini halus (`CheckCircle2` size 14) di pojok kiri nama unit atau di samping order badge.
3. Seluruh area bodi kartu (termasuk nama unit) dapat di-klik untuk memicu `onToggleSelect(item.unit)`.
4. Badge nomor urutan `badge-order-${item.unit}` diberi efek interaktif (cursor pointer, hover border halus) dan saat di-klik memanggil prop baru: `onOpenOrderModal?: (unit: string) => void`.
5. Hapus icon `GripVertical` drag handle.

- [ ] **Step 1: Update unit test pada `PlottingUnitCard.test.tsx`**
- [ ] **Step 2: Run test to verify failures on old behavior**
- [ ] **Step 3: Update implementasi `PlottingUnitCard.tsx`**
- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/plotting/PlottingUnitCard.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/plotting/PlottingUnitCard.tsx src/components/plotting/PlottingUnitCard.test.tsx
git commit -m "feat: clean selection dan interactive order badge plotting card"
```

---

### Task 5: Integrasi Penuh pada `DailyPlottingPage.tsx`

**Files:**
- Modify: `src/components/plotting/DailyPlottingPage.tsx`
- Modify: `src/components/plotting/DailyPlottingPage.test.tsx`

**Perubahan:**
1. Tambahkan state `orderModal: { isOpen: boolean; units: string[] }`.
2. Handler `handleOpenOrderModal(unit: string)` untuk single-unit reorder via tap order badge.
3. Handler `handleOpenBulkOrderModal()` dari tombol `[ ⇅ Atur Posisi (N) ]` pada Floating Action Bar.
4. Handler `handleApplyReorderMove(unitsToMove, placement, referenceUnit)`:
   - Menggunakan `reorderUnitsRelative` untuk memodifikasi urutan unit pada base aktif.
   - Normalisasi urutan base dan update `unitsData`.
   - Menghapus seleksi setelah pemindahan berhasil.
   - Menampilkan success toast ramah non-teknis.
5. Menghubungkan `PlottingOrderModal` ke JSX rendering.

- [ ] **Step 1: Update unit test pada `DailyPlottingPage.test.tsx`**
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Update implementasi `DailyPlottingPage.tsx`**
- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/plotting/DailyPlottingPage.test.tsx`  
Expected: PASS 9+ tests

- [ ] **Step 5: Commit**

```bash
git add src/components/plotting/DailyPlottingPage.tsx src/components/plotting/DailyPlottingPage.test.tsx
git commit -m "feat: integrasi penempatan urutan relatif satuan dan rombongan"
```

---

### Task 6: Verifikasi Menyeluruh & Quality Gates

- [ ] **Step 1: Run Color Contract Test**
  `pnpm vitest run src/styles/tokens/color-contract.test.ts` (100% pass)
- [ ] **Step 2: Run Entire Test Suite**
  `pnpm vitest run src/` (100% pass)
- [ ] **Step 3: Run Production Build**
  `pnpm run build` (tsc strict + vite build 0 error)
- [ ] **Step 4: Update Knowledge Graph**
  `graphify update .`
- [ ] **Step 5: Dokumentasi Audit & Perbaikan**
  Buat `refactor-ss-pdo/refact_198/AUDIT_BUGS.md` dan `REPAIR_REPORT.md`.
- [ ] **Step 6: Final Commit**
  `git commit -m "docs: dokumentasi refactor 198 order modal plotting"`
