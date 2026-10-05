# Paket tugas Gemini — Fase 1: inventaris dan kontrak perapihan

Anda adalah executor Antigravity/Gemini untuk proyek `D:\MINE\SS_PDO`. Codex menjadi orchestrator dan project owner meneruskan paket ini. Jalankan **Fase 1** pada roadmap, lalu kembalikan hasil untuk review Codex.

## Tujuan

Menghasilkan peta lengkap komponen dan keputusan refactor yang sederhana, berbasis bukti sumber terkini. Keluaran fase ini adalah audit dan kontrak implementasi yang cukup rinci untuk memulai Fase 2. Implementasi perubahan kode aplikasi dijadwalkan lewat paket fase berikutnya setelah review.

## Bacaan awal

1. `AGENTS.md`, `.agents/AGENTS.md`, dan aturan scoped lain yang berlaku pada file yang dikerjakan.
2. `refactor-ss-pdo/refact_79/ROADMAP.md`.
3. `refactor-ss-pdo/refact_79/AUDIT_BUGS.md` dan `REPAIR_REPORT.md`.
4. `refactor-ss-pdo/refact_79/evidence/baseline.json` dan `source-inventory.csv`.
5. `graphify-out/GRAPH_REPORT.md`, kemudian verifikasi hasil navigasinya dengan kode aktual. HEAD dan working tree dapat berubah setelah paket disusun.

## Langkah kerja

### 1. Rekam keadaan saat mulai

- Pastikan branch aktif `devmode`; jangan mengakses `main/master/production`. Bila berbeda, laporkan konteks dan ikuti aturan branch sebelum perubahan.
- Periksa `git status --short`, HEAD, dan aturan yang berlaku. Catat perubahan lokal awal sebagai pekerjaan yang harus dipertahankan. Jangan reset, checkout file lama, stash, clean, commit/push massal.
- Buat folder `refactor-ss-pdo/refact_N` baru dengan N = nomor terbesar saat mulai + 1. Nomor yang diperkirakan dari paket ini adalah 80, tetapi wajib periksa ulang dan jangan menimpa folder yang sudah ada.
- Tuliskan referensi `refact_79/GEMINI_PHASE_01.md`, waktu, HEAD, branch, dan status awal pada laporan. Gunakan hasil baseline Codex sebagai pembanding. Ulang pemeriksaan bila snapshot sumber sudah berubah atau ada kegagalan yang perlu dijelaskan.

### 2. Inventaris seluruh permukaan UI

- Cakup seluruh file TS/TSX dalam `src/components/`, `src/App.tsx`, hooks terkait, seluruh CSS aplikasi, kamus, serta helper/services yang dipanggil UI.
- Buat satu baris per file komponen non-test, termasuk facade. Catat: path, peran, fitur/pemilik, tanggung jawab, baris fisik, pemanggil, dependensi domain, pola UI, teks/gaya, test relevan, dan keputusan keep/refactor/share/investigate.
- Sertakan ringkasan jumlah file ditemukan vs diperiksa. Jelaskan setiap pengecualian; jangan menganggap file panjang, facade, atau nama serupa otomatis salah.
- Buat peta dependensi yang cukup untuk menunjukkan entry point, aliran data, dan batas fitur. Temukan import silang fitur/cycle dengan bukti. Primitive UI tidak boleh bergantung pada layanan data/domain bus.
- Untuk peluang reuse, tunjukkan minimal dua pemakai konkret dan bedakan kesamaan visual dari kesamaan kontrak perilaku. Kandidat lokal satu fitur tidak perlu langsung dipindahkan ke shared.

### 3. Audit keluarga UI dan kontraknya

Periksa tombol, input, label/hint/error, selector tanggal/rute, tabs/filter, badge/status, KPI, kartu, modal/bottom sheet, loading/skeleton, empty, error/retry, serta sticky header/footer. Catat mana yang sudah konsisten dan dapat dipertahankan.

Kontrak memuat props minimum, tanggung jawab, variasi yang terbukti perlu, sumber teks, style/token, aksesibilitas, state loading/error/disabled, dan konsumen pertama. Usulan visual harus menjaga fungsi warna status dan kebutuhan petugas lapangan. Tidak perlu mengganti font, ikon, atau library demi variasi desain.

Untuk modal, telusuri parent dan efek global: portal, layer, Escape, tombol kembali Android, scroll lock bersarang, focus trap/restore, judul dialog, dan viewport keyboard. Bedakan fakta dari dugaan. Pemeriksaan kode saja belum membuktikan perilaku mobile.

### 4. Validasi temuan awal dan invariant bisnis

- Konfirmasi atau koreksi R79-01 s.d. R79-07 dengan lokasi sumber terkini. Hubungkan temuan baru dengan ID lama agar dapat ditelusuri.
- Buat kasus uji yang diperlukan untuk ritase: 101 trip = 50,5 ritase; 100 = 50; 0 = 0; `totalRitasePp` eksplisit tetap menjadi sumber sesuai kontraknya. Catat apakah kode lain punya pola pembulatan serupa.
- Petakan alur odometer dan TOA berdasarkan kode/test serta `docs/ODOMETER_INPUT_CHAIN_LOGIC.md`: prefill tiga digit, KM awal/akhir, perpindahan shift/hari, rollover, mode single field, simpan/gagal/batal, dan offline queue.
- Cari teks yang benar-benar tampil ke user, termasuk label yang disisipkan ke error. Jangan melaporkan union, route key, CSS class, test fixture, atau ID teknis sebagai UI string.
- Periksa pemanggil utilitas modal lama sebelum merekomendasikan penghapusan atau penggantian.

