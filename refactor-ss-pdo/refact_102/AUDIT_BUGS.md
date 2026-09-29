# Audit Review Fase 3 Batch 3.1

**Status:** `REVISION_REQUIRED`. Review pada branch `devmode`; `refact_101` dan arsip terdahulu tidak diubah. Perubahan Batch 3.1 pada umumnya sesuai cakupan, tetapi gerbang belum lulus karena temuan berikut.

## R102-01 — Error lintas hari Shift 2 tanpa checkbox bypass

- **Lokasi kode:** `src/components/busCard/modal/useBusInputForm.ts:583-604,680-695` dan `src/components/busCard/BusInputModal.tsx:257`.
- **Keparahan:** Sedang; petugas dapat terhalang menyimpan koreksi odometer yang sah.
- **Deskripsi:** `getCrossDayValidationErrors()` menganggap Shift 1 sudah dimulai bila `kmAkhir1` berisi angka penuh, sedangkan jalur submit mode fokus `kmAwal2`/`kmAkhir2` hanya memeriksa `bus.kmAwal1` dan `kmAwal1`. Bila KM Awal S1 kosong/draf 3 digit, KM Akhir S1 terisi, dan KM Awal S2 lebih kecil dari KM akhir kemarin, submit menghasilkan error lintas hari S2. `hasCrossDayError` tidak mengenali pesan tersebut karena helper melewati validasi S2; checkbox bypass tidak tampil.
- **Dampak user:** Pada baris spreadsheet dengan Shift 1 terisi sebagian, petugas Shift 2 melihat pesan reset odometer tetapi tidak memiliki kontrol untuk mengonfirmasi penggantian speedometer. Penyimpanan tetap terblokir.
- **Mitigasi:** Samakan syarat pemilihan Shift 1/2 pada derivasi error, pembersihan error, dan submit. Gunakan predikat kecil yang dipakai bersama atau hasil validasi yang sama; jangan menambah abstraksi umum. Tambahkan tes hook dan komponen untuk keadaan parsial ini, termasuk centang/lepas centang dan error lain yang tetap terlihat.

## R102-02 — Checkbox bypass tetap hilang jika hanya ada error lintas hari

- **Lokasi kode:** `src/components/busCard/BusInputModal.tsx:195-282`; state pembersihan pada `src/components/busCard/modal/useBusInputForm.ts:602-614`.
- **Keparahan:** Sedang (UX dan kendali validasi).
- **Deskripsi:** Checkbox `form.hasCrossDayError` berada di dalam panel yang seluruhnya dirender hanya saat `form.validationErrors.length > 0`. Bila error lintas hari adalah satu-satunya error, aksi centang membersihkannya sehingga panjang array menjadi nol dan seluruh panel, termasuk checkbox, hilang. Nilai `hasCrossDayError === true` saat bypass aktif tidak membantu karena parent sudah tidak dirender.
- **Dampak user:** Petugas tidak dapat melepas centang bypass setelah memilihnya; konfirmasi reset odometer tersembunyi sebelum simpan.
- **Mitigasi:** Render kontrol bypass ketika `hasCrossDayError` aktif, meskipun daftar error kosong. Pertahankan pesan alert hanya saat ada error. Tambahkan tes komponen untuk kasus satu error lintas hari: centang, kontrol tetap tampak dan checked, lepas centang, submit ulang mengevaluasi error.

## Catatan gate

- Mutasi langsung `validationErrors.length = 0` sudah hilang; sanitizer KM dan fallback teks trip sudah sesuai lingkup.
- Review independen: `pnpm run test src/` **83 file / 601 tes lulus**; `pnpm run build` **exit 0**. Tes yang ada belum mencakup R102-01 atau R102-02.
- Empat warning `react-hooks/exhaustive-deps` tetap menjadi tugas Batch 3.2 sesuai rencana, bukan blocker tambahan Batch 3.1.
