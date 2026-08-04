# Aturan & Ketentuan Kerja untuk AI Coding Agent v2 — Proyek SS_PDO

**Jenis dokumen:** Instruksi kerja mengikat untuk AI coding agent (Claude Code, AntiGravity, atau agent lain manapun) yang bertugas mengimplementasikan perbaikan babak kedua ini.
**Dokumen rujukan wajib:** `01-daftar-masalah-v2.md` (apa yang salah), `02-rekomendasi-solusi-v2.md` (bagaimana memperbaikinya).
**Dokumen yang TETAP BERLAKU dan HARUS tetap dipatuhi bersamaan dengan dokumen ini:**
- `.agents/AGENTS.md` — aturan emas proyek (Mobile-First, SSOT presisi penuh, sesi login permanen, wajib PNPM, standar animasi iOS, format komunikasi). Dokumen ini **melengkapi**, bukan menggantikan, `.agents/AGENTS.md`. Jika ada perbedaan penafsiran, `.agents/AGENTS.md` yang menjadi acuan utama untuk hal-hal yang memang dibahas di sana.
- `03-aturan-ai-agent.md` (v1) — sebagian besar poinnya masih relevan; dokumen ini menambahkan poin baru yang muncul dari temuan v2, tidak mengulang semuanya dari nol.

---

## 1. Tujuan

Memperbaiki seluruh temuan BUG-19 s.d. BUG-36 di `01-daftar-masalah-v2.md` (BUG-18 dicabut, tidak perlu dikerjakan), sekaligus **tidak merusak ulang** perbaikan BUG-01 s.d. BUG-17 dari babak pertama yang sudah terverifikasi bekerja (kecuali BUG-13 yang memang perlu dipulihkan lewat BUG-29).

## 2. Catatan: BUG-18 Dicabut

BUG-18 ("KM Awal/Akhir tidak pernah tersimpan") **dicabut** — terbukti keliru setelah verifikasi lapangan oleh pemilik proyek dan pengecekan ulang struktur spreadsheet (audit awal salah karena tampilan kolom sempat terpotong, menyembunyikan kolom "Kilometer Awal/Akhir Shift 1/2" yang sebenarnya ada). **Jangan mengerjakan/mengubah apa pun terkait BUG-18** — fitur ini sudah berfungsi dengan benar. Lihat catatan retraksi lengkap di `01-daftar-masalah-v2.md`.

## 3. Urutan Prioritas

1. **BUG-19** (race condition ganti tab/tanggal) — prioritas tertinggi; berdiri sendiri tapi berdampak langsung ke integritas data (berpotensi menyimpan ke hari/tab yang salah).
2. **Kelompok Antrean Offline v2** (BUG-22, 23, 24, 25).
3. **Kelompok Route Selector** (BUG-27, 28, 29) — BUG-29 memulihkan proteksi yang sempat hilang, prioritaskan lebih dulu dari 27/28 karena sifatnya regresi keamanan data yang sudah pernah "selesai".
4. BUG-20, BUG-21 (parsing & pembulatan angka) — berdiri sendiri, terkait tema SSOT.
5. Sisanya (BUG-26, 30, 31, 32, 33, 34, 35, 36) sesuai kapasitas.

## 4. Prinsip Kerja Utama (melanjutkan v1)

Semua prinsip di `03-aturan-ai-agent.md` (v1) — satu bug satu unit perubahan, reproduksi dulu baru perbaiki, verifikasi setelah perbaikan, ikuti solusi yang direkomendasikan atau jelaskan alasan menyimpang — **tetap berlaku penuh** di sini. Tambahan khusus untuk babak ini:

