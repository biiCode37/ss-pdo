# Audit Codex — Penutupan Fase 3 dan Baseline Fase 4

Tanggal: 29 September 2026  
Branch: `devmode`  
Sumber revisi: `refactor-ss-pdo/refact_127/`  
Keputusan: **PASS — FASE 3 CLOSED**

## Matriks temuan Fase 3

| ID | Lokasi | Keparahan | Deskripsi dan dampak user | Mitigasi terverifikasi | Status |
| --- | --- | --- | --- | --- | --- |
| R124-01 | `src/utils/historyNavigation.ts`, `src/components/busCard/BusInputModal.tsx` | Sedang | Back berulang saat animasi 220 ms dapat menjangkau modal bawah/root dan menghilangkan draft. | Entri tetap terlindungi selama dismissal; tes `history.back()` nyata membuktikan callback modal bawah tidak terpanggil sebelum modal atas hilang. | CLOSED |
| R124-02 | Dokumentasi `refact_123`, errata `refact_125` | Rendah | Klaim stack SweetAlert2 dan metode hitung baris ambigu. | Errata memisahkan stack SweetAlert2 dan menjelaskan hitungan fisik/tidak kosong. | CLOSED |
| R126-01 | `src/utils/historyNavigation.ts:52-83`, tes history dan Bus Input | Tinggi | Perbaikan sebelumnya memakai `pushState` saat Back kedua, memangkas forward history; modal Bus masih tampil dengan state root. | Kode kini memakai `history.forward()` saat pointer melewati target sah. Tes `history.back()` nyata memeriksa state Bus setelah modal atas unmount, lalu Back berikutnya menutup Bus. | CLOSED |

## Bukti review independen

- Branch `devmode` terverifikasi; arsip refactor terdahulu tidak diubah.
- `vitest run src/`: **88 berkas, 675 tes lulus**, exit 0. Diagnostik Happy DOM untuk pemuatan Google API pada tes auth tidak menyebabkan kegagalan.
- `tsc -b`: exit 0.
- `vite build`: exit 0, PWA dihasilkan. Peringatan ukuran chunk >500 kB adalah catatan performa di luar batch ini.
- `oxlint` terarah pada Bus Input/history dan tesnya: exit 0.
- Pemeriksaan kode dan tes mengonfirmasi `history.back()` nyata, penjagaan callback topmost, serta `history.state` modal bawah setelah unmount. Perangkat Android/iOS fisik belum diuji.

## Temuan yang tetap terbuka di luar Fase 3

| ID | Lokasi | Keparahan | Deskripsi dan dampak user | Mitigasi yang direncanakan | Status |
| --- | --- | --- | --- | --- | --- |
| R80-10 global | Modal lain di `src/components/`, termasuk `MonitoringRouteDetailModal.tsx` | Sedang | Sebagian modal masih mengatur shell/scroll secara berbeda; pengalaman Back, Escape, dan fokus dapat tidak konsisten. | Audit dan migrasi bertahap pada Fase 4–5, tanpa menyatakan global selesai dari hasil Bus Input saja. | PARTIAL |
| R80-08 / roadmap Fase 4 | `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx` (832 baris), `tabs/MonitoringFleetStatusTab.tsx` (700), `tabs/MonitoringToaBarChart.tsx` (402) | Sedang | Komponen monitoring besar menyulitkan konsistensi UI serta pengujian perubahan. | Fase 4 memisahkan kalkulasi dan kelompok UI yang nyata, menjaga kontrak dan visual. | OPEN |
| R89-01 | `dist_old/` dan noise graf/lint root | Rendah | Arsip build lama mencemari pelaporan tooling. | Lacak terpisah; jangan hapus arsip tanpa kebijakan cleanup yang disetujui. | OPEN |

Fase 3 selesai sesuai lingkupnya. Roadmap enam fase kini **3/6 fase selesai** menurut jumlah fase; angka ini bukan persentase kerapian codebase. Tiga fase tersisa: Fase 4–6.
