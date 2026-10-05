# Dashboard Monitoring All Route & Generator Laporan WhatsApp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun halaman mandiri Dashboard Monitoring All Route untuk pimpinan/Korlap (18 rute Wilayah Utara), form input data fisik operasional per shift untuk petugas PDO di rute, dan generator pesan laporan harian WhatsApp otomatis (Format 1: Komprehensif & Format 2: Rincian Shift).

**Architecture:** 
- Ekstensi tabel `public.routes` dan pembuatan tabel `public.daily_route_reports` di Supabase untuk mencatat input PDO per shift (Renops/Realops, headway, kemacetan, kendala).
- Service agregasi wilayah yang menggabungkan data rute, data unit `daily_unit_summaries`, dan laporan harian `daily_route_reports` dengan komparasi riwayat $H-1$ dan $H-7$.
- Utility murni `waReportGenerator.ts` untuk memformat teks pesan WhatsApp 100% presisi dengan format baku Transjakarta/JakLingko.
- Komponen antarmuka mandiri `AllRouteMonitoringPage.tsx` dengan filter Korlap, kartu ringkasan KPI, indikator kelengkapan, dan modal generator WhatsApp.

**Tech Stack:** React 19, TypeScript (Strict Mode), Vite, Supabase JS Client, Lucide React, Vitest.

## Global Constraints
- Target branch pengerjaan wajib `devmode`. Dilarang menyentuh `main` / `master` / `production`.
- Format judul commit wajib seringkas mungkin (maksimal $\le 50$ karakter) menggunakan format Conventional Commits (contoh: `feat: add wa report generator`).
- Parsing angka dari spreadsheet/PDO wajib menggunakan `parseIndonesianNumber()` dari `src/utils/numberUtils.ts`.
- Format angka ke teks Indonesia (titik sebagai ribuan, koma sebagai desimal) menggunakan `formatIndonesianNumber()` / helper lokal yang konsisten.
- Desain antarmuka wajib **Mobile-First** dengan dukungan penuh untuk **Light Mode & Dark Mode**.
- Animasi transisi menggunakan kurva fisik iOS: `cubic-bezier(0.32, 0.72, 0, 1)`.

---

### Task 1: Skema Database & Migrasi Supabase (Tabel Routes & Daily Route Reports)

**Files:**
- Create: `supabase/migrations/20260908000001_all_route_monitoring.sql`
- Create: `src/services/dailyRouteReportService.ts`
- Create: `src/services/dailyRouteReportService.test.ts`
- Modify: `src/types/supabase.ts`

**Interfaces:**
- Consumes: Supabase client from `src/services/supabase.ts`
- Produces: 
  - `RouteMasterConfig` (tipe data rute lengkap)
  - `DailyRouteReport` (tipe data laporan operasional harian rute)
  - `upsertDailyRouteReport(report: Partial<DailyRouteReport>): Promise<DailyRouteReport>`
  - `fetchDailyRouteReportsByDate(date: string): Promise<DailyRouteReport[]>`
  - `fetchRouteMasterConfigs(): Promise<RouteMasterConfig[]>`

- [ ] **Step 1: Tulis file migrasi SQL Supabase**

Buat file `supabase/migrations/20260908000001_all_route_monitoring.sql` yang menambahkan kolom ke `public.routes`, membuat tabel `public.daily_route_reports`, dan melakukan seed data 18 rute:

