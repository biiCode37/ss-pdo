# Laporan Perbaikan — Fase 3, Batch 3.1: Keamanan State & Helper KM

**Status:** `READY_FOR_REVIEW`.
Pengerjaan diselesaikan secara ketat pada branch `devmode`. Seluruh perubahan lokal terdahulu, folder arsip `refact_1`–`refact_100`, dan `dist_old/` dipertahankan utuh.

---

## 1. Ringkasan Implementasi

Sesuai `refactor-ss-pdo/refact_100/PHASE_03_BATCH_PLAN.md` dan `GEMINI_PHASE_03_BATCH_01.md`, lingkup Batch 3.1 mencakup:
1. **Perbaikan Bypass Reset Odometer (R100-01):**
   - Menghapus mutasi array state `form.validationErrors.length = 0` dari `BusInputModal.tsx`.
   - Menambahkan aksi state terarah `handleToggleBypassOdometerReset(checked: boolean)` pada `useBusInputForm.ts`:
     - Saat dicentang (`checked = true`), hanya pesan error dari validator murni `validateKmCrossDay(..., false)` yang dibersihkan via `setValidationErrors(prev => prev.filter(...))`. Pesan validasi lain (Total TOA < TOA S1, KM Akhir < KM Awal, dsb.) tetap terlihat di antarmuka.
     - Saat centang dilepas (`checked = false`), state `bypassOdometerReset` kembali `false`, dan saat disubmit berikutnya `handleFormSubmit` mengevaluasi validasi lintas hari kembali.
   - Menghilangkan pencocokan fragmen substring rapuh `e.includes("tidak boleh lebih kecil dari")`. Kondisi render checkbox kini menggunakan derivasi semantis `form.hasCrossDayError` yang menghitung keterkaitan error lintas hari secara murni dari validator atau state aktif `bypassOdometerReset`. Checkbox tetap tampil di DOM selama bypass aktif sehingga pengguna dapat membatalkan pilihan.
2. **Ekstraksi Fungsi Sanitasi Murni Odometer (R100-02):**
   - Memindahkan `sanitizeKmAwal` dan `sanitizeKmAkhir` dari god hook `useBusInputForm.ts` ke modul murni `src/utils/modals/busInput/busModalOdometer.ts` sebagai fungsi murni yang diekspor.
   - Mengimpor kembali ke `useBusInputForm.ts`. Semantik kontrak lama dipertahankan persis:
     - Input batas kosong/whitespace menghasilkan `""`.
     - Draf prefill 3 digit dari H-1 atau pasangan tidak terkirim sebagai KM penuh (Zero Phantom Value).
     - Nilai eksisting tersimpan (walau kebetulan 3 digit) tetap dihormati dan tidak terpotong.
     - Nilai KM penuh tidak berubah.
3. **Sentralisasi Kamus Teks Trip Fallback (R100-04):**
   - Mengganti literal hardcoded `"Trip Pergi"` dan `"Trip Pulang"` pada `BusInputModal.tsx:334-335` dengan konstanta domain yang sudah tersedia: `TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TRIP_PERGI` dan `LABEL_TRIP_PULANG`.
4. **Isolasi Batasan Batch 3.1:**
   - Tidak menyentuh `BusInputModalSingleFocus.tsx` (dijadwalkan Batch 3.4).
   - Tidak melakukan migrasi shell modal (dijadwalkan Batch 3.5).
   - Tidak menyentuh `useBusCardSave.ts` atau kalkulasi domain ritase (1 ritase = PP = 2 trip).
   - Mempertahankan 4 warning baseline `react-hooks(exhaustive-deps)` pada efek prefill lama tanpa disable rule (akan ditangani terstruktur saat ekstraksi sub-hook di Batch 3.2).

---

## 2. Before vs After

