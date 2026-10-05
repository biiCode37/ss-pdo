# Laporan Keputusan Review — Batch 3.5 Masih Tertahan

Tanggal: 29 September 2026  
Branch: `devmode`  
Status: **REVISION_REQUIRED**

## Implementasi yang diterima

Revisi `refact_125` menahan callback Back ganda selama animasi 220 ms, menandai penutupan yang dipicu tombol UI, dan menutup temuan dokumentasi R124-02. Codex memverifikasi source, angka ukuran berkas, 671 tes, TypeScript, build PWA, dan lint. Review ini tidak mengubah kode aplikasi.

## Before vs After

| Aspek | Sebelum revisi `refact_125` | Setelah revisi `refact_125` | Hasil audit |
| --- | --- | --- | --- |
| Back kedua saat modal atas masih animasi | Callback modal bawah langsung dapat terpanggil | Guard `isDismissing` menahan callback | Perbaikan parsial diterima |
| State riwayat setelah dua Back nyata dan modal atas unmount | Tidak terkoordinasi | Kembali ke root guard, padahal modal Bus masih terbuka | R126-01, perlu revisi |
| Pengujian Back bertumpuk | Satu `popstate` sintetis | Dua `popstate` sintetis | Belum membuktikan perpindahan `history.state` nyata |
| Akurasi dokumentasi | Metode hitung baris/SweetAlert2 ambigu | Errata dan dua jenis hitungan baris tersedia | R124-02 CLOSED |

## Case: Skenario Lapangan

1. **Pengawas membuka modal Bus lalu modal lain di atasnya:** Ia menekan Back dua kali sebelum animasi atas selesai. Form Bus tetap terlihat, tetapi browser history kembali ke root setelah modal atas hilang. Back berikutnya berisiko meninggalkan aplikasi atau melewati alur tutup Bus.
2. **Petugas hanya membuka modal Bus:** Setelah Back dan unmount, root guard harus menjadi state aktif. Revisi berikutnya harus mempertahankan jalur ini sambil memperbaiki tumpukan dua modal.
3. **Tim QA mengulang tes:** Event `popstate` buatan dapat memverifikasi callback, tetapi tes riwayat harus memakai `history.back()` yang benar-benar mengubah `history.state` dan memeriksa urutan state setelah cleanup.

## Keputusan

Batch 3.5 belum lulus. Kerjakan hanya R126-01 sesuai `GEMINI_PHASE_03_BATCH_05_FINAL_NAV_REVISION.md`, dokumentasikan pada folder urutan baru, lalu serahkan `READY_FOR_REVIEW`.