```sql
-- 1. Tambah kolom spesifikasi ke public.routes
ALTER TABLE public.routes 
ADD COLUMN IF NOT EXISTS operator_name text,
ADD COLUMN IF NOT EXISTS is_looping boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS km_baku numeric,
ADD COLUMN IF NOT EXISTS target_hk integer,
ADD COLUMN IF NOT EXISTS best_record integer,
ADD COLUMN IF NOT EXISTS default_renops integer,
ADD COLUMN IF NOT EXISTS supervisor_name text,
ADD COLUMN IF NOT EXISTS default_traffic_jam_spots text[] DEFAULT '{}';

-- 2. Buat tabel daily_route_reports
CREATE TABLE IF NOT EXISTS public.daily_route_reports (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  route_id bigint REFERENCES public.routes(id) ON DELETE CASCADE,
  route_code text NOT NULL,
  date date NOT NULL,
  renops_shift1 integer DEFAULT 0,
  realops_shift1 integer DEFAULT 0,
  renops_shift2 integer DEFAULT 0,
  realops_shift2 integer DEFAULT 0,
  headway_fastest integer DEFAULT 0,
  headway_slowest integer DEFAULT 0,
  traffic_jam_spots text[] DEFAULT '{}',
  operational_issues text DEFAULT '',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'verified')),
  submitted_by text,
  verified_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_route_date UNIQUE (route_id, date)
);

-- RLS
ALTER TABLE public.daily_route_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read daily_route_reports" ON public.daily_route_reports FOR SELECT USING (true);
CREATE POLICY "Allow insert/update daily_route_reports" ON public.daily_route_reports FOR ALL USING (true);

-- 3. Seed data spesifikasi 18 rute Wilayah Utara
UPDATE public.routes SET operator_name = 'KOLAMAS', is_looping = true, km_baku = 14.415, target_hk = 5161, best_record = 5201, default_renops = 20, supervisor_name = 'MOAMAR. Z.A. MAHU', default_traffic_jam_spots = ARRAY['Pasar Warakas', 'Jl. Warakas Raya', 'Jl. Yos Sudarso'] WHERE route_code = 'JAK.01';
UPDATE public.routes SET operator_name = 'KWK', is_looping = true, km_baku = 30.897, target_hk = 7315, best_record = 6384, default_renops = 33, supervisor_name = 'ABDUL MANAN', default_traffic_jam_spots = ARRAY['Jl Raya Cakung cilincing', 'Jl Sungai landak (Persimpangan lestari)', 'Jl Cilincing landak'] WHERE route_code = 'JAK.05';
UPDATE public.routes SET operator_name = 'KWK', is_looping = false, km_baku = 29.603, target_hk = 11164, best_record = 10207, default_renops = 60, supervisor_name = 'ABDUL MANAN', default_traffic_jam_spots = ARRAY['Jl. Jampea', 'Jl. Marunda Makmur sampai Bulak Turi'] WHERE route_code = 'JAK.15';
UPDATE public.routes SET operator_name = 'KWK', is_looping = false, km_baku = 25.089, target_hk = 13817, best_record = 12139, default_renops = 42, supervisor_name = 'MOAMAR. Z.A. MAHU', default_traffic_jam_spots = ARRAY['Jl Tipar cakung (KBN BULOG)', 'Jl Jampea', 'Jl Simpang lima semper'] WHERE route_code = 'JAK.29';
UPDATE public.routes SET operator_name = 'KWK', is_looping = true, km_baku = 30.713, target_hk = 9354, best_record = 8120, default_renops = 40, supervisor_name = 'ABDUL MANAN', default_traffic_jam_spots = ARRAY['Jl Raya Cakung cilincing', 'Jl Sungai landak (Persimpangan lestari)', 'Jl Raya Cilincing', 'Simpang lima semper'] WHERE route_code = 'JAK.58';
UPDATE public.routes SET operator_name = 'KWK', is_looping = true, km_baku = 33.740, target_hk = 6853, best_record = 5858, default_renops = 35, supervisor_name = 'RANTO LUMBAN TORUAN', default_traffic_jam_spots = ARRAY['Jl. Boulevard Raya', 'Jl. Inspeksi Kali Sunter'] WHERE route_code = 'JAK.60';
UPDATE public.routes SET operator_name = 'KMJ', is_looping = true, km_baku = 26.805, target_hk = 1580, best_record = 2770, default_renops = 44, supervisor_name = 'RANTO LUMBAN TORUAN', default_traffic_jam_spots = ARRAY['Jl. Boulevard Raya', 'Jl. Mitra Sunter'] WHERE route_code = 'JAK.76';
UPDATE public.routes SET operator_name = 'KMJ/KLM', is_looping = false, km_baku = 23.840, target_hk = 6622, best_record = 7654, default_renops = 32, supervisor_name = 'RANTO LUMBAN TORUAN', default_traffic_jam_spots = ARRAY['Jl. Danau Sunter Utara', 'Lampu merah Jubile', 'Pasar Warakas'] WHERE route_code = 'JAK.77';
UPDATE public.routes SET operator_name = 'LSG', is_looping = false, km_baku = 37.414, target_hk = 4796, best_record = 3327, default_renops = 30, supervisor_name = 'MOAMAR. Z.A. MAHU', default_traffic_jam_spots = ARRAY['Jl. Boulevard Barat', 'Jl. BGR', 'Jl. Mitra Sunter'] WHERE route_code = 'JAK.87';
UPDATE public.routes SET operator_name = 'KMJ', is_looping = true, km_baku = 24.792, target_hk = 5887, best_record = 5434, default_renops = 30, supervisor_name = 'MOAMAR. Z.A. MAHU', default_traffic_jam_spots = ARRAY['Jl. Re. Martadinata (Pembangunan proyek Jl. Tol)', 'Jl. Karang Bolong (adanya Proyek Strategis Nasional)'] WHERE route_code = 'JAK.88';
UPDATE public.routes SET operator_name = 'KMJ', is_looping = true, km_baku = 21.463, target_hk = 3569, best_record = 3430, default_renops = 28, supervisor_name = 'MOAMAR. Z.A. MAHU', default_traffic_jam_spots = ARRAY['Jl. Re. Martadinata (Pembangunan proyek Jl Tol)', 'Jl. Lodan (Pembangunan proyek Jl Tol)', 'Jl. Kopi'] WHERE route_code = 'JAK.89';
UPDATE public.routes SET operator_name = 'KMJ', is_looping = true, km_baku = 29.628, target_hk = 3801, best_record = 3488, default_renops = 24, supervisor_name = 'MOAMAR. Z.A. MAHU', default_traffic_jam_spots = ARRAY['Jl. Re. Martadinata (Pembangunan proyek Jl Tol)', 'Jl. Danau Sunter Utara'] WHERE route_code = 'JAK.90';
UPDATE public.routes SET operator_name = 'KWK', is_looping = false, km_baku = 41.205, target_hk = 8345, best_record = 5903, default_renops = 30, supervisor_name = 'ABDUL MANAN', default_traffic_jam_spots = ARRAY['Jl. Cacing', 'Jl. JGC', 'Jl. Marunda', 'Jl. Sungai Tiram'] WHERE route_code = 'JAK.110A';
UPDATE public.routes SET operator_name = 'KWK', is_looping = true, km_baku = 19.985, target_hk = 8101, best_record = 6705, default_renops = 30, supervisor_name = 'RANTO LUMBAN TORUAN', default_traffic_jam_spots = ARRAY['Jl Raya Cilincing', 'Jl Sungai landak (Persimpangan lestari)', 'Jl Yos sudarso (Permai)'] WHERE route_code = 'JAK.113';
UPDATE public.routes SET operator_name = 'KWK', is_looping = true, km_baku = 28.443, target_hk = 8239, best_record = 7389, default_renops = 30, supervisor_name = 'ABDUL MANAN', default_traffic_jam_spots = ARRAY['JALAN PEGANGSAAN 2', 'JALAN SIMPANG LIMA SEMPER'] WHERE route_code = 'JAK.115';
UPDATE public.routes SET operator_name = 'KWK', is_looping = false, km_baku = 26.155, target_hk = 9877, best_record = 8273, default_renops = 33, supervisor_name = 'ABDUL MANAN', default_traffic_jam_spots = ARRAY['Jl Yos sudarso (Polres Jakut)', 'Jl Yos sudarso (Plumpang)', 'Jl Raya Cilincing (Persimpangan jaya)'] WHERE route_code = 'JAK.117';
UPDATE public.routes SET operator_name = 'KWK', is_looping = true, km_baku = 26.038, target_hk = 9201, best_record = 8390, default_renops = 30, supervisor_name = 'RANTO LUMBAN TORUAN', default_traffic_jam_spots = ARRAY['JALAN KALI MATI PADEMANGAN', 'LAMPU MERAH BEOS/KOTA TUA', 'PASAR ASEMKA'] WHERE route_code = 'JAK.118';
UPDATE public.routes SET operator_name = 'KWK AC', is_looping = true, km_baku = 43.465, target_hk = 2717, best_record = 2639, default_renops = 15, supervisor_name = 'RANTO LUMBAN TORUAN', default_traffic_jam_spots = ARRAY['Sunter TL blok A arah muara angke', 'jl industri pertamina arah muara angke', 'jl pangeran jaya karta arah muara angke', 'jl kota tua arah muara angke'] WHERE route_code = 'JAK.120';
```

