# Rencana Implementasi: Overhaul Alur Sumber Data Status Armada, Laporan A2, dan Resolusi Data Wilayah

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun arsitektur status armada multi-sumber baru dengan hierarki 3 jalur (Laporan A2 Petugas PDO -> Otomatis Ritase Spreadsheet -> Input Cepat Korlap/Korwil), menerapkan prinsip realops kumulatif harian, menyembunyikan form laporan lama, dan mengintegrasikannya ke Generator WA Format 3.

**Architecture:** Mengadopsi *Unified Fleet Shift Model* di Supabase (`daily_fleet_shifts` & `daily_fleet_non_sgo_units`) dengan penanda `source_type`. Mesin resolusi data murni (`fleetResolutionService`) mengevaluasi status per rute secara deterministik. UI Form A2 baru dibuat mandiri dengan kemampuan prefill dari keterangan spreadsheet serta kontrol edit/tambah/hapus unit, dan shortcut override darurat disediakan langsung di dalam modal WA Format 3 dan tab Monitoring.

**Tech Stack:** React 19, TypeScript (Strict), Supabase (PostgreSQL), Vite, Vitest, Lucide React, SweetAlert2.

## Global Constraints

- Wajib beroperasi di branch `devmode`. Dilarang menyentuh branch `main`/`production`.
- Selalu gunakan `pnpm` (dilarang `npm`/`yarn`).
- Seluruh teks UI wajib menggunakan kamus sentral `src/constants/texts/` (dilarang hardcoded UI string).
- Dilarang merusak atau menghapus file fisik `RouteOperationalReportCard.tsx`, cukup sembunyikan akses dan tampilannya dari pengguna.
- Parsing angka spreadsheet wajib menggunakan `parseIndonesianNumber()`.
- Quality gates: `pnpm vitest run src/` lulus 100%, `pnpm run build` lulus 0 error.

---

### Task 1: Skema Database & Service Layer Mesin Resolusi Data

**Files:**
- Create: `supabase/migrations/20261011000001_add_source_type_to_daily_fleet_shifts.sql`
- Modify: `src/types/supabase.ts:194-227`
- Create: `src/services/fleetResolutionService.ts`
- Create: `src/services/fleetResolutionService.test.ts`
- Modify: `src/services/fleetStatusService.ts:90-158`

**Interfaces:**
- Produces:
  ```ts
  export type FleetSourceType = 'pdo_a2' | 'spreadsheet_auto' | 'korlap_manual';
  export interface ResolvedRouteFleetStatus {
    routeId: number;
    routeCode: string;
    shift: 1 | 2;
    targetRenops: number;
    realops: number;
    sourceType: FleetSourceType | 'empty';
    sourceLabel: string;
    isComplete: boolean;
    nonSgoUnits: Array<{ unit_body: string; status_code: string; note: string }>;
    submittedBy?: string;
    confirmedAt?: string;
  }
  export function resolveRouteFleetStatus(
    route: { id: number; route_code: string; default_renops?: number },
    date: string,
    shift: 1 | 2,
    dbShift: DailyFleetShiftWithUnits | null | undefined,
    sheetBuses: BusData[] | null | undefined,
    previousShiftRealops?: number
  ): ResolvedRouteFleetStatus;
  ```

- [ ] **Step 1: Buat migration SQL penambahan kolom metadata sumber**

File: `supabase/migrations/20261011000001_add_source_type_to_daily_fleet_shifts.sql`
```sql
-- Tambah metadata source_type dan submitted_by_role pada daily_fleet_shifts
ALTER TABLE public.daily_fleet_shifts
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'pdo_a2',
ADD COLUMN IF NOT EXISTS submitted_by_role text DEFAULT 'pdo';

COMMENT ON COLUMN public.daily_fleet_shifts.source_type IS 'Sumber penetapan data: pdo_a2, spreadsheet_auto, korlap_manual';
COMMENT ON COLUMN public.daily_fleet_shifts.submitted_by_role IS 'Peran penginput: pdo, korlap, korwil, system';
```

