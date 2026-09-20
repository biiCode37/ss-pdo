# 🔍 AUDIT BUGS — REFACTOR 65

## 📌 Metadata
- **Siklus Refactor:** Refactor 65 (`refact_65`)
- **Tanggal:** 20 September 2026
- **Branch:** `devmode`
- **Acuan Spesifikasi SSOT:** `docs/ODOMETER_INPUT_CHAIN_LOGIC.md`
- **Area Terdampak:** Odometer Input Modal (`BusInputModal`, `useBusInputForm`, `BusInputModalShift1`, `BusInputModalShift2`, `BusInputModalSingleFocus`, `busModalValidation`)

---

## 🛑 Daftar Temuan Bug

### 🆔 BUG-65-01: False-Positive Validation Error Akibat Phantom Prefill di Pagi Hari
- **Lokasi Kode:**
  - `src/components/busCard/modal/useBusInputForm.ts` (efek auto-prefill latar belakang baris 102–108 & 140–180)
  - `src/utils/modals/busInput/busModalValidation.ts` (`validateKmPair`)
- **Tingkat Keparahan:** 🔴 Kritis (*Blocker Lapangan*)
- **Deskripsi:**
  Ketika petugas di pagi hari membuka modal unit bus untuk menginput `KM Awal Shift 1` (misal `300100`), state formulir di latar belakang secara otomatis menyuntikkan prefill 3 digit ke kolom `KM Akhir Shift 1` (`"300"`). Akibatnya, saat petugas menekan tombol **Simpan**, fungsi `validateKmPair` membandingkan nilai numerik `300 < 300100` dan menghentikan pengiriman dengan pesan galat palsu: *"KM Akhir Shift 1 (300) tidak boleh lebih kecil dari KM Awal (300100)!"*. Petugas terblokir dari pelaporan pagi hari.
- **Dampak Pengguna:**
  1. Petugas di lapangan tidak dapat menyimpan data operasional pagi hari.
  2. Terjadi kepanikan operasional karena sistem menolak data yang sah.
  3. Risiko angka draf `"300"` terkirim ke Google Sheets merusak rumus selisih jarak menjadi negatif ekstrem.
- **Mitigasi:**
  1. Terapkan prinsip **Zero Phantom Value**: Field yang belum berhak aktif/diisi wajib murni string kosong `""` di state.
  2. Implementasikan logika **Cascading Blocking**: Kolom `KM Akhir Shift 1` terkunci (`disabled`, placeholder terkunci) dan tidak menampilkan angka siluman sebelum `KM Awal Shift 1` diisi secara definitif.
  3. Terapkan deteksi semantik `isDraftPrefill` di `validateKmPair` agar tidak mengevaluasi selisih jika field lawan masih berupa potongan kepala angka yang belum selesai diketik.
  4. Tambahkan fungsi `sanitizeKmAkhir` dan `sanitizeKmAwal` pada payload sebelum dikirim ke Google Sheets.

---

### 🆔 BUG-65-02: Ketiadaan Kunci Berantai Antar-Shift (Cascading Cross-Shift Dependency)
- **Lokasi Kode:**
  - `src/components/busCard/modal/useBusInputForm.ts`
  - `src/components/busCard/modal/BusInputModalShift2.tsx`
  - `src/components/busCard/modal/BusInputModalSingleFocus.tsx`
  - `src/utils/modals/busInput/busModalValidation.ts`
- **Tingkat Keparahan:** 🟠 Tinggi (*Integritas Data Operasional*)
- **Deskripsi:**
  Pengguna dapat menginput data KM Shift 2 padahal dinas Shift 1 belum ditutup (`KM Awal Shift 1` ada, namun `KM Akhir Shift 1` masih kosong). Secara fisik di lapangan, sebuah bus tidak dapat memulai dinas siang jika dinas pagi belum selesai dicatat KM akhirnya.
- **Dampak Pengguna:**
  Kekacauan rekap ritase dan selisih KM antar-shift, lompatan angka odometer yang tidak logis di spreadsheet.
- **Mitigasi:**
  1. Terapkan `validateKmCrossShift` untuk memvalidasi bahwa jika Shift 1 pernah dimulai, maka Shift 1 wajib ditutup sebelum Shift 2 boleh diisi.
  2. Kunci input `KM Awal Shift 2` di UI (`disabled`) jika Shift 1 sedang berjalan dan belum ditutup.
  3. Namun, izinkan `KM Awal Shift 2` langsung terbuka jika Shift 1 kosong total (Skenario B: Bus hanya mulai berdinas siang).

---

### 🆔 BUG-65-03: Ketiadaan Redirection Cerdas pada Mode Single Focus
- **Lokasi Kode:**
  - `src/components/busCard/modal/useBusInputForm.ts`
  - `src/components/busCard/modal/BusInputModalSingleFocus.tsx`
- **Tingkat Keparahan:** 🟡 Sedang (*UX Friction*)
- **Deskripsi:**
  Jika petugas mengetuk pintasan edit `KM Akhir 1` dari dashboard padahal unit tersebut belum memiliki data `KM Awal 1`, modal tetap membuka formulir `KM Akhir 1` yang membingungkan petugas karena field tersebut sebenarnya belum memiliki acuan awal.
- **Dampak Pengguna:**
  Petugas kebingungan dan berpotensi mengisi angka acak atau mengira aplikasi rusak.
- **Mitigasi:**
  1. Hitung `effectiveCategory` di `useBusInputForm`: jika kategori yang dituju adalah `kmAkhir1` namun `KM Awal 1` belum valid, otomatis alihkan ke `kmAwal1`.
  2. Tampilkan banner panduan ramah non-teknis: *"Silakan isi KM Awal Shift 1 terlebih dahulu sebelum mengisi KM Akhir."* (`TEXT_ALERTS.BUS_INPUT_MODAL.GUIDE_FILL_KM_AWAL_FIRST`).