- [ ] **Step 2: Jalankan migrasi ke Supabase via MCP Supabase**
Eksekusi query SQL migrasi di atas ke Supabase menggunakan tool `execute_sql`.

- [ ] **Step 3: Tulis unit test untuk `dailyRouteReportService`**

Tulis file `src/services/dailyRouteReportService.test.ts` untuk menguji:
- Pengambilan rute master beserta konfigurasinya.
- Simpan dan ambil data `daily_route_reports`.
- Perhitungan total renops & realops harian dari shift 1 dan shift 2.

- [ ] **Step 4: Implementasi `src/services/dailyRouteReportService.ts`**

Implementasikan fungsi client Supabase untuk interaksi dengan `daily_route_reports` dan `routes`.

- [ ] **Step 5: Jalankan test dan verifikasi**
Run: `pnpm vitest run src/services/dailyRouteReportService.test.ts`
Expected: PASS 100%.

- [ ] **Step 6: Commit**
```bash
git add supabase/migrations/ src/services/dailyRouteReportService* src/types/
git commit -m "feat: add daily route reports schema & service"
```

---

### Task 2: Generator Format Pesan WhatsApp (Format 1 & Format 2)

**Files:**
- Create: `src/utils/waReportGenerator.ts`
- Create: `src/utils/waReportGenerator.test.ts`

