# Daily Fleet Status per Shift Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan fitur pencatatan dan penguncian status armada harian per rute dan per shift (Shift 1 & 2) di Supabase dengan skema relasional 3 tabel (Master `fleet_statuses`, Header `daily_fleet_shifts`, dan Detail `daily_fleet_non_sgo_units`), kalkulasi otomatis, penguncian permanen pasca-konfirmasi, dan terisolasi 100% dari Google Sheets sebagai sumber data primer generator laporan.

**Architecture:** Menggunakan arsitektur relasional hybrid di PostgreSQL/Supabase: Master Status fleksibel, Header shift menyimpan agregasi angka (`target_renops`, `realops`, `sgo`, `to`, `off`, `so`) untuk query cepat dashboard, serta Detail unit non-SGO untuk pencatatan nomor body bus bermasalah dan catatannya. Frontend React 19 mengintegrasikan hook status armada dengan mekanisme penguncian (*read-only*), kalkulasi instan, dan kamus teks sentral.

**Tech Stack:** React 19, TypeScript Strict, Supabase (PostgreSQL), Vite, Vitest, Lucide React.

## Global Constraints
- Seluruh pengerjaan wajib berada di branch `devmode`.
- Seluruh teks antarmuka wajib merujuk ke kamus teks sentral `src/constants/texts/`. Dilarang hardcoded UI strings.
- Operasi penetapan status armada TIDAK boleh menulis atau memodifikasi file Google Sheets laporan (100% beroperasi di Supabase).
- Parsing angka wajib menggunakan `parseIndonesianNumber()` dari `src/utils/numberUtils.ts`.
- Desain antarmuka wajib mobile-first dan mendukung tema Light & Dark Mode.
- Status armada terkunci permanen (*read-only*) setelah user melakukan konfirmasi.

---

### Task 1: Supabase Database Migration (Master, Header, Child Tables, Seeds & RLS)

**Files:**
- Create: `supabase/migrations/20260921000001_create_fleet_status_tables.sql`

**Interfaces:**
- Produces:
  - Table: `public.fleet_statuses`
  - Table: `public.daily_fleet_shifts`
  - Table: `public.daily_fleet_non_sgo_units`
  - Initial seed data: `SGO`, `TO`, `OFF`, `SO`
  - RLS policies & indexes

- [ ] **Step 1: Tulis file migrasi SQL DDL**
Tulis file `supabase/migrations/20260921000001_create_fleet_status_tables.sql` berisi pembuatan tabel `fleet_statuses`, `daily_fleet_shifts`, `daily_fleet_non_sgo_units`, seed data awal, constraint unik, index, dan policy RLS.

- [ ] **Step 2: Verifikasi sintaks SQL migrasi**
Periksa keutuhan relasi Foreign Key:
- `daily_fleet_shifts.route_id -> routes(id) ON DELETE CASCADE`
- `daily_fleet_non_sgo_units.fleet_shift_id -> daily_fleet_shifts(id) ON DELETE CASCADE`
- `daily_fleet_non_sgo_units.status_id -> fleet_statuses(id) ON DELETE RESTRICT`

- [ ] **Step 3: Commit**
```bash
git add supabase/migrations/20260921000001_create_fleet_status_tables.sql
git commit -m "feat(db): migration fleet status per shift tables"
```

---

### Task 2: TypeScript Interfaces & Kamus Teks Sentral

**Files:**
- Modify: `src/types/supabase.ts`
- Modify: `src/constants/texts/text_fleet_status.ts`
- Modify: `src/constants/texts/texts.test.ts`

**Interfaces:**
- Produces:
  - Interface `FleetStatusMaster` di `src/types/supabase.ts`
  - Interface `DailyFleetShift` di `src/types/supabase.ts`
  - Interface `DailyFleetNonSgoUnit` di `src/types/supabase.ts`
  - Token kamus `TEXT_FLEET_STATUS.LOCK`: banner terkunci, tooltip, dan konfirmasi
  - Token kamus `TEXT_FLEET_STATUS.TARGET_RENOPS_INPUT`: label & placeholder edit renops
  - Token kamus `TEXT_FLEET_STATUS.STATUS_CODES.SO`: kode `'SO'` dan label `'Stop Operasi'`

- [ ] **Step 1: Tulis unit test untuk teks kamus baru di texts.test.ts**
Tambahkan pengujian untuk token baru di `src/constants/texts/texts.test.ts`.

- [ ] **Step 2: Jalankan test untuk memastikan failing**
```bash
pnpm vitest run src/constants/texts/texts.test.ts
```
Expected: FAIL karena token belum didefinisikan.

- [ ] **Step 3: Tambahkan definisi interface TypeScript & Kamus Teks**
- Tambahkan types di `src/types/supabase.ts`.
- Tambahkan token di `src/constants/texts/text_fleet_status.ts`.

