# REPAIR REPORT: FLEET STATUS FLOW, MULTI-SHIFT NOTES, NON-BLOCKING CARD, & DYNAMIC RENOPS (REFACTOR 25)

Dokumen ini mencatat implementasi arsitektur, tabel perbandingan Before vs After, dan skenario lapangan relevan untuk fitur konfirmasi status armada per shift, pencatatan multi-shift compound notes, kartu bus non-blocking, serta engine target Rencana Operasi (Renops) dinamis pada SS_PDO.

---

## 1. IMPLEMENTASI PERBAIKAN

### 1.1 Dynamic Renops Database & Holiday Engine
- **File Dibuat / Diubah:**
  - `supabase/migrations/20260909000001_dynamic_renops.sql`
  - `src/types/supabase.ts`
  - `src/utils/holidayUtils.ts` & `src/utils/holidayUtils.test.ts`
- **Tindakan:**
  - Menambahkan kolom `renops_weekday`, `renops_saturday`, `renops_sunday`, dan `renops_holiday` ke tabel `public.routes`.
  - Mengembangkan fungsi `getRenopsForDate(route, dateStr)` yang mendeteksi hari kerja (Senin–Jumat), Sabtu, Minggu, atau Hari Libur Nasional Indonesia (kalender cuti bersama/libur resmi).
  - Menyediakan fallback aman ke `default_renops` bila konfigurasi spesifik hari belum diisi petugas admin.

### 1.2 Multi-Shift Keterangan Standard Delimiter & Color Detection
- **File Dibuat / Diubah:**
  - `src/utils/keteranganUtils.ts` & `src/utils/keteranganUtils.test.ts`
  - `src/utils/sheetColorUtils.ts` & `src/utils/sheetColorUtils.test.ts`
- **Tindakan:**
  - Menetapkan standar penggabungan multi-shift dengan pemisah `" | "`:
    - Shift 1 `BA.01`, Shift 2 `TO EVDAL` ➔ `"BA.01 | TO EVDAL"`
    - Shift 1 `SGO`, Shift 2 `OFF` ➔ `"OFF"`
    - Keduanya SGO ➔ `""` (string kosong).
  - Menyediakan fungsi utilitas `combineShiftKeterangan(s1, s2)` dan `splitShiftKeterangan(combinedNote)`.
  - Memperbarui parser warna sel spreadsheet (`sheetColorUtils.ts`) sehingga jika baris memiliki teks compound `" | "`, sistem warna secara otomatis memprioritaskan warna paling kritis (Biru Langit untuk BA, Merah Cerah untuk TO, Kuning untuk OFF). Jika string kosong (`""`), baris tetap normal tanpa highlight.

### 1.3 Shift Confirmation Alert Bar
- **File Dibuat / Diubah:**
  - `src/components/fleetStatus/ShiftConfirmationAlertBar.tsx` & `.test.tsx`
  - `src/index.css`
- **Tindakan:**
  - Membuat bar alert ramping (~38px) dengan aksen amber/kuning transparan, ikon lonceng bergetar halus, label shift aktif (Shift 1 pagi atau Shift 2 siang), serta tombol aksi cepat `[ Konfirmasi ]`.
  - Alert bar otomatis menghilang saat shift tersebut sudah dikonfirmasi di database Supabase atau saat hari/rute berganti.

### 1.4 Full-Screen Interactive Fleet Status Modal
- **File Dibuat / Diubah:**
  - `src/components/fleetStatus/FleetStatusModal.tsx` & `.test.tsx`
  - `src/components/RouteSelectorCard.tsx` & `.test.tsx`
  - `src/components/Dashboard.tsx`
