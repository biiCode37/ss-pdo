# Audit Prioritas Rilis Cepat SS_PDO

Tanggal: 29 September 2026  
Branch: `devmode`  
Status: **RELEASE_READINESS_OPEN**

Dokumen ini mencatat kesenjangan bukti rilis, bukan menyatakan adanya bug produksi baru. Baseline saat ini: Fase 1–3 selesai, 675 tes otomatis lulus, TypeScript dan build PWA lulus. Fase 4–6 adalah pekerjaan struktur/penyempurnaan yang dapat berjalan setelah pilot bila gerbang operasional terpenuhi.

| ID | Lokasi | Keparahan untuk rilis | Deskripsi | Dampak pengguna | Mitigasi |
| --- | --- | --- | --- | --- | --- |
| R129-01 | Alur login, rute/tanggal, Bus Input, sinkronisasi offline, monitoring/laporan | Tinggi sampai dibuktikan | Tes otomatis dan build belum membuktikan perjalanan pengguna end-to-end pada konfigurasi serta data lapangan. | Aplikasi dapat lulus CI tetapi gagal login, simpan, atau sinkronisasi pada perangkat pengguna. | Satu paket smoke test dengan akun dan data uji yang sah; catat hasil dan bukti per alur, perbaiki hanya penahan pilot. |
| R129-02 | `devmode` working tree dan konfigurasi preview | Sedang | Banyak perubahan lokal refactor belum dibekukan menjadi kandidat rilis yang dapat diulang; belum ada bukti preview dari revisi terakhir. | Sulit mengetahui persis kode yang diuji dan mengembalikan versi sebelumnya bila pilot gagal. | Catat snapshot file/versi, build, konfigurasi non-rahasia, dan langkah pemulihan; jangan push/deploy sebelum izin owner sesuai kebijakan proyek. |
| R129-03 | Roadmap Fase 4–6 (`refact_128/PHASE_04_BATCH_PLAN.md`) | Rendah untuk pilot, tinggi untuk pemeliharaan jangka panjang | Tiga fase struktur masih terbuka, terutama komponen monitoring dan CSS. | Pemeliharaan fitur baru lebih lambat bila hotspot disentuh tanpa batas modul. | Tunda refactor menyeluruh selama jalur rilis; lakukan refactor terarah hanya pada kode yang harus diperbaiki untuk pilot, lalu lanjutkan roadmap setelah pilot stabil. |

## Aturan prioritas

- **P0:** kehilangan/korupsi data, pelanggaran akses, simpan salah, sinkronisasi menggandakan/menimpa data. Wajib selesai sebelum pilot.
- **P1:** alur utama tidak bisa dipakai, termasuk login, pilih rute/tanggal, input/simpan, antrean offline, atau tampilan ponsel yang menghalangi tugas. Wajib selesai sebelum pilot.
- **P2:** perapian struktur, inkonsistensi kosmetik yang tidak menghalangi, dan peningkatan non-kritis. Masuk backlog Fase 4–6.

Status saat ini adalah **siap memulai verifikasi rilis**, belum klaim siap dipakai luas. Tidak ada perubahan kode aplikasi pada keputusan prioritas ini.
