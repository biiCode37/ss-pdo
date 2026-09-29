# Paket Gemini — Fase 2, Batch 2.3: fondasi dialog dan scroll lock

Codex telah meluluskan Batch 2.2 pada `refact_93/REPAIR_REPORT.md`. Kerjakan **Batch 2.3 saja** sebagai pilot pada `QueueModal` dan `ReportModalLayout`, sesuai rencana `refact_82/IMPLEMENTATION_BATCHES.md`. Berhenti untuk review setelah selesai.

## Persiapan

1. Baca `AGENTS.md`, `.agents/AGENTS.md`, temuan R79-03/R80-03/R80-10 pada `refact_79`/`refact_82`, serta kode aktual `QueueModal.tsx`, `ReportModalLayout.tsx`, `useMobileBackHandler.ts`, dan `historyNavigation.ts` sebelum desain. Pastikan branch `devmode`; catat HEAD, working tree, dan diff file target. Pertahankan perubahan lokal, `dist_old/`, dan semua arsip `refact_N`. Jangan reset, stash, clean, commit, atau push.
2. Buat folder dokumentasi `refactor-ss-pdo/refact_94` jika belum dipakai, atau nomor tertinggi + 1.

## Batas implementasi

1. Implementasikan `src/utils/scrollLockCoordinator.ts` sekecil mungkin: akuisisi mengembalikan fungsi release yang idempotent; simpan nilai `document.body.style.overflow` sebelum lock pertama; pulihkan nilai persis itu hanya setelah lock terakhir dilepas. Aman untuk StrictMode, perubahan `isOpen`, dan dua urutan penutupan A/B. Jangan membuat counter bernilai negatif atau mereset lock milik dialog lain.
2. Buat `src/components/ui/ModalShell.tsx` yang mengurus portal, dialog dengan accessible name, dismiss backdrop, Escape, Back Android melalui `useMobileBackHandler`, serta fokus awal dan pemulihan fokus secara terukur. Pertahankan tata letak, animasi, scroll internal, `z-index`, dan close behavior spesifik pada dua konsumen. Hindari konfigurasi generik besar untuk kasus yang belum ada. Teks UI baru harus berasal dari `src/constants/texts/` dan diuji di `texts.test.ts`.
3. Migrasikan **hanya** `QueueModal.tsx` dan `ReportModalLayout.tsx` sebagai konsumen pilot. Hapus listener Escape, body scroll lock, dan handler Back lama yang kini dimiliki shell agar tidak terjadi double close. Periksa `ReportModalLayout` yang saat tertutup masih me-render portal dengan `display:none`; jangan mengubah lifecycle/isi anak tanpa tes yang membuktikan aman. `onClose` di ReportModalLayout opsional, jadi shell tidak boleh memicu callback yang tidak ada.
4. Uji modal bertumpuk: A buka → B buka → B tutup → A tutup; A buka → B buka → A tutup → B tetap terkunci. Escape/Back menutup **hanya dialog teratas**; klik di isi dialog tidak menutupnya; klik backdrop menutup sesuai kontrak. Uji pemulihan fokus dan nilai overflow awal yang nonkosong. Jika stack keyboard/back yang benar memerlukan koordinator kecil, jelaskan alasan dan jaga cakupan minimal.
5. **Batas R80-10:** `BusInputModal`, `UnitDetailModal`, dan modal lain masih menulis `body.style.overflow` secara langsung. Dua pilot ini belum menyelesaikan konflik global dengan modal tersebut. Dokumentasikan status R80-10 sebagai **PARTIAL** sampai seluruh penulis scroll lock relevan dimigrasikan atau dibuktikan tidak dapat bertumpuk. Jangan mengklaim bug global selesai berdasarkan tes dua pilot saja.
6. R89-01 tetap terbuka: `dist_old/` ikut dipindai Graphify/lint root. Jangan menghapus atau memindahkannya dalam batch ini. Laporkan lint terarah untuk file yang berubah dan catat noise root secara jujur; jangan membandingkan angka 1868 dengan baseline 72 sebagai regresi source.

## Gate dan dokumentasi

- Tambahkan tes coordinator, shell, dan konsumen yang menutup perilaku di atas. Jalankan tes target, `pnpm run test --dir src`, lint terarah, `pnpm run build`, lalu `graphify update .` setelah perubahan kode. Baseline saat ini: 75 file/542 tes lulus; build exit 0.
- Verifikasi mobile light/dark bila modal dapat dibuka di preview. Bila login atau preview menghalangi, tulis batasnya secara tepat tanpa mengklaim rendering sudah dilihat.
- Dalam folder baru, simpan `AUDIT_BUGS.md` berisi ID/lokasi/keparahan/deskripsi/dampak user/mitigasi dan `REPAIR_REPORT.md` berisi implementasi, **Before vs After**, **Case: Skenario Lapangan**, hasil gate, daftar file, serta status `READY_FOR_REVIEW` atau `BLOCKED` dengan alasan spesifik. Jangan mengedit arsip lama.

Kriteria review Codex: kedua pilot memakai shell yang sama tanpa kehilangan perilaku; scroll lock dan topmost dismissal benar pada dua urutan; fokus/ARIA benar; tidak ada perubahan logika data; tes dan build lulus; dokumentasi jujur tentang batas pilot dan visual.
