# AUDIT BUGS — Anomali Data Renops/Realops 20/20 Rute JAK.01 & Format 3 WA (Refactor 149)

Tanggal Audit: 19 Oktober 2026  
Status Eksekusi: **AUDIT ONLY (Belum Ada Modifikasi Kode Sumber)**  
Branch: `devmode`  
Kasus: Rute JAK.01 Tanggal 19 Oktober 2026 menampilkan Renops/Realops 20/20 di Monitoring Rute & WA Format 3, padahal Laporan A2 belum disubmit dan di Sheet rute asli unit KLM 556 ritase kosong (seharusnya Renops 20 / Realops 19).

---

## 1. Ringkasan Investigasi Faktual Lapangan

Berdasarkan inspeksi data langsung ke Google Sheets rute asli JAK.01 (Spreadsheet ID: `1SNFw19334BarQXPzYe8ZbMlpLg2esYSzTNwNl_TT5Ag`, Tab: `19`) dan database Supabase (`daily_route_reports` row ID 4729):

1. **Fakta Lembar Spreadsheet Rute Asli (SSOT Mikro - Tab 19):**
   - Total armada terdaftar: **20 unit bus** (KLM 540 s.d. KLM 2056).
   - **19 unit bus** beroperasi normal dengan capaian trip (13–15 trip).
   - **Tepat 1 unit (KLM 556, Baris 12) memiliki Trip Pergi = `""` (kosong), Trip Pulang = `""` (kosong), Total KM = `0`, dan Keterangan = `"PERBAIKAN MESIN "`**.
   - Total Pelanggan riil: **1.676 penumpang**.
   - Total KM riil: **3.784,473 km** (bukan 4.036 km).
   - KM/Bus riil: **199,18 km/bus** (yaitu 3.784,473 km / 19 unit aktif).
   - **Realops Lapangan Riil = 19 Unit, Tidak Ops = 1 Unit (KLM 556).**

2. **Fakta Data di Database Supabase (`daily_route_reports` ID 4729):**
   - `renops_shift1`: `20`
   - `realops_shift1`: `20`
   - `renops_shift2`: `20`
   - `realops_shift2`: `20`
   - `total_km`: `"4036.2"`
   - `achievement_km`: `"201.81"` (4036.2 / 20)
   - `total_passengers`: `0`
   - `total_trip`: `"280"`
   - `data_source`: `"sheet_ingestion"`
   - `status`: `"draft"`
   - `last_synced_at`: `2026-10-18 18:24:16 UTC` (Jam **01:24 WIB Dini Hari**).

---

## 2. Rincian Temuan Masalah & Akar Penyebab (Root Cause Analysis)

### BUG-149-01: Kontaminasi Data Rencana Awal dari Master Spreadsheet Global
- **Lokasi Kode:** `src/services/monthlyMasterIngestionService.ts` (baris 460–507) & `src/services/allRouteMonitoringService.ts` (baris 780–812)
- **Keparahan:** High (Data Misinformation)
- **Akar Masalah:**
  Pada dini hari (01:24 WIB), terjadi penarikan data dari Spreadsheet Rekap Global Wilayah bulanan. Pada tanggal 19 Oktober, spreadsheet rekap global wilayah belum memuat data capaian aktual sore/malam hari, melainkan masih berisi **angka rencana/template awal**: Renops 20, Realops 20, Total KM 4.036,2 km (20 bus x 201,81 km), dan Penumpang 0. Data rencana ini di-upsert ke `daily_route_reports` sebagai `sheet_ingestion`.
- **Dampak:** Monitoring wilayah menganggap rute JAK.01 sudah memiliki data realisasi 20 bus beroperasi penuh dengan total KM 4.036 km padahal penumpang masih 0.

---

### BUG-149-02: `regionalIngestionService.ts` Tidak Menyimpan Snapshot Unit Non-SGO
- **Lokasi Kode:** `src/services/regionalIngestionService.ts` (baris 221–245)
- **Keparahan:** Critical (Data Loss & Format WA Bocor)
- **Akar Masalah:**
  Saat proses penarikan dari Spreadsheet rute individu dijalankan, servis mendeteksi unit yang aktif vs tidak aktif. Namun, servis **TIDAK PERNAH menyimpan daftar unit Non-SGO** ke kolom `fleet_status_shift1` dan `fleet_status_shift2` pada tabel `daily_route_reports`.
- **Dampak:** Kolom `fleet_status_shift1` di database tetap bernilai `NULL` / kosong `[]`. Akibatnya, modul pembuat laporan WhatsApp Format 3 (`MonitoringWaReportTab.tsx`) menganggap tidak ada unit yang bermasalah (`ssNonSgo = []`), sehingga menghitung `Tidak Ops: 0 Unit` dan memberi label `Status: LENGKAP ✅`, menutupi fakta bahwa KLM 556 sedang perbaikan mesin.

---

### BUG-149-03: Kriteria Unit Aktif Mengabaikan Definisi Ritase Murni
- **Lokasi Kode:** `src/services/regionalIngestionService.ts` (baris 178–183)
- **Keparahan:** High (Logic Flaw)
- **Akar Masalah:**
  Kriteria saat ini:
  ```ts
  const hasActivity = (km1 + km2 > 0) || (toaS1 + toaS2 > 0) || (trip1 + trip2 > 0);
  ```
  Pada beberapa spreadsheet, jika kolom KM Awal dan KM Akhir terisi angka odometer rollover kemarin atau selisih stabling di pool, bus tanpa ritase (trip = 0) dapat keliru dianggap aktif beroperasi (`activeBuses++`). Sesuai aturan operasional, bukti utama unit beroperasi (Realops) adalah **memiliki ritase/trip > 0**.

---

### BUG-149-04: Penyamarataan Realops Seharian ke Shift 1 dan Shift 2
- **Lokasi Kode:** `src/services/regionalIngestionService.ts` (baris 225–228)
- **Keparahan:** Medium
- **Akar Masalah:**
  Servis menghitung satu angka `realops` akumulatif, lalu menyimpannya langsung ke kedua shift:
  ```ts
  renops_shift1: route.default_renops || 0,
  realops_shift1: realops,
  renops_shift2: route.default_renops || 0,
  realops_shift2: realops,
  ```
  Saat penarikan di siang hari (Shift 1), Shift 2 otomatis terisi angka yang sama padahal Shift 2 belum berjalan.

---

### BUG-149-05: Ambiguitas UX Badge "Tarik Sheet" di Kartu Monitoring
- **Lokasi Kode:** `src/components/monitoring/tabs/MonitoringRouteCardModern.tsx` (baris 162–180)
- **Keparahan:** Low (UX Confusion)
- **Akar Masalah:**
  Elemen bertuliskan "Tarik Sheet" pada kartu rute sebenarnya adalah *provenance badge* (label sumber data), namun penampilannya menyerupai tombol aksi sekunder. Pengguna mengira bahwa tombol tersebut dapat ditekan untuk menarik sheet rute terkait secara independen.
