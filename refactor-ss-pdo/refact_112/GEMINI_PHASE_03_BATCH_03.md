# Instruksi Gemini — Fase 3 Batch 3.3: Validasi dan Payload Simpan

Batch 3.2 sudah `PASS` menurut review Codex di folder ini. Kerjakan **hanya Batch 3.3** pada branch `devmode`. Baca rencana `refactor-ss-pdo/refact_100/PHASE_03_BATCH_PLAN.md` dan temuan R112-01 di `AUDIT_BUGS.md` ini. Setelah selesai, berhenti di `READY_FOR_REVIEW`; Codex akan membuka Batch 3.4 setelah review.

## Lingkup implementasi

1. Ekstrak validasi submit dan pembentukan `Partial<BusData>` dari `src/components/busCard/modal/useBusInputForm.ts` menjadi fungsi murni yang fokus pada fitur bus input. Pertahankan bentuk input/output sederhana dan gunakan validator serta sanitizer yang sudah ada. `useBusInputForm` tetap mengurus state React, event, fokus, bypass, serta pemanggilan `onSave` dan `onDismiss`.
2. Jaga semantik **Single Focus** dan **All**: field yang dikirim harus tetap scoped menurut kategori, penguncian dan sanitasi KM tetap berlaku, TOA total tetap dihitung seperti sebelumnya, manual/keterangan sesuai kondisi tampilan, dan trip tetap berarti satu arah. Jangan mengubah urutan atau perilaku `onSave`/`onDismiss` tanpa tes yang membuktikan kebutuhan perubahan.
3. Selesaikan **R112-01**: setelah rollover, validasi yang masih berlaku harus memakai angka KM terbaru. Error lintas hari yang teratasi hilang; error KM pair/TOA lain tidak terhapus. Hindari pencocokan fragmen teks. Gunakan fungsi validasi yang sama agar tidak muncul dua aturan berbeda.
4. Jangan refactor UI Single Focus atau shell modal pada batch ini; itu lingkup Batch 3.4 dan 3.5. Hindari abstraction layer generik, config framework, atau duplikasi state yang tidak diperlukan.

## Tes wajib yang membuktikan kontrak

- Fungsi murni untuk kategori Single Focus (trip, TOA, KM awal/akhir, keterangan) dan mode All: periksa **key payload persis** agar field lain tidak tertimpa. Sertakan kondisi field KM terkunci, manual field tersembunyi, dan `showKeterangan`.
- Validasi TOA, trip, KM pair, antarshift, lintas hari, bypass, serta input spreadsheet berformat Indonesia melalui `parseIndonesianNumber`.
- Integrasi form: rollover pada dua error campuran memperbarui angka pada pesan KM pair; TOA tetap tampil; submit ditolak sampai koreksi. Jaga tes R108-01 saat KM Awal kedua shift sama dan tes R110-01.
- Integrasi simpan: pemanggilan `onSave`/`onDismiss`, optimistik UI, konflik, dan offline queue tidak berubah. Tambah tes hanya untuk risiko yang belum ditutup oleh tes yang ada.
- Bila menambah/mengubah teks UI, gunakan modul `src/constants/texts/` dan uji di `src/constants/texts/texts.test.ts`; jangan hardcode teks di komponen atau utilitas modal.

## Gerbang dan laporan

Tetap pada `devmode`; jangan reset, stash, clean, commit, push, atau menyentuh branch utama. Pertahankan seluruh perubahan lokal dan arsip historis. Cari seluruh call site di `src/` saat memindahkan fungsi. Jalankan tes target, `pnpm run test src/`, lint terarah, `pnpm run build`, lalu `graphify update .` setelah perubahan kode. Catat hasil sebenarnya, termasuk batas pengujian UI bila ada.

Buat folder urutan baru `refactor-ss-pdo/refact_N/` (jangan edit folder selesai), berisi `AUDIT_BUGS.md` dengan ID/lokasi/keparahan/deskripsi/dampak user/mitigasi, `REPAIR_REPORT.md` dengan implementasi, **Before vs After**, dan **Case: Skenario Lapangan**, serta log bukti dalam `evidence/`. Laporkan `READY_FOR_REVIEW` hanya setelah dokumentasi dan gerbang selesai.
