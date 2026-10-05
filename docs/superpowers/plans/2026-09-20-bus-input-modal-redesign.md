# Redesign Bus Input Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merombak pengalaman pengguna (*UX*) dan estetika form `BusInputModal` menjadi *keyboard-aware floating sheet* yang nyaman, cepat (*satset*), estetik, dan presisi di lapangan dengan auto-prefill 3 digit KM, live validation badge, dan paket per shift.

**Architecture:** Menggunakan pure React 19 dengan hook `useVisualViewport` untuk mencegah benturan keyboard virtual, modular utilitas `busModalOdometer.ts` untuk kalkulasi selisih KM dan prefill 3 digit, serta perombakan komponen formulir per shift (`BusInputModalShift1`, `Shift2`, `SingleFocus`, `Header`, `Footer`).

**Tech Stack:** React 19, TypeScript, Vite PWA, Lucide React, Vitest.

## Global Constraints
- Wajib menggunakan branch `devmode`.
- Seluruh teks antarmuka wajib merujuk ke kamus teks sentral `src/constants/texts/`. Dilarang hardcoded UI strings.
- Semua parsing angka wajib menggunakan `parseIndonesianNumber()` dari `src/utils/numberUtils.ts`.
- Desain wajib mobile-first dan mendukung dual-theme (Light & Dark Mode).
- Zero external UI library bloat (0 KB additional JS runtime).

---

### Task 1: Kamus Teks Sentral untuk Indikator & Badge Modal

**Files:**
- Modify: `src/constants/texts/text_alerts.ts`
- Modify: `src/constants/texts/texts.test.ts`

**Interfaces:**
- Produces:
  - `TEXT_ALERTS.BUS_INPUT_MODAL.DIFF_NORMAL: (diff: number) => string`
  - `TEXT_ALERTS.BUS_INPUT_MODAL.DIFF_NEGATIVE: (diff: number) => string`
  - `TEXT_ALERTS.BUS_INPUT_MODAL.DIFF_EXTREME: (diff: number, max: number) => string`
  - `TEXT_ALERTS.BUS_INPUT_MODAL.LIVE_TOA_S2_RESULT: (tot: number, s1: number, s2: number) => string`
  - `TEXT_ALERTS.BUS_INPUT_MODAL.COPY_KM_AKHIR_S1_BTN: string`

- [ ] **Step 1: Tulis unit test untuk teks kamus baru**
Update `src/constants/texts/texts.test.ts` untuk memverifikasi entri baru pada `TEXT_ALERTS.BUS_INPUT_MODAL`.

- [ ] **Step 2: Jalankan test untuk memastikan test gagal**
Run: `pnpm vitest run src/constants/texts/texts.test.ts`
Expected: FAIL karena properti belum ada.

- [ ] **Step 3: Tambahkan definisi teks di text_alerts.ts**
Definisikan template fungsi dan string di `src/constants/texts/text_alerts.ts`.

- [ ] **Step 4: Jalankan test kembali hingga lulus**
Run: `pnpm vitest run src/constants/texts/texts.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
Run: `git add src/constants/texts/; git commit -m "feat(texts): add bus modal live diff text tokens"`

---

### Task 2: Utilitas Odometer: Auto-Prefill 3 Digit & Kalkulasi Real-Time

**Files:**
- Create: `src/utils/modals/busInput/busModalOdometer.ts`
- Create: `src/utils/modals/busInput/busModalOdometer.test.ts`

**Interfaces:**
- Produces:
  - `extractLeading3Digits(val?: string | null): string`
  - `computeRealtimeDistance(awalRaw?: string | null, akhirRaw?: string | null): KmDistanceResult`
  - `computeLiveToaShift2(totalToaRaw?: string | null, toaS1Raw?: string | null): ToaLiveResult`

- [ ] **Step 1: Buat failing unit test untuk odometer utils**
Buat `src/utils/modals/busInput/busModalOdometer.test.ts` yang menguji:
1. `extractLeading3Digits("145.820")` -> `"145"`
2. `extractLeading3Digits("145820")` -> `"145"`
3. `extractLeading3Digits("98")` -> `"98"`
4. `computeRealtimeDistance("145.800", "145.920")` -> `{ diff: 120, status: 'normal' }`
5. `computeRealtimeDistance("145.800", "145.750")` -> `{ diff: -50, status: 'negative' }`
6. `computeRealtimeDistance("145.800", "146.300")` -> `{ diff: 500, status: 'extreme' }`
7. `computeLiveToaShift2("250", "150")` -> `{ s2: 100, status: 'valid' }`
8. `computeLiveToaShift2("120", "150")` -> `{ s2: -30, status: 'invalid' }`

- [ ] **Step 2: Jalankan test untuk memastikan test gagal**
Run: `pnpm vitest run src/utils/modals/busInput/busModalOdometer.test.ts`
Expected: FAIL karena file implementasi belum ada.

- [ ] **Step 3: Buat implementasi di busModalOdometer.ts**
Implementasikan fungsi menggunakan `parseIndonesianNumber` dan regex pembersih digit.

- [ ] **Step 4: Jalankan test hingga lulus**
Run: `pnpm vitest run src/utils/modals/busInput/busModalOdometer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
Run: `git add src/utils/modals/busInput/busModalOdometer*; git commit -m "feat: add bus modal odometer prefill & diff utils"`

