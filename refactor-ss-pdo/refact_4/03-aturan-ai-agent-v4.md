# Aturan & Ketentuan Kerja untuk AI Coding Agent v4 — Proyek SS_PDO / SPUM

**Jenis dokumen:** Instruksi kerja mengikat untuk babak perbaikan keempat ini.
**Dokumen rujukan wajib:** `01-daftar-masalah-v4.md`, `02-rekomendasi-solusi-v4.md`.
**Dokumen yang TETAP BERLAKU bersamaan:** `.agents/AGENTS.md`, serta `03-aturan-ai-agent.md`/`-v2`/`-v3`.

---

## 1. Catatan Apresiasi & Konteks

Tingkat penyelesaian bug di babak ini sangat tinggi (lihat bagian Verifikasi di `01-daftar-masalah-v4.md`) — proses kerja mengikuti dokumen aturan sebelumnya (reproduksi dulu, verifikasi manual untuk isu keamanan/browser, komentar kode mereferensikan ID bug) terbukti efektif. **Pertahankan pola kerja yang sama untuk babak ini.**

## 2. Prioritas Tertinggi: Cegah Pola Regresi Berulang (BUG-45)

Ini adalah **kali ketiga** kelas bug yang sama persis (parsing angka Indonesia dengan `parseInt`/`parseFloat` polos alih-alih `parseIndonesianNumber`) muncul di file yang berbeda-beda (BUG-20 → BUG-26 → BUG-45). Untuk mencegah kali keempat:

1. Kerjakan BUG-45 sesuai `02-rekomendasi-solusi-v4.md`.
2. **Sebelum menandai selesai, WAJIB grep seluruh `src/` untuk pola `parseInt(` dan `parseFloat(`** yang beroperasi pada field bertipe string dari `BusData`/spreadsheet (bukan pada input lain seperti `Number(e.target.value)` dari form HTML biasa, yang berbeda konteks) — pastikan tidak ada instance keempat yang lolos di file yang belum sempat diaudit di dokumen ini.
3. **Tambahkan pencegahan struktural**, bukan cuma perbaikan titik: usulkan penambahan catatan singkat di `.agents/AGENTS.md` bagian "Aturan Emas" yang secara eksplisit menyebut "Semua parsing angka dari data BusData/sheet WAJIB lewat `parseIndonesianNumber()` di `utils/numberUtils.ts` — dilarang `parseInt`/`parseFloat` langsung." Ini directive tingkat proyek, bukan sekadar catatan di dokumen audit yang bisa terlewat di masa depan.

## 3. Urutan Prioritas

1. BUG-45 (kritis, sesuai Bagian 2).
2. BUG-46 (perbaikan performa, risiko rendah, boleh dikerjakan sekaligus dengan BUG-45 karena menyentuh file yang sama).
3. BUG-47 (minor, prioritas rendah, opsional untuk babak ini).

## 4. Prinsip Kerja Tambahan

- **Saat memperbaiki BUG-45, jangan berhenti di `unitAnalytics.ts` saja** — pola pencarian sebelum menulis kode baru (Bagian 2, poin 2) berlaku untuk SEMUA pekerjaan berikutnya di proyek ini, tidak hanya untuk masalah nomor parsing. Setiap kali akan menulis logika yang "terasa familiar" (parsing angka, deteksi header, format tanggal, dll.), luangkan waktu mencari dulu apakah sudah ada utilitas serupa di `utils/`/`services/` sebelum menulis dari nol.
- Verifikasi BUG-45 dengan data uji yang MENGANDUNG pemisah ribuan (bukan cuma angka kecil di bawah 1000) — kelemahan test lama (`analytics.test.ts` versi awal) yang tidak menangkap BUG-20 adalah karena data ujinya semua di bawah 1000. Jangan ulangi kesalahan itu di `unitAnalytics.test.ts`.

## 5. Definition of Done

- BUG-45: lolos test baru dengan kasus format ribuan Indonesia + grep menyeluruh (Bagian 2 poin 2) tidak menemukan instance lain yang lolos.
- BUG-46: hasil akhir tetap identik secara fungsional (angka yang ditampilkan sama persis sebelum & sesudah refactor) — ini optimisasi performa, bukan perubahan perilaku, jadi regresi hasil sekecil apa pun tidak boleh terjadi.
- BUG-47: cache tidak boleh menyebabkan data basi (stale) terlihat oleh user setelah refresh eksplisit — uji dengan pull-to-refresh setelah cache terisi, pastikan data ter-update.

## 6. Pelaporan Progres

Sama seperti babak sebelumnya. Untuk BUG-45, sertakan hasil grep menyeluruh (Bagian 2 poin 2) sebagai bukti tidak ada instance lain yang tertinggal.
