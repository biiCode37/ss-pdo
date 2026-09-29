# Audit review Batch 2.2 — Refact 91

Tanggal: 27 September 2026. Auditor: Codex (orchestrator). Branch: `devmode`. Sumber: diff kode, dokumen, dan evidence `refact_90`; arsip sebelumnya tidak diubah.

## R91-01 — Status chip aktif belum tersedia untuk teknologi bantu

- **Lokasi:** `src/components/busCard/modal/fields/ShiftOptionChip.tsx:24-48`.
- **Keparahan:** Sedang untuk aksesibilitas komponen baru.
- **Deskripsi:** Komponen memakai `<button type="button">`, yang sudah dapat dioperasikan dengan keyboard secara native, tetapi `isActive` hanya mengubah gaya. Tidak ada `aria-pressed` pada tombol. Laporan `refact_90/REPAIR_REPORT.md:127` mengklaim `role="button"`, `aria-pressed`, dan `tabIndex={0}` padahal atribut itu tidak ada. `role` dan `tabIndex` tidak perlu ditambah pada tombol native; `aria-pressed` diperlukan untuk mengumumkan status toggle.
- **Dampak user:** pengguna pembaca layar tidak memperoleh status pilihan Manual/Catatan yang sedang aktif.
- **Mitigasi:** tambahkan `aria-pressed={isActive}` pada `<button>` dan tes nilai `true/false` serta callback klik. Pertahankan tombol native dan label dari kamus.

## R91-02 — Bukti regresi interaksi kedua Shift dan visual belum memadai

- **Lokasi:** `src/components/busCard/modal/fields/BusFormField.test.tsx:91-124,359-426`; `refact_90/evidence/`.
- **Keparahan:** Sedang untuk risiko regresi alur input lapangan.
- **Deskripsi:** Tes Enter hanya membuktikan prop `onKeyDown` memanggil spy, belum membuktikan handler form menjalankan `requestSubmit()`. Tes integrasi Shift 1 memeriksa satu chip Manual; Shift 2 belum menguji chip Manual/Catatan dan keadaan terkunci KM Akhir 2. Paket Batch 2.2 meminta bukti visual mobile light/dark atau catatan bila preview tidak tersedia; folder evidence belum memuat keduanya. Ini celah verifikasi, bukan bukti bug runtime.
- **Dampak user:** regresi submit pada keyboard ponsel, status input terkunci, atau keterbacaan tema dapat tidak terdeteksi sebelum dipakai petugas.
- **Mitigasi:** tambah tes perilaku terarah yang mengeksekusi alur Enter melalui handler form nyata atau `BusInputModal` dan membuktikan `requestSubmit`; cek disabled KM Akhir 2 dan toggle Manual/Catatan pada kedua Shift. Lampirkan screenshot mobile light/dark bila preview tersedia, atau catat keterbatasan secara jujur. Hindari snapshot besar atau tes yang hanya mengulang markup.

## R91-03 — Laporan tidak sesuai source dan diff memiliki whitespace error

- **Lokasi:** `refact_90/REPAIR_REPORT.md:38-61,68-109,127,140-162,180-185`; `BusInputModalShift1.tsx:400`, `BusInputModalShift2.tsx:394`.
- **Keparahan:** Rendah untuk ketertelusuran review dan kerapian diff.
- **Deskripsi:** Contoh “Before” menyebut latar `#181C24` dan gaya lain yang tidak cocok dengan source `devmode` sebelum Batch 2.2 (sebenarnya `rgba(0,0,0,0.35)` untuk hero dan `rgba(0,0,0,0.25)` untuk secondary). Contoh “After” mengklaim props/behavior yang tidak ada pada `BusFormField` (`isLocked`, `suffix`, `helperText`, `onBlur`) dan pemakaian `CHIP_ADD_LABEL` yang tidak ada. `git diff --check` menemukan blank line baru di EOF kedua file Shift.
- **Dampak user:** tidak langsung pada aplikasi; project owner dapat menyetujui perilaku yang belum diimplementasikan dan pemelihara salah memakai API komponen.
- **Mitigasi:** dalam folder dokumentasi revisi baru, tulis Before vs After dari source aktual dan jelaskan batas fitur yang benar. Jangan edit `refact_90`. Hapus hanya blank line ekstra di EOF kedua file Shift; verifikasi `git diff --check` bersih.

## Bagian yang sudah sesuai

- Duplikasi objek gaya input dan chip di dua file Shift berkurang; komponen bersama benar-benar dipakai di keduanya.
- Nilai, `ref`, `disabled`, handler input, dan teks kamus pada pemanggil utama tampak diteruskan; hook domain tidak diubah oleh Batch 2.2.
- Codex menjalankan ulang tes target: 3 file, 40 tes lulus. Lint terarah pada dua file Shift dan folder `fields/` exit 0 tanpa warning. Evidence executor menyatakan full suite 75 file/541 tes dan build exit 0.
- Root lint saat ini menghasilkan 1868 warning karena `dist_old/` ikut dipindai. R89-01 tetap terbuka dan tidak diselesaikan melalui Batch ini.