- [ ] **Step 2: Update definisi TypeScript `DailyFleetShift`**

File: `src/types/supabase.ts`
Tambahkan properti:
```ts
export type FleetSourceType = 'pdo_a2' | 'spreadsheet_auto' | 'korlap_manual';

export interface DailyFleetShift {
  // ... field eksisting ...
  source_type?: FleetSourceType;
  submitted_by_role?: 'pdo' | 'korlap' | 'korwil' | 'system';
}
```

- [ ] **Step 3: Tulis unit test untuk `fleetResolutionService` (TDD)**

File: `src/services/fleetResolutionService.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { resolveRouteFleetStatus } from './fleetResolutionService';
import type { DailyFleetShiftWithUnits } from '../types/supabase';
import type { BusData } from './googleSheets';

describe('fleetResolutionService - resolveRouteFleetStatus', () => {
  const mockRoute = { id: 1, route_code: 'JAK.15', default_renops: 30 };
  const mockDate = '2026-10-11';

  it('Prioritas 1: Menggunakan Laporan A2 jika tersedia di DB', () => {
    const dbShift: DailyFleetShiftWithUnits = {
      id: 10,
      route_id: 1,
      route_code: 'JAK.15',
      date: mockDate,
      shift: 1,
      target_renops: 30,
      realops: 28,
      total_units: 30,
      sgo_count: 28,
      to_count: 1,
      off_count: 1,
      so_count: 0,
      other_count: 0,
      is_confirmed: true,
      source_type: 'pdo_a2',
      non_sgo_units: [{ id: 1, fleet_shift_id: 10, unit_body: 'TS.01', status_id: 2, status_code: 'TO', note: 'EVDAL', created_at: '' }],
    };

    const res = resolveRouteFleetStatus(mockRoute, mockDate, 1, dbShift, null);
    expect(res.sourceType).toBe('pdo_a2');
    expect(res.isComplete).toBe(true);
    expect(res.realops).toBe(28);
    expect(res.nonSgoUnits).toHaveLength(1);
  });

  it('Prioritas 2: Fallback otomatis menghitung unit ritase > 0 dari spreadsheet jika DB kosong', () => {
    const mockBuses: Partial<BusData>[] = [
      { rowIndex: 2, unit: 'TS.01', tripPergi: '3', tripPulang: '3', keterangan: '' },
      { rowIndex: 3, unit: 'TS.02', tripPergi: '4', tripPulang: '4', keterangan: 'BA.01 Radiator' },
      { rowIndex: 4, unit: 'TS.03', tripPergi: '0', tripPulang: '0', keterangan: 'OFF' },
      { rowIndex: 5, unit: 'TS.04', tripPergi: '', tripPulang: '', keterangan: '' },
    ];

    const res = resolveRouteFleetStatus(mockRoute, mockDate, 1, null, mockBuses as BusData[]);
    expect(res.sourceType).toBe('spreadsheet_auto');
    expect(res.isComplete).toBe(true);
    expect(res.realops).toBe(2); // TS.01 dan TS.02 memiliki trip > 0
    expect(res.targetRenops).toBe(30);
    expect(res.nonSgoUnits.some(u => u.unit_body === 'TS.02' && u.note.includes('Radiator'))).toBe(true);
  });

  it('Prioritas 3: Menandai status empty jika DB kosong dan spreadsheet tidak memiliki ritase', () => {
    const res = resolveRouteFleetStatus(mockRoute, mockDate, 1, null, []);
    expect(res.sourceType).toBe('empty');
    expect(res.isComplete).toBe(false);
    expect(res.realops).toBe(0);
  });

  it('Aturan Kumulatif Harian: Realops Shift 2 tidak boleh berkurang dari Shift 1', () => {
    const mockBusesS2: Partial<BusData>[] = [
      { rowIndex: 2, unit: 'TS.01', tripPergi: '0', tripPulang: '0', keterangan: 'Mogok' },
    ];
    // Shift 1 sebelumnya mencatat 27 unit
    const res = resolveRouteFleetStatus(mockRoute, mockDate, 2, null, mockBusesS2 as BusData[], 27);
    expect(res.realops).toBe(27); // Menjaga nilai minimal Realops Shift 1
  });
});
```