- **Verifikasi terhadap data nyata, bukan asumsi — termasuk saat memeriksa struktur spreadsheet.** BUG-18 (sekarang dicabut) awalnya "ditemukan" justru karena tampilan kolom sempat dipotong saat audit, menyembunyikan kolom yang sebenarnya ada di lebar penuh. Untuk setiap perbaikan yang menyentuh parsing/penulisan data (BUG-20, 21, 26), WAJIB uji terhadap file di `contoh_file_ss/*.xlsx` dengan memeriksa SELURUH lebar kolom (jangan dipotong), bukan hanya data tiruan buatan sendiri.
- **Jangan ulangi pola regresi BUG-29.** Saat melakukan refactor besar pada satu komponen (seperti yang terjadi pada `RouteSelectorCard`), WAJIB menelusuri kembali fungsi-fungsi lama yang tergantikan untuk memastikan tidak ada logika penting (validasi, pencegahan duplikat, dsb.) yang diam-diam hilang. Sebelum menandai sebuah refactor besar selesai, jalankan ulang skenario reproduksi dari BUG-13 (v1) sebagai bagian dari verifikasi, meski refactor itu sendiri tidak menyasar BUG-13.
- **Pesan error yang dilihat user HARUS selalu lewat `formatUserError`.** Jangan membuat string pesan error baru secara langsung (hardcoded) di komponen manapun — ini murni untuk menjaga konsistensi setelah BUG-30 diperbaiki. Jika pesan yang dibutuhkan belum ada di `errorFormatter.ts`, tambahkan rule baru di sana, jangan buat jalan pintas lokal.

## 5. Batasan Teknis Tambahan

- Seluruh batasan teknis di `03-aturan-ai-agent.md` (v1) tetap berlaku (tidak ganti stack, tidak menambah dependency tanpa persetujuan, dst.), **kecuali** satu pengecualian eksplisit: `vitest` (untuk Solusi BUG-32) diizinkan ditambahkan sebagai devDependency karena tidak berdampak ke bundle produksi (hanya alat pengembangan) dan sudah direkomendasikan secara eksplisit di dokumen solusi.
- **Wajib `pnpm`** untuk seluruh perintah instalasi/skrip, sesuai `.agents/AGENTS.md` bagian 4 — bukan `npm`/`yarn`.
- Repo saat ini berada di commit bertitel "Sebelum integrasi SUPABASE" — **jangan mulai/lanjutkan integrasi Supabase** sebagai bagian dari pekerjaan memperbaiki bug-bug di dokumen ini, kecuali diminta secara terpisah dan eksplisit. Menggabungkan migrasi database besar dengan perbaikan bug akan menyulitkan verifikasi mana yang menyebabkan regresi apa.
- Perubahan pada `SyncItem`, `HeaderMap`, atau struktur `localStorage` lain harus tetap backward-compatible dengan data yang mungkin sudah tersimpan di perangkat pengguna dari versi sebelumnya (pola migrasi di `readQueueFromStorage` sudah menjadi contoh yang baik untuk diikuti).

## 6. Kapan Harus Berhenti dan Bertanya ke Manusia (tambahan)

Selain kondisi yang sudah tercantum di `03-aturan-ai-agent.md` (v1), tambahan khusus untuk babak ini:

- **BUG-35 dan BUG-36** — keduanya membutuhkan keputusan/konfirmasi bisnis (siapa pengguna utama; apakah Total Pelanggan bisa pecahan) sebelum kode diubah. Jangan mengubah default tab atau menghapus pembulatan hanya berdasarkan dugaan.
- Jika ditemukan pola "perbaikan lama yang hilang" LAIN selain BUG-29 saat menelusuri kode (indikasi ada regresi lain yang belum terdeteksi di audit ini), laporkan dulu dengan ID baru mengikuti pola BUG-XX, jangan langsung diperbaiki di luar rencana yang disepakati.

## 7. Pelaporan Progres

Sama seperti v1 (ID bug, ringkasan perubahan, skenario uji & hasil, status Selesai/Perlu Review/Terblokir). Untuk perbaikan yang menyentuh parsing/penulisan data spreadsheet (BUG-20, 21, 26), sertakan contoh nilai SEBELUM dan SESUDAH sebagai bukti perbaikan tidak mengubah makna angka.
