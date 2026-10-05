# Laporan Audit dan Persiapan Fase 3

**Status:** `AUDIT_COMPLETE / BATCH_3_1_READY`. Ini persiapan orchestrator, bukan klaim bahwa kode Fase 3 telah diperbaiki. Tidak ada perubahan kode aplikasi pada `refact_100`.

## Implementasi yang ditetapkan

Fase 3 dibagi menjadi lima batch kecil dalam `PHASE_03_BATCH_PLAN.md`. Paket eksekusi pertama untuk Gemini ada di `GEMINI_PHASE_03_BATCH_01.md`. Prioritasnya mengunci kontrak odometer dan memperbaiki mutasi state sebelum memecah hook serta komponen besar.

## Before vs After yang dituju

| Area | Sebelum Fase 3 | Hasil yang wajib dibuktikan |
|---|---|---|
| Bypass validasi | Array error dimutasi langsung dan semua pesan terhapus. | Perubahan melalui setter; hanya error lintas hari yang relevan hilang, error lain tetap terlihat. |
| Hook form | 989 baris berisi state KM, efek, UI fokus, validasi, payload. | Sub-hook odometer dan fungsi submit murni berukuran fokus; API konsumen tetap stabil. |
| Single Focus | 805 baris dan beberapa label hardcoded. | Komponen lokal yang benar-benar reusable; semua teks UI di kamus domain dengan tes integritas. |
| Modal bus | Escape, portal, dan body overflow ditangani sendiri. | Menggunakan shell/scroll lock yang disetujui, tanpa kehilangan animasi dan ergonomi keyboard ponsel. |
| Verifikasi | Tes sudah banyak tetapi belum menguji bypass campuran dan alur modal hingga antrean offline sebagai satu kontrak. | Skenario odometer, payload, dan queue diverifikasi pada batas yang relevan; full suite/build/lint/Graphify lulus setiap batch. |

## Case: Skenario Lapangan

1. **Pagi hari, bus mulai Shift 1:** referensi KM akhir H-1 datang belakangan; form memprefill tiga digit saja, kursor di akhir, dan prefill mentah tidak tersimpan sebagai nilai penuh.
2. **Bus hanya dinas Shift 2:** KM Awal S2 boleh diisi tanpa membuat Shift 1 palsu; lock Akhir S2 tetap mengikuti validitas Awal S2.
3. **Koreksi KM atau backspace:** menghapus Awal S1 mengunci kembali Akhir S1 dan tidak menimpa input lain; pemulihan validitas membuka field berikutnya.
4. **Rollover odometer:** saran naik kepala angka diterapkan tanpa memotong presisi; bila petugas memilih bypass reset, error lintas hari hilang tetapi error TOA/KM lain tetap terlihat.
5. **Jaringan hilang saat simpan:** payload hanya memuat kolom yang relevan, optimistik UI dan antrean offline tetap bekerja, dan modal tidak melakukan perubahan semantik simpan tanpa bukti tes.
6. **Ponsel dengan keyboard terbuka:** footer tetap terlihat, fokus/Enter-to-Save dan animasi tutup tetap sesuai alur petugas.

## Baseline audit

- Branch `devmode`, working tree mengandung perubahan Fase 2 dan arsip yang harus dipertahankan.
- `useBusInputForm.ts`: 989 baris; `BusInputModalSingleFocus.tsx`: 805 baris; `BusInputModal.tsx`: 358 baris.
- Uji mandiri lima file (`useBusInputForm`, `BusInputModal`, `busModalOdometer`, `busModalValidation`, `useBusCardSave`): **62/62 tes lulus**, exit 0.
- Lint tiga hotspot: **4 warning `react-hooks(exhaustive-deps)`, 0 error**, semuanya di `useBusInputForm.ts`.
- Baseline suite Fase 2 terakhir: 83 file/586 tes lulus dan build lulus menurut `refact_99`. Perintah `pnpm run test src/` juga mencocokkan dua file pada `.worktrees/.../src/`; laporkan cakupan aktual dengan jujur.
- Graphify `graphify-out/GRAPH_REPORT.md` diperiksa untuk peta modul/odometer. Tidak ada perubahan kode pada audit ini sehingga graf tidak diperbarui.

## Keputusan gerbang

Fase 3 **dimulai**, belum selesai. Batch 3.1 diserahkan kepada Gemini melalui file instruksi. Setelah Gemini menyelesaikan satu batch, Codex melakukan review dan memutuskan lanjut/revisi. Fase 1–2 tetap PASS; progres fase selesai tetap **2/6 (33,3%)** sampai seluruh gerbang Fase 3 lulus.
