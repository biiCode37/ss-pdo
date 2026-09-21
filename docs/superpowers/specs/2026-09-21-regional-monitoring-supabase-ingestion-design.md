# 📋 Spesifikasi Desain: Migrasi Sumber Data Monitoring Wilayah dari SS Global ke Supabase Ingestion Engine

**Tanggal Pembuatan:** 2026-09-21  
**Status:** Terkunci & Disetujui Penuh (Bagian 1, 2, 3, dan 4)  
**Branch Wajib:** `devmode`  

---

## 1. Latar Belakang & Masalah

1. **Kerapuhan Spreadsheet Global (SS Global):**
   - Halaman *Monitoring Wilayah* sebelumnya bergantung pada pembacaan langsung spreadsheet konsolidator wilayah (*Salinan dari LAPORAN OPERASI WIL UTARA JULI-DESEMBER_2026*).
   - Logika pembacaan spreadsheet sangat rapuh (*fragile*) karena mengandalkan indeks baris kaku (blok interval 27 baris per tanggal) dan offset kolom statis. Perubahan kecil seperti penyisipan satu baris catatan oleh staf dapat memicu *data drift* atau *crash*.
2. **Konteks Operasional Lapangan:**
   - SS Global **bukanlah dokumen regulasi resmi dari kantor pusat Transjakarta**, melainkan inisiatif internal Koordinator Wilayah (Korwil) & Koordinator Lapangan (Korlap) untuk memantau 18 rute Mikrotrans.
   - Mengganti wadah SS Global dengan database murni di Supabase **tidak melanggar regulasi**, karena pimpinan hanya membutuhkan nilai datanya, bukan format wadahnya.
3. **Kenyataan Pengisian Data Rute:**
   - Masih ada beberapa rute yang pengisian hariannya diketik manual langsung di Google Sheets masing-masing oleh staf lain (belum memakai aplikasi).
   - Oleh karena itu, **18 Google Sheet rute individu adalah sumber data asli (*ground truth*)**, dan database Supabase harus mampu menyerap data dari sheet-sheet individu tersebut.

---

## 2. Bagian 1: Arsitektur & Alur Data (Data Flow) [TERKUNCI]

### 2.1. Eliminasi Total SS Global
* File spreadsheet gabungan (*SS Global*) dan formula `IMPORTRANGE` **dihapus sepenuhnya** dari rantai data aplikasi.
* Tabel database Supabase `daily_route_reports` resmi menjadi wadah tunggal (*Single Source of Truth*) untuk menyajikan data di halaman **Monitoring Wilayah**.

### 2.2. Dual-Ingestion Pipeline (Alur 2 Jalur)

```
[ Jalur A: Pengawas Input via Aplikasi SS_PDO ]
Pengawas isi Form di App ──> Simpan ke Sheet Rute
                           └──> Upsert ke Supabase `daily_route_reports` (Status: 'submitted')

[ Jalur B: Staf Mengisi Manual di Spreadsheet Rute ]
Staf ketik di Sheet Rute 
        │
        ▼ (Korwil klik tombol [🔄 Tarik 18 Rute])
Aplikasi baca Sheet Rute Individu ──> Upsert ke Supabase `daily_route_reports` (Status: 'draft')
                                                    │
                                                    ▼
                                     [ Halaman Monitoring Wilayah ]
                                     (100% Query Bersih dari Supabase)
```

1. **Jalur A (Input Langsung via App):**
   - Pengawas yang input via aplikasi langsung meng-update tabel `daily_route_reports` dan `daily_unit_summaries`. Status rute = `submitted` atau `verified`.
2. **Jalur B (Tarik Data Sheet Rute Individu - Ingestion Engine):**
   - Korlap/Korwil menekan tombol **`[🔄 Tarik 18 Rute]`** pada tanggal aktif di halaman Monitoring Wilayah.
   - Sistem memeriksa rute mana yang belum diinput via aplikasi, membaca ringkasan dari spreadsheet rute masing-masing, lalu menyimpannya ke Supabase.

