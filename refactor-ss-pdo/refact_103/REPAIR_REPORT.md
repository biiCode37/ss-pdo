# Laporan Perbaikan Revisi Fase 3 Batch 3.1

**Status:** `READY_FOR_REVIEW`  
**Branch:** `devmode`  
**Folder Dokumentasi:** `refactor-ss-pdo/refact_103/`

Dokumen ini merangkum perbaikan komprehensif atas temuan audit Codex dari `refact_102` (R102-01 dan R102-02) pada siklus pengerjaan Fase 3 Batch 3.1. Seluruh kode tetap berada di branch `devmode`, seluruh arsip dan berkas lokal dipertahankan, dan seluruh quality gate telah lulus 100%.

---

## 1. Ringkasan Implementasi

1. **R102-01 — Penyatuan Predikat Evaluasi Lintas Hari Shift 2:**
   - Menyederhanakan dan menyatukan logika deteksi Shift 1 aktif antara fungsi derivasi error lintas hari (`getCrossDayValidationErrors`), status checkbox bypass (`hasCrossDayError`), pembersih error (`handleToggleBypassOdometerReset`), dan submit handler (`handleFormSubmit`).
   - Pada mode fokus tunggal Shift 2 (`kmAwal2` atau `kmAkhir2`), predikat Shift 1 aktif dievaluasi konsisten:
     ```typescript
     const hasShift1 =
       (bus.kmAwal1 && bus.kmAwal1.trim() !== "") ||
       (kmAwal1 && kmAwal1.trim() !== "" && kmAwal1.trim().length > 3);
     ```
   - Dengan predikat ini, jika Shift 1 kosong murni atau hanya berupa draf 3 digit (`"120"`), submit mengevaluasi lintas hari Shift 2 dan `hasCrossDayError` langsung bernilai `true`, sehingga checkbox bypass odometer reset muncul di antarmuka pengguna.
   - `handleFormSubmit` memanggil langsung `getCrossDayValidationErrors(bypassOdometerReset)` baik pada mode fokus tunggal maupun mode All, menghilangkan percabangan ganda yang rentan inkonsistensi.

2. **R102-02 — Preservasi Panel Kontrol Bypass Odometer:**
   - Mengubah kondisi pembungkus panel alert di `BusInputModal.tsx` dari `form.validationErrors.length > 0` menjadi:
     ```tsx
     {(form.validationErrors.length > 0 || form.hasCrossDayError) && (
       ...
     )}
     ```
   - Memisahkan blok tampilan pesan kesalahan (`AlertCircle` dan `<ul>` error items) agar hanya dirender bila `form.validationErrors.length > 0`.
   - Mengatur tema panel secara halus: jika error teks dibersihkan oleh checkbox bypass, kontainer beralih ke warna info lembut (`rgba(56, 189, 248, 0.1)`) sehingga checkbox tetap tampil utuh di DOM dengan status checked.
   - Pengguna dapat melepas centang kapan saja; aksi uncheck mengembalikan error lintas hari saat form disubmit ulang.

---

## 2. Before vs After

| Aspek / Fitur | Before (Kondisi Audit `refact_102`) | After (Kondisi Setelah Revisi `refact_103`) |
|---|---|---|
| **Predikat Shift 1 Aktif (S2 Cross-Day)** | `getCrossDayValidationErrors` memeriksa `kmAkhir1` berisi angka penuh untuk menentukan Shift 1 aktif, sedangkan submit mode fokus S2 hanya memeriksa `bus.kmAwal1` dan `kmAwal1`. | Predikat disatukan seragam: Shift 1 dianggap aktif hanya jika `bus.kmAwal1` ada isi atau `kmAwal1` lokal valid (> 3 digit). |
| **Ketersediaan Checkbox Bypass (R102-01)** | Pada Shift 1 parsial (`kmAwal1: ""`, `kmAkhir1: "100000"`), submit menghasilkan error lintas hari S2, namun checkbox bypass tidak muncul karena `hasCrossDayError === false`. | Checkbox bypass tampil secara tepat saat error lintas hari S2 dihasilkan, memungkinkan konfirmasi pergantian odometer. |
| **Kemandirian Validasi Submit** | Submit handler menduplikasi pemanggilan `validateKmCrossDay` secara manual dengan parameter terpisah. | Submit handler langsung memanfaatkan `getCrossDayValidationErrors(bypassOdometerReset)` sebagai SSOT. |
| **Lifecycle Panel Alert Error (R102-02)** | Panel dibungkus `{form.validationErrors.length > 0}`. Saat error lintas hari adalah satu-satunya error dan dicentang, seluruh panel unmount bersama checkbox. | Panel dibungkus `(form.validationErrors.length > 0 || form.hasCrossDayError)`. Checkbox tetap tampil dan checked di DOM, pengguna dapat melepas centang. |
| **Pembersihan Pesan Error** | Aksi centang menghapus seluruh error atau tidak menghapus error S2 pada kondisi parsial. | Aksi centang hanya menghapus pesan error lintas hari yang relevan; error lain (seperti KM pair / TOA) tetap terlihat dan memblokir simpan. |