- [ ] **Step 4: Jalankan test kembali hingga lulus**
```bash
pnpm vitest run src/constants/texts/texts.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/types/supabase.ts src/constants/texts/
git commit -m "feat(types,texts): add fleet status types and text tokens"
```

---

### Task 3: Data Access Service Layer (`fleetStatusService.ts`) & Unit Testing

**Files:**
- Create: `src/services/fleetStatusService.ts`
- Create: `src/services/fleetStatusService.test.ts`

**Interfaces:**
- Produces:
  - `fetchFleetStatusesMaster(): Promise<FleetStatusMaster[]>`
  - `fetchDailyFleetShift(routeId: number, date: string, shift: 1 | 2): Promise<DailyFleetShiftWithUnits | null>`
  - `upsertDailyFleetShift(shiftData: Omit<DailyFleetShift, 'id' | 'created_at' | 'updated_at'>, nonSgoUnits: Array<{ unit_body: string; status_id: number; status_code: string; note: string }>): Promise<DailyFleetShift>`
  - `fetchDailyFleetShiftsByDate(date: string, shift?: 1 | 2): Promise<DailyFleetShiftWithUnits[]>`

- [ ] **Step 1: Tulis failing unit test untuk fleetStatusService**
Buat `src/services/fleetStatusService.test.ts` dengan mock Supabase client untuk menguji:
1. `fetchFleetStatusesMaster` mengembalikan daftar master status terurut.
2. `fetchDailyFleetShift` mengambil header dan unit non-SGO terkait.
3. `upsertDailyFleetShift` menyimpan header dan mengganti (*replace*) daftar non-SGO unit.
4. Error handling yang aman (tidak melempar crash tanpa jejak log).

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**
```bash
pnpm vitest run src/services/fleetStatusService.test.ts
```
Expected: FAIL karena service belum dibuat.

- [ ] **Step 3: Implementasikan fleetStatusService.ts**
Implementasikan fungsi-fungsi CRUD terisolasi dengan penanganan error ramah dan logging peringatan `[fleetStatusService]`.

- [ ] **Step 4: Jalankan test hingga lulus**
```bash
pnpm vitest run src/services/fleetStatusService.test.ts
```
Expected: PASS 100%.

- [ ] **Step 5: Commit**
```bash
git add src/services/fleetStatusService.ts src/services/fleetStatusService.test.ts
git commit -m "feat(service): add fleetStatusService with unit tests"
```

---

### Task 4: Refactoring Hook Status Armada (`useFleetStatusData.ts`) & Types

**Files:**
- Modify: `src/components/fleetStatus/types.ts`
- Modify: `src/components/fleetStatus/useFleetStatusData.ts`
- Modify: `src/components/fleetStatus/FleetStatusModal.test.tsx`

**Interfaces:**
- Consumes: `fleetStatusService`, `FleetStatusMaster`
- Produces:
  - State `targetRenops`: angka yang dapat diedit oleh user, default dari `renopsTarget`
  - State `isConfirmed`: boolean pengunci modal
  - State `confirmedInfo`: `{ by?: string; at?: string }`
  - Auto-kalkulasi `summaryCounts`: `{ sgo, to, off, so, other, realops }`
  - Handler `handleConfirm`: mengirimkan data terstruktur lengkap ke parent callback

- [ ] **Step 1: Tulis failing unit test untuk hook behavior**
Update `src/components/fleetStatus/FleetStatusModal.test.tsx` untuk menguji:
1. Perhitungan instan `realops = sgo_count`.
2. Kemampuan edit nilai `targetRenops`.
3. Read-only lock saat shift berstatus `isConfirmed = true`.

- [ ] **Step 2: Jalankan test untuk memastikan test gagal**
```bash
pnpm vitest run src/components/fleetStatus/FleetStatusModal.test.tsx
```

- [ ] **Step 3: Implementasikan refactor useFleetStatusData.ts**
- Tambahkan dukungan status `SO`.
- Tambahkan kalkulasi otomatis `realops` dan `summaryCounts`.
- Tambahkan status kunci `isLocked` jika shift telah dikonfirmasi.

- [ ] **Step 4: Jalankan test kembali hingga lulus**
```bash
pnpm vitest run src/components/fleetStatus/FleetStatusModal.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/fleetStatus/
git commit -m "feat(hook): refactor useFleetStatusData for dynamic statuses & locking"
```

---

### Task 5: Peningkatan UI Komponen Modal Status Armada (Header, Toolbar, Grid, Footer)

**Files:**
- Modify: `src/components/fleetStatus/FleetStatusHeader.tsx`
- Modify: `src/components/fleetStatus/FleetStatusToolbar.tsx`
- Modify: `src/components/fleetStatus/FleetStatusGrid.tsx`
- Modify: `src/components/fleetStatus/FleetStatusFooter.tsx`
- Modify: `src/components/fleetStatus/FleetStatusModal.tsx`