---

### Task 3: Hook Keyboard-Aware & Visual Viewport (`useVisualViewport`)

**Files:**
- Create: `src/hooks/useVisualViewport.ts`
- Create: `src/hooks/useVisualViewport.test.ts`

**Interfaces:**
- Produces:
  - `useVisualViewport(): { viewportHeight: number, isKeyboardOpen: boolean }`

- [ ] **Step 1: Buat test untuk useVisualViewport**
Buat `src/hooks/useVisualViewport.test.ts` untuk memverifikasi listener resize pada `window.visualViewport`.

- [ ] **Step 2: Jalankan test untuk verifikasi kegagalan awal**
Run: `pnpm vitest run src/hooks/useVisualViewport.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasi useVisualViewport**
Buat `src/hooks/useVisualViewport.ts` dengan fallback aman ke `window.innerHeight` jika `window.visualViewport` tidak tersedia.

- [ ] **Step 4: Jalankan test hingga lulus**
Run: `pnpm vitest run src/hooks/useVisualViewport.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
Run: `git add src/hooks/useVisualViewport*; git commit -m "feat: add useVisualViewport hook for mobile keyboard"`

---

### Task 4: Pembaruan Logika Form `useBusInputForm.ts`

**Files:**
- Modify: `src/components/busCard/modal/useBusInputForm.ts`
- Modify: `src/components/busCard/BusInputModal.test.tsx`

**Interfaces:**
- Consumes:
  - `extractLeading3Digits`, `computeRealtimeDistance`, `computeLiveToaShift2` from Task 2.
- Produces:
  - Form state yang mengintegrasikan auto-prefill 3 digit untuk KM Akhir S1, KM Awal S2, KM Akhir S2.
  - Live distance object: `kmLiveS1`, `kmLiveS2`.
  - Live TOA S2 object: `toaLiveS2`.
  - Fungsi `handleCopyKmAkhir1ToAwal2()`.

- [ ] **Step 1: Tambahkan test kasus auto-prefill dan live distance**
Update `src/components/busCard/BusInputModal.test.tsx` untuk menguji:
1. Prefill 3 digit KM Akhir S1 saat KM Awal S1 terisi.
2. Tombol salin KM Akhir S1 ke KM Awal S2.
3. Live calculation selisih KM real-time.

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan fitur baru**
Run: `pnpm vitest run src/components/busCard/BusInputModal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasikan logika di useBusInputForm.ts**
Integrasikan utilitas odometer, auto-prefill pada inisialisasi state, dan live calculations.

- [ ] **Step 4: Jalankan test hingga lulus**
Run: `pnpm vitest run src/components/busCard/BusInputModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
Run: `git add src/components/busCard/modal/useBusInputForm.ts src/components/busCard/BusInputModal.test.tsx; git commit -m "feat: integrate 3-digit prefill and live diff in form"`

---

### Task 5: Redesign Komponen Header & Sticky Footer

