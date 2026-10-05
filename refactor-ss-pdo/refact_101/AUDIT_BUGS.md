# Audit Bugs — Fase 3, Batch 3.1 (Form Input Bus & Odometer)

**Status:** `BATCH_3_1_COMPLETED / READY_FOR_REVIEW`.
Pengerjaan dilakukan ketat pada branch `devmode`. Seluruh perubahan lokal, `dist_old/`, dan folder `refact_1`–`refact_100` dipertahankan. Baseline targeted test meningkat dari 62 tes menjadi **77 tes lulus** (100%), full suite **83 file / 601 tes lulus** (100%), targeted oxlint **11 baseline warnings, 0 errors**, build lulus 0 error.

---

## R100-01 — Mutasi langsung dan penghapusan semua error saat bypass odometer

- **Lokasi kode:** `src/components/busCard/BusInputModal.tsx:256-287`; aksi state di `src/components/busCard/modal/useBusInputForm.ts:570-625,993-997`.
- **Keparahan:** Sedang (Integritas State React & Validasi UX).
- **Deskripsi:** Sebelumnya, handler checkbox memutasi langsung properti array state `form.validationErrors.length = 0` dan mendeteksi kondisi render lewat fragmen substring rapuh `e.includes("tidak boleh lebih kecil dari")`. Begitu checkbox dicentang, seluruh pesan error (termasuk Total TOA < TOA S1 atau KM Akhir < Awal) terhapus, dan checkbox langsung lenyap dari DOM sehingga pengguna tidak bisa melepas centang bypass.
- **Dampak user:** Form terlihat bebas error meski ada input invalid lain. Tombol simpan sempat tampak aktif lalu error muncul kembali saat submit; checkbox bypass menghilang begitu disentuh dan membingungkan petugas.
- **Mitigasi di Batch 3.1:**
  1. Menghapus mutasi `form.validationErrors.length = 0`.
  2. Menambahkan aksi state terarah `handleToggleBypassOdometerReset(checked: boolean)` pada `useBusInputForm`:
     - Saat dicentang (`checked = true`), hanya error lintas hari dari validator murni `validateKmCrossDay(..., false)` yang dibersihkan via state setter `setValidationErrors(prev => prev.filter(...))`. Error lain (TOA, KM pair, dll.) tetap utuh.
     - Saat dilepas (`checked = false`), state `bypassOdometerReset` kembali `false`, dan saat disubmit berikutnya `handleFormSubmit` mengevaluasi lintas hari kembali.
  3. Mengganti pengecekan fragmen string dengan derivasi semantis `hasCrossDayError`:
     `hasCrossDayError = bypassOdometerReset || validationErrors.some((err) => getCrossDayValidationErrors().includes(err))`.
     Checkbox tetap tampil stabil di DOM selama bypass aktif sehingga pengguna dapat membatalkan centang sewaktu-waktu.
- **Status:** **CLOSED pada Batch 3.1**.

---

## R100-02 — Aturan odometer bercampur di hook form (Tahap 1: Ekstraksi Sanitasi Murni)

- **Lokasi kode:** `src/components/busCard/modal/useBusInputForm.ts:569-606` dipindahkan ke `src/utils/modals/busInput/busModalOdometer.ts:118-164`.
- **Keparahan:** Sedang (Separation of Concerns & Maintainability).
- **Deskripsi:** Logika sanitasi payload KM (`sanitizeKmAwal` dan `sanitizeKmAkhir`) sebelumnya didefinisikan secara lokal di dalam god hook `useBusInputForm.ts` (990 baris), padahal modul murni `busModalOdometer.ts` sudah ada.
- **Dampak user:** Risiko regresi pada nilai draf prefill 3 digit (Zero Phantom Value) dan nilai KM 3 digit eksisting.
- **Mitigasi di Batch 3.1:**
  1. Mengekstrak fungsi murni `sanitizeKmAwal` dan `sanitizeKmAkhir` ke `src/utils/modals/busInput/busModalOdometer.ts` sebagai fungsi murni yang diekspor.
  2. Mengimpor kembali ke `useBusInputForm.ts` dengan kontrak dan semantik yang persis sama:
     - Input kosong/whitespace menghasilkan `""`.
     - Draf prefill 3 digit dari H-1 / pasangan dibersihkan menjadi `""` (tidak tersimpan sebagai KM penuh).
     - Nilai eksisting tersimpan (walau kebetulan 3 digit) tetap dihormati dan tidak terpotong.
     - Input KM penuh tidak berubah.
  3. Menambahkan 10 unit test komprehensif pada `busModalOdometer.test.ts` untuk batas kosong, 3 digit draft, nilai eksisting, dan input penuh.
- **Status:** **BATCH 3.1 DONE (Fungsi Sanitasi Ekstrak Murni)**; pemisahan sub-hook odometer dijadwalkan pada Batch 3.2.

---

## R100-03 — Efek prefill memiliki dependensi yang tidak lengkap

- **Lokasi kode:** `src/components/busCard/modal/useBusInputForm.ts:275-335`.
- **Keparahan:** Sedang (React Hooks Dependency Integrity).
- **Deskripsi:** 4 warning `react-hooks(exhaustive-deps)` pada efek prefill dan reactivity KM. Sesuai instruksi Codex dan prompt Batch 3.1, warning ini dicatat sebagai baseline stabil dan TIDAK boleh dihilangkan dengan disable-rule atau penambahan dependensi membabi buta pada batch ini.
- **Dampak user:** Potensi re-render berlebih jika dependensi diubah tanpa guard.
- **Mitigasi:** Dicatat sebagai baseline untuk sub-hook extraction pada Batch 3.2.
- **Status:** **TRACKED / DEFERRED TO BATCH 3.2**.

---

## R100-04 — Komponen Single Focus dan literal string UI (Tahap 1: Fallback Label Trip)

- **Lokasi kode:** `src/components/busCard/BusInputModal.tsx:334-335`.
- **Keparahan:** Rendah-Sedang (Kamus Teks UI Sentral).
- **Deskripsi:** `BusInputModal.tsx` memiliki fallback literal hardcoded `"Trip Pergi"` dan `"Trip Pulang"`.
- **Dampak user:** Inkonsistensi teks UI jika kamus terpusat diperbarui.
- **Mitigasi di Batch 3.1:** Mengganti fallback dengan konstanta domain yang sudah tersedia di kamus:
  - `headerMap?.tripPergiLabel || TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TRIP_PERGI`
  - `headerMap?.tripPulangLabel || TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TRIP_PULANG`
  Menambahkan unit test di `BusInputModal.test.tsx` untuk memverifikasi fallback teks dari kamus.
- **Status:** **BATCH 3.1 DONE (BusInputModal trip fallback)**; pemecahan `BusInputModalSingleFocus.tsx` dijadwalkan pada Batch 3.4.

---

## R100-05 — Scroll lock modal bus belum memakai koordinator

- **Lokasi kode:** `src/components/busCard/BusInputModal.tsx:59-79`.
- **Keparahan:** Sedang (Modal Stack Coordination).
- **Deskripsi:** `BusInputModal` masih mengelola `document.body.style.overflow` langsung dan belum memakai `ModalShell` / `scrollLockCoordinator`.
- **Dampak user:** Potensi konflik scroll lock jika dialog lain dibuka di atasnya.
- **Mitigasi:** Sesuai rencana batch, migrasi shell modal dilakukan pada Batch 3.5.
- **Status:** **TRACKED / DEFERRED TO BATCH 3.5**.
