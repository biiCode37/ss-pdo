# Instruksi Gemini — Revisi Fase 3 Batch 3.4

Batch 3.4 masih `REVISION_REQUIRED`. Baca `refactor-ss-pdo/refact_116/AUDIT_BUGS.md` dan `REPAIR_REPORT.md`. Kerjakan **R116-01 sampai R116-04** saja; Batch 3.5 tetap menunggu review Codex. Branch wajib `devmode`; pertahankan perubahan lokal dan seluruh arsip `refact_N`.

## Perbaikan terarah

1. **Pecah modul KM:** `SingleFocusKm.tsx` masih 676 baris. Pisahkan UI Shift 1 dan Shift 2, serta potongan rollover/badge hanya bila benar-benar identik. Targetnya tanggung jawab per file jelas dan ukuran di bawah batas god file proyek. Jangan membangun field framework generik. Pertahankan seluruh ID input, `singlePrimaryInputRef`, event/fokus, kursor prefill, chip, lock, copy, saran rollover, dan urutan submit.
2. **Perbaiki Light/Dark:** `--text-main` tidak didefinisikan. Ganti pemakaian fallback putih pada label dan input dengan token tema yang ada (`--text-primary`, `--input-bg`, `--card-bg`, `--card-border`) atau token semantik baru yang benar-benar didefinisikan pada dua tema. Periksa komponen TOA, KM, notes, dan helper style; termasuk teks disabled, badge, chip, dan tombol salin. Fokus pada Single Focus, tanpa mengubah shell modal Batch 3.5.
3. **Selesaikan kamus:** Pindahkan empat literal unit `KM` dari badge jarak ke `src/constants/texts/`; gunakan fungsi template murni bila menggabungkan nilai dinamis. Tambahkan tes integritas di `texts.test.ts`.
4. **Errata laporan:** Dalam folder revisi baru, tulis ukuran file aktual, token/CSS yang benar-benar dipakai, dan hasil verifikasi yang benar. `handleCopyKmAkhir1ToAwal2` mengubah state, bukan fokus; koreksi klaim Case 3. Jangan mengubah `refact_115`.

## Gerbang

- Tambah tes yang bermakna untuk kategori KM S1/S2 setelah pemecahan, terutama pemetaan ref/fokus, tombol copy, lock, dan rollover. Pertahankan tes 661 yang sudah ada.
- Verifikasi mobile Light dan Dark pada browser nyata bila tersedia; sertakan screenshot dan viewport. Bila browser tidak tersedia, catat keterbatasan dengan jelas serta bukti token tema/kontras dari kode, tanpa menyatakan visual sudah teruji.
- Jalankan tes target, `pnpm run test src/`, lint terarah, `pnpm run build`, dan `graphify update .` setelah perubahan kode. Catat jumlah warning sebenarnya.
- Buat folder urutan baru `refactor-ss-pdo/refact_N/` dengan `AUDIT_BUGS.md` (ID/lokasi/keparahan/deskripsi/dampak user/mitigasi), `REPAIR_REPORT.md` (implementasi, **Before vs After**, **Case: Skenario Lapangan**), dan log bukti dalam `evidence/`. Jangan edit arsip lama.

Laporkan `READY_FOR_REVIEW` setelah semua perbaikan dan gerbang selesai. Jangan mulai Batch 3.5.
