# Generator Laporan WhatsApp Format 3 (Status Armada Per Shift) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan fitur Generator Laporan WhatsApp Format 3 (Status Armada Per Shift) dengan format elegan "Executive Modern", validasi pemblokiran 100% konfirmasi 18 rute, dan snapshot persistensi status armada di Supabase.

**Architecture:** 
1. Database Supabase (`daily_route_reports`) menyimpan snapshot unit non-SGO (`fleet_status_shift1`, `fleet_status_shift2`) dan flag konfirmasi (`is_fleet_confirmed_s1`, `is_fleet_confirmed_s2`).
2. Generator text murni (`waReportGenerator.ts`) menyusun format WhatsApp monospace rapi dengan Executive Summary Wilayah di atas dan pemisahan unit kendala vs unit libur (OFF).
3. Modal `WaReportModal.tsx` menyediakan tombol Format 3, sub-toggle Shift 1/2 dengan pendeteksi waktu otomatis, dan pemblokiran ketat jika ada dari 18 rute yang belum mengonfirmasi status armada.

**Tech Stack:** React 19, TypeScript (Strict), Supabase Client, Lucide React, Vitest, Vite.

## Global Constraints
- **Branch:** `devmode` (Wajib, isolasi penuh).
- **Anti-Hardcoded String:** Seluruh teks antarmuka, judul, banner, dan template WA wajib dari `src/constants/texts/text_wa_report.ts`.
- **Quality Gates:** `pnpm vitest run src/` lulus 100%, `pnpm run build` lulus 0 error, `graphify update .` terbarui.
- **Strict Blocking Rule:** Format 3 wajib memblokir pembuatan/penyalinan laporan jika ada dari 18 rute yang belum mengonfirmasi status armada pada shift target.

---

### Task 1: Supabase Database Migration & Types

**Files:**
- Create: `supabase/migrations/20260910000003_add_fleet_status_snapshot.sql`
- Modify: `src/types/supabase.ts`

**Interfaces:**
- Produces: `FleetUnitStatusDetail`, updated `DailyRouteReport` with `fleet_status_shift1`, `fleet_status_shift2`, `is_fleet_confirmed_s1`, `is_fleet_confirmed_s2`, `fleet_confirmed_s1_at`, `fleet_confirmed_s2_at`.

- [ ] **Step 1: Buat migration SQL untuk kolom snapshot status armada**
  Tulis `supabase/migrations/20260910000003_add_fleet_status_snapshot.sql`:
  ```sql
  ALTER TABLE public.daily_route_reports
  ADD COLUMN IF NOT EXISTS fleet_status_shift1 jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS fleet_status_shift2 jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_fleet_confirmed_s1 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_fleet_confirmed_s2 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS fleet_confirmed_s1_at timestamptz,
  ADD COLUMN IF NOT EXISTS fleet_confirmed_s2_at timestamptz;
  ```

- [ ] **Step 2: Perbarui tipe TypeScript di `src/types/supabase.ts`**
  Tambahkan interface `FleetUnitStatusDetail` dan perbarui `DailyRouteReport`:
  ```typescript
  export interface FleetUnitStatusDetail {
    unit: string;
    note: string;
    isOff: boolean;
  }
  ```

- [ ] **Step 3: Commit Task 1**
  ```bash
  git add supabase/migrations/20260910000003_add_fleet_status_snapshot.sql src/types/supabase.ts
  git commit -m "feat: skema snapshot status armada di daily_route_reports"
  ```

---

### Task 2: Persistensi Snapshot Status Armada di Dashboard & Service

**Files:**
- Modify: `src/services/dailyRouteReportService.ts`
- Modify: `src/components/Dashboard.tsx`
- Test: `src/services/dailyRouteReportService.test.ts`

**Interfaces:**
- Consumes: `FleetUnitStatusDetail` dari `src/types/supabase.ts`
- Produces: `handleConfirmFleetStatus` yang menyimpan snapshot `fleet_status_shift{shift}` dan `is_fleet_confirmed_s{shift}` ke Supabase saat tombol konfirmasi ditekan.

- [ ] **Step 1: Tulis unit test untuk persistensi snapshot di `dailyRouteReportService.test.ts`**
  Uji bahwa `upsertDailyRouteReport` menerima dan meneruskan kolom snapshot dan flag konfirmasi ke Supabase client.

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan awal**
  Run: `pnpm vitest run src/services/dailyRouteReportService.test.ts`