**Interfaces:**
- Produces:
  - Header: Input editable `target_renops` (saat belum dikonfirmasi) & badge terkunci (saat sudah dikonfirmasi).
  - Toolbar: Tombol brush dinamis (`SGO`, `TO`, `OFF`, `SO`) dengan status disabled saat terkunci.
  - Grid: Indikator status unit, modal edit note untuk TO/SO, read-only saat terkunci.
  - Footer: Banner & status terkunci *"Terkonfirmasi pada [Waktu] oleh [Pengawas]"*.

- [ ] **Step 1: Modifikasi FleetStatusHeader**
Buat target renops dapat diedit dengan tombol penyesuaian angka atau input minimalis yang ramah sentuhan, serta banner terkonfirmasi jika `isConfirmed = true`.

- [ ] **Step 2: Modifikasi FleetStatusToolbar**
Tambahkan tombol brush `SO` dengan palet warna kontras yang serasi di Light & Dark Mode.

- [ ] **Step 3: Modifikasi FleetStatusGrid & FleetStatusFooter**
Nonaktifkan tap pada kartu bus saat modal terkunci. Sembunyikan atau nonaktifkan tombol simpan jika sudah dikonfirmasi.

- [ ] **Step 4: Jalankan verifikasi test komponen**
```bash
pnpm vitest run src/components/fleetStatus/
```
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/fleetStatus/
git commit -m "feat(ui): update fleet status modal UI with editable renops & lock view"
```

---

### Task 6: Integrasi Dashboard & Pelepasan Ketergantungan Google Sheets (`useDashboardFleet.ts`)

**Files:**
- Modify: `src/components/dashboard/useDashboardFleet.ts`
- Modify: `src/components/dashboard/useDashboardFleet.test.ts` (jika ada, atau buat baru)

**Interfaces:**
- Consumes: `fleetStatusService.upsertDailyFleetShift`, `fleetStatusService.fetchDailyFleetShift`
- Changes:
  - **HAPUS** penulisan `updateBulkBusData` ke Google Sheets pada konfirmasi status armada.
  - Simpan data murni ke `daily_fleet_shifts` dan `daily_fleet_non_sgo_units`.
  - Sinkronkan `realops` ke `daily_route_reports` untuk menjaga backward-compatibility dashboard 18 rute.
  - Catat jejak audit ke `fleet_status_logs`.

- [ ] **Step 1: Buat failing unit test untuk useDashboardFleet**
Verifikasi bahwa `handleConfirmFleetStatus` memanggil `upsertDailyFleetShift` dan TIDAK memanggil `updateBulkBusData`.

- [ ] **Step 2: Jalankan test untuk memastikan test mendeteksi perubahan**
```bash
pnpm vitest run src/components/dashboard/
```

- [ ] **Step 3: Modifikasi useDashboardFleet.ts**
Implementasikan integrasi ke `fleetStatusService` dan lepaskan pemanggilan Google Sheets API.

- [ ] **Step 4: Jalankan test hingga lulus**
```bash
pnpm vitest run src/components/dashboard/
```
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/dashboard/useDashboardFleet.ts
git commit -m "feat(dashboard): isolate fleet status persistence to supabase"
```

---

### Task 7: Integrasi Generator Laporan (WA Report) & Quality Gates

**Files:**
- Modify: `src/services/dailyRouteReportService.ts` / `src/services/allRouteMonitoringService.ts`
- Modify: `src/constants/texts/text_wa_report.ts` (jika perlu penyesuaian SO/rincian)

**Interfaces:**
- Consumes: `daily_fleet_shifts`, `daily_fleet_non_sgo_units`
- Produces:
  - Generator laporan menggunakan data Renops, Realops, dan daftar unit TO/OFF/SO dari tabel status armada baru tanpa parsing Google Sheets.

- [ ] **Step 1: Hubungkan pembacaan status armada baru pada generator laporan**
Pastikan generator laporan menarik target renops, realops, dan rincian unit bermasalah dari tabel `daily_fleet_shifts` & `daily_fleet_non_sgo_units`.

- [ ] **Step 2: Jalankan seluruh pengujian unit**
```bash
pnpm vitest run src/
```
Expected: PASS 100% (semua test suite hijau).

- [ ] **Step 3: Jalankan TypeScript Strict Mode & Build Production**
```bash
pnpm run build
```
Expected: Build sukses 0 error.

- [ ] **Step 4: Perbarui Knowledge Graph**
```bash
graphify update .
```

- [ ] **Step 5: Commit**
```bash
git add .
git commit -m "feat(report): integrate daily fleet status to report generator"
```