---

## 3. Bagian 2: Skema Database Supabase & Pemetaan 21 Kolom [TERKUNCI]

### 3.1. Struktur Tabel `daily_route_reports`
Tabel penampung di Supabase mencakup seluruh metrik operasional harian:
* `id` (bigint / primary key)
* `route_id` (foreign key ke `routes.id`)
* `route_code` (varchar, contoh: `"JAK 01"`)
* `date` (date, format `"YYYY-MM-DD"`)
* **Armada:**
  * `renops_shift1` (integer)
  * `realops_shift1` (integer)
  * `renops_shift2` (integer)
  * `realops_shift2` (integer)
* **Penumpang:**
  * `toa_shift1` (integer)
  * `manual_shift1` (integer)
  * `toa_shift2` (integer)
  * `manual_shift2` (integer)
  * `total_passengers` (integer, akumulasi S1 + S2)
* **Kilometer & Ritase:**
  * `total_km` (numeric/float, total KM tempuh seluruh armada rute)
  * `achievement_km` (numeric/float, rata-rata KM per bus)
  * `total_trip` (numeric/float, total ritase harian rute)
* **Status & Metadata:**
  * `status` (`'draft'` | `'submitted'` | `'verified'`)
  * `data_source` (`'app_input'` | `'sheet_ingestion'`)
  * `last_synced_at` (timestamptz)

### 3.2. Pemetaan 1-to-1: 21 Kolom SS Global vs Supabase / Komputasi

| No | Kolom SS Global | Tipe / Contoh | Sumber Data di Supabase | Penanganan Sistem |
|:---|:---|:---|:---|:---|
| 1 | `NO` | `1` | Index baris tabel | UI Index |
| 2 | `RUTE` | `JAK 01` | `routes.route_code` | Tersimpan di DB |
| 3 | `RENOPS` | `20` | `daily_route_reports.renops_shift1` / `routes.default_renops` | Tersimpan di DB |
| 4 | `REALOPS` | `20` | `daily_route_reports.realops_shift1` (jumlah unit jalan) | Tersimpan di DB |
| 5 | `KM TEMPUH` | `3935,30` | `daily_route_reports.total_km` | Tarik dari Sheet Rute |
| 6 | `TOA SHIFT 1` | `2.229` | `daily_route_reports.toa_shift1` | Tarik dari Sheet Rute |
| 7 | `MANUAL SHIFT 1` | `0` | `daily_route_reports.manual_shift1` | Tarik dari Sheet Rute |
| 8 | `TOTAL SHIFT 1` | `2.229` | `toa_shift1 + manual_shift1` | Komputasi Murni |
| 9 | `TOA SHIFT 2` | `2.661` | `daily_route_reports.toa_shift2` | Tarik dari Sheet Rute |
| 10 | `MANUAL SHIFT 2` | `47` | `daily_route_reports.manual_shift2` | Tarik dari Sheet Rute |
| 11 | `TOTAL SHIFT 2` | `2.708` | `toa_shift2 + manual_shift2` | Komputasi Murni |
| 12 | `TOTAL PELANGGAN` | `4.937` | `daily_route_reports.total_passengers` | Tersimpan di DB |
| 13 | `KILOMETER / BUS` | `196,76` | `daily_route_reports.achievement_km` / (`total_km / realops`) | Komputasi Murni / DB |
| 14 | `TARGET PELANGGAN` | `5161` | `routes.target_hk` (target resmi per rute) | Master `routes` |
| 15 | `PERSENTASE PELANGGAN` | `95,66%` | `(total_passengers / target_hk) * 100%` | Komputasi Murni |
| 16 | `TARGET PELANGGAN / KM` | `1,5` | Nilai baku standar Transjakarta (`1.5`) | Konstanta Master |
| 17 | `PERSENTASE PELANGGAN / KM` | `83,64%` | `(pelanggan_per_km / 1.5) * 100%` | Komputasi Murni |
| 18 | `PELANGGAN / KM` | `1,255` | `total_passengers / total_km` | Komputasi Murni |
| 19 | `TOTAL RITASE` | `273,0` | `daily_route_reports.total_trip` | Tarik dari Sheet Rute |
| 20 | `RITASE / BUS` | `13,7` | `total_trip / realops` | Komputasi Murni |
| 21 | `PELANGGAN / BUS` | `247` | `total_passengers / realops` | Komputasi Murni |

