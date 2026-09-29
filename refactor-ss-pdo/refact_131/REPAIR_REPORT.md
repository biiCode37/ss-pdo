# Laporan peninjauan dan arahan koreksi `refact_131`

Tanggal: 29 September 2026  
Branch: `devmode`  
Status: **REVIEWED — CORRECTION_REQUIRED**

## Implementasi pada paket ini

Codex meninjau laporan `refact_130`, log bukti, status Git, dan jalur kode antrean. Paket ini menambahkan audit, instruksi koreksi untuk Gemini, dan runbook uji owner. **Kode aplikasi belum diubah dan temuan R131-01/R131-02 belum diperbaiki.** Hasil otomatis 675 tes, typecheck, lint, dan build pada `refact_130` diterima sebagai baseline yang dilaporkan, tetapi tidak dijadikan keputusan siap pilot.

## Before vs After

| Aspek | Sebelum peninjauan (`refact_130`) | Setelah peninjauan (`refact_131`) |
| --- | --- | --- |
| Kesiapan pilot | P0/P1 tertulis 0 walau uji live belum tersedia. | Dua jalur kehilangan data P0 dan dua gerbang P1 dicatat `OPEN`; pilot ditahan. |
| Penyimpanan offline | Kegagalan `localStorage` bisa tetap menampilkan status antrean berhasil. | Jalur gagal dan kriteria perbaikannya terdokumentasi untuk Gemini; belum diklaim selesai. |
| Resolusi konflik | Pemilihan data server dapat menghapus item walau fetch gagal. | Wajib mempertahankan item sampai fetch dan pembaruan UI berhasil. |
| Kandidat/rollback | Hash `HEAD` dipakai seolah mewakili perubahan dan deployment. | Perlu identitas kandidat dan target rollback yang dibuktikan; belum ada. |
| Runbook owner | Mengarahkan Force Save/Coba Lagi/Hapus sebagai pemulihan umum. | `OWNER_FIELD_TEST_RUNBOOK.md` memberi urutan uji sandbox dan penanganan antrean yang menjaga data. |

## Case: Skenario Lapangan

1. **Ponsel kehabisan ruang saat blank spot.** Petugas mengisi KM/TOA lalu Simpan. Saat `localStorage.setItem()` gagal, aplikasi saat ini dapat menyatakan masuk antrean tanpa data persisten. Hasil perbaikan yang diwajibkan: jangan menutup/mengosongkan input; tampilkan pesan bahwa data belum tersimpan dan minta petugas mempertahankan layar atau mencatat nilai sampai penyimpanan berhasil.
2. **Konflik ketika pembacaan Sheets gagal.** Petugas memilih “Gunakan Server”, tetapi koneksi putus. Saat ini item lokal dapat hilang. Hasil perbaikan yang diwajibkan: item tetap `conflict`, nilai lokal tetap ada, dan pengguna mendapat cara mencoba kembali setelah jaringan pulih.
3. **Dua petugas mengubah unit yang sama.** Pilihan Force Save melewati pemeriksaan snapshot. Dalam uji sandbox, kedua nilai harus dibandingkan dahulu; jangan jadikan Force Save tindakan pemulihan default.
4. **Owner hendak memulai pilot.** Build lokal lulus, tetapi tidak ada URL preview, akun uji, rute/spreadsheet sandbox, atau deployment rollback yang diverifikasi. Hasil yang benar: lanjut koreksi P0 dan persiapan lingkungan, kemudian uji perangkat pada sandbox; jangan menulis ke data operasional.

## Keputusan

Jalur cepat tetap tepat: Fase 4–6 yang bersifat struktural dapat menunggu. Fokus berikutnya adalah menutup R131-01 dan R131-02, membuktikan kandidat preview serta rollback, lalu menjalankan uji lapangan sandbox. Instruksi pelaksanaan ada di `GEMINI_CORRECTION_PACKET.md`; langkah owner ada di `OWNER_FIELD_TEST_RUNBOOK.md`.

## Status verifikasi

- Review statis dan inspeksi bukti: selesai.
- Tes/build baru: tidak dijalankan karena paket ini hanya menambah dokumen dan tidak mengubah source.
- Verifikasi perangkat dan integrasi live: `UNVERIFIED`; prasyarat lingkungan belum tersedia.
