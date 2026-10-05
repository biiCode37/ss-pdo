# Paket Gemini — Fase 2, Batch 2.2: pilot field Shift 1/2 reusable

Codex telah meluluskan Batch 2.1 melalui `refact_89/REPAIR_REPORT.md`. Kerjakan **Batch 2.2 saja** untuk menutup R79-02/R80-02: duplikasi kontrol input dan chip pada `BusInputModalShift1.tsx` dan `BusInputModalShift2.tsx`. Setelah selesai, berhenti untuk review Codex sebelum Batch 2.3.

## Sebelum mengubah kode

1. Baca `AGENTS.md`, `.agents/AGENTS.md`, `refact_82/IMPLEMENTATION_BATCHES.md` bagian Batch 2.2, serta paket ini. Pastikan branch `devmode`. Catat `git status --short`, HEAD, dan diff file target; pertahankan perubahan lokal. Jangan reset, stash, clean, commit, push, atau mengubah arsip `refact_N` lama tanpa instruksi pengguna.
2. Folder dokumentasi baru adalah `refactor-ss-pdo/refact_90` jika tersedia, atau nomor tertinggi + 1. Jangan mengubah `refact_89`.

## Batas implementasi

1. Audit pemakaian nyata `heroInputStyle`, `secondaryInputStyle`, dan `getChipStyle` pada kedua Shift. Catat mana yang sama, mana override dinamis seperti disabled/locked, dan kontrak input yang harus dipertahankan: `id`, `htmlFor`, `ref`, `value`, `type`, `inputMode`, `pattern`, `min/max`, `placeholder`, `disabled`, `onChange`, `onFocus`, `onKeyDown`.
2. Ekstrak gaya dan markup input yang **sungguh dipakai oleh kedua Shift** ke komponen kecil dengan props jelas, misalnya `fields/BusFormField.tsx`. Ekstrak chip Manual/Catatan yang sama ke `fields/ShiftOptionChip.tsx` bila kontrak bersama terbukti. Jangan memindahkan state atau rumus domain dari `useBusInputForm.ts`; Shift 1 dan Shift 2 tetap mengatur perilaku masing-masing. Hindari komponen generik dengan puluhan opsi atau wrapper yang hanya meneruskan props tanpa mengurangi duplikasi nyata.
3. Pertahankan tampilan light/dark, fokus, disabled, keyboard Enter, nilai draft, serta aturan Shift 1 dan Shift 2. Jangan mengubah `MAX_TOA_VALUE`, odometer, TOA, atau logika penyimpanan. Gunakan token warna yang sudah ada; audit warna gelap hardcoded pada input sebelum mengklaim tampilan light mode setara.
4. Karena kedua file `.tsx` dimodifikasi, audit semua teks UI yang terlihat. Empat label chip aktif saat ini membentuk `` `✓ ${...}` `` di JSX. Pindahkan template dinamis ini ke `TEXT_ALERTS.BUS_INPUT_MODAL` atau gunakan kamus yang sudah sesuai, lalu tambah uji integritas `src/constants/texts/texts.test.ts`. Komponen bersama menerima teks dari pemanggil/kamus; jangan menulis copy UI langsung di komponen baru.
5. Prioritaskan tes perilaku yang membedakan regresi: nilai dan handler input hero/secondary di kedua Shift, disabled KM yang terkunci, perpindahan fokus Enter, serta toggle chip Manual/Catatan. Gunakan tes yang memeriksa perilaku pengguna/DOM, bukan duplikasi struktur komponen. Tambahkan uji visual atau bukti screenshot pada lebar mobile yang relevan untuk light dan dark bila lingkungan preview tersedia; catat jika tidak dapat dilakukan.

## Batas file dan verifikasi

- File utama: `src/components/busCard/modal/BusInputModalShift1.tsx`, `BusInputModalShift2.tsx`, komponen baru yang benar-benar perlu di `modal/fields/`, serta tes terkait.
- Kamus: `src/constants/texts/text_alerts.ts` dan `texts.test.ts` hanya untuk teks baru.
- `graphify-out/` boleh berubah sebagai hasil `graphify update .`. **R89-01:** graf saat ini memuat `dist_old/assets/`; jangan menghapus atau memindahkan `dist_old/`. Catat kontaminasi ini secara jujur; jangan mengklaim jumlah node sebagai hitungan source murni. Pemulihan korpus graf ditangani terpisah.
- Jalankan tes target, `pnpm run test --dir src`, `pnpm run lint`, `pnpm run build`, dan `graphify update .` setelah perubahan kode. Baseline: 74 file/531 tes lulus, lint 72 warning/0 error, build exit 0. Di Windows, arahkan TEMP/TMP proses PNPM ke folder writable dalam workspace jika muncul EPERM.
- Dokumentasikan di folder baru: `AUDIT_BUGS.md` dengan ID/lokasi/keparahan/deskripsi/dampak user/mitigasi; `REPAIR_REPORT.md` dengan implementasi, **Before vs After**, **Case: Skenario Lapangan**, hasil gate, dan daftar file. Jangan menyatakan PASS sendiri; gunakan `READY_FOR_REVIEW` atau `BLOCKED` dengan alasan spesifik.

## Kriteria review Codex

- Duplikasi input/chip yang dipilih benar-benar berkurang pada kedua Shift tanpa abstraksi berlebihan.
- Kontrak input dan alur keyboard/toggle tetap sama; tidak ada perubahan rumus domain atau data.
- Semua teks UI di komponen yang disentuh memakai kamus domain; entri baru teruji.
- Tes bermakna, full suite/build lulus, lint tanpa warning baru; bukti visual light/dark/mobile tersedia atau keterbatasannya dijelaskan.
- Diff dan dokumentasi terfokus; `dist_old/`, perubahan lokal lain, dan arsip audit tetap aman.
