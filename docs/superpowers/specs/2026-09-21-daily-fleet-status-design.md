# Design Spec: Dedicated Daily Fleet Status per Shift & Route

**Tanggal:** 2026-09-21  
**Status:** Approved by User (Scope Locked)  
**Tujuan:** Menyediakan skema database khusus dan alur bisnis operasional untuk mencatat, mengunci, dan menyajikan status armada harian per shift (Shift 1 & Shift 2) pada setiap rute Mikrotrans secara mandiri di Supabase tanpa ketergantungan atau manipulasi file Google Sheets laporan, serta menjadi sumber data primer (*single source*) untuk fitur generator laporan (WhatsApp Report & Rekap Pimpinan).

---

## 1. Latar Belakang & Ruang Lingkup (Scope)

Sebelumnya, status armada disimpan dalam bentuk array snapshot `jsonb` di tabel `daily_route_reports` dan kolom teks bebas `keterangan` di Google Sheets. Pola ini memiliki keterbatasan:
1. Sulit diagregasi secara analitik relasional untuk mengetahui tren unit bus bermasalah.
2. Proses simpan bergantung pada penulisan kolom `keterangan` di Google Sheets yang memakan kuota API dan rawan tabrakan edit.
3. Fitur generator laporan membutuhkan sumber data Renops, Realops, dan rincian unit non-SGO yang bersih, cepat, dan mandiri dari database.

### Keputusan Ruang Lingkup yang Telah Dikunci (*Locked Scope*):
1. **Pola Hybrid 2 Tingkat di Supabase:** Tabel Header Ringkasan Shift + Tabel Anak Khusus Unit Non-SGO + Master Status Data.
2. **Unit SGO Cukup Angka Agregat:** Unit yang berstatus SGO (normal) tidak dicatat per bus di tabel detail (hanya angka `sgo_count` di header) untuk efisiensi baris database.
3. **Unit Non-SGO Wajib Identitas Nomor Body:** Setiap unit berstatus TO, OFF, SO, atau status lainnya wajib dicatat identitas nomor bodynya (contoh: `KWK 222177`) beserta catatan kendala (*note*).
4. **Target Renops Default Otomatis & Dapat Diedit:** Di-prefill otomatis dari konfigurasi master rute berdasarkan kalender operasional (`getRenopsForDate`), namun pengawas tetap dapat mengeditnya jika ada penyesuaian lapangan. Hasil edit hanya disimpan di record shift tersebut tanpa mengubah tabel master `routes`.
5. **Realops & Counter Status 100% Otomatis:** Dihitung langsung oleh sistem (*zero manual calculation*).
6. **Mekanisme Penguncian Permanen (*Locking Rule*):** Status ditetapkan di awal shift. Begitu dikonfirmasi pengawas, data status shift tersebut **TERKUNCI (*read-only*)**. Kendala unit mendadak di tengah operasional tidak mengubah data status armada awal shift.
7. **Terisolasi dari Google Sheets:** Proses ini 100% berjalan di Supabase dan **TIDAK mengubah atau menyentuh file Google Sheets laporan**.

---

## 2. Arsitektur Skema Database (Supabase PostgreSQL)

### 2.1. Tabel Master: `public.fleet_statuses`
Menampung katalog master status armada yang dapat diperluas tanpa perubahan DDL di masa depan:

```sql
CREATE TABLE IF NOT EXISTS public.fleet_statuses (
  id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text UNIQUE NOT NULL, -- 'SGO', 'TO', 'OFF', 'SO', etc.
  name text NOT NULL,        -- 'Siap Guna Operasi', 'Tukar Operasi', 'Libur', 'Stop Operasi'
  default_note text DEFAULT '', -- Bawaan: SGO='', TO='EVDAL', OFF='LIBUR', SO=''
  is_operational boolean DEFAULT false, -- Hanya SGO = true
  is_editable_note boolean DEFAULT true, -- TO & SO = true, OFF = false
  sort_order smallint DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Seed Data Awal
INSERT INTO public.fleet_statuses (code, name, default_note, is_operational, is_editable_note, sort_order)
VALUES
  ('SGO', 'Siap Guna Operasi', '', true, false, 1),
  ('TO', 'T.O (Tukar Operasi)', 'EVDAL', false, true, 2),
  ('OFF', 'Libur (OFF)', 'LIBUR', false, false, 3),
  ('SO', 'Stop Operasi (SO)', '', false, true, 4)
ON CONFLICT (code) DO NOTHING;
```

