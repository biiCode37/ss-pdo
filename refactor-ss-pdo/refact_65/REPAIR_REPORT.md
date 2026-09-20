# 🛠️ REPAIR REPORT — REFACTOR 65

## 📌 Metadata
- **Siklus Refactor:** Refactor 65 (`refact_65`)
- **Tanggal:** 20 September 2026
- **Branch:** `devmode`
- **Acuan Spesifikasi SSOT:** [`docs/ODOMETER_INPUT_CHAIN_LOGIC.md`](file:///d:/MINE/SS_PDO/docs/ODOMETER_INPUT_CHAIN_LOGIC.md)
- **Status Quality Gates:**
  - Vitest: 60 test files passed (449/449 tests passed 100%)
  - Build: `tsc -b && vite build` passed (0 error)
  - Graphify: Knowledge graph updated

---

## 📋 Ringkasan Implementasi

Mengimplementasikan arsitektur **Cascading Odometer Input Blocking & Zero Phantom Value** pada formulir input armada bus aplikasi SS_PDO untuk menyelesaikan galat validasi palsu di pagi hari, mencegah kebocoran angka draf 3 digit siluman ke Google Sheets, dan menegakkan integritas urutan pencatatan dinas antar-shift.

---

## 🔄 Perbandingan: Before vs After

| Aspek | Sebelum Refactor 65 (Before) | Sesudah Refactor 65 (After) |
|---|---|---|
| **Nilai Default KM Akhir** | Otomatis disuntikkan string 3 digit (`"300"`) di latar belakang sekalipun KM Awal belum diisi lengkap. | **Zero Phantom Value**: Field terkunci wajib murni string kosong `""`. |
| **Status Kolom KM Akhir S1** | Terbuka bebas dan siap kirim ke sheet kapan saja. | **Terkunci** (`disabled`, placeholder `Isi KM Awal terlebih dahulu`) sampai KM Awal valid. |
| **Validasi Pagi Hari (KM Awal S1 saja)** | ❌ **Error Palsu:** Sistem menolak penyimpanan karena menganggap `300 < 300100`. | ✅ **Lolos 100%:** Guard `isDraftPrefill` mendeteksi bahwa field lawan belum diisi dan bypass perbandingan tanpa galat. |
| **Pencatatan Shift 2** | Pengguna bebas mengisi Shift 2 kapan saja tanpa pemeriksaan status Shift 1. | **Kunci Berantai Antar-Shift**: `KM Awal Shift 2` terkunci jika Shift 1 sedang berdinas dan belum ditutup (`validateKmCrossShift`). |
| **Dinas Siang Saja (Skenario B)** | Mengambil prefill salah atau terblokir. | Otomatis mendeteksi Shift 1 kosong murni, langsung membuka `KM Awal Shift 2` dan mengambil prefill dari H-1/kemarin. |
| **Redirection Single Mode** | Membuka field terkunci tanpa panduan jika diklik dari shortcut kartu. | Otomatis dialihkan ke `KM Awal Shift 1` disertai banner panduan ramah non-teknis. |
| **Sanitasi Payload Google Sheets** | Berisiko mengirimkan string 3 digit siluman ke kolom spreadsheet. | Fungsi `sanitizeKmAwal` dan `sanitizeKmAkhir` otomatis menghapus angka draf sebelum `onSave`. |

---

## 🚗 Case: 5 Skenario Lapangan

### Skenario 1: Pagi Hari Normal (Petugas Mengisi KM Awal S1)
- **Kondisi:** Bus baru keluar pool di pagi hari. Petugas membuka modal dan mengetik `300100` pada `KM Awal Shift 1`. `KM Akhir Shift 1` belum ada karena bus baru mulai beroperasi.
- **Perilaku Sistem:**
  - Kotak `KM Akhir Shift 1` awalnya berstatus locked dan bernilai `""`.
  - Begitu digit ke-4 `3001..` diketik, kotak terbuka secara realtime dan menampilkan prefill 3 digit `"300"`.
  - Petugas menekan **Simpan**. Sistem memvalidasi tanpa galat `300 < 300100`.
  - Payload ke Google Sheets menyimpan `kmAwal1 = "300100"` dan `kmAkhir1 = ""`. Tidak ada angka siluman yang masuk sheet.

### Skenario 2: Koreksi & Backspace KM Awal (Petugas Salah Ketik)
- **Kondisi:** Petugas salah memilih bus dan sempat mengetik `300100`, lalu menghapus kembali seluruh digit hingga kosong.
- **Perilaku Sistem:**
  - Begitu digit dihapus kembali $\le 3$ digit atau kosong, kotak `KM Akhir Shift 1` seketika terkunci kembali.
  - Nilai di dalam `KM Akhir Shift 1` otomatis di-reset menjadi `""` untuk mencegah angka gantung.

### Skenario 3: Bus Mogok / Putus Dinas di Shift 1 (Shift 2 Tidak Beroperasi)
- **Kondisi:** Bus beroperasi di Shift 1 (`KM Awal = 300100`, `KM Akhir = 300150`), lalu ditarik ke pool dan Shift 2 dibiarkan kosong.
- **Perilaku Sistem:**
  - Formulir dapat disimpan dengan sukses tanpa mewajibkan pengisian Shift 2.

### Skenario 4: Bus Dinas Siang Saja (Shift 1 Kosong Murni)
- **Kondisi:** Bus cadangan baru dikeluarkan pool pada siang hari untuk berdinas di Shift 2.
- **Perilaku Sistem:**
  - Shift 1 kosong total.
  - Kolom `KM Awal Shift 2` **LANGSUNG TERBUKA** dan mengambil 3 digit prefill dari `previousDayKmAkhir2` (hari kemarin).

### Skenario 5: Salin Cepat KM Akhir S1 ke KM Awal S2
- **Kondisi:** Bus melanjutkan dinas dari Shift 1 ke Shift 2.
- **Perilaku Sistem:**
  - Setelah `KM Akhir S1` terisi valid (`300180`), tombol **"Salin KM Akhir S1"** muncul di samping label `KM Awal S2`. Sekali klik, nilai `300180` langsung disalin dan membuka kotak `KM Akhir S2`.

---

## 🧪 Verifikasi Pengujian Otomatis

Seluruh 10 butir uji otomatis SSOT berhasil diuji dan lulus 100%:
- `src/components/busCard/modal/useBusInputForm.test.tsx` ➔ 8/8 passed
- `src/utils/modals/busInput/busModalValidation.test.ts` ➔ 9/9 passed
- `src/constants/texts/texts.test.ts` ➔ 15/15 passed
- `src/components/busCard/BusInputModal.test.tsx` ➔ 18/18 passed
- Total suite proyek: **60 test files passed (449/449 tests passed 100%)**.
