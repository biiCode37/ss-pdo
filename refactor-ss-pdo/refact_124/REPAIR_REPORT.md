# Laporan Review — Batch 3.5 Belum Lulus

Tanggal: 29 September 2026  
Branch: `devmode`  
Status: **REVISION_REQUIRED**

## Implementasi yang diterima sementara

Gemini memindahkan shell Bus Input ke `ModalShell`, menghapus portal dan scroll lock lokal, menambahkan timer yang dibersihkan saat unmount, dan menjaga satu elemen `role="dialog"`. Tes yang tersedia lulus. Codex tidak mengubah kode aplikasi pada review ini.

## Before vs After

| Aspek | Before Batch 3.5 | Setelah paket `refact_123` | Keputusan |
| --- | --- | --- | --- |
| Portal/Escape/scroll lock | Dikelola sendiri oleh Bus Input | Dikelola `ModalShell` dan koordinator | Diterima |
| Penutupan tombol/ Escape | Tanpa timer cleanup yang jelas | Guard dan timer 220 ms dengan cleanup | Diterima untuk jalur yang diuji |
| Back satu kali | Bus Input tidak terdaftar | Bus Input menutup setelah 220 ms | Tes lulus |
| Back dua kali dalam 220 ms | Belum menjadi kontrak teruji | Entri Back pertama langsung dikeluarkan, Back kedua mencapai lapisan bawah/root | Perlu revisi |
| Bukti ukuran berkas | Dokumentasi sebelumnya bukan bagian audit ini | `340/908` adalah hitungan baris tidak kosong; baris fisik `361/1062` | Jelaskan metode |

## Case: Skenario Lapangan

1. **Petugas menekan Back dua kali dengan cepat saat mengisi KM:** Back pertama memulai animasi keluar Bus Input. Back kedua yang datang sebelum 220 ms akan diproses sebagai Back untuk modal di bawah atau root, walaupun Bus Input masih tampil. Ini harus dicegah sebelum Batch 3.5 lulus.
2. **Dialog lain bertumpuk di atas Bus Input:** Back pertama meminta dialog teratas menutup. Jika dialog itu memakai animasi, Back berikutnya harus menunggu dialog tersebut selesai agar draft Bus Input tidak ikut tertutup. Tes yang ada belum membuktikan urutan ini.
3. **Pengujian di desktop dan ponsel:** 669 tes otomatis dan build sudah lulus; tinggi keyboard dan footer baru diverifikasi lewat source/DOM, bukan pemeriksaan visual perangkat nyata. Catat batas ini saat revisi.

## Keputusan

Tahan penutupan Fase 3. Revisi dan tes regresi R124-01, lalu benarkan bukti R124-02 di folder urutan baru. Instruksi terukur tersedia pada `GEMINI_PHASE_03_BATCH_05_REVISION.md`.
