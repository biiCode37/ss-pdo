# AUDIT BUGS: FLEET STATUS FLOW, MULTI-SHIFT NOTES, NON-BLOCKING CARD, & DYNAMIC RENOPS (REFACTOR 25)

Dokumen ini mendokumentasikan temuan audit alur operasional armada (*fleet readiness workflow*), format pencatatan keterangan multi-shift pada Google Sheets SSOT, interaksi kartu unit non-SGO, serta ketidakcocokan target Rencana Operasi (Renops) statis pada SS_PDO.

---

## DAFTAR TEMUAN AUDIT

| ID Temuan | Komponen / File Terkait | Keparahan | Status |
| :--- | :--- | :--- | :---: |
| **FLOW-25-01** | `src/components/Dashboard.tsx`<br>`src/components/fleetStatus/ShiftConfirmationAlertBar.tsx` | 🔴 **HIGH** (Tidak Ada Verifikasi Status Armada Awal Shift & Pergantian Hari) | Terselesaikan |
| **UX-25-02** | `src/components/fleetStatus/FleetStatusModal.tsx`<br>`src/components/RouteSelectorCard.tsx` | 🔴 **HIGH** (Penetapan Status Unit Per-Kartu Lambat & Melelahkan Petugas) | Terselesaikan |
| **DATA-25-03** | `src/utils/keteranganUtils.ts`<br>`src/utils/sheetColorUtils.ts`<br>`src/services/googleSheets/` | 🔴 **HIGH** (Penimpaan Catatan Shift 1 vs Shift 2 & Ketidakjelasan Status SGO) | Terselesaikan |
| **UX-25-04** | `src/components/BusCard.tsx`<br>`src/utils/alertUtils.ts` | 🟡 **MEDIUM** (Risiko Salah Input Unit Non-Operasi Tanpa Konfirmasi Cepat) | Terselesaikan |
| **DATA-25-05** | `src/utils/holidayUtils.ts`<br>`src/types/supabase.ts`<br>`supabase/migrations/` | 🟡 **MEDIUM** (Nilai Renops Statis Mengabaikan Weekend & Hari Libur Nasional) | Terselesaikan |

---

## RINCIAN TEMUAN

### 🔴 FLOW-25-01: Tidak Ada Verifikasi Status Armada Awal Shift & Pergantian Hari

- **ID Temuan:** `FLOW-25-01`
- **Lokasi Kode:**
  - `src/components/Dashboard.tsx`
  - `src/components/fleetStatus/ShiftConfirmationAlertBar.tsx`
- **Keparahan:** **HIGH** (Penyimpangan Alur Verifikasi Lapangan)
- **Deskripsi Masalah:**
  1. Pada awal hari operasional (Shift 1 sebelum 05.00 WIB) maupun pergantian siang (Shift 2 pukul 14.00 WIB), aplikasi tidak memberikan pengingat aktif kepada petugas untuk memvalidasi kesiapan unit armada.
  2. Akibatnya, petugas sering kali langsung menginput ritase bus tanpa memeriksa apakah ada unit yang sedang mengalami kendala teknis (TO), libur (OFF), atau berkas acara (BA), sehingga data Realops dan laporan operasional menjadi tidak akurat.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Laporan harian tidak mencerminkan ketersediaan armada riil di lapangan. Unit mogok/libur berisiko salah catat sebagai beroperasi.
- **Mitigasi:**
  - Menghadirkan `ShiftConfirmationAlertBar` ramping (~38px) di bawah bar sticky header yang memperingatkan petugas untuk mengonfirmasi status armada pada shift aktif (Shift 1 atau Shift 2).
  - Alert bar secara otomatis tersembunyi (*auto-hide*) begitu status shift hari tersebut telah dikonfirmasi dan tersimpan di database/sheet.
  - Menyediakan tombol pintas `[ Konfirmasi ]` pada alert bar serta tombol akses cepat `[ 📋 Armada ]` pada bar selector rute.

---

### 🔴 UX-25-02: Penetapan Status Unit Per-Kartu Lambat & Melelahkan Petugas

- **ID Temuan:** `UX-25-02`
- **Lokasi Kode:**
  - `src/components/fleetStatus/FleetStatusModal.tsx`
  - `src/components/RouteSelectorCard.tsx`
- **Keparahan:** **HIGH** (Inefisiensi Interaksi Pengguna Mobile)
- **Deskripsi Masalah:**
  1. Sebelumnya, jika petugas ingin menandai 5 unit sebagai OFF atau TO, petugas harus mengetuk satu per satu kartu bus, membuka modal input ritase/TOA yang berat, mengetik catatan keterangan, lalu menyimpannya satu per satu.
  2. Pada rute dengan 20–30 unit armada, proses ini memakan waktu beberapa menit di lapangan pada waktu pagi yang sangat sibuk.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Beban kerja input petugas di awal shift membengkak; timbul keengganan untuk mencatat status armada dengan lengkap.