**Interfaces:**
- Consumes:
  - Data agregat harian per rute:
    ```typescript
    export interface RouteWaData {
      no: number;
      routeCode: string;
      routeName: string;
      operatorName: string;
      isLooping: boolean;
      todayPassengers: number;
      yesterdayPassengers: number;
      lastWeekPassengers: number;
      targetHk: number;
      bestRecord: number;
      achievementKm: number;
      kmBaku: number;
      renops: number;
      realops: number;
      trafficJamSpots: string[];
      operationalIssues: string;
      headwayFastest: number;
      headwaySlowest: number;
      // Shift breakdown
      toaShift1: number;
      manualShift1: number;
      totalShift1: number;
      toaShift2: number;
      manualShift2: number;
      totalShift2: number;
    }
    ```
- Produces:
  - `generateWaReportFormat1(dateStr: string, routes: RouteWaData[]): string`
  - `generateWaReportFormat2(dateStr: string, routes: RouteWaData[], totals: RegionTotals): string`
  - `openWhatsApp(text: string): void`

- [ ] **Step 1: Tulis unit test komprehensif untuk format pesan WA**

Tulis test di `src/utils/waReportGenerator.test.ts`:
- Memverifikasi Format 1 menghasilkan string teks yang persis sesuai template (termasuk huruf tebal `*...*`, miring `_..._`, titik koma, dan format desimal persentase `98,37%`).
- Memverifikasi Format 2 menghasilkan susunan `[TOA] + [MANUAL] = JUMLAH` untuk Shift 1, Shift 2, dan blok summary akumulasi di bagian bawah.
- Memverifikasi penanganan fallback jika data kemarin atau minggu lalu belum ada (misal tampil angka 0 atau strip).

- [ ] **Step 2: Jalankan test untuk memastikan kegagalan awal (TDD)**
Run: `pnpm vitest run src/utils/waReportGenerator.test.ts`
Expected: FAIL (fungsi belum diimplementasi).

- [ ] **Step 3: Implementasi logika generator di `src/utils/waReportGenerator.ts`**
Implementasikan:
- Helper format tanggal bahasa Indonesia (contoh: `RABU, 2 September 2026`).
- Helper format angka ribuan dengan titik (contoh: `5.077`).
- Fungsi `generateWaReportFormat1` dan `generateWaReportFormat2`.
- Fungsi `openWhatsApp(text)` yang memanggil `window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank')`.

