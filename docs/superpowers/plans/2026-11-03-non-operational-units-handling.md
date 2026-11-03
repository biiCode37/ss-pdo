# Rencana Implementasi: Penanganan Unit Tidak Beroperasi (Ritase 0/Kosong) pada Input SS & Plotting

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memperlakukan unit yang tidak beroperasi (ritase = 0/kosong) secara presisi di Halaman Input SS dan Halaman Plotting: auto-skip pada mode Satset, proteksi kunci kolom angka dengan banner ramah dan tombol override `[ 🔓 Aktifkan Input ]`, pengelompokan otomatis ke posisi bawah (*auto-park to bottom*), serta eksklusi mutlak dari nomor urutan antrean 1..N.

**Architecture:** Modul murni terisolasi `operationalStatusUtils.ts` menjadi Single Source of Truth untuk evaluasi non-operasional (berbasis nilai ritase dan pengecualian khusus TO). Komponen `BusList.tsx` dan `DailyPlottingPage.tsx` menggunakan utilitas ini untuk sorting dan eksklusi nomor urut. `BusInputModal.tsx` menerapkan proteksi kolom angka sementara, banner informatif 2 skenario, dan tombol aktivasi yang otomatis membersihkan catatan murni "OFF/LIBUR".

**Tech Stack:** React 19, TypeScript (Strict), Vitest, Happy-DOM, SweetAlert2 (`alertUtils`), Semantic CSS Tokens (`semantic.css`).

## Global Constraints
- **Strictdevmode:** Bekerja pada branch `devmode`.
- **Golden Rule Ritase:** Nilai/kolom ritase adalah penentu mutlak unit tidak beroperasi (bukan kolom keterangan).
- **Pengecualian Khusus TO:** `"TO"`, `"T.O"`, `"TO EVDAL"`, `"T.O EVDAL"` BUKAN unit tidak beroperasi.
- **Pembersihan Bersyarat:** Hanya bersihkan kolom keterangan jika isinya murni `"OFF"` atau `"LIBUR"`. Catatan lain wajib dipertahankan.
- **TDD & Zero Regression:** Setiap task wajib menyertakan unit test yang 100% lulus.

---

### Task 1: Modul Utilitas Status Operasional (`operationalStatusUtils.ts`)

**Files:**
- Create: `src/utils/operationalStatusUtils.ts`
- Test: `src/utils/operationalStatusUtils.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function isBusNonOperational(
    bus: { tripPergi?: string; tripPulang?: string; keterangan?: string },
    plottingItem?: { target_ritase?: number; status?: string }
  ): boolean;

  export type NonOperationalBannerType = 'NONE' | 'EMPTY_RITASE' | 'OFF_LIBUR';

  export function getNonOperationalBannerType(
    bus: { tripPergi?: string; tripPulang?: string; keterangan?: string },
    plottingItem?: { target_ritase?: number; status?: string }
  ): NonOperationalBannerType;

  export function shouldClearKeteranganOnActivation(keterangan?: string | null): boolean;
  ```

- [ ] **Step 1: Write the failing test**

```ts
// src/utils/operationalStatusUtils.test.ts
import { describe, it, expect } from 'vitest';
import {
  isBusNonOperational,
  getNonOperationalBannerType,
  shouldClearKeteranganOnActivation,
} from './operationalStatusUtils';

describe('operationalStatusUtils', () => {
  describe('isBusNonOperational', () => {
    it('menganggap beroperasi jika ritase > 0 meskipun ada keterangan TO', () => {
      expect(isBusNonOperational({ tripPergi: '7', tripPulang: '7', keterangan: 'T.O' })).toBe(false);
    });

    it('menganggap tidak beroperasi jika ritase 0 atau kosong', () => {
      expect(isBusNonOperational({ tripPergi: '0', tripPulang: '0', keterangan: '' })).toBe(true);
      expect(isBusNonOperational({ tripPergi: '', tripPulang: '', keterangan: 'OFF' })).toBe(true);
    });

    it('mengecualikan status TO dari non-operasional jika hanya evaluasi keterangan tanpa ritase', () => {
      // Jika ritase 0 dan keterangan TO: tetap dianggap non-operasional karena ritasenya 0
      expect(isBusNonOperational({ tripPergi: '0', tripPulang: '0', keterangan: 'TO EVDAL' })).toBe(true);
    });

    it('sinkron dengan plotting status jika target_ritase 0', () => {
      expect(
        isBusNonOperational(
          { tripPergi: '', tripPulang: '', keterangan: '' },
          { target_ritase: 0, status: 'OFF' }
        )
      ).toBe(true);
    });
  });

  describe('getNonOperationalBannerType', () => {
    it('mengembalikan NONE untuk unit beroperasi', () => {
      expect(getNonOperationalBannerType({ tripPergi: '5', tripPulang: '5' })).toBe('NONE');
    });

    it('mengembalikan EMPTY_RITASE jika ritase 0 dan keterangan kosong atau bukan OFF/LIBUR', () => {
      expect(getNonOperationalBannerType({ tripPergi: '', tripPulang: '', keterangan: '' })).toBe('EMPTY_RITASE');
      expect(getNonOperationalBannerType({ tripPergi: '0', tripPulang: '0', keterangan: 'BOCOR RADIATOR' })).toBe('EMPTY_RITASE');
    });

    it('mengembalikan OFF_LIBUR jika ritase 0 dan keterangan murni OFF atau LIBUR', () => {
      expect(getNonOperationalBannerType({ tripPergi: '0', tripPulang: '0', keterangan: 'OFF' })).toBe('OFF_LIBUR');
      expect(getNonOperationalBannerType({ tripPergi: '', tripPulang: '', keterangan: 'LIBUR' })).toBe('OFF_LIBUR');
    });
  });

  describe('shouldClearKeteranganOnActivation', () => {
    it('mengembalikan true hanya jika keterangan murni OFF atau LIBUR', () => {
      expect(shouldClearKeteranganOnActivation('OFF')).toBe(true);
      expect(shouldClearKeteranganOnActivation('off')).toBe(true);
      expect(shouldClearKeteranganOnActivation('LIBUR')).toBe(true);
      expect(shouldClearKeteranganOnActivation(' Libur ')).toBe(true);
    });

    it('mengembalikan false jika memuat catatan lain', () => {
      expect(shouldClearKeteranganOnActivation('OFF - BENGKEL')).toBe(false);
      expect(shouldClearKeteranganOnActivation('BA.02')).toBe(false);
      expect(shouldClearKeteranganOnActivation('T.O')).toBe(false);
      expect(shouldClearKeteranganOnActivation('')).toBe(false);
      expect(shouldClearKeteranganOnActivation(null)).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/utils/operationalStatusUtils.test.ts`  
