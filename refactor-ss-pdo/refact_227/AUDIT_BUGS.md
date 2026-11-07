# AUDIT TEMUAN TOMBOL REFRESH TAB SIAP KIRIM: REFACTOR 227
**Modul:** `MonitoringHeader` (tombol refresh), `AllRouteMonitoringPage`, `readiness/SubmissionReadinessTab`, `services/realtimeSyncService`
**Fokus Masalah:** Laporan pemilik (8 Nov 2026): tombol refresh di sebelah "Tarik data 18 rute" tidak memberi respons di tab Siap Kirim, dan tidak mengecek ulang semua rute seperti yang diharapkan.

---

### ID Temuan: BUG-RECHECK-227-01
- **Lokasi Kode:** `AllRouteMonitoringPage.tsx` (prop `onRefresh`/`refreshing` header), `SubmissionReadinessTab.tsx` (`onRegisterReload`)
- **Keparahan:** Medium (fitur terlihat rusak dan memaksa kerja manual per rute; data tidak rusak)
- **Deskripsi:** Di segmen Kelengkapan, tombol refresh hanya memuat ulang 3 query database (`reload`). Prop `refreshing` dipaksa `false` di tab ini, sehingga ikon tidak berputar dan tidak ada pesan apa pun. Tombol itu juga tidak membaca ulang Google Sheets: kelengkapan hanya dihitung `sheet-sync-webhook`. Tombol "Tarik data 18 rute" pun tidak menghitung kelengkapan, karena hanya menulis angka capaian lewat `sheets-proxy`.
- **Dampak User:** Tombol terasa mati. Untuk memastikan semua rute sebelum pengiriman malam, korlap harus membuka 18 dialog dan menekan "Cek ulang" satu per satu.
- **Mitigasi:** Di segmen Kelengkapan, tombol refresh header menjadi "Cek ulang semua rute". Tombol ini memicu webhook untuk setiap rute yang terlihat (filter Pantauan dihormati) dengan:
  - batas 3 request bersamaan, jeda 2 menit antar-penekanan, pengaman request ganda, dan pengecekan offline;
  - progres "Mengecek n/total…" di bar kontrol yang menempel;
  - ikon berputar dan tombol terkunci selama berjalan;
  - satu kali muat ulang status di akhir, lalu toast hasil (termasuk jumlah rute yang gagal).

## Catatan kuota
Satu kali penekanan untuk 18 rute = 18 pemanggilan Edge Function + 18 pembacaan Sheets + sekitar 5 query REST per rute + 3 query muat ulang, dengan Log Ingestion sekitar 0,2 MB. Jeda klien 2 menit ditambah cooldown server 3 detik per rute/tanggal mencegah ledakan bila tombol ditekan berulang.
