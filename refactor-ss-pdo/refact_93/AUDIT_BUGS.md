# Audit akhir Batch 2.2 — Refact 93

Tanggal: 27 September 2026. Auditor: Codex (orchestrator). Branch: `devmode`. Dokumen `refact_90` sampai `refact_92` dipertahankan sebagai arsip.

## Temuan Batch 2.2 yang ditutup

| ID | Lokasi | Keparahan | Deskripsi dan dampak user | Mitigasi dan status |
| --- | --- | --- | --- | --- |
| R79-02 / R80-02 | `BusInputModalShift1.tsx`, `BusInputModalShift2.tsx`, `fields/` | Sedang | Style input/chip diduplikasi sehingga perubahan UI antarsift dapat berbeda | Komponen bersama dipakai di kedua Shift; **CLOSED** untuk pilot ini. |
| R91-01 | `fields/ShiftOptionChip.tsx` | Sedang | Status toggle aktif tidak diumumkan pembaca layar | `<button>` native diberi `aria-pressed={isActive}` dan tes true/false; **CLOSED**. |
| R91-02 | `fields/BusFormField.test.tsx` dan evidence | Sedang | Alur Enter, Shift 2 terkunci, dan toggle belum dibuktikan oleh tes | Harness memakai handler hook nyata sampai `requestSubmit()`, dua Shift diuji; batas visual dicatat; **CLOSED** untuk cakupan revisi. |
| R91-03 | Dua file Shift dan laporan | Rendah | Whitespace dan contoh dokumentasi salah | Whitespace dibersihkan; sebagian koreksi laporan masih perlu catatan R93-01; **CLOSED** setelah koreksi review ini. |

## R93-01 — Contoh “Before” dalam laporan revisi masih salah kutip

- **Lokasi:** `refactor-ss-pdo/refact_92/REPAIR_REPORT.md` bagian 2B, blok `Source Aktual Sebelum Batch 2.2`.
- **Keparahan:** Rendah untuk ketertelusuran historis; tidak memengaruhi runtime.
- **Deskripsi:** blok itu menyebut `background: "var(--input-bg, rgba(0, 0, 0, 0.35))"` dan varian `.25` sebagai kode sebelum Batch 2.2. Diff terhadap source `devmode` menunjukkan baris awal sebenarnya `background: "rgba(0, 0, 0, 0.35)"` untuk hero dan `background: "rgba(0, 0, 0, 0.25)"` untuk secondary. Token `var(--input-bg, …)` baru digunakan dalam komponen hasil ekstraksi.
- **Dampak user:** tidak langsung; contoh historis dapat membuat pemelihara salah menilai perubahan tema.
- **Mitigasi:** koreksi eksplisit dicatat di `refact_93/REPAIR_REPORT.md`. Arsip `refact_92` tidak diedit. **CLOSED dalam review ini.**

## R89-01 — Korpus Graphify masih memuat `dist_old/`

- **Lokasi:** `graphify-out/GRAPH_REPORT.md` berisi edge menuju `dist_old/assets/`.
- **Keparahan:** Rendah untuk navigasi tooling; tidak mengubah aplikasi.
- **Deskripsi:** berkas bundle cadangan ikut dipindai sehingga jumlah node tidak mewakili source murni.
- **Dampak user:** tidak langsung; laporan graf/lint root menjadi bising.
- **Mitigasi:** audit pengecualian korpus secara terpisah tanpa menghapus `dist_old/`. **OPEN, nonblocking untuk Batch 2.2.**
