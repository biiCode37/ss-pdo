# Paket Gemini — Fase 3 Batch 3.2: Sub-hook Odometer

Batch 3.1 telah **PASS**. Kerjakan **hanya Batch 3.2** menurut `refactor-ss-pdo/refact_100/PHASE_03_BATCH_PLAN.md`. Berhenti pada `READY_FOR_REVIEW`; Batch 3.3 menunggu review Codex.

## Persiapan

1. Baca `AGENTS.md`, `.agents/AGENTS.md`, `refactor-ss-pdo/refact_106/AUDIT_BUGS.md`, rencana Fase 3, kode `useBusInputForm.ts`, utilitas `busModalOdometer.ts`/`busModalValidation.ts`, serta tes yang ada. Gunakan Graphify untuk melihat pemakai hook dan state KM.
2. Pastikan branch `devmode`. Catat HEAD/status/diff sebelum mengedit. Pertahankan seluruh perubahan lokal, `dist_old/`, dan semua arsip `refact_N`; jangan reset, stash, clean, commit, push, atau menyentuh branch utama.
3. Buat folder dokumentasi urutan berikutnya (`refact_107` jika tersedia). Jangan ubah arsip yang sudah selesai.

## Implementasi terarah

1. Pisahkan **satu tanggung jawab odometer** dari `useBusInputForm.ts` ke sub-hook lokal yang fokus: empat state KM, status draf prefill 3 digit, validitas/lock berantai, prefill H-1 dan pasangan KM, copy KM Akhir S1 ke Awal S2, jarak live, serta target/saran/aplikasi rollover. Biarkan validasi submit, pembentukan `Partial<BusData>`, state error form, fokus/keyboard, TOA/trip, dan `onSave` pada lapisan yang sesuai. Jika aksi rollover perlu membersihkan error form, pertahankan aksi pembersihan di hook form dan gunakan hasil sub-hook odometer.
2. Pertahankan kontrak return `useBusInputForm` yang dipakai `BusInputModal`, field, dan tes. Hindari perubahan UI yang tidak diperlukan dan jangan membuat hook generik untuk form lain.
3. Tangani empat warning `react-hooks/exhaustive-deps` pada efek KM secara semantis. Karakterisasi terlebih dahulu lalu gunakan dependensi/guard atau event setter yang tepat. Jangan menambah dependensi membabi buta, menonaktifkan rule, atau memicu render loop. Input yang sengaja diedit/dihapus pengguna tidak boleh tiba-tiba tertimpa oleh prefill pada render berikutnya.
4. Pertahankan sanitizer yang sudah diekstrak, validasi lintas hari dan checkbox bypass Batch 3.1, serta aturan `onSave`/optimistic/offline queue. Jangan mulai pemecahan validasi/payload (Batch 3.3), Single Focus UI (3.4), atau shell modal (3.5).

## Tes karakterisasi dan regresi wajib

- Data KM H-1 datang **setelah** modal dirender: draf tiga digit masuk hanya ketika field pantas diisi; nilai tersimpan dan ketikan pengguna tidak tertimpa.
- Backspace/koreksi KM Awal S1/S2: lock dan reset KM Akhir terkait tepat; tidak ada prefill berulang atau loop. Draf tiga digit tidak ikut tersimpan sebagai KM penuh, sedangkan nilai tiga digit yang memang tersimpan tetap dihormati.
- Bus yang hanya beroperasi Shift 2: KM Awal S2 terbuka dan mengambil draf H-1; kondisi Shift 1 parsial R102-01 tetap memungkinkan bypass.
- Copy KM Akhir S1 ke Awal S2 serta prefill KM Akhir S2; rollover suggestion/apply tidak mengubah nilai lain.
- Kasus bypass dengan hanya satu error maupun error campuran tetap lulus. Scoped updates dan `useBusCardSave`/offline queue tetap lulus.

## Gerbang dan laporan

Jalankan tes odometer/hook/modal/save yang relevan, `pnpm run test` tanpa filter, `pnpm run test src/`, lint terarah pada file yang disentuh, `pnpm run build`, dan `graphify update .`. Empat warning `react-hooks/exhaustive-deps` pada efek KM harus hilang tanpa disable rule; laporkan warning lama lain secara jujur. Pada Windows, bila PNPM gagal `EPERM` di profil temp, arahkan `TEMP`/`TMP` proses ke `D:\MINE\SS_PDO\node_modules\.tmp`.

Simpan `AUDIT_BUGS.md` (ID/lokasi/keparahan/deskripsi/dampak user/mitigasi), `REPAIR_REPORT.md` (implementasi, **Before vs After**, **Case: Skenario Lapangan** tiap perbaikan, hasil gate dan batas visual), serta bukti log di folder revisi baru. Laporkan `READY_FOR_REVIEW` hanya jika seluruh cakupan Batch 3.2 lulus.