---

## 3. Case: Skenario Lapangan

### Skenario Lapangan 1 (R102-01: Shift 1 Parsial pada Input Shift 2)
- **Kondisi Awal:**
  - Baris bus di spreadsheet memiliki catatan KM Akhir Shift 1 (`"100000"`), namun KM Awal Shift 1 belum dicatat (`""`).
  - KM Akhir bus pada hari kemarin (H-1) adalah `"120000"`.
  - Petugas Shift 2 membuka modal input langsung pada mode fokus `kmAwal2` (atau `kmAkhir2`), lalu menginput nilai KM Awal Shift 2 sebesar `"90000"` (karena bus baru saja mengganti unit speedometer di pool). Input lokal `kmAwal1` hanya berisi draf prefill 3 digit `"120"`.
- **Sebelum Perbaikan:**
  - Saat tombol Simpan ditekan, sistem mendeteksi angka mundur terhadap hari kemarin dan menampilkan pesan error merah: `"KM Awal Shift 2 (90.000) tidak boleh lebih kecil dari KM Akhir Kemarin (120.000)!"`.
  - Namun fungsi derivasi bypass menganggap Shift 1 sudah jalan penuh karena melihat kolom `kmAkhir1`. Akibatnya, `hasCrossDayError` bernilai `false`, dan checkbox bypass **tidak muncul**. Petugas tidak dapat mengonfirmasi penggantian odometer dan penyimpanan terblokir total.
- **Setelah Perbaikan:**
  - Sistem mengevaluasi bahwa Shift 1 belum memiliki KM Awal sah, sehingga validasi lintas hari Shift 2 aktif dan dikenali oleh `hasCrossDayError`.
  - Checkbox *"Centang jika bus mengalami reset odometer / speedometer baru"* langsung muncul di bawah pesan error. Petugas mencentang kotak tersebut, pesan error lintas hari hilang, dan data berhasil disimpan.

---

### Skenario Lapangan 2 (R102-02: Checkbox Tetap Terlihat Saat Hanya Ada Satu Error Lintas Hari)
- **Kondisi Awal:**
  - Petugas mengisi data bus dengan KM yang valid antar-shift, namun KM Awal Shift 1 lebih kecil dari KM Akhir Kemarin.
  - Form tidak memiliki error lain (tidak ada kesalahan TOA, trip, atau KM pair).
- **Sebelum Perbaikan:**
  - Error yang muncul pada daftar kesalahan tepat satu buah (error lintas hari).
  - Ketika petugas mencentang checkbox bypass, array `validationErrors` menjadi kosong (`length = 0`).
  - Akibat kondisi `{form.validationErrors.length > 0}`, kontainer panel langsung lenyap dari layar seketika itu juga. Checkbox bypass hilang dari tampilan visual dan DOM.
  - Petugas tidak dapat membatalkan centang jika salah klik, dan tidak ada indikator visual bahwa bypass sedang aktif sebelum form disubmit.
- **Setelah Perbaikan:**
  - Saat checkbox dicentang, pesan teks error merah hilang, tetapi kontainer panel bertransformasi menjadi panel info bernuansa lembut. Checkbox bypass **tetap terlihat, aktif, dan checked**.
  - Petugas dapat melepas centang (uncheck) kapan saja sebelum submit.
  - Jika centang dilepas dan form disubmit kembali, validasi lintas hari langsung dievaluasi ulang dan pesan error merah kembali ditampilkan.

---

## 4. Hasil Verifikasi Quality Gates