> **Prinsip Clean DB (KISS & DRY):**
> Metrik rasio (kolom 8, 11, 15, 17, 18, 20, 21) dihitung secara murni (*pure function*) di sisi frontend/service saat data dibaca, bukan disimpan berulang di database guna mencegah anomali inkonsistensi data.

---

## 4. Bagian 3: Cara Kerja Engine Penarikan Data (Ingestion Engine) [TERKUNCI]

### 4.1. Alur Eksekusi
1. **Trigger Pengguna:** User menekan tombol `[🔄 Tarik 18 Rute]` di halaman Monitoring Wilayah untuk tanggal aktif (`selectedDate`).
2. **Proteksi Status Tombol (Lifecycle State):**
   - Tombol seketika berstatus **`disabled`** dan menampilkan indikator proses (*spinner / loading animation*).
   - Tombol **tetap disabled** selama proses penarikan data berlangsung.
   - Setelah proses tuntas (sukses maupun gagal dengan notifikasi error), tombol otomatis kembali aktif (**`enabled`**).
   - *Tidak ada cooldown timer buatan (bebas dari timer hitung mundur 30 detik)*.
3. **Smart Skip (Penyaringan Cerdas):**
   - Sistem memeriksa Supabase untuk tanggal bersangkutan.
   - Rute yang sudah berstatus `'submitted'` atau `'verified'` (karena sudah diisi via aplikasi) **dilewati (*skipped*)**.
   - Hanya rute yang berstatus `'empty'` atau `'draft'` yang akan ditarik dari spreadsheet.
4. **Controlled Concurrency Batching:**
   - Rute yang perlu ditarik diproses dalam kelompok kecil: **batch 4–5 rute secara paralel** dengan jeda ~250ms.
   - Menghindari lonjakan permintaan (*burst spike*) ke server Google Sheets API.
   - Estimasi waktu total: ~1,5 hingga 3,5 detik untuk seluruh 18 rute.
5. **Targeted Range Read:**
   - Sistem hanya membaca tab tanggal bersangkutan (contoh: tab `"21"`) dan mengambil nilai dari baris rangkuman (Total KM, TOA S1/S2, Manual S1/S2, Ritase, Realops).
6. **Bulk Upsert ke Supabase:**
   - Hasil ekstraksi di-upsert sekaligus ke tabel `daily_route_reports`.
7. **Penyegaran UI:**
   - Layar Monitoring Wilayah memuat ulang data lokal dari Supabase dan menampilkan notifikasi toast keberhasilan (contoh: *"Berhasil menyinkronkan 7 rute dari spreadsheet, 11 rute dari aplikasi"*).

---

## 5. Bagian 4: Penyesuaian Antarmuka (UI/UX Halaman Monitoring Wilayah) [TERKUNCI]

### 5.1. Tombol Sinkronisasi Utama di Header (Direct Action, Zero-Input Modal)
* **Pembersihan Modal Lama:** Modal input teks manual URL spreadsheet global (`showRegionalSyncModal`) dihapus sepenuhnya. Tidak ada lagi dialog popup yang meminta input URL.
* **Penempatan Tombol:** Di header toolbar utama monitoring, bersanding dengan stepper tanggal dan kalender:
  ```
  [ < 21 Sep 2026 > ]    [ 🔄 Tarik 18 Rute ]
  ```
