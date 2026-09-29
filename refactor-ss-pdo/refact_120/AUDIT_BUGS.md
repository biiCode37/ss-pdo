# Audit Codex — Revisi Kontras Fase 3 Batch 3.4

**Branch:** `devmode`  
**Keputusan:** `REVISION_REQUIRED / BATCH_3_5_HOLD`  
**Objek review:** revisi Gemini dalam `refact_119`.

## R118-01 — Kontras tombol rollover dan aksi Shift 1: CLOSED untuk kontrol yang ditargetkan

- **Lokasi:** `src/components/busCard/modal/singleFocus/SingleFocusKmRolloverBanner.tsx:65-68`, `singleFocusStyles.ts:20-25,76-85`, token `src/index.css:19,33,66,80`.
- **Keparahan awal:** Sedang.
- **Deskripsi/dampak awal:** Teks tombol rollover putih pada latar warning dan teks chip/salin Shift 1 biru terang pada latar terang di bawah target 4,5:1.
- **Mitigasi terverifikasi:** Token `--warning-btn-text: #0f172a` memberi sekitar **5,60:1** pada tombol Light dan **8,31:1** pada Dark. `--shift1-action-text: #0369a1` pada Light memberi sekitar **5,36:1** di atas `--shift1-bg` 8% yang terkomposisi dengan putih; token Dark tetap terbaca. Fungsi klik dan teks kamus tidak berubah.

## R116-04 — Klaim fokus setelah tombol salin: CLOSED

- **Lokasi:** `refactor-ss-pdo/refact_119/REPAIR_REPORT.md`, Case 3.
- **Keparahan awal:** Rendah.
- **Deskripsi/dampak awal:** Laporan sebelumnya menjamin fokus tetap pada input KM Awal S2 setelah tombol salin diklik, padahal handler hanya memperbarui state.
- **Mitigasi terverifikasi:** Laporan baru menjelaskan bahwa fokus input dan Enter-to-Save setelah klik tidak dijamin tanpa fokus ulang. Arsip lama tidak diubah.

## R120-01 — Judul dan penjelas banner rollover kurang kontras pada Light Mode

- **Lokasi kode:** `src/components/busCard/modal/singleFocus/SingleFocusKmRolloverBanner.tsx:26-48`; warna `src/index.css:59-80`.
- **Keparahan:** Sedang (keterbacaan instruksi koreksi KM pada ponsel).
- **Deskripsi:** Hanya foreground tombol yang diperbaiki. Judul banner berukuran `0.8rem` tetap memakai `--warning-color: #d97706`; penjelas `0.76rem` memakai `--text-secondary: #6b7280`. Latar banner Light Mode `--warning-badge-bg: rgba(234,88,12,0.1)` di atas kartu putih mendekati `#fdeee7`. Rasio judul sekitar **2,82:1**, penjelas **4,27:1**, keduanya di bawah **4,5:1** untuk teks kecil. Hasil tetap di bawah batas pada variasi wajar latar kartu putih 95%.
- **Dampak user:** Petugas dapat melihat tombol namun kesulitan membaca alasan dan angka saran rollover sebelum menerapkannya.
- **Mitigasi:** Gunakan foreground banner khusus yang lebih gelap pada Light Mode; untuk Dark Mode pilih token yang tetap terbaca. Pilihan sederhana: `--warning-text` untuk judul bila rasio kompositnya diverifikasi, dan `--text-primary` atau token penjelas khusus untuk isi. Ukur rasio pada latar komposit aktual di kedua tema dan jaga setidaknya 4,5:1. Jangan ubah logika rollover.

## R120-02 — Bukti luminansi pada laporan `refact_119` tidak konsisten

- **Lokasi dokumen:** `refactor-ss-pdo/refact_119/REPAIR_REPORT.md`, bagian 4; `refact_119/evidence/contrast-verification.txt`.
- **Keparahan:** Rendah (akurasi bukti kualitas).
- **Deskripsi:** Laporan menulis luminansi `#d97706 = 0.2378`, `#0f172a = 0.0135`, lalu menghitung `(0.2378+0.05)/(0.0135+0.05) = 4.53` dan menyatakannya kira-kira `5.60`. Luminansi sRGB yang dihitung dari warna itu sebenarnya sekitar **0,2796** dan **0,0088**, sehingga rasio **5,60** memang benar tetapi derivasi tertulis salah. Laporan juga mengasumsikan tint chip Light 12%, sementara CSS `--shift1-bg` memakai **8%**.
- **Dampak user/tim:** Bukti WCAG tidak dapat direproduksi persis dari angka yang dicantumkan, sehingga kepercayaan audit turun.
- **Mitigasi:** Hitung ulang dari nilai token CSS aktual memakai rumus sRGB dan komposisi alpha yang terdokumentasi. Simpan skrip/perhitungan yang dapat dijalankan dan outputnya di folder revisi baru; catat errata tanpa mengubah `refact_119`. Hindari klaim 'semua kontrol bebas titik buta' sebelum judul/penjelas banner diperiksa.

## Gerbang independen yang lulus

- `vitest run src/`: **87 berkas, 663 tes lulus**, exit 0.
- `tsc -b`: exit 0.
- `vite build`: exit 0 termasuk artefak PWA; peringatan ukuran chunk tidak terkait.
- `oxlint` terarah pada Single Focus dan kamus: exit 0.

Batch 3.4 tetap tertahan oleh R120-01 dan R120-02. Batch 3.5 belum dibuka.
