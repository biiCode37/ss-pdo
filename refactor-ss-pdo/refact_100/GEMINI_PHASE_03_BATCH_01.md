# Paket Gemini — Fase 3, Batch 3.1

Codex membuka Fase 3 pada `refact_100`. Kerjakan **hanya Batch 3.1** sesuai `PHASE_03_BATCH_PLAN.md` dan audit `AUDIT_BUGS.md`. Berhenti pada `READY_FOR_REVIEW`; Batch 3.2 menunggu keputusan review Codex.

## Persiapan

1. Baca `AGENTS.md`, `.agents/AGENTS.md`, `refactor-ss-pdo/refact_99/REPAIR_REPORT.md`, semua dokumen `refactor-ss-pdo/refact_100/`, kode aktual `BusInputModal.tsx`, `useBusInputForm.ts`, `busModalOdometer.ts`, `busModalValidation.ts`, `useBusCardSave.ts`, serta tes yang ada. Periksa Graphify untuk dependensi. Pastikan branch `devmode`, catat HEAD/status/diff file target; pertahankan seluruh perubahan lokal dan `dist_old/`. Jangan reset, stash, clean, commit, push, atau menyentuh branch utama.
2. Buat `refactor-ss-pdo/refact_101` jika tersedia, atau nomor tertinggi berikutnya. Jangan ubah folder arsip yang selesai.

## Implementasi Batch 3.1

1. Perbaiki `BusInputModal.tsx:273-280`: hapus mutasi `form.validationErrors.length = 0`. Tambahkan aksi state sekecil mungkin pada `useBusInputForm` untuk mengubah bypass dan membersihkan **hanya** error lintas hari yang relevan. Error lain (contoh Total TOA kurang dari S1 atau KM Akhir kurang dari Awal) harus tetap terlihat. Hindari pencocokan fragmen kalimat Indonesia yang rapuh bila bisa memakai hasil validator yang sama secara langsung. Jangan membuat sistem error generik baru untuk satu kasus.
2. Pindahkan fungsi murni `sanitizeKmAwal` dan `sanitizeKmAkhir` dari `useBusInputForm.ts:569-606` ke modul yang sudah ada `src/utils/modals/busInput/busModalOdometer.ts`; impor dari hook. Pertahankan semantik persis: nilai tersimpan eksisting dihormati, draft 3 digit dari H-1/pasangan tidak ikut dikirim, dan KM penuh tidak berubah. Tambahkan tes helper untuk batas kosong, 3 digit, nilai eksisting, dan input penuh.
3. Karena `BusInputModal.tsx` disentuh, ganti fallback literal `"Trip Pergi"` dan `"Trip Pulang"` dengan konstanta domain yang **sudah tersedia** di `TEXT_ALERTS.BUS_INPUT_MODAL`. Bila benar-benar perlu teks kamus baru, tambahkan pada `src/constants/texts/` dan uji integritas di `texts.test.ts`.
4. Jangan menyentuh `BusInputModalSingleFocus.tsx`, migrasi shell modal, `useBusCardSave.ts`, kalkulasi domain ritase, atau empat efek prefill pada batch ini. Catat warning dependensi efek sebagai baseline untuk Batch 3.2; jangan menghilangkannya dengan disable rule atau perubahan membabi buta.

## Skenario uji wajib

- Bypass dicentang ketika error lintas hari dan error lain sama-sama ada: hanya error lintas hari yang hilang, error lain tetap tampil dan tombol simpan tetap mengikuti validasi. Saat bypass dilepas, submit mengevaluasi lintas hari lagi.
- Prefill tiga digit awal H-1 tidak tersimpan sebagai KM penuh; nilai KM eksisting yang kebetulan tiga digit tetap dihormati sesuai kontrak lama.
- Copy KM Akhir S1 ke Awal S2, bus hanya Shift 2, dan saran rollover tetap lolos tes lama.
- `onSave` tetap menghasilkan scoped updates dan alur optimistic/offline queue `useBusCardSave` tidak berubah.

## Verifikasi dan dokumentasi

Jalankan tes target yang relevan (`useBusInputForm.test.tsx`, `BusInputModal.test.tsx`, `busModalOdometer.test.ts`, `busModalValidation.test.ts`, `useBusCardSave.test.tsx`, dan `texts.test.ts` bila kamus berubah), lalu `pnpm run test src/`, lint file yang disentuh, `pnpm run build`, dan `graphify update .`. Baseline awal: 5 file/62 tes lulus; lint tiga hotspot 4 warning efek lama, 0 error. Pada Windows bila PNPM gagal EPERM di temp profil, arahkan `TEMP` dan `TMP` proses ke `D:\MINE\SS_PDO\node_modules\.tmp` tanpa mengubah konfigurasi global.

Simpan pada folder revisi baru: `AUDIT_BUGS.md` (ID, lokasi, keparahan, deskripsi, dampak user, mitigasi), `REPAIR_REPORT.md` (implementasi, **Before vs After**, **Case: Skenario Lapangan** untuk setiap perbaikan, hasil gate, batas visual), dan bukti log. Laporkan `READY_FOR_REVIEW` hanya bila seluruh cakupan Batch 3.1 benar-benar lulus; jika tidak, laporkan blocker spesifik.
