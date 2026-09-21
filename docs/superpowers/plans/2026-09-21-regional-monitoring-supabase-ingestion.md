# Regional Monitoring Supabase Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menggantikan pembacaan rapuh Spreadsheet Global dengan engine penarikan data langsung dari 18 Google Sheet rute individu ke tabel Supabase `daily_route_reports` (1-klik di UI tanpa modal URL), lengkap dengan smart skip, konkurensi terkontrol, badge asal data, dan preservasi 21 metrik operasional.

**Architecture:** 
- **Ingestion Service:** Membaca data rute individual dari `route_sheets` menggunakan pembatasan konkurensi batch (4 rute per putaran) dengan targeted range read pada tab tanggal aktif.
- **Smart Skip:** Melewati rute yang sudah berstatus `submitted` atau `verified` di Supabase untuk menghemat kuota Google Sheets API.
- **Pure Computation Ratios:** Seluruh rasio turunan (Pnp/KM, Ritase/Bus, % Capaian) dihitung murni di sisi service/frontend.
- **UI Modern Ergonomis:** Tombol direct action di header (disabled selama proses berjalan tanpa timer cooldown buatan), provenance badge (`Input App` vs `Tarik Sheet`), dan banner kesiapan wilayah.

**Tech Stack:** TypeScript, React, Supabase Client, Google Sheets API Client (`gapi`/proxy), Vitest.

## Global Constraints
- Seluruh kode berada di branch `devmode`.
- Dilarang keras menulis teks antarmuka (*hardcoded UI strings*) di komponen; wajib menggunakan `src/constants/texts/text_monitoring.ts`.
- Parsing angka dari spreadsheet wajib menggunakan `parseIndonesianNumber()` dari `src/utils/numberUtils.ts`.
- Quality Gates: `pnpm vitest run src/` lulus 100%, `pnpm run build` lulus 0 error.

---

### Task 1: Kamus Teks Sentral untuk Ingestion & Data Provenance

**Files:**
- Modify: `src/constants/texts/text_monitoring.ts`
- Modify: `src/constants/texts/text_errors.ts`
- Test: `src/constants/texts/texts.test.ts`

**Interfaces:**
- Produces: 
  - `TEXT_MONITORING.INGESTION.BUTTON_LABEL`: `"Tarik 18 Rute"`
  - `TEXT_MONITORING.INGESTION.BUTTON_LOADING`: `"Menyinkronkan..."`
  - `TEXT_MONITORING.INGESTION.SUCCESS_TOAST(appCount: number, sheetCount: number)`: string
  - `TEXT_MONITORING.INGESTION.PARTIAL_WARN(errorCount: number)`: string
  - `TEXT_MONITORING.PROVENANCE.APP_INPUT`: `"Input App"`
  - `TEXT_MONITORING.PROVENANCE.SHEET_SYNC`: `"Tarik Sheet"`
  - `TEXT_MONITORING.PROVENANCE.EMPTY`: `"Belum Ada Data"`
  - `TEXT_MONITORING.READINESS.SUMMARY(filled: number, total: number, app: number, sheet: number)`: string

- [ ] **Step 1: Tulis unit test kamus teks baru**
  Tambahkan ekspektasi kamus teks `TEXT_MONITORING.INGESTION`, `PROVENANCE`, dan `READINESS` pada `src/constants/texts/texts.test.ts`.

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**
  Jalankan: `pnpm vitest run src/constants/texts/texts.test.ts`
  Ekspektasi: FAIL (properti belum didefinisikan).

- [ ] **Step 3: Implementasikan teks baru di `text_monitoring.ts`**
  Definisikan seluruh objek kamus teks dan fungsi template string murni.

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**
  Jalankan: `pnpm vitest run src/constants/texts/texts.test.ts`
  Ekspektasi: PASS 100%.

- [ ] **Step 5: Commit perubahan**
  `git add src/constants/texts/`
  `git commit -m "feat: kamus teks ingestion monitoring wilayah"`

---

### Task 2: Service Ingestion Rute Individu (`regionalIngestionService`)

**Files:**
- Create: `src/services/regionalIngestionService.ts`
- Create: `src/services/regionalIngestionService.test.ts`

**Interfaces:**
- Consumes:
  - `supabase` dari `src/services/supabase.ts`
  - `fetchRouteMasterList` dari `src/services/dailyRouteReportService.ts`
  - `fetchSheetValues` dari `src/services/googleSheets/transport.ts`
  - `parseIndonesianNumber` dari `src/utils/numberUtils.ts`
- Produces:
  - `ingestRegionalRouteSummaries(dateStr: string): Promise<IngestionResult>`
  - Interface `IngestionResult { success: boolean; syncedFromSheet: number; skippedFromApp: number; errors: string[] }`

- [ ] **Step 1: Tulis unit test untuk `regionalIngestionService`**
  Buat `src/services/regionalIngestionService.test.ts` menguji:
  1. *Smart Skip*: Rute dengan status `'submitted'` tidak dipanggil ke spreadsheet.
  2. *Batching & Ingestion*: Membaca ringkasan tab tanggal dan meng-upsert ke `daily_route_reports` dengan `data_source: 'sheet_ingestion'`.
  3. *Partial Error Tolerance*: Jika 1 rute gagal fetch, rute lainnya tetap berhasil disimpan dan error dicatat ke array.

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**
  Jalankan: `pnpm vitest run src/services/regionalIngestionService.test.ts`
  Ekspektasi: FAIL (file belum dibuat).

