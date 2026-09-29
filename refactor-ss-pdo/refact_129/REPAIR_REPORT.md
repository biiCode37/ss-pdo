# Keputusan Orkestrasi — Jalur Cepat ke Pilot

Tanggal: 29 September 2026  
Branch: `devmode`  
Status: **FAST_TRACK_PLANNED**

## Implementasi keputusan

Prioritas kerja berikutnya dialihkan dari dekomposisi menyeluruh Batch 4.1 ke satu paket **release readiness**. Paket Batch 4.1 pada `refact_128` tetap menjadi backlog dan tidak dihapus. Tidak ada kode aplikasi, arsip lama, atau konfigurasi deploy yang diubah pada keputusan ini.

## Before vs After

| Aspek | Sebelum | Jalur cepat |
| --- | --- | --- |
| Syarat mulai dipakai | Menunggu Fase 4, 5, dan 6 selesai | Menunggu gerbang P0/P1 alur operasional dan pilot terbatas |
| Fokus Gemini | Memecah file monitoring menurut roadmap | Memverifikasi login, data rute, simpan bus, offline queue, konflik, dan layar ponsel; memperbaiki hanya penahan |
| Review Codex | Review tiap batch refactor | Satu review bukti rilis dan review perbaikan P0/P1 yang nyata |
| Pekerjaan struktur | Dilakukan sebelum fitur berikutnya | Dilanjutkan setelah pilot stabil atau saat fitur menyentuh hotspot terkait |

## Case: Skenario Lapangan

1. **Petugas menyimpan KM/TOA saat jaringan stabil:** data harus tampak benar di aplikasi dan di sumber Google Sheets yang memang dituju, tanpa mengubah ritase PP menjadi trip satu arah.
2. **Petugas kehilangan koneksi setelah menekan Simpan:** antrean lokal harus mempertahankan perubahan, lalu sinkronisasi saat online tanpa duplikasi atau kehilangan data.
3. **Dua petugas mengubah unit yang sama:** konflik harus terlihat jelas, tidak menimpa data tanpa pilihan pengguna, dan tidak menghasilkan angka palsu.
4. **Pengawas membuka aplikasi pada ponsel:** login, rute/tanggal, input Bus, dan tindakan utama dapat dijalankan pada Light/Dark dengan keyboard virtual.

## Keputusan rilis

Mulai dari pilot internal terbatas pada akun dan rute yang ditentukan owner, dengan data uji yang aman, bukti alur, serta cara kembali ke versi sebelumnya. Setelah pilot stabil, lanjutkan pengembangan fitur dan Fase 4–6 secara terarah. Persetujuan owner tetap diperlukan sebelum push `devmode` atau deployment, sesuai aturan proyek.
