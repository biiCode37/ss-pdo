# Instruksi Gemini — Fase 4 Batch 4.1: Metrik Detail Rute

Codex menetapkan Fase 3 **PASS**. Mulai **hanya Batch 4.1**, lalu berhenti pada `READY_FOR_REVIEW`. Rencana lengkap Fase 4 ada pada `PHASE_04_BATCH_PLAN.md` di folder ini.

## Tujuan dan batas

`src/components/monitoring/modals/MonitoringRouteDetailModal.tsx` masih 832 baris. Baris awalnya menghitung banyak fallback (`renops`, `realops`, TOA, KM, Pax/KM, ritase PP). Pindahkan kalkulasi tersebut ke fungsi murni terlokalisasi pada fitur detail rute; modal tetap memegang state tab dan JSX. Jangan memigrasikan shell atau memecah tab pada batch ini.

## Kontrak yang harus dijaga

- Pertahankan prioritas field eksplisit, termasuk nilai **0** yang sah, dibanding fallback. Jangan mengubah tampilan angka, format presisi, atau nilai kosong tanpa tes kebutuhan.
- **1 ritase = PP = 2 trip.** `totalTrips / 2` dan `tripsPerBus / 2` tidak dibulatkan menjadi bilangan bulat. Contoh 101 trip harus tetap 50,5 rit; 10,1 tripsPerBus menjadi 5,05 rit/bus bila itulah fallback yang ada.
- Jaga API `MonitoringRouteDetailModal`, `onSelectRoute`, `onVerifyRoute`, tiga tab, dan teks dari `TEXT_MONITORING`. Jika ada teks UI baru, tambah kamus dan uji integritasnya.
- Jangan mengubah CSS/JSX, animasi, shell, atau komponen status/chart yang menjadi batch berikutnya. Pilih satu helper murni yang jelas bila cukup; jangan membuat hook/abstraksi generik tanpa kebutuhan.

## Bukti penerimaan

1. Tambah tes fungsi murni untuk prioritas field, nilai 0, pembagi nol, trip ganjil, dan presisi ritase per bus. Pastikan tes komponen detail rute yang sudah ada tetap lulus.
2. Jalankan tes target, seluruh `src/`, `tsc -b`, build PWA, lint terarah, dan `graphify update .` setelah perubahan kode.
3. Buat folder urutan baru setelah `refact_128` berisi `AUDIT_BUGS.md`, `REPAIR_REPORT.md`, **Before vs After**, **Case: Skenario Lapangan**, dan log bukti. Jangan edit arsip selesai.
4. Bekerja hanya di `devmode`; jangan reset, stash, clean, commit, push, atau menyentuh branch utama. Pertahankan perubahan lokal.

Kirim path folder dan status `READY_FOR_REVIEW` setelah Batch 4.1. Jangan mulai Batch 4.2 sebelum keputusan Codex.
