# Instruksi Gemini — koreksi gerbang pilot setelah review Codex

Baca `AUDIT_BUGS.md` dan `REPAIR_REPORT.md` dalam folder ini. Kerjakan **R131-01 dan R131-02 lebih dulu** pada branch `devmode`; jangan memulai Fase 4–6. Jangan mengubah folder `refact_N` yang sudah selesai. Tulis hasil dan bukti di folder urutan baru sesudah `refact_131` dengan `AUDIT_BUGS.md`, `REPAIR_REPORT.md`, Before vs After, serta Case: Skenario Lapangan.

## 1. Perbaikan wajib

1. **Kegagalan penyimpanan offline (R131-01).** Ubah kontrak penulisan antrean agar kegagalan `localStorage.setItem()` diketahui pemanggil. Jangan mengubah state menjadi queued atau menampilkan toast sukses jika persistensi gagal. Pastikan input petugas tetap tersedia dan tampilkan pesan ramah pengguna. Jangan menjadikan backup Supabase sebagai bukti sukses ketika offline. Hindari refactor luas; periksa semua call site dan propagasi error.
2. **Resolusi konflik memakai server (R131-02).** `resolveConflict()` hanya boleh menghapus item setelah data server berhasil dibaca dan UI diperbarui. Bila gagal, pertahankan item dan status `conflict`; tampilkan pesan gagal yang tepat. Periksa pemanggil agar toast sukses tidak dikirim sebelum operasi async sukses. Jaga pilihan Force Save sebagai tindakan sadar pengguna, bukan retry otomatis.
3. **Kamus UI.** Setiap pesan UI baru masuk ke `src/constants/texts/` dan uji integritas `texts.test.ts`. Pertahankan terminologi ritase PP dan perilaku Google Sheets sebagai SSOT.

## 2. Tes penerimaan yang diperlukan

- `localStorage.setItem()` melempar `QuotaExceededError` dan `SecurityError`: tidak ada status queued palsu, input tetap tersedia, pesan kegagalan muncul.
- `getBusRowData()` gagal saat “Gunakan Server”: item konflik tetap persisten setelah render ulang, tanpa toast sukses. Jalur sukses menghapus item sesudah UI menerima nilai server.
- Satu kasus offline antrean normal kembali online tetap sinkron; kasus konflik tetap tidak menimpa server secara otomatis.
- Jalankan unit test yang relevan, seluruh `src/`, `tsc -b`, build, lint pada file tersentuh, dan `graphify update .`. Catat perintah dan hasil; pisahkan hitungan tes source kandidat dari `.worktrees` bila tersedia.

## 3. Gerbang kandidat dan dokumentasi

- Koreksi klaim `R129-02 CLOSED`, `P0/P1 = 0`, rollback hash `1fb52a6`, dan sanitasi rahasia yang belum didukung bukti. Lakukan di folder revisi baru; jangan mengedit `refact_130`.
- Catat identitas **kode yang benar-benar diuji**, termasuk perubahan dan berkas baru. Jangan menyebut hash `HEAD` sebagai snapshot seluruh working tree.
- Siapkan rencana preview dan rollback konkret, tetapi **jangan commit, push, deploy, reset, stash, clean, atau menyentuh branch utama** tanpa instruksi owner yang sesuai. Konfigurasi/URL/akun sandbox belum tersedia; tandai gerbang live `BLOCKED_BY_ENVIRONMENT`.
- Jangan menyimpan kredensial atau nilai `.env` dalam bukti. Jangan menulis ke rute atau spreadsheet operasional.

Serahkan status `READY_FOR_REVIEW` hanya setelah dua P0 tertutup dan bukti otomatis lengkap. Jika lingkungan live masih belum ada, tulis `READY_FOR_REVIEW — LIVE_UNVERIFIED`, bukan `READY_FOR_PILOT`.
