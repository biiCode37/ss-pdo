# Rencana Batch Fase 3 — Form Input Bus dan Odometer

Sumber: roadmap `refact_82/IMPLEMENTATION_BATCHES.md`, audit aktual `refact_100/AUDIT_BUGS.md`, dan hasil Fase 2 `refact_99`. Tiap batch berhenti pada `READY_FOR_REVIEW` untuk keputusan Codex; jangan menggabungkan beberapa batch tanpa review.

| Batch | Lingkup sempit | Hasil dan gerbang utama |
|---|---|---|
| **3.1 — Keamanan state & helper KM** | Perbaiki bypass yang memutasi `validationErrors`; ekstrak dua sanitizer KM murni dari hook ke modul `busModalOdometer.ts` yang sudah ada; ganti fallback teks trip pada file yang disentuh. | Tes bypass campuran, zero phantom prefill, payload tersanitasi, dan baseline 62 tes tetap lulus. Tidak mengubah urutan simpan/offline queue. |
| **3.2 — Sub-hook odometer** | Pisahkan state empat KM, prefill/lock berantai, copy antarshift, dan saran rollover ke sub-hook fitur yang fokus. | Kontrak `useBusInputForm` tetap; async H-1, koreksi/backspace, bus Shift 2 saja, dan 4 warning dependensi efek ditangani tanpa loop. |
| **3.3 — Validasi dan payload simpan** | Pisahkan validasi/pembentukan `Partial<BusData>` dari hook besar sebagai fungsi murni sesuai mode Single/All; hook tetap mengurus event. | Scoped updates, TOA, trip, KM, bypass, optimistik UI, konflik dan offline queue terjaga; jangan mengubah semantik `onSave`/`onDismiss` tanpa tes. |
| **3.4 — Single Focus UI** | Pecah `BusInputModalSingleFocus.tsx` berdasarkan kelompok TOA, KM, dan catatan; gunakan field/chip bersama hanya jika cocok; pindahkan literal UI ke `src/constants/texts/`. | File tidak lagi god component; ID, urutan fokus, Enter, copy KM, chip, tema Light/Dark, dan teks kamus stabil. |
| **3.5 — Shell modal bus & gerbang akhir** | Migrasi `BusInputModal.tsx` ke `ModalShell`/scroll lock terkoordinasi dan rapikan shell saja. | Escape/Back/topmost, animasi 220 ms, viewport keyboard, scroll internal, footer, fokus, offline queue, full suite, build, lint terarah, Graphify, visual mobile bila dapat diakses. R80-10 global tetap dilacak untuk modal lain. |

## Aturan lintas batch

1. Hanya branch `devmode`. Jangan reset, stash, clean, commit, push, atau menyentuh branch utama; pertahankan arsip `refact_N`, `dist_old/`, dan perubahan lokal.
2. Setiap batch memakai folder `refact_N` baru dengan `AUDIT_BUGS.md`, `REPAIR_REPORT.md`, bukti tes/build/lint, **Before vs After**, dan **Case: Skenario Lapangan**. Jangan edit folder yang selesai.
3. Semua UI string baru/diubah di `src/constants/texts/` dan diuji pada `texts.test.ts`. Parsing angka spreadsheet memakai `parseIndonesianNumber`; ritase selalu PP.
4. Jangan membuat abstraksi generik untuk kasus hipotetis. Gunakan helper/sub-hook hanya ketika mengurangi tanggung jawab nyata dan mempertahankan API yang dipakai konsumen.
5. Pada akhir tiap batch jalankan tes target, `pnpm run test src/`, lint terarah, `pnpm run build`, dan `graphify update .` setelah perubahan kode. Catat batas pengujian visual dan noise lint root secara tepat.
