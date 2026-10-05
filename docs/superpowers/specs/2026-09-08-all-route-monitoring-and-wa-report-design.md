# Spesifikasi Desain: Dashboard Monitoring All Route & Generator Laporan WhatsApp Harian

**Tanggal:** 2026-09-08  
**Status:** Approved by User  
**Target Branch:** `devmode`  

---

## 1. Latar Belakang & Tujuan

Berdasarkan analisis file master `LAPORAN OPERASI WIL UTARA JULI-DESEMBER_2026.xlsx`, operasional Mikrotrans Wilayah Jakarta Utara mencakup **18 rute** yang dibina oleh 3 Koordinator Lapangan (Korlap):
1. **Ranto Lumban Toruan:** JAK 60, JAK 76, JAK 77, JAK 113, JAK 118, JAK 120.
2. **Abdul Manan:** JAK 05, JAK 15, JAK 58, JAK 110A, JAK 115, JAK 117.
3. **Moamar Z.A. Mahu:** JAK 01, JAK 29, JAK 87, JAK 88, JAK 89, JAK 90.

Saat ini, rekapitulasi harian di Google Sheets bergantung pada ribuan formula `IMPORTRANGE` yang lambat, rentan kuota, dan sering menghasilkan `#ERROR!`. Selain itu, setiap malam Korlap/Korwil harus merangkum data operasional lapangan untuk dikirimkan ke grup WhatsApp pimpinan dengan dua format standar Transjakarta:
* **Format 1:** Laporan Jumlah Pelanggan & Pencapaian KM Harian (Lengkap: Komparasi Kemarin, Minggu Lalu, Target HK, Best Record, Renops, Realisasi, Titik Kemacetan, Headway).
* **Format 2:** Laporan Pelanggan Rincian Shift (`[TOA] + [MANUAL] = JUMLAH`) beserta rekapitulasi total wilayah.

### Tujuan Utama:
1. Menyediakan **Dashboard Monitoring All Route** terpisah khusus untuk pimpinan/Korlap yang menampilkan status kelengkapan 18 rute dan agregat KPI wilayah secara instan (< 1 detik).
2. Memfasilitasi petugas **PDO di tiap rute** untuk menginput data fisik lapangan per shift: RENOPS, REALOPS, Headway tercepat/terlama, Titik Kemacetan, dan Kendala Operasional.
3. Menyediakan **Generator Laporan WhatsApp Otomatis** dengan 1 klik salin (*copy to clipboard*) atau langsung membuka WhatsApp, siap kirim ke pimpinan tanpa perlu ketik manual.

---

## 2. Arsitektur Data & Skema Database (Supabase)

Pendekatan menggunakan **Snapshot Terintegrasi di Supabase** memanfaatkan tabel yang sudah ada secara efisien.

### 2.1. Perluasan Tabel `public.routes`
Menambahkan kolom parameter rute baku dari dokumen master ke tabel `routes` yang sudah ada:
* `operator_name` (`text`): Koperasi operator (`KWK`, `KLM`, `KMJ`, `LSG`).
* `is_looping` (`boolean`, default: `false`): Tipe trayek melingkar.
* `km_baku` (`numeric`): Panjang trayek PP resmi dalam KM (misal: JAK 01 = `14.415`, JAK 15 = `29.603`).
* `target_hk` (`integer`): Target kuota penumpang Hari Kerja (misal: JAK 15 = `11.164`).
* `best_record` (`integer`): Rekor penumpang tertinggi yang pernah dicapai.
* `default_renops` (`integer`): Rencana operasi unit standar.
* `supervisor_name` (`text`): Nama Korlap pengampu (`RANTO LUMBAN TORUAN`, `ABDUL MANAN`, `MOAMAR. Z.A. MAHU`).
* `default_traffic_jam_spots` (`text[]`): Daftar ruas jalan rawan macet standar rute tersebut sebagai opsi checklist cepat.

### 2.2. Tabel Baru: `public.daily_route_reports`
Tabel untuk mencatat laporan harian yang diisi oleh petugas PDO:
* `id` (`bigint`, Generated Always as Identity, Primary Key).
* `route_id` (`bigint`, Foreign Key ke `routes(id)`).
* `route_code` (`text`, referensi cepat kode rute).
* `date` (`date`, tanggal operasional).
* `renops_shift1` (`integer`, wajib diisi manual oleh PDO).
* `realops_shift1` (`integer`, wajib diisi manual oleh PDO).
* `renops_shift2` (`integer`, wajib diisi manual oleh PDO).
* `realops_shift2` (`integer`, wajib diisi manual oleh PDO).
* `headway_fastest` (`integer`, menit).
* `headway_slowest` (`integer`, menit).
* `traffic_jam_spots` (`text[]`, daftar titik kemacetan yang dialami hari itu).
* `operational_issues` (`text`, catatan kendala operasional / realisasi berkurang).
* `status` (`text`, check `status in ('draft', 'submitted', 'verified')`, default: `'draft'`).
* `submitted_by` (`text`, email/nama petugas PDO pelapor).
* `verified_by` (`text`, email/nama Korlap/pimpinan verifikator).
* `created_at` (`timestamptz`, default `now()`).
* `updated_at` (`timestamptz`, default `now()`).
* Unique constraint: `UNIQUE(route_id, date)`.