- **Tindakan:**
  - Membuat modal layar penuh dengan isolasi scroll latar belakang (*body scroll lock*) dan DOM portal ke `document.body`.
  - Menghadirkan **Brush Mode** (`[SGO]`, `[OFF]`, `[TO]`, `[BA]`): petugas cukup memilih kuas status di toolbar atas lalu mengetuk kartu-kartu bus di grid untuk mengubah statusnya secara instan.
  - Menghadirkan tombol `[ ⚡ SGO Semua Unit ]` untuk mereset seluruh armada menjadi siap guna dalam 1 ketukan.
  - Dock status di bawah menghitung secara real-time: Total Armada, SGO, Non-SGO, Kesiapan (%), dan deviasi terhadap target Renops dinamis.
  - Menyimpan status secara massal ke Google Sheets (`updateBulkBusData`) dan Supabase `daily_route_reports` (kolom `realops_shift1` & `realops_shift2`).

### 1.5 Non-Blocking Bus Card Confirmation (Opsi B)
- **File Dibuat / Diubah:**
  - `src/components/BusCard.tsx` & `src/components/BusCard.test.tsx`
- **Tindakan:**
  - Mengubah perilaku ketukan pada kartu berstatus non-SGO (OFF / TO) agar tidak dikunci mati (*hard lock*).
  - Saat kartu berstatus OFF/TO diketuk di dashboard, aplikasi menampilkan modal konfirmasi ramah SweetAlert2:
    - `[ Jadikan SGO & Buka Form ]`: Menghapus status non-SGO unit menjadi beroperasi normal dan membuka modal input ritase.
    - `[ Tetap Lanjut Input ]`: Membuka modal input tanpa mengubah catatan keterangan yang sudah ada.
    - `[ Batal ]`: Menutup dialog tanpa perubahan.

---

## 2. BEFORE VS AFTER

| Aspek | Sebelum Refactor 25 | Sesudah Refactor 25 |
| :--- | :--- | :--- |
| **Alur Awal Shift** | Petugas membuka aplikasi tanpa ada pengingat status armada. Risiko langsung input ritase pada unit yang rusak/libur. | Alert bar ramping (~38px) muncul di bagian atas mengingatkan konfirmasi status armada Shift 1 / Shift 2. Hilang otomatis setelah dikonfirmasi. |
| **Kecepatan Set Status Armada** | Mengubah 5–10 bus harus membuka modal satu per satu (butuh waktu 3–5 menit). | Dengan mode kuas (*brush tool*) atau tombol *SGO Semua*, pengaturan 20–30 unit selesai dalam 5–10 detik. |
| **Pencatatan Multi-Shift SSOT** | Hanya 1 teks catatan. Keterangan Shift 2 menimpa keterangan Shift 1 di kolom Keterangan spreadsheet. | Format compound `" | "` memisahkan catatan Shift 1 & 2 secara rapi. Jika SGO, teks dikosongkan (`""`) dan baris berwarna normal. |
| **Fleksibilitas Lapangan (Opsi B)** | Risiko unit cadangan yang mendadak jalan di lapangan tidak bisa diinput jika sistem menggunakan penguncian kaku. | Konfirmasi ramah SweetAlert2 (Non-blocking): petugas bisa mengubah unit jadi SGO seketika atau tetap input dengan konfirmasi sadar. |
| **Target Rencana Operasi (Renops)** | Target statis tunggal untuk setiap hari sepanjang bulan, membuat capaian hari libur selalu tampak merah. | Engine kalender mendeteksi Hari Kerja, Sabtu, Minggu, dan Libur Nasional otomatis dengan target Renops yang sesuai. |

---

## 3. CASE: SKENARIO LAPANGAN