| Aspek | Sebelum Perbaikan (Batch 3.0) | Setelah Perbaikan (Batch 3.1) |
|---|---|---|
| **Mutasi State `validationErrors`** | Memutasi array state langsung: `form.validationErrors.length = 0`. | Bebas mutasi; menggunakan state setter `setValidationErrors(prev => prev.filter(...))`. |
| **Pembersihan Error Bypass** | Seluruh error form terhapus (termasuk Total TOA < TOA S1 atau KM Akhir < Awal). | **Hanya** error lintas hari (`validateKmCrossDay`) yang dibersihkan. Error lain tetap aktif dan memblokir simpan. |
| **Kondisi Checkbox Bypass** | Pengecekan substring rapuh `e.includes("tidak boleh lebih kecil dari")`. Checkbox langsung hilang saat dicentang. | Derivasi semantis murni `form.hasCrossDayError` via validator; checkbox tetap stabil di DOM selama bypass aktif. |
| **Lokasi Sanitasi KM** | Didefinisikan lokal di dalam hook 990 baris (`useBusInputForm.ts`). | Berada di modul murni `busModalOdometer.ts`, diekspor dan diuji independen dengan 10 unit test baru. |
| **Fallback Label Trip Modal** | Literal hardcoded `"Trip Pergi"` dan `"Trip Pulang"` di JSX `BusInputModal.tsx`. | Menggunakan kamus domain `TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TRIP_PERGI` dan `LABEL_TRIP_PULANG`. |
| **Targeted Test Coverage** | 5 file / 62 tes lulus. | **5 file / 77 tes lulus** (+15 tes skenario baru). |

---

## 3. Case: Skenario Lapangan

1. **Kasus Speedometer Diganti Baru & Salah Ketik TOA (Mixed Errors):**
   - **Kondisi:** Armada JAK.15-09 mengalami penggantian speedometer baru di bengkel sehingga KM Awal hari ini (misal `001200`) lebih kecil dari KM Akhir kemarin (`292990`). Secara bersamaan, petugas salah memasukkan Total TOA (`200`) yang lebih kecil dari TOA Shift 1 (`250`).
   - **Perilaku:** Saat submit, muncul 2 pesan kesalahan: peringatan odometer lintas hari dan peringatan Total TOA. Petugas mencentang *"Reset Odometer (ganti speedometer / rollover)"*.
   - **Hasil:** Hanya pesan kesalahan odometer lintas hari yang hilang. Peringatan Total TOA **tetap tampil di layar**, tombol *"Simpan"* **tetap nonaktif (disabled)**, dan checkbox bypass **tetap terlihat** dalam keadaan tercentang. Petugas tidak dapat menyimpan data rusak hingga Total TOA diperbaiki.
2. **Kasus Pembatalan Centang Bypass (Uncheck & Re-evaluate):**
   - **Kondisi:** Petugas tidak sengaja mencentang bypass, lalu menyadari angkanya memang salah ketik dan melepas centang checkbox.
   - **Perilaku:** State `bypassOdometerReset` kembali `false`. Saat petugas mencoba menyimpan form kembali, validator mengevaluasi lintas hari ulang dan menampilkan kembali pesan kesalahan edukatif batas KM hari kemarin.
3. **Kasus Draf Prefill 3 Digit H-1 (Zero Phantom Value):**
   - **Kondisi:** Petugas membuka form bus baru di pagi hari. Sistem memberikan draf prefill kepala angka 3 digit (misal `"292"` dari kemarin `"292990"`). Petugas hanya mengisi data Shift 2 atau batal mengisi KM Awal 1 lalu menekan simpan.
   - **Hasil:** Fungsi murni `sanitizeKmAwal` mendeteksi bahwa `"292"` adalah draf prefill 3 digit dari H-1 dan membersihkannya menjadi `""`. Tidak ada nilai siluman 3 digit yang tersimpan ke spreadsheet sebagai angka KM penuh.
4. **Kasus Nilai KM Eksisting yang Kebetulan 3 Digit:**
   - **Kondisi:** Bus perintis atau rute feeder khusus memiliki odometer tercatat eksisting `"150"`.
   - **Hasil:** `sanitizeKmAwal` memeriksa `existingVal`. Karena nilai sama persis dengan yang tersimpan, nilai `"150"` dihormati dan tidak terhapus.
