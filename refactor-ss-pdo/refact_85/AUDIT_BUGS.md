# Audit review Batch 2.1 — Refact 85

Tanggal: 27 September 2026. Auditor: Codex (orchestrator). Branch: `devmode`. Sumber: diff kode dan dokumen `refact_84`; folder `refact_84` dipertahankan sebagai arsip.

## R85-01 — Asersi nol ritase tidak membedakan hasil salah

- **Lokasi:** `src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx:273,300`.
- **Keparahan:** Sedang untuk mutu regresi domain.
- **Deskripsi:** `expect(container.textContent).toContain("0 Rit")` juga lolos bila UI menampilkan `50 Rit`. Karena tes memakai seluruh isi modal, kedua skenario nol belum membuktikan nilai metrik total ritase yang persis.
- **Dampak user:** regresi fallback atau prioritas nilai eksplisit `0` dapat lolos suite, sehingga pengawas kembali melihat 50 ritase alih-alih 0.
- **Mitigasi:** asert nilai yang tepat pada metrik `TOTAL_RITASE_PP`, misalnya dengan menemukan label metrik dan membaca nilai dalam kartu yang sama. Pastikan tes gagal jika totalnya `50 Rit`. Hindari tes yang hanya mencocokkan substring seluruh modal.

## R85-02 — Teks antarmuka masih literal dalam file yang dimodifikasi

- **Lokasi:** `src/components/busCard/modal/useBusInputForm.ts:653,684,707,712,733,755,969`; `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:193,293,510,719,735`.
- **Keparahan:** Sedang untuk konsistensi UI dan kepatuhan `AGENTS.md`.
- **Deskripsi:** Hook masih memakai fallback `"Kemarin"`, `"Trip Pergi"`, `"Trip Pulang"` dalam alur pesan validasi dan data presentasi. Modal masih memuat `"Mikrotrans"`, `title="Tutup Modal"`, `Org/KM`, serta akhiran `/Bus` dalam unit yang tampil. Sembilan call-site label Shift/TOA dari R83-01 memang sudah berpindah ke kamus, tetapi migrasi teks UI pada dua file yang disentuh belum lengkap.
- **Dampak user:** perubahan istilah di kamus dapat menghasilkan label atau pesan yang berbeda antaralir dan antarmodal.
- **Mitigasi:** gunakan entri domain di `src/constants/texts/` untuk fallback dan unit lengkap; manfaatkan entri yang sudah ada bila sesuai. Tambahkan uji integritas `texts.test.ts` untuk entri baru. Jangan ubah kalkulasi metrik nonritase ketika memindahkan unitnya.

## R85-03 — ID temuan historis salah dipetakan dalam laporan

- **Lokasi:** `refactor-ss-pdo/refact_84/AUDIT_BUGS.md:12,29`; `refactor-ss-pdo/refact_84/REPAIR_REPORT.md:148`.
- **Keparahan:** Rendah untuk ketertelusuran audit.
- **Deskripsi:** R79-06 dinyatakan sebagai masalah presisi ritase per bus. Definisi asli pada `refact_79/AUDIT_BUGS.md:49` adalah label error hardcoded di `useBusInputForm.ts`. Masalah presisi ritase per bus adalah R83-02.
- **Dampak user:** tidak berdampak langsung pada tampilan, tetapi pemilik proyek dapat menelusuri status perbaikan yang keliru dan melewatkan sisa literal UI.
- **Mitigasi:** tulis koreksi pemetaan dan status aktual R79-06/R83-01/R83-02 pada laporan `refact_86` berikutnya. Jangan mengedit arsip `refact_84`.

## Hal yang sudah diverifikasi

- Diff perhitungan modal menghapus `Math.round(totalTrips / 2)` dan `.toFixed(1)` pada tiga cabang ritase per bus; prioritas nilai eksplisit, termasuk 0, tetap ada.
- Sembilan pemanggil label validasi Shift/TOA yang ditugaskan sudah memakai `TEXT_ALERTS.BUS_INPUT_MODAL`.
- Tes target dijalankan ulang oleh Codex: 3 file, 40 tes lulus. Ini tidak meniadakan kelemahan asersi R85-01.
- Log full suite/lint/build pada `refact_84/evidence/` berupa ringkasan hasil executor. Full suite, lint, dan build tidak dijalankan ulang pada review ini.