---

## 3. Alur Kerja & Antarmuka Pengguna (UI/UX)

### 3.1. Halaman Operasional Rute (Sisi Petugas PDO)
* Menambahkan kartu expandable / bottom sheet: **"Laporan Operasional Rute"**.
* Form input:
  1. **Armada Operasi (Manual per Shift):**
     * Shift 1: Renops & Realops (unit).
     * Shift 2: Renops & Realops (unit).
  2. **Indikator Headway:**
     * Headway Tercepat & Terlama (menit).
  3. **Kendala & Titik Macet:**
     * Checklist pilihan cepat ruas jalan macet (diambil dari `default_traffic_jam_spots`) + tombol tambah manual.
     * Catatan kendala operasional (misal: "Realisasi berkurang karena kendala teknis").
  4. **Tombol "Kirim Laporan Operasional":**
     * Menyimpan ke `daily_route_reports` dan mengubah status menjadi `submitted`.

### 3.2. Halaman Dashboard Monitoring All Route (Sisi Korlap / Pimpinan)
* **Halaman Mandiri:** Terpisah dari dashboard rute tunggal.
* **Header & Kontrol Tanggal:** Pemilih tanggal operasional (default hari ini, bisa pilih tanggal mundur).
* **Filter Korlap (Horizontal Tabs):**
  * `Semua Rute (18)`
  * `Ranto L.T. (6)`
  * `Abdul Manan (6)`
  * `Moamar Z.A. (6)`
* **Status Kelengkapan Wilayah:** Progress bar & counter (cth: *"16/18 Rute Siap (88%)"*).
* **Kartu KPI Wilayah:** Total Realops/Renops, Total Penumpang vs Target, Total KM Tempuh, dan Komparasi Shift.
* **All-Route List/Grid Cards:**
  * Menampilkan 18 rute dengan badge status: 🟢 `Submitted`, 🟡 `Draft`, ⚪ `Belum Input`, 🔵 `Verified`.
  * Rincian cepat: Realops/Renops, Penumpang (% Target), KM/Bus, dan ringkasan kendala.
  * Tombol aksi konfirmasi/verifikasi cepat per rute.
* **Floating Action Button:** **"📲 Generate Laporan WA"**.

---

## 4. Generator Laporan WhatsApp (Format 1 & Format 2)

Modal pembuat pesan WhatsApp yang diakses dari Dashboard Monitoring:

### 4.1. Fitur Generator
1. **Pilihan Format:**
   * **Format 1: Komprehensif (Pelanggan & KM):**
     Memuat Hari/Tanggal, daftar rute (Hari Ini, Kemarin, Minggu Lalu, Target HK, Best Record, %, KM Tempuh/Bus, KM Baku, Renops, Realisasi, Titik Kemacetan, dan Headway).
   * **Format 2: Rincian Shift (TOA + Manual):**
     Memuat rincian `[TOA] + [MANUAL] = JUMLAH` per rute untuk Shift 1 & 2, serta rekapitulasi total akumulasi wilayah di bagian bawah.
2. **Pilihan Lingkup:**
   * `Seluruh Wilayah (18 Rute)` atau filter khusus per Korlap (6 Rute).
3. **Logika Otomatisasi:**
   * **Hari Ini ($H$):** Dari laporan tanggal aktif.
   * **Kemarin ($H-1$):** Otomatis ditarik dari snapshot H-1.
   * **Minggu Lalu ($H-7$):** Otomatis ditarik dari snapshot H-7.
4. **Validasi Ramah Pengguna:** Peringatan jika ada rute yang belum selesai input, dengan fallback tanda `-` tanpa merusak format pesan.
5. **Aksi Eksekusi:**
   * Tombol **"📋 Salin ke Clipboard"**.
   * Tombol **"💬 Buka WhatsApp"** (`wa.me` / deep link).

---

## 5. Rencana Migrasi Data Awal (18 Rute)

Data master diinjeksi ke tabel `routes` melalui SQL Migration:

| Kode Rute | Nama Lintasan Trayek | Operator | Looping | KM Baku | Target HK | Best Record | Renops | Korlap Pengampu |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **JAK 01** | TANJUNG PRIOK - PLUMPANG | KOLAMAS | Ya | 14.415 | 5.161 | 5.201 | 20 | MOAMAR. Z.A. MAHU |
| **JAK 05** | SEMPER - ROROTAN | KWK | Ya | 30.897 | 7.315 | 6.384 | 33 | ABDUL MANAN |
| **JAK 15** | TANJUNG PRIOK - RUSUN MARUNDA | KWK | Tidak | 29.603 | 11.164 | 10.207 | 60 | ABDUL MANAN |
| **JAK 29** | TANJUNG PRIOK - RUSUN SUKAPURA | KWK | Tidak | 25.089 | 13.817 | 12.139 | 42 | MOAMAR. Z.A. MAHU |
| **JAK 58** | RUSUN PADAT KARYA - ISLAMIC CENTRE | KWK | Ya | 30.713 | 9.354 | 8.120 | 40 | ABDUL MANAN |
| **JAK 60** | KELAPA GADING - RUSUN KEMAYORAN | KWK | Ya | 33.740 | 6.853 | 5.858 | 35 | RANTO LUMBAN TORUAN |
| **JAK 76** | ASMI - JL. INDUSTRI | KMJ | Ya | 26.805 | 1.580 | 2.770 | 44 | RANTO LUMBAN TORUAN |
| **JAK 77** | TANJUNG PRIOK - JEMBATAN ITEM (JIS) | KMJ/KLM | Tidak | 23.840 | 6.622 | 7.654 | 32 | RANTO LUMBAN TORUAN |
| **JAK 87** | RAWAMANGUN - TANJUNG PRIOK | LSG | Tidak | 37.414 | 4.796 | 3.327 | 30 | MOAMAR. Z.A. MAHU |
| **JAK 88** | TANJUNG PRIOK - ANCOL BARAT | KMJ | Ya | 24.792 | 5.887 | 5.434 | 30 | MOAMAR. Z.A. MAHU |
| **JAK 89** | TANJUNG PRIOK - TAMAN KOTA INTAN | KMJ | Ya | 21.463 | 3.569 | 3.430 | 28 | MOAMAR. Z.A. MAHU |
| **JAK 90** | TANJUNG PRIOK - RUSUN KEMAYORAN | KMJ | Ya | 29.628 | 3.801 | 3.488 | 24 | MOAMAR. Z.A. MAHU |
| **JAK 110A** | RUSUN MARUNDA - PULO GEBANG | KWK | Tidak | 41.205 | 8.345 | 5.903 | 30 | ABDUL MANAN |
| **JAK 113** | RUSUN SINDANG - KAMPUNG SAWAH | KWK | Ya | 19.985 | 8.101 | 6.705 | 30 | RANTO LUMBAN TORUAN |
| **JAK 115** | PEGANGSAAN 2 IGI - TANJUNG PRIOK | KWK | Ya | 28.443 | 8.239 | 7.389 | 30 | ABDUL MANAN |
| **JAK 117** | TANJUNG PRIOK - TANAH MERDEKA | KWK | Tidak | 26.155 | 9.877 | 8.273 | 33 | ABDUL MANAN |
| **JAK 118** | TAMAN WADUK PAPANGGO - KOTA TUA | KWK | Ya | 26.038 | 9.201 | 8.390 | 30 | RANTO LUMBAN TORUAN |
| **JAK 120** | JIS - TERMINAL MUARA ANGKE | KWK AC | Ya | 43.465 | 2.717 | 2.639 | 15 | RANTO LUMBAN TORUAN |

---

## 6. Hak Akses & Keamanan

1. **Role `petugas`:** Akses edit data bus harian dan form laporan rute sendiri. Akses Dashboard All Route bersifat *View-Only*.
2. **Role `admin` & `superadmin` (Korlap/Korwil):** Akses penuh ke Dashboard All Route, hak konfirmasi/verifikasi data, dan hak akses Generator Laporan WhatsApp.
3. **Sanitasi Output:** Proteksi string WhatsApp dari karakter berbahaya dan pencegahan XSS saat ditampilkan di antarmuka web.

---

## 7. Rencana Pengujian & Quality Gates

* **Unit Testing:**
  * Pengujian parser dan formatter teks WhatsApp (memverifikasi Format 1 dan Format 2 tepat 100% sama dengan template).
  * Pengujian kalkulasi komparasi H-1 dan H-7.
  * Pengujian agregasi nilai Realops/Renops per shift dan total penumpang.
* **Integrasi & Skema Database:**
  * Verifikasi query migrasi kolom `routes` dan pembuatan tabel `daily_route_reports`.
* **Standard Quality Gates:**
  * `pnpm vitest run src/` $\rightarrow$ 100% lulus.
  * `pnpm run build` $\rightarrow$ 0 error typecheck / strict mode.
  * `graphify update .` $\rightarrow$ Graf pengetahuan kode diperbarui.
