# Aturan & Ketentuan Kerja untuk AI Coding Agent — Proyek SS_PDO

**Jenis dokumen:** Instruksi kerja mengikat untuk AI agent (mis. Claude Code) yang bertugas mengimplementasikan perbaikan.
**Dokumen rujukan wajib:** `01-daftar-masalah.md` (apa yang salah) dan `02-rekomendasi-solusi.md` (bagaimana memperbaikinya). Semua pengerjaan HARUS mengacu ke ID BUG-XX yang sama di kedua dokumen tersebut.
**Repo target:** github.com/biiCode37/ss-pdo (React 19 + TypeScript + Vite, PWA, integrasi Google Sheets API via `gapi-script`)

---

## 1. Tujuan

Memperbaiki seluruh temuan pada `01-daftar-masalah.md` sesuai pendekatan yang direkomendasikan di `02-rekomendasi-solusi.md` — **tanpa** menambah bug baru, tanpa mengubah cakupan/fitur di luar yang diminta, dan tanpa mengubah pengalaman pengguna yang sudah benar.

## 2. Urutan Prioritas Pengerjaan

1. **Kelompok Antrean Offline** (BUG-01, 02, 03, 06, 12) — dikerjakan sebagai satu unit, sesuai catatan "Kelompok Perbaikan" di `02-rekomendasi-solusi.md`. Ini yang paling berisiko terhadap kehilangan data user.
2. **Kelompok Autentikasi** (BUG-04, 11).
3. **BUG-05** (kegagalan silent per-kolom) — kritis tapi independen, boleh disusulkan setelah kelompok 1 & 2.
4. Sisanya (BUG-07, 08, 09, 10, 13, 14, 15, 16) dikerjakan sesuai kapasitas, urutan bebas.

Dilarang mengerjakan item prioritas rendah lebih dulu sambil mengabaikan kelompok Kritis, kecuali diminta eksplisit oleh pemilik proyek.

## 3. Prinsip Kerja Utama

- **Satu bug = satu unit perubahan yang bisa direview sendiri.** Jangan menggabungkan perbaikan beberapa BUG-ID tak berkaitan ke dalam satu perubahan besar (kecuali memang satu kelompok yang saling terkait sesuai poin 2).
- **Reproduksi dulu, baru perbaiki.** Sebelum mengubah kode, tunjukkan/catat cara memicu bug tersebut sesuai skenario di `01-daftar-masalah.md`, agar ada baseline untuk membuktikan perbaikan benar-benar berhasil.
- **Verifikasi setelah perbaikan.** Setiap perbaikan wajib disertai skenario uji manual (langkah-langkah) yang membuktikan: (a) bug tidak lagi terjadi, dan (b) fitur terkait lain yang bersinggungan tidak rusak (khususnya alur offline-sync dan deteksi konflik, karena keduanya saling bersinggungan di banyak bug).
- **Ikuti solusi yang direkomendasikan** di `02-rekomendasi-solusi.md` sebagai pendekatan utama. Jika agent menilai ada pendekatan lain yang lebih baik, **jelaskan alasannya secara eksplisit** kepada pemilik proyek sebelum mengimplementasikan — jangan diam-diam menyimpang.

## 4. Batasan Teknis (Wajib Dipatuhi)

- **Dilarang mengganti stack teknologi inti** (React, TypeScript, Vite, `gapi-script`, penyimpanan di Google Sheets) tanpa persetujuan eksplisit dari pemilik proyek. Ini termasuk dilarang memindahkan backend ke database baru sebagai "solusi cepat" untuk bug antrean.
- **Dilarang menambah dependency/library baru** kecuali disebutkan eksplisit dalam dokumen solusi (mis. migrasi ke IndexedDB pada BUG-01 boleh pakai API bawaan browser, tidak perlu library tambahan) atau disetujui lebih dulu oleh pemilik proyek. Secara khusus: **jangan menambahkan Tailwind CSS** sebagai solusi BUG-08 — solusinya adalah menulis ulang styling dengan pendekatan yang sudah dipakai proyek (CSS var/inline style), bukan menambah dependency baru.
- **Perubahan skema data di `localStorage`** (terutama `SyncItem`/`PDO_SYNC_QUEUE`) **harus backward-compatible** atau menyediakan migrasi otomatis saat load — user yang sudah punya antrean tersimpan dengan skema lama tidak boleh kehilangan data saat aplikasi di-update ke versi baru.
- **Dilarang mengubah struktur/urutan kolom** pada Google Sheet sumber data, maupun asumsi format tab (nama tab = tanggal 1–31).
- Semua kredensial (`VITE_GAPI_CLIENT_ID`, `VITE_GAPI_API_KEY`) tetap lewat environment variable (`.env`) — **tidak boleh** ditulis langsung ke kode dalam bentuk apa pun, termasuk untuk keperluan testing/debug sementara.