Expected: FAIL

- [ ] **Step 3: Write implementation**

Implementasikan logika murni di `src/utils/operationalStatusUtils.ts` memanfaatkan `parseIndonesianNumber`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/utils/operationalStatusUtils.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/operationalStatusUtils.ts src/utils/operationalStatusUtils.test.ts
git commit -m "feat: utilitas evaluasi unit non-operasional dan pembersihan"
```

---

### Task 2: Kamus Teks Sentral Banner & Tombol Pembuka Kunci

**Files:**
- Modify: `src/constants/texts/text_alerts.ts`
- Test: `src/constants/texts/texts.test.ts`

- [ ] **Step 1: Write the failing test in `texts.test.ts`**
- [ ] **Step 2: Run test to verify failure (RED)**
- [ ] **Step 3: Tambahkan entri kamus pada `TEXT_ALERTS.BUS_INPUT_MODAL`**
  - `NON_OPERATIONAL_BANNER_EMPTY_RITASE`: `"Unit tidak memiliki target Ritase (Tidak Beroperasi) - Hanya kolom Keterangan yang dapat diedit/diisi."`
  - `NON_OPERATIONAL_BANNER_OFF_LIBUR`: `"Unit tidak memiliki target Ritase dan berstatus \"OFF (Libur)\" - Hanya kolom Keterangan yang dapat diedit/diisi."`
  - `BTN_ACTIVATE_INPUT`: `"🔓 Aktifkan Input"`
  - `ACTIVATE_INPUT_PROMPT_TITLE`: `"Aktifkan Input Unit"`
  - `ACTIVATE_INPUT_PROMPT_LABEL`: `"Masukkan target ritase unit untuk membuka kunci input:"`
  - `ACTIVATE_INPUT_SUCCESS`: `"Unit berhasil diaktifkan. Kolom input angka telah terbuka."`
- [ ] **Step 4: Run test to verify pass (GREEN)**
- [ ] **Step 5: Commit**

```bash
git add src/constants/texts/text_alerts.ts src/constants/texts/texts.test.ts
git commit -m "feat: kamus teks banner proteksi non-operasional dan aktivasi"
```

---

### Task 3: Auto-Skip Mode Satset & Auto-Park to Bottom pada Input SS (`BusList.tsx` & `BusCard.tsx`)

**Files:**
- Modify: `src/components/busList/BusList.tsx`
- Modify: `src/components/busCard/BusCard.tsx`
- Modify: `src/components/busList/BusList.test.tsx`
- Modify: `src/components/busCard/BusCard.test.tsx`

**Perubahan:**
1. `BusList.tsx` (Auto-Skip):
   - Pada `handleSaveAndNext`, gunakan `!checkFilled(b) && !isBusNonOperational(b, plottingMap.get(b.unit.trim().toUpperCase()))`.
   - Bus dengan ritase 0 / kosong dilewati otomatis saat Satset aktif.
2. `BusList.tsx` (Auto-Park to Bottom):
   - Dalam pengurutan `filteredData`, kelompokkan unit operasional di atas, dan unit non-operasional (`isBusNonOperational`) di paling bawah.
3. `BusCard.tsx` (Eksklusi Nomor Urut):
   - Badge nomor urut `#{plottingItem.order}` HANYA dirender jika `!isBusNonOperational(bus, plottingItem)`. Jika non-operasional, nomor urut tidak ditampilkan (atau tampil badge non-operasi `-`).

