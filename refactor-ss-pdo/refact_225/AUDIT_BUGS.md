# AUDIT TEMUAN UNIT JALAN SATU SHIFT DICAP "SEBAGIAN": REFACTOR 225
**Modul:** Aturan kelengkapan (`supabase/functions/_shared/completeness.ts`), tampilan tab Siap Kirim
**Fokus Masalah:** Uji lapangan pemilik (7 Nov 2026): JAK.115 unit KWK 222179 hanya jalan di shift 2 (keterangan "Program Keur/ Renops"), sehingga TOA S1 kosong. Aturan refact_223 mencapnya "Sebagian" dan menurunkan status rute, padahal kondisinya wajar.

---

### ID Temuan: BUG-SUB-225-01
- **Lokasi Kode:** `_shared/completeness.ts` (`classifyUnitRow`)
- **Keparahan:** High (status palsu membuat korlap mengejar masalah yang tidak ada; konfirmasi meminta alasan tanpa perlu)
- **Deskripsi:** Aturan mewajibkan TOA S1 **dan** Total TOA untuk semua unit yang beroperasi. Kenyataan lapangan:
  1. unit yang hanya jalan satu shift sah memiliki salah satu kolom TOA kosong;
  2. Total TOA lazim **tidak diisi** untuk unit yang tidak jalan di shift 2 (misalnya NP2), karena petugas menganggapnya input shift 2 (TOA S2 adalah kolom berumus dan tetap tidak disentuh);
  3. prefiks shift pada keterangan **tidak bisa dipercaya**: petugas di luar aplikasi tidak menulisnya, sementara aplikasi menambahkan "S1:" bahkan untuk status seharian (OFF/T.O).
- **Dampak User:** Rute tampak "Sebagian" walau lengkap secara wajar.
- **Mitigasi (opsi D, disetujui pemilik):** status baru **WAJAR**, yaitu unit **berketerangan** (bukan NORMAL, prefiks diabaikan) yang ritasenya lengkap dan **hanya** TOA S1 **atau** Total TOA yang kosong. Tidak dihitung masalah, tetapi dicantumkan di detail dengan cuplikan keterangan (≤ 40 karakter) agar korlap tetap bisa menilai. Unit tanpa keterangan tetap wajib keempat kolom.

### ID Temuan: BUG-UI-225-02 (ditemukan saat verifikasi browser)
- **Lokasi Kode:** `ReadinessRouteDetailModal.tsx`, `submission.css` (header dialog)
- **Keparahan:** Low
- **Deskripsi:** Di 375 px, label status panjang (`nowrap` sebaris dengan judul, polesan refact_224) menimpa judul "Kelengkapan JAK.115".
- **Mitigasi:** Judul dan label status bertumpuk (`.submission-modal__heading`); nomor unit tidak patah baris.

## Risiko yang diterima pemilik
Unit dengan keterangan yang tidak berkaitan dengan jam operasi (misalnya "Telat datang", padahal jalan seharian) **dan** lupa mengisi satu kolom TOA akan tercatat WAJAR. Data tidak bisa membedakannya; label "Wajar" di detail adalah jaring pengamannya.

## Observasi (tidak diperbaiki di refact ini)
Form input aplikasi menambahkan prefiks "S1:" pada status seharian (OFF/T.O). Ini menyangkut cara aplikasi menulis keterangan ke sheet (wilayah form input bus); disarankan dibahas terpisah.