- **Mitigasi:**
  - Mengembangkan `FleetStatusModal` layar penuh dengan kurva animasi Apple spring (`cubic-bezier(0.32, 0.72, 0, 1)`).
  - Memperkenalkan *Brush Mode* (`[SGO]`, `[OFF]`, `[TO]`, `[BA]`): petugas cukup memilih satu kuas status, lalu mengetuk bus yang diinginkan untuk langsung mengubah statusnya seketika.
  - Menyediakan tombol aksi instan `[ ⚡ SGO Semua Unit ]` dan dock ringkasan real-time (Total Armada, SGO, Non-SGO, dan Persentase Kesiapan).
  - Menyediakan batch update sekali jalan (`updateBulkBusData`) yang langsung mengupdate Google Sheets dan Supabase `daily_route_reports`.

---

### 🔴 DATA-25-03: Penimpaan Catatan Shift 1 vs Shift 2 & Ketidakjelasan Status SGO

- **ID Temuan:** `DATA-25-03`
- **Lokasi Kode:**
  - `src/utils/keteranganUtils.ts`
  - `src/utils/sheetColorUtils.ts`
  - `src/services/googleSheets/`
- **Keparahan:** **HIGH** (Kehilangan Data Keterangan Antar Shift)
- **Deskripsi Masalah:**
  1. File Google Sheets hanya menyediakan 1 kolom Keterangan per baris bus.
  2. Apabila unit pada Shift 1 berstatus `BA.01` namun pada Shift 2 berstatus `TO EVDAL`, pembaruan Shift 2 menimpa (*overwrite*) catatan Shift 1.
  3. Belum ada kepastian mengenai aturan visual status SGO: apakah diberi tanda tulisan atau dikosongkan.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Riwayat keterangan Shift 1 hilang saat Shift 2 mengupdate spreadsheet, menimbulkan perselisihan audit operasional antar shift.
- **Mitigasi:**
  - Menerapkan format compound multi-shift dengan delimiter `" | "` (contoh: `BA.01 | TO EVDAL`).
  - Menyediakan utilitas parser & formatter: `combineShiftKeterangan(s1, s2)` dan `splitShiftKeterangan(combined)`.
  - Memastikan jika status unit adalah SGO pada shift tersebut, string keterangannya murni dikosongkan (`""`) dan baris spreadsheet tetap berwarna normal tanpa highlight.
  - Memperbarui `sheetColorUtils.ts` agar ekspresi reguler warna tetap mengenali kode BA, TO, atau OFF meskipun berada di dalam teks gabungan `" | "`.

---

### 🟡 UX-25-04: Risiko Salah Input Unit Non-Operasi Tanpa Konfirmasi Cepat

- **ID Temuan:** `UX-25-04`
- **Lokasi Kode:**
  - `src/components/BusCard.tsx`
  - `src/utils/alertUtils.ts`
- **Keparahan:** **MEDIUM** (Potensi Input Data pada Unit yang Tidak Jalan)
- **Deskripsi Masalah:**
  1. Jika kartu bus non-SGO (OFF / TO) dikunci mati (*hard blocking*), petugas lapangan tidak bisa menginput ritase jika sewaktu-waktu terjadi dinamika lapangan (misal bus cadangan mendadak dioperasikan menggantikan bus lain).
  2. Sebaliknya, jika kartu tidak memiliki pengaman sama sekali, petugas rawan salah ketuk dan menginput ritase pada bus yang mogok di pool.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Sistem terlalu kaku atau sebaliknya terlalu longgar dalam mencegah kesalahan input.
- **Mitigasi:**
  - Mengimplementasikan Opsi B (*Flexible Non-Blocking Confirmation*): saat kartu bus berstatus non-SGO diketuk, muncul dialog ramah SweetAlert2 yang menanyakan konfirmasi.
  - Petugas diberikan opsi instan: `[ Jadikan SGO & Buka Form ]`, `[ Tetap Lanjut Input ]`, atau `[ Batal ]`.

---

### 🟡 DATA-25-05: Nilai Renops Statis Mengabaikan Weekend & Hari Libur Nasional

- **ID Temuan:** `DATA-25-05`
- **Lokasi Kode:**
  - `src/utils/holidayUtils.ts`
  - `src/types/supabase.ts`
  - `supabase/migrations/20260909000001_dynamic_renops.sql`
- **Keparahan:** **MEDIUM** (Kalkulasi Pencapaian Operasi Tidak Akurat)
- **Deskripsi Masalah:**
  1. Selama ini `default_renops` pada tabel rute bersifat angka tunggal statis (misal 15 unit).
  2. Di dunia nyata operasional transportasi publik, target Rencana Operasi pada hari kerja (Senin–Jumat) berbeda dengan hari Sabtu (misal 12 unit), Minggu (misal 10 unit), serta Hari Libur Nasional (misal 8 unit).
- **Dampak ke Pengguna Lapangan (User Impact):**
  Tingkat ketercapaian Realops vs Renops pada akhir pekan dan hari libur selalu tampak merah/kurang unit karena target Renops tidak fleksibel mengikuti jenis hari.
- **Mitigasi:**
  - Menambahkan kolom konfigurasi di Supabase: `renops_weekday`, `renops_saturday`, `renops_sunday`, dan `renops_holiday`.
  - Mengembangkan engine `getRenopsForDate` di `src/utils/holidayUtils.ts` yang mendeteksi kalender hari libur nasional Indonesia dan hari dalam seminggu secara otomatis, dengan fallback transparan ke `default_renops`.