- [ ] **Step 1: Write failing tests in `BusList.test.tsx` and `BusCard.test.tsx`**
- [ ] **Step 2: Run test to verify failure (RED)**
- [ ] **Step 3: Implementasi perubahan di `BusList.tsx` dan `BusCard.tsx`**
- [ ] **Step 4: Run tests to verify pass (GREEN)**
- [ ] **Step 5: Commit**

```bash
git add src/components/busList/BusList.tsx src/components/busCard/BusCard.tsx src/components/busList/BusList.test.tsx src/components/busCard/BusCard.test.tsx
git commit -m "feat: auto-skip satset dan auto-park bawah input ss"
```

---

### Task 4: Proteksi Kolom Angka, Banner, & Override Action pada Modal Form Input SS (`BusInputModal.tsx`, `useBusInputForm.ts`)

**Files:**
- Modify: `src/components/busCard/BusInputModal.tsx`
- Modify: `src/components/busCard/modal/useBusInputForm.ts`
- Modify: `src/components/busCard/BusInputModal.test.tsx`

**Perubahan:**
1. Di `useBusInputForm.ts`:
   - State `isInputUnlocked: boolean` (default false).
   - Flag `isLocked = isBusNonOperational(initialBus) && !isInputUnlocked`.
   - Handler `handleActivateInput(newRitase: number)`:
     - Mengubah `isInputUnlocked` menjadi `true`.
     - Mengisi `tripPergi` dan `tripPulang` berdasarkan `newRitase` (atau default split).
     - Jika `shouldClearKeteranganOnActivation(keterangan)` bernilai true, kosongkan `keterangan` (`setKeterangan('')`).
2. Di `BusInputModal.tsx`:
   - Jika `isLocked === true`:
     - Render Banner Peringatan di atas tab navigasi form dengan teks dari `getNonOperationalBannerType(bus)`.
     - Tampilkan tombol `[ 🔓 Aktifkan Input ]` di dalam banner.
     - Teruskan status `disabled={isLocked}` ke field trip, KM, dan TOA. Kolom Keterangan tetap aktif.
   - Klik `[ 🔓 Aktifkan Input ]` memunculkan prompt/dialog pengisian ritase menggunakan SweetAlert2 / Modal shell.

- [ ] **Step 1: Write failing test in `BusInputModal.test.tsx`**
- [ ] **Step 2: Run test to verify failure (RED)**
- [ ] **Step 3: Implementasi di `useBusInputForm.ts` dan `BusInputModal.tsx`**
- [ ] **Step 4: Run test to verify pass (GREEN)**
- [ ] **Step 5: Commit**

```bash
git add src/components/busCard/BusInputModal.tsx src/components/busCard/modal/useBusInputForm.ts src/components/busCard/BusInputModal.test.tsx
git commit -m "feat: proteksi form bus off dan override aktivasi input"
```

---

### Task 5: Auto-Park to Bottom & Eksklusi Nomor Urutan pada Halaman Plotting (`DailyPlottingPage.tsx` & `PlottingUnitCard.tsx`)

**Files:**
- Modify: `src/components/plotting/DailyPlottingPage.tsx`
- Modify: `src/components/plotting/PlottingUnitCard.tsx`
- Modify: `src/components/plotting/DailyPlottingPage.test.tsx`
- Modify: `src/components/plotting/PlottingUnitCard.test.tsx`

**Perubahan:**
1. Di `DailyPlottingPage.tsx`:
   - Modifikasi `normalizeBaseOrders`:
     - Pisahkan unit aktif (`target_ritase > 0 && status !== 'OFF'`) dengan unit non-operasional (`target_ritase === 0 || status === 'OFF'`).
     - Unit aktif diberi nomor urut berurutan `1..N`.
     - Unit non-operasional diposisikan di bawah unit aktif dengan `order: 0`.
2. Di `PlottingUnitCard.tsx`:
   - Jika `item.order === 0` atau non-operasional:
     - Badge urutan tidak menampilkan angka, melainkan tanda `-` atau label status ringkas `OFF`.
     - Tombol reorder panah atas/bawah tidak ditampilkan atau disesuaikan untuk kelompok non-operasional.

- [ ] **Step 1: Write failing tests in `DailyPlottingPage.test.tsx` and `PlottingUnitCard.test.tsx`**
- [ ] **Step 2: Run test to verify failure (RED)**
- [ ] **Step 3: Implementasi perubahan di `DailyPlottingPage.tsx` dan `PlottingUnitCard.tsx`**
- [ ] **Step 4: Run tests to verify pass (GREEN)**
- [ ] **Step 5: Commit**

```bash
git add src/components/plotting/DailyPlottingPage.tsx src/components/plotting/PlottingUnitCard.tsx src/components/plotting/DailyPlottingPage.test.tsx src/components/plotting/PlottingUnitCard.test.tsx
git commit -m "feat: auto-park bawah dan eksklusi nomor urut plotting"
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
  Buat `refactor-ss-pdo/refact_199/AUDIT_BUGS.md` dan `REPAIR_REPORT.md`.
- [ ] **Step 6: Final Commit**
  `git commit -m "docs: dokumentasi refactor 199 penanganan unit non-operasi"`