- [ ] **Step 3: Implementasi snapshotting di `Dashboard.tsx` (`handleConfirmFleetStatus`)**
  Ekstrak unit non-SGO dari `unitMap`:
  ```typescript
  const nonSgoUnits: FleetUnitStatusDetail[] = [];
  for (const bus of busData || []) {
    const unitVal = unitMap.get(bus.rowIndex);
    const note = cleanShiftNote(shift === 1 ? unitVal?.s1 : unitVal?.s2);
    if (note) {
      nonSgoUnits.push({
        unit: bus.unit,
        note,
        isOff: note.toUpperCase().includes('OFF'),
      });
    }
  }
  ```
  Sertakan dalam payload `upsertDailyRouteReport`:
  - `fleet_status_shift1`: shift === 1 ? nonSgoUnits : undefined
  - `fleet_status_shift2`: shift === 2 ? nonSgoUnits : undefined
  - `is_fleet_confirmed_s1`: shift === 1 ? true : undefined
  - `is_fleet_confirmed_s2`: shift === 2 ? true : undefined
  - `fleet_confirmed_s1_at`: shift === 1 ? new Date().toISOString() : undefined
  - `fleet_confirmed_s2_at`: shift === 2 ? new Date().toISOString() : undefined

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**
  Run: `pnpm vitest run src/services/dailyRouteReportService.test.ts`

- [ ] **Step 5: Commit Task 2**
  ```bash
  git add src/services/dailyRouteReportService.ts src/components/Dashboard.tsx src/services/dailyRouteReportService.test.ts
  git commit -m "feat: persistensi snapshot status armada saat konfirmasi"
  ```

---

### Task 3: Kamus Teks Sentral WhatsApp Report (`text_wa_report.ts`)

**Files:**
- Modify: `src/constants/texts/text_wa_report.ts`
- Modify: `src/constants/texts/texts.test.ts`

**Interfaces:**
- Produces: `TEXT_WA_REPORT.FORMAT_3_BTN`, `TEXT_WA_REPORT.SHIFT_SELECTOR`, `TEXT_WA_REPORT.FORMAT_3_TEMPLATE`, `TEXT_WA_REPORT.BLOCKING_ALERT`.

- [ ] **Step 1: Tulis test di `src/constants/texts/texts.test.ts` untuk kamus baru**
  Verifikasi keberadaan teks tombol Format 3, label Shift 1/2, pesan blokir unconfirmed, dan template teks.

- [ ] **Step 2: Jalankan test untuk melihat kegagalan**
  Run: `pnpm vitest run src/constants/texts/texts.test.ts`

- [ ] **Step 3: Tambahkan definisi teks di `src/constants/texts/text_wa_report.ts`**
  - `FORMAT_3_BTN: 'Format 3 (Status Armada)'`
  - `SHIFT_1_BTN: '☀️ Shift 1 (Pagi)'`
  - `SHIFT_2_BTN: '🌙 Shift 2 (Siang)'`
  - `BLOCKING_TITLE: (shift: number) => `⚠️ Laporan Status Armada Shift ${shift} Belum Siap Dibuat``
  - `BLOCKING_DESC: (count: number, routes: string[]) => `Masih ada ${count} rute yang belum mengonfirmasi status armada: ${routes.join(', ')}. Harap pastikan seluruh rute terkonfirmasi terlebih dahulu.``
  - `FORMAT_3_HEADER: (day: string, date: string, shift: number, shiftName: string) => ...`
  - `FORMAT_3_CLOSING: '_Demikian laporan status kesiapan armada dibuat untuk diketahui pimpinan. Terima kasih._'`

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**
  Run: `pnpm vitest run src/constants/texts/texts.test.ts`

- [ ] **Step 5: Commit Task 3**
  ```bash
  git add src/constants/texts/text_wa_report.ts src/constants/texts/texts.test.ts
  git commit -m "feat: kamus teks sentral laporan WA format 3"
  ```

---

### Task 4: Logika Generator Laporan WA Format 3 (`waReportGenerator.ts`)

**Files:**
- Modify: `src/utils/waReportGenerator.ts`
- Create: `src/utils/waReportGenerator.test.ts`

**Interfaces:**
- Consumes: `RouteWaData`, `FleetUnitStatusDetail`
- Produces: `generateWaReportFormat3(dateStr, shift, routes, fleetSnapshotsMap)`