- [ ] **Step 4: Jalankan test untuk memverifikasi kegagalan awal**

Command:
```bash
pnpm vitest run src/services/fleetResolutionService.test.ts
```
Expected: FAIL karena modul belum dibuat.

- [ ] **Step 5: Implementasikan `src/services/fleetResolutionService.ts`**

File: `src/services/fleetResolutionService.ts`
Implementasikan fungsi `resolveRouteFleetStatus` dengan logika prioritas 3 jalur dan penegakan kumulatif harian.

- [ ] **Step 6: Jalankan test ulang untuk memastikan PASS**

Command:
```bash
pnpm vitest run src/services/fleetResolutionService.test.ts
```
Expected: PASS.

- [ ] **Step 7: Commit perubahan Task 1**

```bash
git add supabase/migrations/20261011000001_add_source_type_to_daily_fleet_shifts.sql src/types/supabase.ts src/services/fleetResolutionService.ts src/services/fleetResolutionService.test.ts
git commit -m "feat: add fleet resolution service"
```

---

### Task 2: Penyembunyian Komponen Lama `RouteOperationalReportCard.tsx`

**Files:**
- Modify: `src/components/dashboard/DashboardHeader.tsx:34-37,178-197`
- Modify: `src/components/RouteSelectorCard.tsx:40-65,115-140`
- Modify: `src/components/Dashboard.tsx:348-360`
- Modify: `src/components/dashboard/DashboardModals.tsx:110-132`

**Interfaces:**
- File `RouteOperationalReportCard.tsx` tetap ada, tetapi prop `onOpenReportModal` dinonaktifkan/disembunyikan dari UI pengguna.

- [ ] **Step 1: Sembunyikan tombol pembuka laporan operasional di `RouteSelectorCard.tsx`**

Beri flag conditional rendering atau sembunyikan tombol `[ Laporan ▾ ]` pada segmen kanan selector rute agar user tidak lagi melihat/mengakses form lama.

- [ ] **Step 2: Nonaktifkan modal rendering `RouteOperationalReportCard` di `DashboardModals.tsx`**

Bungkus pemanggilan `RouteOperationalReportCard` dengan komentar atau conditional `false` (misal `/* feature-flag: hidden until fixed */`), tanpa menghapus kodenya.

- [ ] **Step 3: Jalankan seluruh test dashboard untuk memverifikasi tidak ada regresi**

Command:
```bash
pnpm vitest run src/components/dashboard/
```
Expected: PASS 100%.

- [ ] **Step 4: Commit perubahan Task 2**

```bash
git add src/components/dashboard/DashboardHeader.tsx src/components/RouteSelectorCard.tsx src/components/dashboard/DashboardModals.tsx
git commit -m "refactor: hide legacy report modal"
```

---

### Task 3: Pembuatan Form Laporan A2 Mandiri Petugas PDO (`A2ReportModal.tsx`)

**Files:**
- Create: `src/components/pdoReport/A2ReportModal.tsx`
- Create: `src/components/pdoReport/A2ReportModal.test.tsx`
- Modify: `src/constants/texts/text_pdo_form.ts`
- Modify: `src/constants/texts/texts.test.ts`
- Modify: `src/components/dashboard/DashboardModals.tsx`

**Interfaces:**
- Produces:
  ```ts
  export interface A2ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    routeId: number;
    routeCode: string;
    selectedDate: string;
    defaultRenops: number;
    buses: BusData[] | null;
    initialShift?: 1 | 2;
    onSaveSuccess?: () => void;
  }
  export const A2ReportModal: React.FC<A2ReportModalProps>;
  ```