| Quality Gate | Perintah / Uji | Target | Hasil Aktual | Status |
|---|---|---|---|---|
| **Reproduksi Bug** | `evidence/repro-failing-before-fix.log` | Membuktikan 2 kegagalan sebelum fix | Terbukti gagal pada 2 pengujian | **PASS** |
| **Uji Terarah** | `pnpm exec vitest run src/components/busCard/` + `src/utils/modals/busInput/` | 5 berkas pengujian | **80 tests passed** (100%) | **PASS** |
| **Seluruh Suite Vitest** | `pnpm exec vitest run src/` | Seluruh unit test proyek | **83 files / 604 tests passed** (100%) | **PASS** |
| **Targeted Linting** | `pnpm dlx oxlint -D correctness ...` | 0 lint error baru | **0 error, 11 baseline warning terjaga** | **PASS** |
| **TypeScript & Build** | `pnpm exec tsc -b && vite build --emptyOutDir false` | Strict mode & bundler exit 0 | **Build berhasil, exit code 0** | **PASS** |
| **Knowledge Graph** | `graphify update .` | Sinkronisasi graph AST | **6.076 node, 9.977 edge, 461 komunitas** | **PASS** |

---

## 5. Daftar Berkas yang Diubah dan Ditambah

### Berkas Sumber Utama yang Diperbaiki:
1. `src/components/busCard/modal/useBusInputForm.ts`:
   - Penyatuan fungsi `getCrossDayValidationErrors(bypass = false)` sebagai SSOT.
   - Penyelarasan predikat `hasShift1` pada mode single focus dan mode all.
   - Pemanfaatan `getCrossDayValidationErrors` pada `handleFormSubmit`, `hasCrossDayError`, dan `handleToggleBypassOdometerReset`.
2. `src/components/busCard/BusInputModal.tsx`:
   - Pembungkus panel diperbarui ke `(form.validationErrors.length > 0 || form.hasCrossDayError)`.
   - Pemisahan blok render pesan error teks dan kontrol bypass.
   - Styling dinamis adaptif (merah saat ada error, biru info lembut saat hanya bypass aktif).

### Berkas Pengujian yang Diperkuat:
3. `src/components/busCard/modal/useBusInputForm.test.tsx`:
   - Penambahan uji unit untuk skenario Shift 1 parsial dengan error lintas hari Shift 2.
4. `src/components/busCard/BusInputModal.test.tsx`:
   - Penambahan uji komponen untuk preservasi checkbox saat hanya ada satu error lintas hari (R102-02).
   - Penambahan uji komponen untuk render checkbox pada mode fokus tunggal Shift 2 dengan Shift 1 parsial (R102-01).

### Berkas Dokumentasi & Bukti Baru:
5. `refactor-ss-pdo/refact_103/AUDIT_BUGS.md`: Pelacakan tuntas temuan R102-01, R102-02, dan matriks Batch 3.1.
6. `refactor-ss-pdo/refact_103/REPAIR_REPORT.md`: Laporan perbaikan komprehensif, before/after, skenario lapangan, dan gerbang kualitas.
7. `refactor-ss-pdo/refact_103/evidence/`:
   - `reproduction-r102.test.tsx`
   - `repro-failing-expectation.test.tsx`
   - `repro-failing-before-fix.log`
   - `targeted-tests.txt`
   - `full-suite-tests.txt`
   - `targeted-lint.txt`
   - `build.txt`
   - `git-status.txt`

---

## 6. Verifikasi Tema & UX Mobile

- **Tema Gelap & Terang:**
  - Panel alert menggunakan nilai warna transparan berbasis alpha (`rgba(239, 68, 68, 0.15)` dan `rgba(56, 189, 248, 0.1)`) dengan aksen token CSS `var(--accent-color, #38bdf8)` yang terbukti kontras dan konsisten di kedua mode (Dark & Light).
- **Mobile-First UX:**
  - Checkbox tetap mudah dijangkau dan memiliki target ketuk yang proporsional pada layar sentuh ponsel tanpa pergeseran tata letak mendadak (*layout shift*).

---

## 7. Kesimpulan & Batasan

Perbaikan untuk **R102-01** dan **R102-02** telah selesai 100% dan terverifikasi secara tuntas. Sesuai instruksi, pengerjaan Batch 3.2 **TIDAK** dimulai pada putaran ini dan menunggu keputusan serta persetujuan review dari Codex.