- [ ] **Step 1: Tulis unit test komprehensif di `src/utils/waReportGenerator.test.ts`**
  - Test 1: Menghasilkan format Executive Modern dengan ringkasan wilayah (SGO, Realisasi, Tidak Ops, Ketercapaian, Jumlah Lengkap vs Kurang).
  - Test 2: Pemetaan nama operator lengkap (`KOLAMAS (KLM)`, `KOPERASI WAHANA KALPIKA (KWK)`, dll).
  - Test 3: Rute dengan unit kendala menampilkan bullet list dan `TIDAK LENGKAP ✖️`.
  - Test 4: Rute dengan unit `OFF` memunculkan seksi `*Unit Libur (OFF):*`.
  - Test 5: Rute tanpa unit `OFF` tidak memunculkan seksi unit libur kosong.

- [ ] **Step 2: Jalankan test untuk melihat kegagalan**
  Run: `pnpm vitest run src/utils/waReportGenerator.test.ts`

- [ ] **Step 3: Implementasi `generateWaReportFormat3` di `src/utils/waReportGenerator.ts`**
  - Implementasikan helper `getOperatorFullName(op: string)`.
  - Hitung total SGO, Realisasi, Tidak Ops wilayah untuk shift target.
  - Susun string WhatsApp sesuai spesifikasi `docs/superpowers/specs/2026-09-10-fleet-status-wa-report-design.md`.

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan 100%**
  Run: `pnpm vitest run src/utils/waReportGenerator.test.ts`

- [ ] **Step 5: Commit Task 4**
  ```bash
  git add src/utils/waReportGenerator.ts src/utils/waReportGenerator.test.ts
  git commit -m "feat: generator teks WA format 3 executive modern"
  ```

---

### Task 5: Integrasi UI & Validasi Pemblokiran di `WaReportModal.tsx`

**Files:**
- Modify: `src/components/WaReportModal.tsx`
- Modify: `src/services/allRouteMonitoringService.ts`
- Test: `src/components/WaReportModal.test.tsx`

**Interfaces:**
- Consumes: `generateWaReportFormat3`, `fetchRegionalMonitoringData`
- Produces: Tampilan modal terintegrasi dengan pemblokiran jika rute belum 100% konfirmasi status armada.

- [ ] **Step 1: Tulis unit test di `WaReportModal.test.tsx`**
  - Uji tombol Format 3 muncul dan dapat dipilih.
  - Uji sub-selector Shift 1 dan Shift 2 muncul hanya saat Format 3 aktif.
  - Uji jika ada rute unconfirmed, muncul kotak peringatan blokir dan tombol Salin/Kirim WA dinonaktifkan.
  - Uji jika seluruh rute terkonfirmasi, pratinjau teks muncul dan tombol aktif.

- [ ] **Step 2: Jalankan test untuk melihat kegagalan**
  Run: `pnpm vitest run src/components/WaReportModal.test.tsx`

- [ ] **Step 3: Implementasikan UI di `WaReportModal.tsx`**
  - Tambahkan state `formatType === 'format3'` dan `selectedShift: 1 | 2` (default berdasarkan jam lokal).
  - Cek kelengkapan konfirmasi 18 rute untuk shift terpilih:
    ```typescript
    const unconfirmedRoutes = routes.filter(
      (r) => !(selectedShift === 1 ? r.isFleetConfirmedS1 : r.isFleetConfirmedS2)
    );
    const isFormat3Blocked = formatType === 'format3' && unconfirmedRoutes.length > 0;
    ```
  - Jika `isFormat3Blocked`, render warning banner dan disable action buttons.

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**
  Run: `pnpm vitest run src/components/WaReportModal.test.tsx`

- [ ] **Step 5: Commit Task 5**
  ```bash
  git add src/components/WaReportModal.tsx src/services/allRouteMonitoringService.ts src/components/WaReportModal.test.tsx
  git commit -m "feat: kontrol format 3 dan validasi blokir di WaReportModal"
  ```

---

### Task 6: Quality Gates & Verifikasi Menyeluruh

- [ ] **Step 1: Jalankan seluruh test suite**
  Run: `pnpm vitest run src/`
  Expected: Seluruh unit test lulus 100% tanpa error.

- [ ] **Step 2: Jalankan build produksi**
  Run: `pnpm run build`
  Expected: `tsc -b && vite build` lulus 0 error.

- [ ] **Step 3: Update knowledge graph**
  Run: `graphify update .`
  Expected: Graf pengetahuan terbarukan.

- [ ] **Step 4: Final commit & Walkthrough update**
  ```bash
  git add .
  git commit -m "chore: final quality gates passed untuk format 3 WA"
  ```