- [ ] **Step 4: Jalankan test untuk memastikan kelulusan**
Run: `pnpm vitest run src/utils/waReportGenerator.test.ts`
Expected: PASS 100%.

- [ ] **Step 5: Commit**
```bash
git add src/utils/waReportGenerator*
git commit -m "feat: add whatsapp report generator formats"
```

---

### Task 3: Form Input Lapangan Petugas PDO di Halaman Rute

**Files:**
- Create: `src/components/RouteOperationalReportCard.tsx`
- Create: `src/components/RouteOperationalReportCard.test.tsx`
- Modify: `src/components/Dashboard.tsx`

**Interfaces:**
- Consumes:
  - `routeCode`: string
  - `selectedDate`: string (YYYY-MM-DD)
  - `defaultJamSpots`: string[]
- Produces:
  - Form UI untuk menginput:
    - Renops Shift 1, Realops Shift 1
    - Renops Shift 2, Realops Shift 2
    - Headway Tercepat & Terlama
    - Titik Kemacetan (Checklist dari template + tambah baru)
    - Catatan Kendala Operasional
  - Event `onReportSaved?: () => void`

- [ ] **Step 1: Tulis unit test untuk `RouteOperationalReportCard`**

Tulis test di `src/components/RouteOperationalReportCard.test.tsx`:
- Render input field Renops & Realops shift 1 dan 2.
- Interaksi memilih chips titik kemacetan.
- Validasi input angka non-negatif.
- Submit form dan trigger pemanggilan `upsertDailyRouteReport`.

- [ ] **Step 2: Implementasi komponen `RouteOperationalReportCard.tsx`**
- Desain Mobile-First dengan kurva transisi halus `cubic-bezier(0.32, 0.72, 0, 1)`.
- Menggunakan CSS variables yang sinkron dengan Light Mode & Dark Mode.
- Menampilkan status saat ini: *Draft*, *Submitted*, atau *Verified*.

- [ ] **Step 3: Integrasikan ke `src/components/Dashboard.tsx`**
Letakkan kartu ini pada posisi strategis di dashboard rute (misal di bawah RouteSelector atau sebelum BusList) sehingga mudah ditemukan petugas PDO.

- [ ] **Step 4: Jalankan test komponen**
Run: `pnpm vitest run src/components/RouteOperationalReportCard.test.tsx`
Expected: PASS 100%.

- [ ] **Step 5: Commit**
```bash
git add src/components/RouteOperationalReportCard* src/components/Dashboard.tsx
git commit -m "feat: add pdo operational report form"
```

---

### Task 4: Service Agregasi & Komparasi Riwayat Wilayah (H, H-1, H-7)

**Files:**
- Create: `src/services/allRouteMonitoringService.ts`
- Create: `src/services/allRouteMonitoringService.test.ts`

**Interfaces:**
- Produces:
  - `fetchRegionalMonitoringData(dateStr: string): Promise<RegionalMonitoringResult>`
  - Menghitung secara otomatis:
    - Data 18 rute untuk tanggal aktif $H$.
    - Total penumpang kemarin ($H-1$) dari riwayat database.
    - Total penumpang minggu lalu ($H-7$) dari riwayat database.
    - Status kelengkapan laporan 18 rute (berapa rute submitted / draft / empty).
    - Agregat KPI Wilayah: Total Renops, Total Realops, Total KM, Total Pelanggan, % Capaian Target, Shift 1 vs Shift 2.

- [ ] **Step 1: Tulis unit test untuk `allRouteMonitoringService.test.ts`**
- Menguji kalkulasi tanggal $H-1$ dan $H-7$ (termasuk edge case lintas bulan).
- Menguji penggabungan data konfigurasi rute dengan laporan operasional PDO dan data ringkasan unit.
- Menguji pengelompokan berdasarkan 3 Korlap.

- [ ] **Step 2: Implementasi `allRouteMonitoringService.ts`**
- Query efisien ke Supabase (`daily_route_reports` dan `daily_unit_summaries`) menggunakan filter `date in (H, H-1, H-7)` dalam satu batch request.
- Mengembalikan struktur data siap pakai untuk antarmuka dashboard dan generator WhatsApp.