* **Interaksi & Status Tombol:**
  * **Normal State:** Tombol aktif dengan aksen hijau emerald lembut, ikon SVG `RotateCw` 16px, dan label teks `"Tarik 18 Rute"`.
  * **Loading State:** Tombol *disabled*, ikon berganti spinner `Loader2` berputar halus, teks berubah dinamis menjadi `"Menyinkronkan..."`.
  * **Success / Error State:** Tombol kembali *enabled* segera setelah proses tuntas, diiringi toast umpan balik visual yang informatif.

### 5.2. Badge Asal Data (Data Provenance) pada Kartu Rute
Pada setiap kartu rute di tab Dashboard dan tab Rute, disematkan *pill badge* ergonomis untuk transparansi asal data:
* 📱 **`Input App`** *(Aksen Emerald / Hijau Halus)*:
  - Rute diinput langsung oleh petugas pengawas melalui aplikasi SS_PDO (status `submitted` / `verified`).
* 📊 **`Tarik Sheet`** *(Aksen Blue / Sky Halus)*:
  - Rute ditarik otomatis dari Google Sheet individu yang diisi manual di luar aplikasi.
* ⚪ **`Belum Ada Data`** *(Muted Zinc)*:
  - Rute belum diisi baik di aplikasi maupun di Google Sheet pada tanggal tersebut.

### 5.3. Banner Kesiapan Wilayah (At-a-Glance Readiness Bar)
Komponen ringkas di bawah header tanggal yang merangkum kesehatan data 18 rute secara instan:
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🟢 14/18 Rute Terisi  •  10 Input App  •  4 Tarik Sheet  •  4 Menunggu  │
└─────────────────────────────────────────────────────────────────────────┘
```
Pimpinan wilayah dapat langsung mengetahui disiplin penggunaan aplikasi oleh para pengawas tanpa harus menghitung satu per satu.

### 5.4. Toleransi Kegagalan Parsial (Graceful Resilience)
* Jika ada 1 atau 2 spreadsheet rute yang gagal diakses (misal link rusak atau izin akses terbatas):
  * **Tidak Boleh Gagal Total:** Rute lainnya yang berhasil tetap disimpan dan ditampilkan secara utuh ke layar.
  * Sistem memberikan peringatan ramah non-teknis pada kartu rute yang terkendala:
    > *"Lembar spreadsheet JAK 120 tidak dapat diakses (17 rute lainnya berhasil)."*

---

## 6. Standar Kamus Teks Sentral (`src/constants/texts/`)

Sesuai aturan emas proyek, dilarang keras menuliskan teks antarmuka (*hardcoded UI strings*) langsung di komponen. Seluruh teks antarmuka baru wajib didefinisikan di:
* `src/constants/texts/text_monitoring.ts`:
  * `SYNC_BUTTON`: Label normal (`"Tarik 18 Rute"`), loading (`"Menyinkronkan..."`).
  * `PROVENANCE_BADGES`: `"Input App"`, `"Tarik Sheet"`, `"Belum Ada Data"`.
  * `READINESS_SUMMARY`: Template format ringkasan kesiapan rute.
* `src/constants/texts/text_errors.ts`:
  * Pesan error ramah pengguna saat penarikan data sheet gagal/parsial.
* Diverifikasi dengan unit test integritas pada `src/constants/texts/texts.test.ts`.

---

## 7. Quality Gates & Rencana Pengujian

1. **Unit Testing:**
   - Pengujian service ingestion: batching, smart skip, parsing ringkasan rute, dan toleransi error parsial.
   - `pnpm vitest run src/` lulus 100% tanpa kegagalan.
2. **Build & Typecheck:**
   - `pnpm run build` (`tsc -b && vite build`) lulus 0 error.
3. **Knowledge Graph:**
   - Menjalankan `graphify update .` setelah pengerjaan selesai untuk memperbarui graf arsitektur proyek.