---

### 2.2. Tabel Header: `public.daily_fleet_shifts`
Menyimpan ringkasan kesiapan armada harian per rute dan shift. Menjadi sumber data instan (*self-contained*) untuk generator laporan:

```sql
CREATE TABLE IF NOT EXISTS public.daily_fleet_shifts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  route_id bigint REFERENCES public.routes(id) ON DELETE CASCADE,
  route_code text NOT NULL,
  date date NOT NULL,
  shift smallint NOT NULL CHECK (shift IN (1, 2)),
  target_renops integer DEFAULT 0,
  realops integer DEFAULT 0, -- Nilai sama persis dengan sgo_count
  total_units integer DEFAULT 0,
  sgo_count integer DEFAULT 0,
  to_count integer DEFAULT 0,
  off_count integer DEFAULT 0,
  so_count integer DEFAULT 0,
  other_count integer DEFAULT 0,
  is_confirmed boolean DEFAULT false,
  confirmed_by text,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_daily_fleet_shift UNIQUE (route_id, date, shift)
);

CREATE INDEX IF NOT EXISTS idx_daily_fleet_shifts_route_date ON public.daily_fleet_shifts(route_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_fleet_shifts_date_shift ON public.daily_fleet_shifts(date, shift);
```

---

### 2.3. Tabel Detail Unit Non-SGO: `public.daily_fleet_non_sgo_units`
Hanya mencatat unit-unit yang berstatus selain SGO (TO, OFF, SO, atau status khusus lainnya):

```sql
CREATE TABLE IF NOT EXISTS public.daily_fleet_non_sgo_units (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fleet_shift_id bigint REFERENCES public.daily_fleet_shifts(id) ON DELETE CASCADE,
  unit_body text NOT NULL, -- Nomor body bus, contoh: 'KWK 222177'
  status_id smallint REFERENCES public.fleet_statuses(id) ON DELETE RESTRICT,
  status_code text NOT NULL, -- Denormalisasi ('TO', 'OFF', 'SO') untuk performa query cepat
  note text DEFAULT '',      -- Catatan alasan kendala, contoh: 'EVDAL', 'LIBUR', 'Banjir Simpang 5'
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_shift_unit_body UNIQUE (fleet_shift_id, unit_body)
);

CREATE INDEX IF NOT EXISTS idx_daily_fleet_non_sgo_shift_id ON public.daily_fleet_non_sgo_units(fleet_shift_id);
CREATE INDEX IF NOT EXISTS idx_daily_fleet_non_sgo_unit_body ON public.daily_fleet_non_sgo_units(unit_body);
```

---

### 2.4. Row Level Security (RLS) & Audit Policy
- RLS aktif pada seluruh tabel di atas.
- Policy baca & tulis diberikan kepada role `authenticated` dan `anon` (mengikuti konfigurasi aplikasi SS_PDO eksisting).
- Tabel `fleet_status_logs` eksisting tetap dipertahankan sebagai jejak audit riwayat (*append-only log*).

---

## 3. Logika Bisnis & Alur Kerja Lapangan (Workflow)

