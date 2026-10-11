# Spesifikasi Desain: Perombakan Alur Sumber Data Status Armada, Laporan A2, dan Resolusi Data Wilayah

- **Tanggal Dokumen:** 11 Oktober 2026
- **Status Dokumen:** Disetujui (Approved)
- **Topik:** Overhaul Alur Sumber Data Status Armada (Renops & Realops), Form Laporan A2, dan Integrasi Generator Laporan WA Format 3
- **Branch Kerja:** `devmode`

---

## 1. Latar Belakang & Tujuan

Sebelumnya, penentuan Status Armada (Renops dan Realops) di SS_PDO sangat bergantung pada modal pewarnaan unit (*brush painting* manual) yang kaku dan memperlakukan setiap catatan kendala sebagai pengurang Realops. Hal ini kerap menimbulkan desinkronisasi data, kebingungan petugas di lapangan, dan pemblokiran (*hard lock*) pada pembuatan Laporan WhatsApp Format 3 di tingkat Korlap/Korwil.

**Tujuan Utama Perombakan:**
1. Menyediakan data status armada yang akurat, fleksibel, dan terpercaya bagi **Korlap (Koordinator Lapangan) dan Korwil (Koordinator Wilayah)** untuk monitoring 18 rute dan pembuatan **Laporan WhatsApp Format 3**.
2. Mengakomodasi **3 jalur sumber data** dengan hierarki evaluasi otomatis yang tangguh (*hybrid resolution fallback chain*).
3. Mengadopsi prinsip operasional nyata: **Realisasi operasi (Realops) dihitung berdasarkan fakta berjalannya unit (ritase/trip)**, dan bersifat **kumulatif harian (*monotonic non-decreasing*)**.
4. Menyediakan **Form Laporan A2** mandiri yang terfokus bagi Petugas PDO per shift.
5. Menyembunyikan akses komponen laporan lama (`RouteOperationalReportCard.tsx`) dari antarmuka pengguna tanpa menghapus kodenya.

---

## 2. Prinsip & Aturan Bisnis Domain Operasional

### 2.1 Prinsip Realops Berbasis Data Fisik Ritase
- Setiap unit bus yang memiliki nilai pada kolom ritase/trip di spreadsheet ($> 0$, bukan `0`, bukan `null`, bukan string kosong) **sah terhitung sebagai unit yang REALOPS** (nyata beroperasi melayani lintasan).
- Adanya catatan atau kendala teknis (seperti `BA.01 Radiator pecah`, `TO EVDAL`, dll.) pada unit yang memiliki ritase **TIDAK MENGURANGI jumlah Realops**, melainkan dicatat sebagai **Catatan Kejadian Operasional / Kendala** pada laporan per shift.
- Unit yang **TIDAK REALOPS** adalah unit yang nilai ritase/trip-nya $= 0$, `null`, atau kosong (seperti unit libur berkala `OFF` atau stop operasi `SO`).

### 2.2 Prinsip Realops Kumulatif Harian (*Monotonic Non-Decreasing*)
- Operasional unit dihitung dalam rentang siklus 1 hari penuh (hari kalender).
- **Shift 1 Beroperasi, Shift 2 Tidak Beroperasi:**
  Jumlah Realops **TIDAK BERKURANG** pada Shift 2 karena unit tersebut sudah tercatat melayani pelanggan di hari itu. Yang diperbarui hanyalah catatan/status pada unit tersebut di Shift 2.
- **Shift 1 Tidak Beroperasi, Shift 2 Beroperasi (Unit Pelengkap / Telat Start):**
  Jumlah Realops **BERTAMBAH (+1)** pada Shift 2. Pada Laporan WA Format 3 dan Laporan A2, unit ini ditandai sebagai *unit pelengkap renops / keterlambatan operasional / keterlambatan start awal*.
- **Formula Mutlak:**
  $$\text{Realops}_{\text{Shift 2}} \ge \text{Realops}_{\text{Shift 1}}$$
  *(Angka Realops tidak pernah turun antar-shift dalam satu hari kalender).*

---

## 3. Hierarki 3 Jalur Sumber Data (*Data Resolution Fallback Chain*)

Ketika Korlap/Korwil membuka halaman Monitoring Status Armada atau memicu pembuatan Laporan WhatsApp Format 3, sistem memeriksa status kelengkapan data per rute dengan hierarki berikut:

