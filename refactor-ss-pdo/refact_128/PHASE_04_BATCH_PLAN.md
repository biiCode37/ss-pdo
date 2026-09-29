# Rencana Fase 4 — Monitoring 18 Rute dan Laporan

Baseline: 29 September 2026 pada branch `devmode`. Sumber roadmap `refact_82/IMPLEMENTATION_BATCHES.md`, audit Fase 3 `refact_128`, dan source aktual. Setiap batch berhenti pada `READY_FOR_REVIEW` untuk keputusan Codex; jangan menggabungkan batch.

| Batch | Lingkup sempit | Gerbang utama |
| --- | --- | --- |
| **4.1 — Metrik detail rute** | Ekstrak kalkulasi/fallback yang kini berada di awal `MonitoringRouteDetailModal.tsx` menjadi fungsi murni terlokalisasi fitur. Jangan ubah JSX atau shell. | Nilai renops/realops, TOA, KM, produktivitas dan ritase PP identik; trip ganjil tetap menghasilkan pecahan (101 trip = 50,5 rit); nol eksplisit diprioritaskan; seluruh tes detail rute lulus. |
| **4.2 — Tiga tab detail rute** | Pisahkan kelompok Operasional, Pelanggan & Shift, dan Produktivitas & Rit dari modal 832 baris menjadi komponen fitur yang fokus. | API publik modal, urutan tab, status verifikasi, aksi pilih/verifikasi, teks kamus, tampilan Light/Dark, dan pembacaan data tetap. Tidak membuat komponen generik baru tanpa dua pemakai nyata. |
| **4.3 — Shell modal detail rute** | Migrasikan shell detail rute inline ke `ModalShell`/koordinator yang sudah ada. | Portal, Escape/Back topmost, scroll lock bertumpuk, fokus, backdrop, ARIA, layout bottom sheet mobile, serta aksi verifikasi tetap aman. R80-10 global masih PARTIAL untuk modal lain. |
| **4.4 — Tab status armada** | Pecah `MonitoringFleetStatusTab.tsx` 700 baris menurut ringkasan, filter, dan daftar unit bila batas tanggung jawab jelas; ekstrak agregasi/filter murni seperlunya. | SGO/TO/OFF/SO, filter Shift 1/2, grouping route dan empty state tetap konsisten; label dan status tidak bocor lintas rute. |
| **4.5 — Grafik TOA & gerbang Fase 4** | Rapikan `MonitoringToaBarChart.tsx` 402 baris secara terukur: kalkulasi urutan/nilai bar dan tampilan tooltip/expand. Jalankan regresi monitoring menyeluruh. | 18 rute, nilai TOA/fallback, urutan tie, top 5/expand/collapse 280 ms, animasi, Light/Dark, mobile, full suite/build/lint/Graphify lulus. |

## Aturan lintas batch

1. Hanya branch `devmode`. Jangan reset, stash, clean, commit, push, atau menyentuh branch utama. Pertahankan perubahan lokal dan arsip `refact_N`/`dist_old/`.
2. Setiap batch memakai folder `refact_N` baru dengan `AUDIT_BUGS.md`, `REPAIR_REPORT.md`, bukti tes/build/lint, **Before vs After**, dan **Case: Skenario Lapangan**. Jangan mengedit folder selesai.
3. Semua teks UI baru/diubah berada di `src/constants/texts/` dan mendapat uji `texts.test.ts`. **1 ritase = PP = 2 trip**; `km_baku` untuk satu ritase PP. Nilai dari spreadsheet yang perlu parsing memakai utilitas resmi proyek.
4. Gunakan prinsip YAGNI: ekstrak hanya tanggung jawab nyata; jangan memaksakan design system atau wrapper generik. Jaga API konsumen dan urutan state/efek.
5. Jalankan tes target, seluruh `src/`, lint terarah, TypeScript/build PWA, dan `graphify update .` setelah perubahan kode. Catat batas pemeriksaan visual perangkat nyata dengan jujur.