```
[Buka Modal Status Armada]
          │
          ├──> 1. Prefill Otomatis Target Renops dari `getRenopsForDate` (bisa diedit pengawas)
          ├──> 2. Muat Daftar Unit Rute dari data aktif (Default seluruh unit = SGO)
          │
[Pengawas Menandai Unit Non-SGO]
          │
          ├──> Tap Brush TO  ──> Default Note "TO EVDAL" (Bagian "EVDAL" dapat diedit)
          ├──> Tap Brush OFF ──> Default Note "LIBUR" (Terkunci)
          ├──> Tap Brush SO  ──> Masukkan alasan lapangan (Banjir / Kendala Jalur)
          │
[Kalkulasi Real-Time Otomatis]
          │
          ├──> total_units = Jumlah unit pada rute
          ├──> to_count, off_count, so_count dihitung instan
          ├──> sgo_count = total_units - (to_count + off_count + so_count)
          └──> realops = sgo_count
          │
[Klik "Konfirmasi & Terapkan Status"]
          │
          ├──> 1. Simpan Header ke `daily_fleet_shifts` (is_confirmed = true)
          ├──> 2. Simpan Unit Non-SGO ke `daily_fleet_non_sgo_units`
          ├──> 3. Catat Riwayat ke `fleet_status_logs`
          ├──> 4. KUNCI PERMANEN status shift tersebut (Read-Only)
          └──> (Google Sheets TIDAK disentuh)
```

---

## 4. Alur Integrasi Generator Laporan (WA Report)

Ketika pengguna menekan tombol *Generate Laporan WhatsApp* atau membuka rekap operasional:
1. Sistem mengambil data langsung dari `daily_fleet_shifts` berdasarkan `route_id`, `date`, dan `shift`.
2. Jika berstatus `is_confirmed = true`:
   - `Renops`: Mengambil nilai `target_renops`
   - `Realops`: Mengambil nilai `realops` (`sgo_count`)
   - `Rincian TO`: Mengambil daftar `unit_body (note)` dari `daily_fleet_non_sgo_units` dengan `status_code = 'TO'`.
   - `Rincian OFF`: Mengambil daftar `unit_body (note)` dari `daily_fleet_non_sgo_units` dengan `status_code = 'OFF'`.
   - `Rincian SO`: Mengambil daftar `unit_body (note)` dari `daily_fleet_non_sgo_units` dengan `status_code = 'SO'`.
3. Format teks pesan WA otomatis terbentuk secara instan tanpa perlu menunggu parsing Google Sheets.

---

## 5. Standar Kode & Pencegahan Regresi

1. **Aturan Kamus Teks Sentral (`src/constants/texts/`):**
   - Seluruh label, judul modal, konfirmasi status, badge terkunci, dan pesan toast didefinisikan dalam `src/constants/texts/text_fleet_status.ts`. Dilarang *hardcoded string*.
2. **Kualitas Layanan Data (Service Layer):**
   - Dibuat service terisolasi `src/services/fleetStatusService.ts` untuk memfasilitasi fetch master, fetch status shift, upsert shift, dan fetch non-sgo units.
3. **Locking UX State:**
   - Komponen UI `FleetStatusModal` menampilkan banner penanda "Status Terkunci" apabila shift telah dikonfirmasi, menonaktifkan interaksi brush pada unit, serta menyembunyikan/menonaktifkan tombol simpan ulang.

---

## 6. Rencana Verifikasi & Uji Mutu

1. **Migrasi Database:**
   - File migrasi SQL baru `supabase/migrations/20260921000001_create_fleet_status_tables.sql`.
2. **Unit Testing:**
   - Pengujian fungsi kalkulasi status dan query service di `src/services/fleetStatusService.test.ts`.
   - Pengujian interaksi modal, locking, dan rendering brush di `src/components/fleetStatus/FleetStatusModal.test.tsx`.
3. **Quality Gates:**
   - `pnpm vitest run src/` ➔ 100% lulus tanpa kegagalan.
   - `pnpm run build` ➔ TypeScript Strict (`tsc -b`) dan Vite build 0 error.
   - `graphify update .` ➔ Graf pengetahuan kode diperbarui.
