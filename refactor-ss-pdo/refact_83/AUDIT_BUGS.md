# Review akhir Fase 1 dan temuan untuk Batch 2.1 — Refact 83

Tanggal: 27 September 2026. Reviewer: Codex (orchestrator). Branch: `devmode`.

**Keputusan Fase 1: PASS.** Revisi Gemini di `refact_82` memenuhi enam koreksi wajib `refact_81`. Temuan berikut tidak membatalkan kelulusan audit; semuanya menjadi cakupan terukur pada Batch 2.1 atau catatan evidence review ini.

## R83-01 — Rencana kamus melewatkan file pemanggil literal

- **Lokasi kode:** `src/components/busCard/modal/useBusInputForm.ts:658`, `:693`, `:730`, `:757`, `:767`. **Lokasi rencana:** `refact_82/IMPLEMENTATION_BATCHES.md` Batch 2.1, daftar file yang boleh berubah.
- **Keparahan:** Sedang.
- **Deskripsi:** rencana menambahkan label ke `text_alerts.ts`, tetapi daftar file Batch 2.1 tidak memasukkan hook tempat literal `"Shift 1"`, `"Shift 2"`, dan `"TOA Shift 2"` mengalir ke pesan validasi. Menambah kamus saja tidak menutup R79-06.
- **Dampak user:** pesan validasi tetap menggunakan literal lama; pengubahan istilah di kamus tidak menyentuh semua pesan.
- **Mitigasi:** sertakan `useBusInputForm.ts` dalam Batch 2.1, telusuri setiap pemanggil validator yang menghasilkan teks UI, migrasikan literal terkait, dan uji label yang ditampilkan.
- **Status:** OPEN; ditugaskan ke Gemini Batch 2.1.

## R83-02 — Metrik ritase per bus masih dibulatkan di modal yang sama

- **Lokasi kode:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:76-82`, tampilan baris sekitar 719.
- **Keparahan:** Tinggi untuk presisi angka operasional.
- **Deskripsi:** `ritasePerBus` memformat nilai eksplisit dengan `.toFixed(1)`, memformat `tripsPerBus / 2` dengan `.toFixed(1)`, dan memformat fallback `totalRitasePp / realops` dengan `.toFixed(1)`. Koreksi total ritase saja akan tetap menyajikan hasil turunan yang terpotong, misalnya 50,5 ritase / 10 bus = 5,05, sedangkan UI menampilkan 5,1. `.agents/AGENTS.md` mewajibkan presisi sumber tanpa pembulatan sepihak.
- **Dampak user:** pengawas melihat angka ritase per bus berbeda dari kalkulasi data yang digunakan.
- **Mitigasi:** dalam Batch 2.1 yang sama, pertahankan urutan prioritas nilai sumber, hapus pemotongan presisi pada cabang ritase per bus, dan tambahkan tes untuk sumber eksplisit, konversi trip per bus, serta fallback 50,5 / 10. Pertahankan scope pada metrik ritase; audit angka lain mengikuti Fase 4.
- **Status:** OPEN; ditugaskan ke Gemini Batch 2.1.

## R83-03 — Berkas evidence revisi membawa keputusan review lama

- **Lokasi:** `refact_82/evidence/review-checks.json` (`Decision: REVISE`, timestamp review `refact_81`).
- **Keparahan:** Rendah, dokumentasi.
- **Deskripsi:** berkas ini salinan bukti sebelum revisi, bukan hasil pemeriksaan ulang Gemini. `refact_82/REPAIR_REPORT.md` memang menyebutnya sebagai salinan baseline, namun bila dibaca terpisah dapat terlihat seperti keputusan terbaru.
- **Dampak user:** pembaca dapat salah memahami status Fase 1.
- **Mitigasi:** keputusan terbaru dan pemeriksaan ulang dicatat di `refact_83/evidence/final-review.json`; arsip `refact_82` dibiarkan utuh.
- **Status:** CLOSED oleh review ini.

## Bukti kelulusan enam koreksi `refact_81`

- Inventory `refact_82` berisi 167 path dari 167 path aktual, tanpa hilang, ekstra, atau duplikat. Dari 14 baris facade, tidak ada yang mendefinisikan implementasi lokal menurut pemeriksaan isi file; tidak ada page yang deskripsinya masih facade.
- Rencana fallback `totalTrips / 2` tidak menambah pembulatan; sumber `totalRitasePp` eksplisit tetap diprioritaskan.
- Instruksi pemulihan luas telah diganti dengan pembandingan snapshot dan pemulihan hunk terarah.
- R80-10 kini dibatasi sebagai risiko bersyarat; dampak overlap runtime tidak lagi diklaim terbukti. Rancangan counter terkoordinasi dan dua urutan penutupan didokumentasikan untuk batch kemudian.
- Token CSS memakai nama yang terdefinisi; pilot Shift 1/2 mengacu pada field serta chip Manual/Keterangan yang ada.
- Dampak performa tanpa pengukuran ditandai sebagai risiko, bukan fakta runtime.

Pemeriksaan 319 hash sumber/CSS dari `refact_79` menunjukkan 0 perubahan sebelum Batch 2.1. Bukti lint, test, dan build `refact_80` tetap relevan untuk source yang sama; review ini tidak mengulang gate tanpa perubahan kode.