- [ ] **Step 1: Tambahkan kamus teks antarmuka Form A2 pada `src/constants/texts/text_pdo_form.ts`**

Tambahkan konstanta:
- `A2_MODAL_TITLE`: `"Laporan Harian A2 Armada"`
- `RENOPS_TARGET_LABEL`: `"Target Renops (Unit)"`
- `REALOPS_LABEL`: `"Realisasi Operasi (Realops)"`
- `NOTES_SECTION_TITLE`: `"Daftar Unit Berkendala / Catatan Khusus"`
- `PREFILL_BANNER`: `"Draft ditarik otomatis dari keterangan spreadsheet rute."`
- `ADD_UNIT_BTN`: `"+ Tambah Catatan Unit"`
- `SUBMIT_BTN`: `(shift: number) => "Kirim Laporan A2 Shift " + shift`

- [ ] **Step 2: Tulis unit test untuk `A2ReportModal` (TDD)**

File: `src/components/pdoReport/A2ReportModal.test.tsx`
Verifikasi:
1. Menampilkan header rute, tanggal, dan shift.
2. Melakukan prefill otomatis unit yang memiliki keterangan di spreadsheet.
3. Mengizinkan user mengedit catatan dan menghapus unit dari list.
4. Mengizinkan user menambah unit baru secara manual.
5. Memanggil fungsi simpan `upsertDailyFleetShift` dengan `source_type = 'pdo_a2'`.

- [ ] **Step 3: Implementasikan `src/components/pdoReport/A2ReportModal.tsx`**

Bangun antarmuka modal elegan (Glassmorphism, Mobile-First, Light/Dark theme support) yang mengakomodasi Opsi C: prefill dari spreadsheet + kontrol edit/hapus/tambah manual.

- [ ] **Step 4: Sambungkan tombol pembuka Laporan A2 pada Dashboard**

Gantikan tombol pemicu lama dengan pemicu `A2ReportModal`.

- [ ] **Step 5: Jalankan unit test `A2ReportModal`**

Command:
```bash
pnpm vitest run src/components/pdoReport/A2ReportModal.test.tsx
```
Expected: PASS.

- [ ] **Step 6: Commit perubahan Task 3**

```bash
git add src/constants/texts/text_pdo_form.ts src/constants/texts/texts.test.ts src/components/pdoReport/A2ReportModal.tsx src/components/pdoReport/A2ReportModal.test.tsx src/components/dashboard/DashboardModals.tsx
git commit -m "feat: add A2 report modal for PDO"
```

---

### Task 4: Komponen Input Cepat Korlap/Korwil (Jalur 3 - Opsi 3 Terpadu)

**Files:**
- Create: `src/components/fleetStatus/QuickKorlapFleetModal.tsx`
- Create: `src/components/fleetStatus/QuickKorlapFleetModal.test.tsx`
- Modify: `src/components/waReport/WaReportModal.tsx`
- Modify: `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx`

**Interfaces:**
- Produces:
  ```ts
  export interface QuickKorlapFleetModalProps {
    isOpen: boolean;
    onClose: () => void;
    routeId: number;
    routeCode: string;
    selectedDate: string;
    shift: 1 | 2;
    defaultRenops?: number;
    initialRealops?: number;
    onSaveSuccess: () => void;
  }
  export const QuickKorlapFleetModal: React.FC<QuickKorlapFleetModalProps>;
  ```

- [ ] **Step 1: Tulis unit test untuk `QuickKorlapFleetModal`**

File: `src/components/fleetStatus/QuickKorlapFleetModal.test.tsx`
Test mencakup:
1. Render form input ringkas (Renops, Realops, dan Catatan Unit opsional).
2. Simpan memanggil `upsertDailyFleetShift` dengan `source_type = 'korlap_manual'` dan `submitted_by_role = 'korlap'`.
3. Memanggil callback `onSaveSuccess`.