- [ ] **Step 3: Jalankan test**
Run: `pnpm vitest run src/services/allRouteMonitoringService.test.ts`
Expected: PASS 100%.

- [ ] **Step 4: Commit**
```bash
git add src/services/allRouteMonitoringService*
git commit -m "feat: add regional monitoring aggregation service"
```

---

### Task 5: Modal Generator Laporan WhatsApp (`WaReportModal.tsx`)

**Files:**
- Create: `src/components/WaReportModal.tsx`
- Create: `src/components/WaReportModal.test.tsx`

**Interfaces:**
- Consumes:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `regionalData: RegionalMonitoringResult`
  - `selectedDate: string`
- Produces:
  - Dialog modal interaktif pemilih format (Format 1 vs Format 2).
  - Filter lingkup: Seluruh Wilayah vs Per Korlap (Ranto, Abdul Manan, Moamar).
  - Tampilan teks preview monospace.
  - Tombol aksi: "Salin ke Clipboard" & "Buka WhatsApp".

- [ ] **Step 1: Tulis unit test untuk `WaReportModal.test.tsx`**
- Menguji perpindahan tab Format 1 ke Format 2.
- Menguji aksi tombol salin memanggil `navigator.clipboard.writeText`.
- Menguji peringatan jika ada rute yang belum submit data.

- [ ] **Step 2: Implementasi komponen `WaReportModal.tsx`**
- Desain Mobile-First bottom-sheet / modal dialog.
- Area pratinjau teks WhatsApp dengan styling dark monospace yang menyerupai tampilan bubble chat WhatsApp.
- Efek toast konfirmasi saat teks berhasil disalin.

- [ ] **Step 3: Jalankan test komponen**
Run: `pnpm vitest run src/components/WaReportModal.test.tsx`
Expected: PASS 100%.

- [ ] **Step 4: Commit**
```bash
git add src/components/WaReportModal*
git commit -m "feat: add wa report preview modal"
```

---

### Task 6: Halaman Mandiri Dashboard Monitoring All Route (`AllRouteMonitoringPage.tsx`)

**Files:**
- Create: `src/components/AllRouteMonitoringPage.tsx`
- Create: `src/components/AllRouteMonitoringPage.test.tsx`

**Interfaces:**
- Consumes:
  - User profile & role
  - Date picker state
- Produces:
  - Halaman lengkap monitoring 18 rute:
    - Header & status bar kelengkapan (misal: "16/18 Rute Siap").
    - Filter Korlap (Semua, Ranto L.T., Abdul Manan, Moamar Z.A.).
    - Regional KPI Cards (Armada, Pelanggan, KM Tempuh, Shift 1 vs 2).
    - Grid kartu 18 rute dengan badge status (Submitted, Draft, Verified).
    - Tombol verifikasi data rute untuk Korlap.
    - Floating Action Button untuk membuka `WaReportModal`.

- [ ] **Step 1: Tulis unit test untuk `AllRouteMonitoringPage.test.tsx`**
- Render 18 rute dan kartu KPI.
- Filter rute saat tab Korlap ditekan (hanya 6 rute yang tampil).
- Klik tombol konfirmasi/verifikasi rute.
- Klik tombol FAB membuka modal WhatsApp report.

- [ ] **Step 2: Implementasi komponen `AllRouteMonitoringPage.tsx`**
- Styling mobile-first dengan kontras tinggi di Light & Dark mode.
- Efek *shimmer skeleton* saat memuat data dari Supabase.
- Tombol aksi mengambang (FAB) yang nyaman dijangkau jempol tangan kanan di smartphone.

- [ ] **Step 3: Jalankan test**
Run: `pnpm vitest run src/components/AllRouteMonitoringPage.test.tsx`
Expected: PASS 100%.

- [ ] **Step 4: Commit**
```bash
git add src/components/AllRouteMonitoringPage*
git commit -m "feat: add all-route regional monitoring page"
```

---

