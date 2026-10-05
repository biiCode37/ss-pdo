# Regional Monitoring & WA Report Generator v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memodernisasi arsitektur pemantauan wilayah 18 rute dan generator laporan WhatsApp dinas melalui pengayaan tabel database Supabase, pembacaan Spreadsheet Global Wilayah secara hibrida (1-hit fast-lane), serta standarisasi tipografi WhatsApp yang elegan, rapi, dan presisi di ponsel.

**Architecture:** Memperkaya `public.daily_route_reports` dengan 8 kolom metrik capaian (1 rute = 1 baris per tanggal), membuat parser khusus `globalReportReader.ts` untuk menarik data 18 rute sekaligus dalam 1 panggilan API, mengoptimasi service agregasi wilayah, dan memperbarui generator teks WhatsApp dengan tipografi monospace columnar alignment tanpa tabulasi liar (`\t`).

**Tech Stack:** React 19, TypeScript Strict Mode, Vite, Supabase Postgres, Google Sheets API v4, Vitest, Happy-DOM, Centralized Text Dictionary.

## Global Constraints
- Wajib bekerja di branch `devmode`. Dilarang menyentuh `main`/`master`/`production`.
- Zero hardcoded strings: seluruh teks antarmuka wajib di `src/constants/texts/`.
- Single Source of Truth (SSOT): parsing angka spreadsheet wajib menggunakan `parseIndonesianNumber()` dari `@/utils/numberUtils`.
- Quality Gates wajib 100%: Vitest pass, `pnpm run build` lulus 0 error, dan `graphify update .`.
- Dokumentasi resmi disimpan di `refactor-ss-pdo/refact_61/`.

---

### Task 1: Database Migration & TypeScript Schema Layer

**Files:**
- Create: `supabase/migrations/20260914000001_add_daily_route_reports_metrics.sql`
- Modify: `src/types/supabase.ts:41-65`
- Test: `src/services/dailyRouteReportService.test.ts`

**Interfaces:**
- Produces: Kolom metrik capaian di `DailyRouteReport`:
  - `toa_shift1?: number;`
  - `manual_shift1?: number;`
  - `toa_shift2?: number;`
  - `manual_shift2?: number;`
  - `total_passengers?: number;`
  - `total_km?: number;`
  - `achievement_km?: number;`
  - `total_trip?: number;`
  - `last_synced_at?: string;`

- [ ] **Step 1: Tulis berkas migrasi SQL Supabase**

Buat `supabase/migrations/20260914000001_add_daily_route_reports_metrics.sql`:
```sql
-- Migration: Add operational metrics columns to daily_route_reports
ALTER TABLE public.daily_route_reports
ADD COLUMN IF NOT EXISTS toa_shift1 integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS manual_shift1 integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS toa_shift2 integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS manual_shift2 integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_passengers integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_km numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS achievement_km numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_trip integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_synced_at timestamptz DEFAULT now();

COMMENT ON COLUMN public.daily_route_reports.toa_shift1 IS 'Jumlah penumpang tiket elektronik TOA shift 1';
COMMENT ON COLUMN public.daily_route_reports.manual_shift1 IS 'Jumlah penumpang tiket manual shift 1';
COMMENT ON COLUMN public.daily_route_reports.toa_shift2 IS 'Jumlah penumpang tiket elektronik TOA shift 2';
COMMENT ON COLUMN public.daily_route_reports.manual_shift2 IS 'Jumlah penumpang tiket manual shift 2';
COMMENT ON COLUMN public.daily_route_reports.total_passengers IS 'Total akumulasi seluruh penumpang harian rute';
COMMENT ON COLUMN public.daily_route_reports.total_km IS 'Total akumulasi kilometer tempuh seluruh armada rute';
COMMENT ON COLUMN public.daily_route_reports.achievement_km IS 'Pencapaian kilometer rata-rata per bus (total_km / realops)';
COMMENT ON COLUMN public.daily_route_reports.total_trip IS 'Total ritase operasional rute harian';
COMMENT ON COLUMN public.daily_route_reports.last_synced_at IS 'Waktu timestamp terakhir sinkronisasi dari spreadsheet';
```

- [ ] **Step 2: Update TypeScript Interface `DailyRouteReport`**