### Kasus 1: Petugas Membuka Shift 1 Pukul 04.45 Pagi
- **Skenario:** Petugas operasional membuka aplikasi di pool bus pada pukul 04.45 WIB untuk rute JAK.115 (total 15 unit).
- **Alur Sebelumnya:** Petugas langsung melihat daftar bus. Dua bus sedang servis di bengkel (`TO`), namun petugas lupa menandainya karena harus mengetuk form panjang satu per satu.
- **Alur Sesudah Perbaikan:**
  1. Alert bar kuning muncul di atas: *"Status armada Shift 1 belum terkonfirmasi"*.
  2. Petugas menekan `[ Konfirmasi ]` ➔ Modal layar penuh `FleetStatusModal` terbuka.
  3. Petugas menekan `[ ⚡ SGO Semua Unit ]` (seluruh 15 unit langsung hijau SGO).
  4. Petugas mengaktifkan kuas `[ TO ]` lalu mengetuk unit `JAK.15-04` dan `JAK.15-09` yang sedang di bengkel.
  5. Dock bawah langsung menampilkan: *"Total: 15 | SGO: 13 | Non-SGO: 2 | Kesiapan: 86.7%"*.
  6. Petugas menekan `[ Konfirmasi Status Shift 1 ]`.
  7. Google Sheets langsung diperbarui, Realops Shift 1 tercatat 13 unit di laporan, dan alert bar di dashboard otomatis menghilang.

### Kasus 2: Pergantian Shift 2 Pukul 14.15 Siang
- **Skenario:** Petugas Shift 2 mengambil alih tugas. Unit `JAK.15-02` yang sebelumnya jalan normal (SGO) pada Shift 1 mengalami mogok AC pada pukul 13.30.
- **Alur Sebelumnya:** Jika Shift 2 mengubah keterangan unit, riwayat Shift 1 tertimpa atau membingungkan.
- **Alur Sesudah Perbaikan:**
  1. Pukul 14.00, alert bar otomatis berganti konteks ke Shift 2.
  2. Petugas membuka modal armada, beralih ke tab Shift 2, dan menandai `JAK.15-02` sebagai `TO AC`.
  3. Kolom keterangan di spreadsheet otomatis tersimpan sebagai: `"" | TO AC"` (disederhanakan menjadi `"TO AC"`). Jika pada Shift 1 unit lain memiliki BA, tersimpan rapi `"BA.01 | TO AC"`.

### Kasus 3: Bus Cadangan Mendadak Dioperasikan (Opsi B Non-Blocking)
- **Skenario:** Unit `JAK.15-07` awalnya berstatus `OFF` (cadangan di pool). Pukul 16.00, sebuah unit di jalur mengalami pecah ban sehingga pengawas memerintahkan `JAK.15-07` langsung berangkat melayani rute.
- **Alur Sebelumnya:** Jika sistem dikunci mati (*hard locked*), petugas tidak dapat memasukkan kilometer dan ritase bus tersebut tanpa mereset sheet secara manual.
- **Alur Sesudah Perbaikan:**
  1. Petugas Shift 2 mencari kartu `JAK.15-07` dan mengetuk kartunya.
  2. Dialog SweetAlert2 muncul: *"Unit Berstatus OFF. Apakah unit ini beroperasi menggantikan armada lain?"*.
  3. Petugas memilih `[ Jadikan SGO & Buka Form ]`.
  4. Status langsung berubah menjadi SGO dan form input ritase langsung terbuka untuk diisi. Operasional lapangan berjalan lancar tanpa hambatan teknis.

### Kasus 4: Hari Libur Nasional Kemerdekaan 17 Agustus
- **Skenario:** Rute JAK.115 beroperasi pada tanggal 17 Agustus (Hari Libur Nasional). Pada hari kerja biasa renops adalah 15 unit, namun untuk hari libur nasional disepakati target renops adalah 10 unit.
- **Alur Sebelumnya:** Sistem menganggap target tetap 15 unit. Saat armada yang siap hanya 10 unit, laporan menampilkan deviasi merah (-5 unit).
- **Alur Sesudah Perbaikan:**
  1. Engine `holidayUtils` membaca tanggal 17 Agustus sebagai Hari Libur Nasional.
  2. Target Renops otomatis mengambil nilai `renops_holiday` (10 unit).
  3. Dashboard dan modal armada menampilkan target 10 unit dengan label *"Libur Nasional"*.
  4. Perhitungan efisiensi armada dan ketercapaian target operasional tepat 100% (10/10 unit).
