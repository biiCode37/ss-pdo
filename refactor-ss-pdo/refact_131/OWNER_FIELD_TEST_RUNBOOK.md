# Runbook uji lapangan pilot SS_PDO (sandbox)

Status: **BELUM DAPAT DIJALANKAN**. Owner menyatakan URL preview, akun Google uji, serta rute/spreadsheet sandbox belum tersedia. Jalankan langkah berikut **setelah** R131-01/R131-02 diperbaiki dan kandidat preview dibuktikan.

## Prasyarat minimum

1. URL preview yang memuat **kandidat persis yang diuji**, dengan identitas deployment/versi dicatat. Bila belum ada, siapkan preview pada alur `devmode` sesuai izin owner; jangan menganggap hash `HEAD` saat ini sebagai versi tersebut.
2. Akun Google uji yang diizinkan login dan mengedit **spreadsheet sandbox**, profil/role uji aktif, serta origin preview yang benar pada konfigurasi OAuth. Isi konfigurasi melalui jalur aman; jangan kirim kata sandi, token, kunci, atau isi `.env` ke chat/log.
3. Satu rute uji yang menunjuk hanya ke spreadsheet sandbox. Siapkan paling sedikit dua unit/baris uji dan salinan nilai awal agar hasil bisa dibandingkan/dipulihkan. Pastikan rute dan tanggal uji dipilih secara sengaja.
4. Satu ponsel Android untuk Chrome, internet yang bisa diputus/diaktifkan, dan pemeriksaan Light/Dark. Untuk uji offline, buka halaman saat online dan pastikan form serta rute telah termuat sebelum memutus jaringan; jangan reload halaman saat offline kecuali ketersediaan PWA offline memang sedang diuji tersendiri.
5. Tentukan orang yang dapat menghentikan pilot dan deployment sebelumnya yang **terbukti dapat dipulihkan**. Jika belum ada, lakukan hanya uji lokal/sandbox dan jangan undang petugas operasional.

## Uji berurutan

| No. | Aksi pada sandbox | Kriteria lulus | Catatan bukti |
| --- | --- | --- | --- |
| 1 | Buka preview di ponsel dan login dengan akun uji. | Dashboard tampil; role sesuai; tidak ada pesan akses salah. | Perangkat/browser, waktu, hasil; tanpa token. |
| 2 | Pilih tahun, bulan, rute uji, dan tanggal uji. | Unit dari spreadsheet sandbox yang tepat tampil. | Kode rute/tanggal dan jumlah unit. |
| 3 | Ubah KM/TOA satu unit uji lalu Simpan. | Aplikasi mengonfirmasi hanya setelah write berhasil; nilai yang sama terlihat pada baris/kolom target di Sheets sandbox. | Nilai awal/akhir yang tidak sensitif, tangkapan layar bila perlu. |
| 4 | Saat form unit kedua sudah terbuka, putus jaringan; isi nilai uji dan Simpan. | Item antrean muncul. Jika halaman memang dapat dibuka ulang saat offline, item tetap ada setelah reload; bila halaman tidak tersedia offline, jangan reload dan lanjut ke langkah 5. | Status antrean, jumlah item, waktu. |
| 5 | Pulihkan jaringan dan tunggu sinkronisasi. | Antrean menjadi kosong hanya sesudah nilai tepat muncul di Sheets sandbox; tidak ada pengubahan kolom/baris lain. | Nilai Sheets dan jumlah antrean. |
| 6 | Buat konflik terkontrol: antrekan perubahan unit uji saat offline, ubah kolom yang sama di Sheets sandbox dari sesi lain, lalu online. | Item menjadi `conflict`; nilai server tidak tertimpa otomatis. Uji “Gunakan Server” setelah membandingkan kedua nilai. | Nilai lokal/server dan pilihan; jangan memakai Force Save sebagai jalan pintas. |
| 7 | Buka modal bertumpuk, tekan Back; uji input dengan keyboard virtual dalam Light dan Dark. | Modal menutup berurutan; tombol Simpan/Batal terlihat; teks terbaca. | Perangkat, viewport, tangkapan layar bila ada masalah. |
| 8 | Buka monitoring/laporan untuk tanggal/rute uji. | Angka cocok dengan sumber Sheets dan ritase dinyatakan sebagai PP, bukan jumlah trip satu arah mentah. | Perbandingan angka sumber dan tampilan. |

## Jika antrean gagal atau konflik

- **Jangan tekan Force Save** untuk memulihkan antrean secara rutin; pilihan ini dapat menimpa nilai server. **Jangan Hapus** item sebelum nilai lokal dicatat dan keberadaannya di Sheets diverifikasi.
- Catat unit, rute/tanggal, kolom dan nilai yang dipersoalkan, status antrean, waktu, serta tangkapan layar yang tidak mengandung rahasia. Bandingkan dengan baris Sheets sandbox.
- Bila status `failed`, perbaiki penyebab jaringan/izin terlebih dahulu. Coba Lagi hanya setelah membandingkan data terbaru dan memastikan tidak ada konflik yang belum terselesaikan.
- Jika pembacaan server gagal saat resolusi konflik, item harus tetap berada di antrean. Hentikan uji bila item hilang atau aplikasi mengklaim sukses tanpa nilai di Sheets.

## Kriteria berhenti dan keputusan

Hentikan uji saat ada input hilang, nilai salah/tertimpa, tulis ke spreadsheet yang salah, login/role salah, atau antrean hilang sebelum nilai ada di Sheets. Simpan bukti dan laporkan ke Gemini/Codex tanpa mengulang write pada data operasional. Pilot petugas hanya dapat dibuka setelah **semua P0/P1 tertutup**, seluruh langkah inti lulus di sandbox, dan kandidat serta rollback terverifikasi.

Format laporan singkat ke Codex: `kandidat/URL preview`, `perangkat`, `rute sandbox`, `langkah 1–8 PASS/FAIL`, `nilai awal/akhir untuk langkah gagal`, `status antrean`, `waktu`. Jangan lampirkan kredensial, token, atau isi `.env`.