- [ ] **Step 2: Implementasikan `src/components/fleetStatus/QuickKorlapFleetModal.tsx`**

Dialog ringkas & cepat (touch-friendly) untuk input darurat Korlap/Korwil.

- [ ] **Step 3: Tambahkan shortcut tombol di dalam `WaReportModal.tsx`**

Pada daftar rute yang belum memiliki data di modal WA Format 3, tambahkan tombol `[ + Isi Data Rute ]` yang membuka `QuickKorlapFleetModal`.

- [ ] **Step 4: Tambahkan shortcut tombol di `MonitoringFleetStatusTab.tsx`**

Pada kartu rute yang belum lengkap di tab Status Armada Monitoring, sertakan tombol `[ Input Data Korlap ]`.

- [ ] **Step 5: Jalankan test unit Task 4**

Command:
```bash
pnpm vitest run src/components/fleetStatus/QuickKorlapFleetModal.test.tsx src/components/waReport/
```
Expected: PASS.

- [ ] **Step 6: Commit perubahan Task 4**

```bash
git add src/components/fleetStatus/QuickKorlapFleetModal.tsx src/components/fleetStatus/QuickKorlapFleetModal.test.tsx src/components/waReport/WaReportModal.tsx src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx
git commit -m "feat: add quick korlap fleet override"
```

---

### Task 5: Integrasi Mesin Resolusi Data ke Generator Laporan WA Format 3

**Files:**
- Modify: `src/components/waReport/useWaReportData.ts:40-160`
- Modify: `src/utils/waReportGenerator.ts:256-340`
- Modify: `src/utils/waReportGenerator.test.ts`
- Modify: `src/components/waReport/WaReportModal.test.tsx`

**Interfaces:**
- Generator WA Format 3 membaca output dari `resolveRouteFleetStatus` untuk ke-18 rute.
- Jika ada unit baru yang aktif di Shift 2 (tidak aktif di Shift 1), diformat sebagai unit pelengkap renops/telat start.
- Pemblokiran tombol salin dilepas jika ke-18 rute telah terselesaikan (baik via A2, SS otomatis, atau input Korlap).

- [ ] **Step 1: Update test `waReportGenerator.test.ts` untuk aturan pelengkap Shift 2**

Tambahkan uji format unit pelengkap di Shift 2.

- [ ] **Step 2: Sambungkan `useWaReportData.ts` dengan `resolveRouteFleetStatus`**

Gantikan pembacaan mentah lama dengan pemanggilan mesin resolusi data.

- [ ] **Step 3: Jalankan seluruh test WA report**

Command:
```bash
pnpm vitest run src/utils/waReportGenerator.test.ts src/components/waReport/
```
Expected: PASS.

- [ ] **Step 4: Commit perubahan Task 5**

```bash
git add src/components/waReport/useWaReportData.ts src/utils/waReportGenerator.ts src/utils/waReportGenerator.test.ts src/components/waReport/WaReportModal.test.tsx
git commit -m "feat: integrate resolution engine to WA format 3"
```

---

### Task 6: Quality Gates & Verifikasi Regresi Menyeluruh

**Files:**
- Seluruh file proyek

- [ ] **Step 1: Jalankan seluruh unit test suite**

Command:
```bash
pnpm vitest run src/
```
Expected: 100% PASS (0 failures).

- [ ] **Step 2: Jalankan build TypeScript strict mode**

Command:
```bash
pnpm run build
```
Expected: Vite build & tsc -b PASS dengan 0 error.

- [ ] **Step 3: Perbarui graf pengetahuan Graphify**

Command:
```bash
graphify update .
```
Expected: Knowledge graph up-to-date.

- [ ] **Step 4: Commit final verifikasi**

```bash
git commit --allow-empty -m "chore: verify quality gates pass"
```