5. **Kasus Label Header Rute Kustom / Default:**
   - **Kondisi:** Rute reguler tidak menyuplai label khusus trip pada header spreadsheet.
   - **Hasil:** Tab trip modal menggunakan fallback konsisten dari kamus sentral `TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TRIP_PERGI` (*"Trip Pergi"*) dan `LABEL_TRIP_PULANG` (*"Trip Pulang"*).

---

## 4. Hasil Verifikasi & Quality Gates

1. **Targeted Tests (5 File Terkait):**
   - Perintah: `pnpm vitest run src/components/busCard/modal/useBusInputForm.test.tsx src/components/busCard/BusInputModal.test.tsx src/utils/modals/busInput/busModalOdometer.test.ts src/utils/modals/busInput/busModalValidation.test.ts src/components/busCard/useBusCardSave.test.tsx`
   - Hasil: **5 file lulus, 77 tes lulus** (0 gagal), exit 0.
   - Bukti: `refactor-ss-pdo/refact_101/evidence/targeted-tests.txt`.
2. **Full Repository Test Suite:**
   - Perintah: `pnpm vitest run src/`
   - Hasil: **83 file lulus, 601 tes lulus** (0 gagal), exit 0.
   - Bukti: `refactor-ss-pdo/refact_101/evidence/full-suite-tests.txt`.
3. **Targeted Lint (Hotspot Files):**
   - Perintah: `pnpm dlx oxlint src/components/busCard/BusInputModal.tsx src/components/busCard/modal/useBusInputForm.ts src/utils/modals/busInput/busModalOdometer.ts src/components/busCard/BusInputModal.test.tsx src/components/busCard/modal/useBusInputForm.test.tsx src/utils/modals/busInput/busModalOdometer.test.ts`
   - Hasil: **11 warning baseline lama, 0 error**, exit 0. 4 warning `react-hooks(exhaustive-deps)` lama pada efek prefill tetap dilacak sebagai baseline Batch 3.2. Tidak ada warning atau error baru.
   - Bukti: `refactor-ss-pdo/refact_101/evidence/targeted-lint.txt`.
4. **TypeScript Strict Mode & Vite Build:**
   - Perintah: `pnpm exec tsc -b; pnpm exec vite build --emptyOutDir false`
   - Hasil: **Lulus 100% tanpa error**, exit 0 (2042 modul ter-transformasi, aset bundle terproduksi).
   - Bukti: `refactor-ss-pdo/refact_101/evidence/build.txt`.
5. **Knowledge Graph (Graphify):**
   - Perintah: `graphify update .`
   - Hasil: **Sukses diperbarui** (6039 nodes, 9945 edges, 463 communities terindeks).
6. **Git Status & Branch Isolation:**
   - Branch aktif: `devmode`.
   - Commit HEAD: `1fb52a63db24788af7f87a0a6a02e708f8928e20`.
   - Tidak ada modifikasi ke branch `main`, tidak ada reset/stash/clean.
   - Bukti: `refactor-ss-pdo/refact_101/evidence/git-status.txt`.

---

## 5. Batas Pengujian Visual

Pengujian logika komponen, interaksi klik checkbox, disabled state tombol simpan, DOM rendering, dan snapshot pesan error telah diverifikasi menggunakan Happy-DOM dan simulasi event React Act. Pengujian fisik layar sentuh peranti mobile (Android/iOS) pada kondisi perputaran orientasi dan keyboard virtual native disarankan saat integrasi Batch 3.5 (shell modal).

---

## 6. Status Akhir

Cakupan Batch 3.1 telah selesai 100% dan memenuhi seluruh kriteria kelulusan. Status: **`READY_FOR_REVIEW`**. Pengerjaan Batch 3.2 menunggu persetujuan review Codex.