```
[Pemeriksaan Data Rute untuk Shift & Tanggal Terpilih]
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ PRIORITAS 1 (UTAMA): Laporan A2 Petugas PDO per Shift            │
│ • Cek apakah Petugas PDO telah mengirim Laporan A2 di rute ini. │
│ • Jika ADA ➔ Gunakan data Renops, Realops, & catatan unit.      │
│ • Status: "Laporan A2 Petugas (Lengkap)"                        │
└───────────────────────────────┬─────────────────────────────────┘
                                │ (Jika Belum Ada Laporan A2)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ PRIORITAS 2 (FALLBACK AUTO): Kolom Ritase/Trip Spreadsheet Asli │
│ • Cek kolom tripPergi / tripPulang pada file spreadsheet rute.  │
│ • Jika ADA (> 0) ➔ Hitung Realops = total unit beritase,       │
│   dan tarik catatan dari kolom Keterangan unit terkait.         │
│ • Status: "Otomatis Spreadsheet (Lengkap)"                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │ (Jika Spreadsheet Belum Ada Data)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ PRIORITAS 3 (KEPUTUSAN KORLAP/KORWIL): Intervensi Manual        │
│ • Rute ditandai: "Belum Ada Data / Menunggu Tindakan"           │
│ • Korlap/Korwil memiliki opsi:                                  │
│   A. Memerintahkan Petugas PDO mengirim Laporan A2 / isi sheet. │
│   B. Korlap/Korwil langsung menginput Renops, Realops, dan      │
│      catatan secara manual di tempat (Override Cepat).          │
│ • Status pasca-input: "Input Manual Korlap (Lengkap)"           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Desain Antarmuka & Interaksi Pengguna (UI/UX)

### 4.1 Form Laporan A2 Petugas PDO (Komponen Baru)
- **Peran:** Form pelaporan resmi petugas pengawas rute di pool per shift.
- **Struktur Form:**
  1. **Header:** Rute, Tanggal, Pilihan Shift (Shift 1 / Shift 2), Nama/Email Petugas.
  2. **Angka Operasional:**
     - `Target Renops` (angka, prefilled dari kalender/jadwal rute, dapat disesuaikan).
     - `Realisasi Realops` (angka unit beroperasi riil).
  3. **Daftar Unit dengan Catatan / Kendala (Model Opsi C Fleksibel):**
     - Aplikasi secara cerdas menarik unit-unit yang kolom Keterangannya sudah terisi di spreadsheet rute sebagai **draft awal**.
     - Petugas bebas **mengedit** teks catatan yang ditarik otomatis tersebut.
     - Petugas bebas **menghapus** unit yang tidak relevan.
     - Petugas bebas **menambah unit baru** secara manual (memilih unit dari daftar armada rute + mengetik catatannya).
     - Unit yang berstatus normal (SGO murni tanpa catatan) tidak perlu dimasukkan ke daftar ini.
  4. **Aksi:** Tombol `[ Kirim Laporan A2 Shift X ]`.

### 4.2 Penyembunyian Komponen Lama (`RouteOperationalReportCard.tsx`)
- Komponen `RouteOperationalReportCard.tsx` **disembunyikan (hide) sepenuhnya dari antarmuka pengguna** (tidak ditampilkan dan akses tombol pemicunya dihilangkan).
- File dan kode komponen tetap dipertahankan di repositori untuk referensi masa depan jika format laporan pimpinan sudah ditetapkan secara final.

### 4.3 Input Cepat untuk Korlap/Korwil (Jalur 3 - Opsi 3 Terpadu)
Tersedia di dua titik strategis:
1. **Shortcut di dalam Modal Laporan WA Format 3:**
   - Pada daftar rute yang berstatus *"Belum Ada Data"*, terdapat tombol ringkas `[ + Isi Data Rute ]`.
   - Mengklik tombol ini membuka dialog cepat untuk memasukkan Renops, Realops, dan catatan unit rute tersebut tanpa perlu menutup atau keluar dari modal laporan WA.
2. **Kartu Rute di Tab Status Armada (Monitoring Wilayah):**
   - Pada kartu rute yang belum memiliki data Laporan A2 maupun data spreadsheet, tersedia tombol `[ Kelola Status Armada ]` / `[ Input Data Korlap ]`.

---

## 5. Arsitektur Data & Skema Database (Supabase)

Mengadopsi **Pendekatan 1 (Unified Fleet Shift Model)**:

### 5.1 Tabel `daily_fleet_shifts`
Menyimpan ringkasan status per rute, tanggal, dan shift:
- `id` (bigint, PK)
- `route_id` (bigint, FK routes)
- `route_code` (text)
- `date` (date)
- `shift` (smallint, 1 | 2)
- `target_renops` (integer)
- `realops` (integer)
- `total_units` (integer)
- `source_type` (text): `'pdo_a2' | 'spreadsheet_auto' | 'korlap_manual'`
- `submitted_by_role` (text): `'pdo' | 'korlap' | 'korwil' | 'system'`
- `is_confirmed` (boolean, default true)
- `user_id` (bigint, FK user_profiles)
- `confirmed_at` (timestamptz)
- `created_at`, `updated_at` (timestamptz)
- **Constraint Unik:** `UNIQUE(route_id, date, shift)`

### 5.2 Tabel `daily_fleet_non_sgo_units`
Menyimpan daftar unit yang memiliki kendala/catatan khusus untuk shift tersebut:
- `id` (bigint, PK)
- `fleet_shift_id` (bigint, FK daily_fleet_shifts ON DELETE CASCADE)
- `unit_body` (text)
- `status_code` (text, misal: `'BA.01'`, `'BA.02'`, `'TO'`, `'OFF'`, `'SO'`, `'OTHER'`)
- `note` (text, deskripsi catatan kendala)
- `created_at` (timestamptz)

---

## 6. Integrasi Generator Laporan WhatsApp Format 3

### 6.1 Status Kelengkapan 18 Rute (*Unblocking Gate*)
- Generator Laporan WA Format 3 memeriksa ke-18 rute wilayah.
- Rute dinyatakan **LENGKAP** jika datanya terpenuhi melalui salah satu dari 3 jalur (Laporan A2, Otomatis Spreadsheet, atau Input Manual Korlap).
- Tombol `[ Salin Teks ]` dan `[ Buka WhatsApp ]` aktif jika seluruh rute sudah memiliki data (atau Korlap telah menyelesaikan rute yang kosong via input cepat).

### 6.2 Format Pesan Teks WA Format 3
Teks laporan WhatsApp memuat:
1. **Header Eksekutif:** Hari, Tanggal, Shift (Pagi/Siang).
2. **Ringkasan Wilayah:** Target SGO (Renops), Realisasi Ops (Realops), Tidak Ops, % Ketercapaian, Jumlah Rute Lengkap/Kurang.
3. **Rincian per Rute:**
   - Target SGO, Realisasi Ops, Tidak Ops, Status Rute.
   - Daftar unit berkendala (beserta catatannya).
   - Khusus Shift 2: Unit yang baru jalan di Shift 2 ditandai sebagai unit pelengkap renops/keterlambatan operasional.

---

## 7. Rencana Tahapan Eksekusi Bertahap (Implementation Phases)

1. **Fase 1: Database Migration & Service Layer**
   - Tambahkan kolom `source_type` dan `submitted_by_role` pada tabel `daily_fleet_shifts`.
   - Buat fungsi evaluasi resolusi data 3 jalur (`resolveRouteFleetData`).
   - Buat unit test komprehensif untuk mesin resolusi data.

2. **Fase 2: Komponen Form Laporan A2 & Penyembunyian Form Lama**
   - Buat komponen `A2ReportModal.tsx` / `A2ReportForm.tsx` untuk Petugas PDO (dukungan prefill dari spreadsheet + edit/tambah unit).
   - Sembunyikan (hide) tampilan dan akses tombol `RouteOperationalReportCard.tsx` dari antarmuka pengguna.
   - Unit test untuk form Laporan A2.

3. **Fase 3: Shortcut Input Cepat Korlap/Korwil**
   - Tambahkan aksi input cepat pada Modal WA Report Format 3 (`WaReportModal.tsx`).
   - Tambahkan aksi input cepat pada tab Status Armada Monitoring (`MonitoringFleetStatusTab.tsx`).

4. **Fase 4: Penyelarasan Generator WA Format 3 & Verifikasi End-to-End**
   - Hubungkan generator WA Format 3 dengan data dari mesin resolusi data.
   - Verifikasi pengujian unit test dan TypeScript build lulus 100%.
