# Task 1: Skema Database & Migrasi Supabase (Tabel Routes & Daily Route Reports)

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
