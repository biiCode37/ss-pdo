# Audit akhir Batch 2.1 — Refact 89

Tanggal: 27 September 2026. Auditor: Codex (orchestrator). Branch: `devmode`. Arsip `refact_84` sampai `refact_88` dipertahankan.

## Keputusan temuan Batch 2.1

| ID | Lokasi | Keparahan | Status review | Dampak user | Mitigasi/hasil |
| --- | --- | --- | --- | --- | --- |
| R79-05 | `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:70-74` | Tinggi | **CLOSED** | Total ritase PP pada jumlah trip ganjil dapat berlebih 0,5 | Fallback `totalTrips / 2` tanpa pembulatan; nilai eksplisit tetap prioritas. |
| R79-06 / R83-01 | `src/components/busCard/modal/useBusInputForm.ts` | Sedang | **CLOSED** untuk cakupan hook | Pesan validasi bisa memakai label yang berbeda dari kamus | Label Shift, TOA, tanggal H-1, dan Trip dari `TEXT_ALERTS.BUS_INPUT_MODAL`; uji kamus dan hook tersedia. |
| R83-02 | `MonitoringRouteDetailModal.tsx:76-82` | Sedang | **CLOSED** | Metrik ritase per bus kehilangan presisi | Tiga cabang ritase per bus tidak lagi memakai `.toFixed(1)`. |
| R85-01 | `MonitoringRouteDetailModal.test.tsx` | Sedang | **CLOSED** | Regresi 50 ritase dapat lolos sebagai 0 ritase | Tes membaca kartu total ritase dan membandingkan nilai persis. |
| R85-02 / R87-01 | `MonitoringRouteDetailModal.tsx`; `text_monitoring.ts`; `texts.test.ts` | Sedang | **CLOSED** | Copy modal dapat tidak konsisten | Semua label UI yang terinventaris, termasuk `S1/S2`, `Target/Cap`, dan `Capaian`, berasal dari kamus domain. |
| R85-03 | `refact_86/AUDIT_BUGS.md` | Rendah | **CLOSED** | Penelusuran ID historis dapat keliru | Laporan baru memetakan R79-06 ke label validasi dan R83-02 ke presisi ritase. |

## R89-01 — Graf memasukkan berkas build cadangan

- **Lokasi:** `graphify-out/GRAPH_REPORT.md:456-464`, contoh edge menuju `dist_old/assets/vendor-*.js`; folder `dist_old/` terlihat untracked.
- **Keparahan:** Rendah untuk navigasi arsitektur; tidak memengaruhi runtime aplikasi.
- **Deskripsi:** Graphify terbaru memasukkan berkas hasil build di `dist_old/` sebagai node/edge graf. Laporan graf berisi 698 file dan 5697 node, tetapi jumlah itu tidak boleh dipakai sebagai hitungan modul sumber murni. Perubahan jumlah node juga dipengaruhi faktor lain; review ini tidak mengatribusikan seluruh selisih pada `dist_old/`.
- **Dampak user:** tidak ada dampak antarmuka langsung. Agent/developer dapat menelusuri graf yang lebih bising dan salah menganggap output build sebagai dependensi source.
- **Mitigasi:** pada pekerjaan tooling terpisah, selidiki asal `dist_old/` dan cara mengeluarkan artefak build dari korpus Graphify tanpa menghapus berkas pengguna. Regenerasi graf dan verifikasi tidak ada edge ke `dist_old/`. **OPEN, nonblocking untuk Batch 2.1.**

## Batas temuan lain

`src/utils/modals/busInput/busModalPreConfirm.ts` masih memiliki literal label validasi yang telah dicatat oleh `refact_84`; file itu tidak termasuk Batch 2.1. Inventaris Fase 2/4 tetap memuatnya untuk migrasi tersendiri.