Perbarui `src/types/supabase.ts`:
```typescript
export interface DailyRouteReport {
  id?: number;
  route_id: number;
  route_code: string;
  date: string; // YYYY-MM-DD
  renops_shift1: number;
  realops_shift1: number;
  renops_shift2: number;
  realops_shift2: number;
  headway_fastest: number;
  headway_slowest: number;
  traffic_jam_spots: string[];
  operational_issues?: string;
  status: 'draft' | 'submitted' | 'verified';
  submitted_by?: string;
  verified_by?: string;
  fleet_status_shift1?: FleetUnitStatusDetail[];
  fleet_status_shift2?: FleetUnitStatusDetail[];
  is_fleet_confirmed_s1?: boolean;
  is_fleet_confirmed_s2?: boolean;
  fleet_confirmed_s1_at?: string;
  fleet_confirmed_s2_at?: string;
  // Kolom metrik capaian baru
  toa_shift1?: number;
  manual_shift1?: number;
  toa_shift2?: number;
  manual_shift2?: number;
  total_passengers?: number;
  total_km?: number;
  achievement_km?: number;
  total_trip?: number;
  last_synced_at?: string;
  created_at?: string;
  updated_at?: string;
}
```

- [ ] **Step 3: Jalankan verifikasi TypeScript**

Run: `pnpm dlx tsc --noEmit`
Expected: PASS 0 error.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260914000001_add_daily_route_reports_metrics.sql src/types/supabase.ts
git commit -m "feat: tambah metrik capaian daily route reports"
```

---

### Task 2: Global Spreadsheet Reader Service

**Files:**
- Create: `src/services/googleSheets/globalReportReader.ts`
- Create: `src/services/googleSheets/globalReportReader.test.ts`
- Modify: `src/services/googleSheets/index.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface GlobalRouteDailyMetrics {
    routeCode: string;
    renops: number;
    realops: number;
    kmTempuh: number;
    toaShift1: number;
    manualShift1: number;
    totalShift1: number;
    toaShift2: number;
    manualShift2: number;
    totalShift2: number;
    totalPassengers: number;
    kmPerBus: number;
    targetPassengers: number;
    percentage: number;
    totalRitase?: number;
  }
  export function parseGlobalSheetDateBlock(
    rows: any[][],
    targetDay: number
  ): Map<string, GlobalRouteDailyMetrics>;
  ```

- [ ] **Step 1: Tulis unit test untuk parser tabel global 27-baris**

Buat `src/services/googleSheets/globalReportReader.test.ts` dengan mock data baris spreadsheet global (header baris 29, data JAK 01 s.d. JAK 120).

- [ ] **Step 2: Jalankan test untuk memastikan failing**

Run: `pnpm vitest run src/services/googleSheets/globalReportReader.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implementasikan `globalReportReader.ts`**

Buat fungsi `parseGlobalSheetDateBlock` yang mencari baris tanggal target, membaca blok rute kiri (JAK 01–JAK 90) dan rute kanan (JAK 110A–JAK 120), mem-parsing setiap cell dengan `parseIndonesianNumber()`, dan mengembalikan mapping rute.

- [ ] **Step 4: Jalankan test untuk memastikan passing**

Run: `pnpm vitest run src/services/googleSheets/globalReportReader.test.ts`
Expected: PASS 100%.

- [ ] **Step 5: Export dari `src/services/googleSheets/index.ts` dan Commit**

```bash
git add src/services/googleSheets/globalReportReader.ts src/services/googleSheets/globalReportReader.test.ts src/services/googleSheets/index.ts
git commit -m "feat: parser spreadsheet global wilayah 18 rute"
```

---

### Task 3: Service Layer & Sync Adapter

**Files:**
- Modify: `src/services/dailyRouteReportService.ts`
- Modify: `src/services/allRouteMonitoringService.ts`
- Modify: `src/services/allRouteMonitoringService.test.ts`

**Interfaces:**
- Produces:
  - `syncRouteMetricsToReport(routeId: number, date: string, metrics: Partial<DailyRouteReport>): Promise<void>`
  - `batchSyncGlobalReports(dateStr: string, spreadsheetId: string, sheetName: string): Promise<number>`
  - `fetchRegionalMonitoringData(dateStr: string): Promise<RegionalMonitoringResult>` (membaca langsung dari `daily_route_reports`)

- [ ] **Step 1: Tulis failing test di `allRouteMonitoringService.test.ts`**

Tambahkan pengujian bahwa `fetchRegionalMonitoringData` memprioritaskan membaca data capaian dari `daily_route_reports` (18 rute).

- [ ] **Step 2: Verifikasi test gagal**