### 5. Susun paket implementasi berikutnya

- Rekomendasikan satu pilot kecil dengan minimal dua konsumen nyata; prioritas awal adalah field/style input Shift 1/2.
- Pisahkan koreksi ritase dari refactor tampilan agar bukti perubahan domain mudah direview.
- Untuk tiap batch usulan, cantumkan file yang boleh berubah, alasan, risiko, kontrak sebelum/sesudah, skenario uji, dan cara memulihkan perubahan batch tanpa menyentuh perubahan lokal lain.
- Struktur default mempertahankan folder fitur saat ini dan menambah `components/ui` sesuai kebutuhan. Usulan pemindahan lebih luas harus menunjukkan manfaat konkret dan seluruh pemanggil terdampak.

## Artefak wajib di folder baru

| File | Isi minimum |
| --- | --- |
| `AUDIT_BUGS.md` | ID, status confirmed/suspected, lokasi, keparahan, deskripsi, dampak user, mitigasi, fase, hubungan ke R79 bila ada. |
| `REPAIR_REPORT.md` | Ringkasan hasil fase, daftar file yang dibuat, Before vs After untuk dokumentasi/keputusan, Case: Skenario Lapangan, status pengujian, batas pemeriksaan; nyatakan belum ada perbaikan kode jika hanya audit. |
| `COMPONENT_INVENTORY.csv` | Seluruh file komponen dan kolom hasil inventaris; denominator cakupan dan file baru tidak boleh hilang. |
| `UI_CONTRACTS.md` | Pola yang dipertahankan, kandidat reuse, konsumen nyata, props, state, token, aksesibilitas, serta batas domain. |
| `IMPLEMENTATION_BATCHES.md` | Peta dependensi ringkas, urutan batch Fase 2, daftar file, acceptance criteria, risiko, dan prioritas hotspot lanjutan. |

Tambahkan evidence pengujian/visual secukupnya; jangan menyalin data sensitif atau file credential. Jika aplikasi tidak bisa dibuka tanpa akses pengguna, teruskan audit statis dan tandai pemeriksaan visual sebagai belum terverifikasi.

## Verifikasi dan batas fase

- Gunakan PNPM. Perintah proyek: `pnpm run lint`, `pnpm vitest run src/`, `pnpm run build`. Jika shorthand Vitest gagal di Windows, gunakan script resmi. Untuk membatasi discovery tepat pada sumber proyek, `pnpm run test --dir src` telah diverifikasi menghasilkan 74 file / 524 test lulus. `pnpm run test src/` menggunakan filter path dan pada baseline menemukan 76 file / 532 test; jangan menyamakan kedua cakupan itu. Catat perintah yang benar-benar dijalankan.
- Pada sesi Codex, PNPM sempat gagal karena `TEMP/TMP` menggunakan path pendek Windows. Override sementara kedua env tersebut ke folder lokal `node_modules/.tmp/refact79` memperbaiki startup. Gunakan workaround hanya bila diperlukan; jangan mengubah konfigurasi mesin permanen.
- Baseline dan warning ada dalam `refact_79/evidence/`. Jangan menyamakan test runner yang gagal mulai dengan kegagalan test aplikasi, dan jangan menyatakan pemeriksaan yang tidak dijalankan lulus.
- Aturan proyek mewajibkan `graphify update .` setelah perubahan kode. Fase ini berupa dokumentasi audit; jika melakukan refresh graf untuk membantu inventory, catat keluaran dan pertahankan perubahan graf yang sudah ada.
- Seluruh teks UI baru saat fase implementasi harus berada di `src/constants/texts/`, dengan uji integritas tambahan pada `texts.test.ts`. Dynamic copy berupa fungsi template murni.
- Semua pengembangan dilakukan di `devmode`; pekerjaan ini tidak mencakup push/deploy, migrasi framework/database, atau perubahan data operasional.

## Kriteria penerimaan oleh Codex

1. Jumlah komponen diperiksa cocok dengan inventory aktual; pemanggil dan status facade jelas.
2. Setiap rekomendasi penting memiliki bukti kode dan dampak; suspected tidak dinyatakan sebagai bug terkonfirmasi.
3. Rancangan membatasi tanggung jawab dan mengurangi duplikasi tanpa memindahkan kompleksitas ke god hook/helper baru.
4. Ada kontrak UI dan matriks skenario nyata untuk kedua tema, mobile, keyboard, jaringan lemah, serta domain ritase/odometer.
5. Pilot implementasi dan batas file siap dieksekusi; dokumentasi wajib lengkap; status verification jujur.

Kembalikan ringkasan berbahasa Indonesia berisi path folder hasil, status `READY_FOR_REVIEW` atau `BLOCKED`, daftar temuan prioritas, rekomendasi pilot, hasil verifikasi, serta keputusan produk yang benar-benar diperlukan. Hentikan pekerjaan setelah paket Fase 1 selesai untuk review orchestrator.
