# Instruksi Gemini — Fase 3 Batch 3.4: Single Focus UI

Batch 3.3 sudah `PASS` pada review Codex di folder ini. Kerjakan **hanya Batch 3.4** pada branch `devmode`, sesuai `refact_100/PHASE_03_BATCH_PLAN.md`. Berhenti pada `READY_FOR_REVIEW`; Batch 3.5 menunggu keputusan Codex.

## Lingkup

1. Pecah `src/components/busCard/modal/BusInputModalSingleFocus.tsx` (sekitar 800 baris) menurut kelompok TOA, KM, dan catatan. Buat komponen lokal fitur yang benar-benar mengurangi tanggung jawab file; pertahankan kontrak `BusInputFormReturn` dan alur data. Gunakan field/chip bersama hanya bila perilaku dan tampilan memang sama. Jangan membuat design system generik baru.
2. Selesaikan **R114-01**: pindahkan semua label chip, aksi salin, dan fallback teks seperti `"Kemarin"` ke modul domain `src/constants/texts/`. Periksa seluruh literal yang terlihat pengguna dalam file dan komponen hasil ekstraksi; tambahkan uji integritas di `src/constants/texts/texts.test.ts`. Template dinamis wajib fungsi murni.
3. Jaga ID input, jenis input, nilai, event handler, posisi kursor, urutan fokus/Enter, copy KM, penguncian field, saran rollover, chip manual/KM Akhir/catatan, serta tampilan error. Form harus nyaman pada viewport mobile dan dua tema Light/Dark. Koreksi masalah visual yang ditemukan hanya dalam lingkup Single Focus.
4. Pertahankan modul validasi/payload Batch 3.3 dan perilaku simpan. Shell `BusInputModal.tsx`, scroll lock, Escape/topmost, dan animasi shell adalah lingkup Batch 3.5; jangan pindahkan pekerjaan tersebut ke Batch 3.4.

## Verifikasi yang diminta

- Tes komponen untuk kategori TOA Shift 1, total TOA, KM Awal/Akhir Shift 1 dan 2, serta catatan. Uji chip terbuka/tertutup, copy KM, lock, rollover, Enter/fokus, dan payload terkait tanpa menyalin implementasi ke tes.
- Cek visual mobile untuk Light dan Dark bila lingkungan browser tersedia; catat viewport, bukti, dan keterbatasan secara jujur. Pastikan kontras, ruang ketik, scroll saat keyboard tampil, dan keterbacaan pesan.
- Jalankan tes target, `pnpm run test src/`, lint terarah, `pnpm run build`, lalu `graphify update .` setelah perubahan kode. Cari seluruh call site sebelum mengubah ekspor/kontrak. Jangan melaporkan jumlah warning lint sebagai nol jika output memuat warning aturan lain.
- R114-02 adalah klarifikasi dokumentasi: kategori trip tidak berada dalam `SINGLE_COLUMN_META` dan UI trip memakai mode All. Jangan menambah cabang trip Single Focus hipotetis. Catat errata di laporan baru tanpa mengubah `refact_113`.

Tetap di `devmode`; jangan reset, stash, clean, commit, push, atau menyentuh branch utama. Pertahankan arsip dan perubahan lokal. Buat folder `refactor-ss-pdo/refact_N/` berikutnya berisi `AUDIT_BUGS.md` (ID, lokasi, keparahan, deskripsi, dampak user, mitigasi), `REPAIR_REPORT.md` (implementasi, **Before vs After**, **Case: Skenario Lapangan**), dan log bukti dalam `evidence/`. Dokumentasi dan gerbang harus selesai sebelum menyatakan `READY_FOR_REVIEW`.