Run: `pnpm vitest run src/services/allRouteMonitoringService.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasikan pengayaan fungsi service**

Perbarui `allRouteMonitoringService.ts` untuk menggunakan data `daily_route_reports` jika kolom metrik sudah terisi, dan menyediakan `syncRouteMetricsToReport` serta `batchSyncGlobalReports`.

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

Run: `pnpm vitest run src/services/allRouteMonitoringService.test.ts`
Expected: PASS 100%.

- [ ] **Step 5: Commit**

```bash
git add src/services/dailyRouteReportService.ts src/services/allRouteMonitoringService.ts src/services/allRouteMonitoringService.test.ts
git commit -m "feat: optimasi service monitoring via route reports"
```

---

### Task 4: Template Generator WhatsApp Elegan & Profesional

**Files:**
- Modify: `src/utils/waReportGenerator.ts`
- Modify: `src/constants/texts/text_wa_report.ts`
- Modify: `src/utils/waReportGenerator.test.ts`
- Modify: `src/constants/texts/texts.test.ts`

**Interfaces:**
- Produces:
  - `generateWaReportFormat1(dateStr: string, routes: RouteWaData[]): string` (Monospace columnar, tanpa `\t`)
  - `generateWaReportFormat2(dateStr: string, routes: RouteWaData[], totals: RegionTotals): string` (Format TOM + MANUAL = JUMLAH, rincian shift wilayah)
  - `generateWaReportFormat3(dateStr: string, shift: 1 | 2, routes: RouteFleetReportItem[]): string` (Target SGO, Realisasi, Tidak Ops, kendala bernomor, blok DATA UNIT LIBUR OFF)

- [ ] **Step 1: Perbarui unit test `waReportGenerator.test.ts` dengan format baru**

Pastikan pengujian memverifikasi tidak ada karakter `\t` dan format blok monospace ``` sesuai spesifikasi.

- [ ] **Step 2: Jalankan test untuk memverifikasi failing**

Run: `pnpm vitest run src/utils/waReportGenerator.test.ts`
Expected: FAIL.

- [ ] **Step 3: Refactor generator fungsi di `waReportGenerator.ts` & kamus teks**

Implementasikan formatting monospace yang rapi dan elegan, dengan padding rata kanan/kiri proporsional.

- [ ] **Step 4: Jalankan test untuk memverifikasi passing**

Run: `pnpm vitest run src/utils/waReportGenerator.test.ts src/constants/texts/texts.test.ts`
Expected: PASS 100%.

- [ ] **Step 5: Commit**

```bash
git add src/utils/waReportGenerator.ts src/utils/waReportGenerator.test.ts src/constants/texts/text_wa_report.ts src/constants/texts/texts.test.ts
git commit -m "feat: generator wa format dinas elegan anti pecah"
```

---

### Task 5: UI Monitoring Wilayah & Modal WhatsApp

**Files:**
- Modify: `src/components/monitoring/AllRouteMonitoringPage.tsx`
- Modify: `src/components/waReport/WaReportModal.tsx`
- Modify: `src/constants/texts/text_monitoring.ts`
- Modify: `src/constants/texts/texts.test.ts`

- [ ] **Step 1: Tambahkan tombol "Sinkronkan Ulang 18 Rute" di `AllRouteMonitoringPage.tsx`**

Tambahkan tombol aksi sinkronisasi dengan icon refresh/sync, status loading, dan toast notifikasi sukses/gagal.

- [ ] **Step 2: Hubungkan opsi format baru ke `WaReportModal.tsx`**

Pastikan modal menampilkan pratinjau teks yang rapi dan tombol salin / buka WhatsApp berfungsi mulus.

- [ ] **Step 3: Verifikasi di unit test**

Run: `pnpm vitest run src/components/monitoring/ src/components/waReport/`
Expected: PASS 100%.

- [ ] **Step 4: Commit**

```bash
git add src/components/monitoring/ src/components/waReport/ src/constants/texts/text_monitoring.ts src/constants/texts/texts.test.ts
git commit -m "feat: tombol sinkronisasi massal dan modal wa v2"
```

---

### Task 6: Quality Gates & Dokumentasi Audit

**Files:**
- Create: `refactor-ss-pdo/refact_61/AUDIT_BUGS.md`
- Create: `refactor-ss-pdo/refact_61/REPAIR_REPORT.md`

- [ ] **Step 1: Jalankan seluruh pengujian unit proyek**

Run: `pnpm vitest run src/`
Expected: 54+ test files passed (100%).

- [ ] **Step 2: Jalankan build produksi TypeScript & Vite**

Run: `pnpm run build`
Expected: `tsc -b && vite build` lulus 0 error.

- [ ] **Step 3: Update Graphify Knowledge Graph**

Run: `graphify update .`
Expected: Graph updated.

- [ ] **Step 4: Tulis dokumentasi audit `refact_61`**

Dokumentasikan temuan, Before vs After, dan Case Lapangan di `refactor-ss-pdo/refact_61/`.

- [ ] **Step 5: Commit akhir**

```bash
git add refactor-ss-pdo/refact_61/ graphify-out/
git commit -m "docs: audit report refact 61 monitoring wa v2"
```