**Files:**
- Modify: `src/components/busCard/modal/BusInputModalHeader.tsx`
- Modify: `src/components/busCard/modal/BusInputModalFooter.tsx`

**Interfaces:**
- Header: Badge nomor unit, Mode Label, Satset icon toggle, Tombol Close.
- Footer: Sticky layout, auto disable Simpan jika validasi error, touch target 48px.

- [ ] **Step 1: Perbarui styling dan tata letak BusInputModalHeader**
Terapkan desain mobile modern dengan kontras tinggi untuk Dark & Light mode.

- [ ] **Step 2: Perbarui styling dan tata letak BusInputModalFooter**
Pastikan footer sticky, memiliki target sentuh jempol (min-height 48px), dan menampilkan status validitas form.

- [ ] **Step 3: Uji komponen dengan vitest**
Run: `pnpm vitest run src/components/busCard/BusInputModal.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**
Run: `git add src/components/busCard/modal/BusInputModalHeader.tsx src/components/busCard/modal/BusInputModalFooter.tsx; git commit -m "feat(ui): redesign modal header and sticky footer"`

---

### Task 6: Redesign Tampilan Form Input Berdampingan & Indikator Live

**Files:**
- Modify: `src/components/busCard/modal/BusInputModalShift1.tsx`
- Modify: `src/components/busCard/modal/BusInputModalShift2.tsx`
- Modify: `src/components/busCard/modal/BusInputModalSingleFocus.tsx`
- Modify: `src/components/busCard/BusInputModal.tsx`

**Interfaces:**
- Shift 1: Layout `[TOA S1]` & `[KM Akhir S1]` berdampingan + Live Badge Selisih KM + Chip Toggle Manual & Keterangan.
- Shift 2: Layout `[TOTAL TOA]` & `[KM Akhir S2]` berdampingan + Live Badge TOA S2 + Live Badge Selisih KM + Chip Toggle Manual & Keterangan.
- Single Focus: Mendukung paket data shift yang sama dengan ergonomi keyboard-aware.
- BusInputModal: Mengintegrasikan `useVisualViewport` dan animasi modal peluncur Apple spring.

- [ ] **Step 1: Redesign BusInputModalShift1.tsx**
Pasang layout 2 kolom responsif untuk TOA S1 dan KM Akhir S1, serta tampilkan badge selisih KM real-time dengan warna dinamis (hijau/merah/kuning).

- [ ] **Step 2: Redesign BusInputModalShift2.tsx**
Pasang layout 2 kolom responsif untuk TOTAL TOA dan KM Akhir S2, sertakan badge live TOA S2 dan badge selisih KM S2.

- [ ] **Step 3: Redesign BusInputModalSingleFocus.tsx**
Sesuaikan mode fokus tunggal agar mengikuti format paket baru jika kategori shift dipilih.

- [ ] **Step 4: Integrasikan useVisualViewport pada BusInputModal.tsx**
Pasang style dinamis `maxHeight: \`min(\${viewportHeight - 20}px, 780px)\`` dan penanganan auto-scroll.

- [ ] **Step 5: Uji seluruh suite test bus card**
Run: `pnpm vitest run src/components/busCard/`
Expected: PASS 100%.

- [ ] **Step 6: Commit**
Run: `git add src/components/busCard/; git commit -m "feat(ui): complete bus input modal touch redesign"`

---

### Task 7: Verifikasi Menyeluruh & Quality Gates

**Files:**
- Run automated tests & TypeScript build across the repository.

- [ ] **Step 1: Jalankan semua unit test repositori**
Run: `pnpm vitest run src/`
Expected: Seluruh test pass 100%.

- [ ] **Step 2: Jalankan build TypeScript strict mode**
Run: `pnpm run build`
Expected: 0 errors, build selesai sukses.

- [ ] **Step 3: Update knowledge graph**
Run: `graphify update .` (jika tersedia).

- [ ] **Step 4: Buat laporan dokumentasi refactor di refactor-ss-pdo/**
Dokumentasikan siklus perbaikan UI ini ke dalam folder urutan berikutnya di `refactor-ss-pdo/` lengkap dengan `AUDIT_BUGS.md` dan `REPAIR_REPORT.md` sesuai aturan emas proyek.