## 5. Standar Konsistensi Kode

- Semua teks yang tampil ke user (label, pesan error, tombol) **tetap dalam Bahasa Indonesia**, mengikuti nada dan istilah yang sudah dipakai di kode saat ini (mis. "Tersimpan!", "Menunggu Sinyal", "Tabrakan Data").
- Ikuti konvensi penamaan variabel/fungsi yang sudah ada (camelCase untuk variabel/fungsi, nama field sesuai domain seperti `kmAwal1`, `toaShift1`, dsb.) — jangan me-rename properti/field yang sudah dipakai lintas file tanpa memperbarui SEMUA pemakaiannya.
- Pertahankan pola arsitektur yang sudah ada: custom hooks di `hooks/`, layanan API di `services/`, komponen presentasional di `components/`. Jangan memindahkan logika bisnis ke tempat yang tidak konsisten dengan pola ini.
- Tidak perlu menulis ulang (rewrite) file yang tidak berkaitan dengan bug yang sedang dikerjakan, sekalipun agent menganggap kualitas kodenya bisa ditingkatkan — di luar cakupan.

## 6. Larangan Eksplisit

- **Dilarang "menyelesaikan" bug dengan cara menghilangkan fitur.** Contoh yang TIDAK diperbolehkan: menghapus fitur deteksi konflik demi menghindari BUG-02/BUG-06, menghapus mode filter kategori demi menghindari BUG-07, atau menghapus antrean offline demi menghindari BUG-01/03. Solusi harus mempertahankan (bahkan memperkuat) fungsionalitas yang sudah ada.
- **Dilarang menyembunyikan error dari user** sebagai jalan pintas (mis. `catch (e) {}` kosong) — jika sebelumnya ada bug karena error tidak ditangani dengan benar, perbaikannya adalah menampilkan/menangani error tersebut secara tepat, bukan menekannya lebih jauh.
- **Dilarang mengubah alur autentikasi Google** menjadi sesuatu di luar OAuth resmi (mis. menyimpan password, membuat proxy auth sendiri) — perbaikan BUG-04/BUG-11 harus tetap dalam kerangka Google Identity Services yang sudah dipakai.
- **Dilarang menghapus validasi KM** (`checkKm` di `BusCard.tsx`) atau melonggarkannya tanpa diminta — itu di luar cakupan dokumen ini.

## 7. Definition of Done per Bug

Sebuah BUG-ID dianggap selesai jika seluruh berikut terpenuhi:

1. Kode berubah sesuai solusi di `02-rekomendasi-solusi.md` (atau alternatif yang sudah disetujui pemilik proyek).
2. Skenario reproduksi pada `01-daftar-masalah.md` tidak lagi menghasilkan perilaku yang salah.
3. Tidak ada regresi pada bug lain yang sudah pernah diperbaiki sebelumnya (khusus kelompok antrean offline — jalankan ulang uji manual seluruh kelompok, bukan hanya bug yang baru disentuh).
4. `CHANGELOG.md` diperbarui dengan entri baru mengikuti format Keep a Changelog yang sudah dipakai proyek ini (kategori `Fixed`/`Added`/`Changed`, deskripsi singkat dalam Bahasa Indonesia, mencantumkan ID bug).
5. Tidak ada `console.log`/kode debug yang tertinggal.

## 8. Kapan Harus Berhenti dan Bertanya ke Manusia

Agent **wajib berhenti dan meminta arahan** (bukan menebak/mengasumsikan) jika menemui:

- Keputusan bisnis yang ambigu — contoh konkret: BUG-07 punya dua opsi solusi (A/B) yang berdampak beda ke alur kerja petugas lapangan; pilih salah satu memerlukan konfirmasi, bukan diputuskan sepihak oleh agent.
- Kebutuhan untuk mengubah kontrak data (`SyncItem`, `BusData`, `HeaderMap`) yang berdampak ke banyak file sekaligus dan berisiko memutus kompatibilitas data user lama.
- Menemukan bug BARU yang tidak tercatat di `01-daftar-masalah.md` selama proses perbaikan — laporkan dulu (tambahkan ke daftar dengan ID baru mengikuti pola BUG-XX), jangan langsung diperbaiki di luar rencana kerja yang disepakati.
- Solusi yang direkomendasikan ternyata tidak bisa diterapkan persis seperti dijelaskan (mis. karena batasan API pihak ketiga) — jelaskan kendalanya dan ajukan alternatif sebelum melanjutkan.

## 9. Pelaporan Progres

Setiap kali menyelesaikan satu BUG-ID (atau satu kelompok), agent melaporkan dalam format singkat:

- ID bug yang dikerjakan
- Ringkasan perubahan (file apa saja yang disentuh)
- Skenario uji yang dijalankan dan hasilnya
- Status: Selesai / Perlu Review / Terblokir (dengan alasan jika terblokir)