- [ ] **Step 3: Implementasikan `regionalIngestionService.ts`**
  Terapkan fungsi batching (chunk size 4 rute, jeda 250ms), targeted range read tab tanggal, smart skip rute submitted/verified, dan bulk upsert Supabase.

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**
  Jalankan: `pnpm vitest run src/services/regionalIngestionService.test.ts`
  Ekspektasi: PASS 100%.

- [ ] **Step 5: Commit perubahan**
  `git add src/services/regionalIngestionService.ts src/services/regionalIngestionService.test.ts`
  `git commit -m "feat: service ingestion 18 rute supabase"`

---

### Task 3: Penyesuaian Pemetaan Model & 21 Kolom pada `allRouteMonitoringService`

**Files:**
- Modify: `src/services/allRouteMonitoringService.ts`
- Modify: `src/services/allRouteMonitoringService.test.ts`

**Interfaces:**
- Consumes:
  - `daily_route_reports` dari Supabase
  - `routes` master list
- Produces:
  - Update `RegionalRouteItem` menyertakan `dataSource?: 'app_input' | 'sheet_ingestion'`, `passengersPerKm`, `tripPerBus`, `passengersPerBus`, `% Capaian`.

- [ ] **Step 1: Tulis test untuk verifikasi pemetaan 21 kolom dan `dataSource`**
  Perbarui `src/services/allRouteMonitoringService.test.ts` untuk memverifikasi perhitungan rasio murni (Pnp/KM, Ritase/Bus, Pnp/Bus) dan pelabelan `dataSource`.

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**
  Jalankan: `pnpm vitest run src/services/allRouteMonitoringService.test.ts`
  Ekspektasi: FAIL (properti baru belum ada).

- [ ] **Step 3: Implementasikan pemetaan di `allRouteMonitoringService.ts`**
  Tambahkan komputasi murni rasio 21 kolom dan pemetaan `dataSource` pada `fetchRegionalMonitoringData()`. Hubungkan `syncRegionalDailyFromGlobalSheet` lama ke engine baru atau tandai deprecated.

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**
  Jalankan: `pnpm vitest run src/services/allRouteMonitoringService.test.ts`
  Ekspektasi: PASS 100%.

- [ ] **Step 5: Commit perubahan**
  `git add src/services/allRouteMonitoringService.ts src/services/allRouteMonitoringService.test.ts`
  `git commit -m "refactor: pemetaan 21 kolom monitoring wilayah"`

---

### Task 4: Pembaruan Komponen UI (MonitoringHeader, RouteCard, ReadinessBanner)

**Files:**
- Modify: `src/components/monitoring/MonitoringHeader.tsx`
- Modify: `src/components/monitoring/MonitoringRouteCard.tsx`
- Modify: `src/components/monitoring/MonitoringReadinessBanner.tsx`
- Modify: `src/components/monitoring/AllRouteMonitoringPage.tsx`
- Test: `src/components/monitoring/AllRouteMonitoringPage.test.tsx`

**Interfaces:**
- Consumes:
  - `ingestRegionalRouteSummaries` dari `src/services/regionalIngestionService.ts`
  - `TEXT_MONITORING` dari `src/constants/texts`

- [ ] **Step 1: Tulis unit test UI untuk direct ingestion & provenance badge**
  Perbarui `src/components/monitoring/AllRouteMonitoringPage.test.tsx` untuk menguji:
  1. Tombol `[🔄 Tarik 18 Rute]` memicu `ingestRegionalRouteSummaries`.
  2. Tombol berstatus disabled selama loading.
  3. Badge `Input App` / `Tarik Sheet` tampil sesuai `dataSource`.

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**
  Jalankan: `pnpm vitest run src/components/monitoring/AllRouteMonitoringPage.test.tsx`
  Ekspektasi: FAIL.

- [ ] **Step 3: Implementasikan pembaruan UI**
  1. Ganti tombol modal sync di `MonitoringHeader.tsx` dengan tombol direct action + spinner `Loader2`.
  2. Tambahkan pill badge asal data di `MonitoringRouteCard.tsx`.
  3. Tampilkan rincian kesiapan (Input App vs Tarik Sheet) di `MonitoringReadinessBanner.tsx`.
  4. Hapus dialog modal input URL lama dari `AllRouteMonitoringPage.tsx`.

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**
  Jalankan: `pnpm vitest run src/components/monitoring/AllRouteMonitoringPage.test.tsx`
  Ekspektasi: PASS 100%.

- [ ] **Step 5: Commit perubahan UI**
  `git add src/components/monitoring/`
  `git commit -m "feat: ui direct ingestion monitoring wilayah"`

---

### Task 5: Quality Gates & Verifikasi Akhir

**Files:**
- Workspace audit

- [ ] **Step 1: Jalankan seluruh suite test proyek**
  Jalankan: `pnpm vitest run src/`
  Ekspektasi: Seluruh test lulus 100%.

- [ ] **Step 2: Jalankan build dan typecheck TypeScript**
  Jalankan: `pnpm run build`
  Ekspektasi: 0 error, build sukses.

- [ ] **Step 3: Perbarui graf arsitektur Knowledge Graph**
  Jalankan: `graphify update .`

- [ ] **Step 4: Commit dokumentasi akhir**
  `git commit -m "chore: quality gates passed regional ingestion"`