### Task 7: Integrasi Navigasi, Switcher Header, & Quality Gates

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/ProfileMenuSheet.tsx`
- Modify: `src/index.css` (tambahkan style khusus monitoring & wa modal jika perlu)

**Interfaces:**
- Kapsul switcher di header atau navigasi untuk berpindah antara:
  - `viewMode === 'route'` (Dashboard Operasional Rute yang ada saat ini)
  - `viewMode === 'regional'` (Dashboard Monitoring All Route)
- Shortcut menu di `ProfileMenuSheet.tsx`.

- [ ] **Step 1: Tambahkan switcher mode di `src/App.tsx`**
- Tambahkan state `viewMode: 'route' | 'regional'`.
- Tambahkan tombol beralih mode di header yang halus dan mudah diakses.
- Pastikan role `petugas` tetap dapat melihat monitoring dalam mode *view-only*.

- [ ] **Step 2: Tambahkan item menu di `src/components/ProfileMenuSheet.tsx`**
- Tambahkan tombol menu *"Monitoring Wilayah & Laporan WA"* lengkap dengan ikon `Globe` atau `LayoutGrid`.

- [ ] **Step 3: Uji seluruh unit test proyek**
Run: `pnpm vitest run src/`
Expected: 100% tests pass tanpa ada kegagalan.

- [ ] **Step 4: Uji build & typecheck strict mode**
Run: `pnpm run build`
Expected: 0 error (`tsc -b` dan vite build lulus).

- [ ] **Step 5: Perbarui knowledge graph**
Run: `graphify update .`

- [ ] **Step 6: Commit akhir integrasi**
```bash
git add src/App.tsx src/components/ProfileMenuSheet.tsx src/index.css
git commit -m "feat: integrate regional monitoring navigation"
```

---

## Verification Plan

### Automated Tests
1. `pnpm vitest run src/utils/waReportGenerator.test.ts` (Format 1 & Format 2 text exact match).
2. `pnpm vitest run src/services/dailyRouteReportService.test.ts` (Supabase CRUD & status tracking).
3. `pnpm vitest run src/services/allRouteMonitoringService.test.ts` (Aggregation & H-1 / H-7 calculations).
4. `pnpm vitest run src/components/RouteOperationalReportCard.test.tsx` (PDO manual input form).
5. `pnpm vitest run src/components/AllRouteMonitoringPage.test.tsx` (Regional dashboard & Korlap filter).
6. `pnpm vitest run src/components/WaReportModal.test.tsx` (WA modal preview & copy actions).
7. `pnpm vitest run src/` (All existing & new tests pass).
8. `pnpm run build` (TypeScript Strict Mode & Vite production build check).

### Manual Verification
1. **Sisi Petugas PDO:**
   * Buka salah satu rute (misal: `JAK.15`).
   * Isi form *Laporan Operasi Rute* (Renops Shift 1 = 60, Realops Shift 1 = 58, Headway 3-6 menit, pilih titik macet "Jl. Jampea").
   * Klik *Kirim Laporan Operasional*. Pastikan status berubah menjadi *Submitted*.
2. **Sisi Korlap / Pimpinan:**
   * Beralih ke halaman *Monitoring Wilayah* via switcher header.
   * Periksa apakah kartu JAK.15 berubah menjadi hijau (`Submitted`) dan kartu ringkasan KPI wilayah ter-update.
   * Coba filter tab *Abdul Manan (6)* $\rightarrow$ pastikan hanya 6 rute binaan beliau yang tampil.
   * Klik tombol konfirmasi (verifikasi) pada rute.
3. **Generator Laporan WhatsApp:**
   * Klik tombol mengambang *Generate Laporan WA*.
   * Pilih *Format 1 (Komprehensif)* $\rightarrow$ periksa apakah perbandingan Hari Ini, Kemarin, Target HK, Best Record, dan titik macet terisi sesuai data.
   * Pilih *Format 2 (Rincian Shift)* $\rightarrow$ periksa formula `[TOA] + [MANUAL] = JUMLAH` dan akumulasi total di bawah.
   * Klik *Salin ke Clipboard* $\rightarrow$ paste ke aplikasi teks atau WA untuk memastikan format monospace, tebal, dan baris rapi tanpa cacat.
