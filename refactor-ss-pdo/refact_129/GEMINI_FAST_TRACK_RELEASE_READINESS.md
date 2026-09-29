# Instruksi Gemini — Fast Track Release Readiness

Prioritas baru dari Codex untuk mempercepat penggunaan SS_PDO: **kerjakan paket kesiapan pilot ini lebih dulu**. Paket Fase 4 Batch 4.1 di `refact_128` tetap backlog sampai gerbang pilot diputuskan. Berhenti pada `READY_FOR_REVIEW`; jangan memulai deploy atau Fase 4 tanpa arahan berikutnya.

## Lingkup

1. Catat baseline `devmode` tanpa mengubah atau membersihkan perubahan lokal: tes `src/`, TypeScript, build PWA, lint terarah pada file yang disentuh, dan status Graphify. Identifikasi versi kode yang diuji tanpa membocorkan nilai `.env`.
2. Verifikasi perjalanan pengguna inti dengan data uji dan akun yang memang tersedia: login dan hak akses; pilih rute/tanggal; input KM/TOA Shift 1/2; simpan online ke Google Sheets yang dituju; offline queue lalu kembali online; konflik dua perubahan; monitoring/laporan utama; Light/Dark dan keyboard ponsel. Bila layanan/akun/perangkat tidak tersedia, tandai `UNVERIFIED` secara eksplisit dan siapkan langkah uji yang dapat dijalankan owner—jangan menulis `PASS` dari unit test saja.
3. Klasifikasikan temuan P0/P1/P2 menurut `AUDIT_BUGS.md` pada folder ini. Perbaiki hanya P0/P1 yang terbukti dalam paket kecil; jangan memecah file monitoring atau CSS besar hanya untuk memenuhi roadmap. Jaga `src/constants/texts/`, terminologi ritase PP, dan tes terkait setiap kode yang diubah.
4. Siapkan daftar gerbang pilot: semua P0/P1 tertutup, alur data utama terbukti pada lingkungan yang tersedia, build lulus, konfigurasi OAuth/origin dan akses rute valid, tidak ada rahasia di output, serta prosedur rollback dan pemantauan antrean/log. Jangan mengklaim siap pakai bila gerbang lapangan belum terverifikasi.
5. Dokumentasikan hasil pada folder `refact_N` baru setelah `refact_129`: `AUDIT_BUGS.md`, `REPAIR_REPORT.md`, **Before vs After**, **Case: Skenario Lapangan**, log bukti, status `READY_FOR_REVIEW` atau `BLOCKED_BY_ENVIRONMENT` yang spesifik.

## Batas operasi

- Hanya branch `devmode`. Jangan reset, stash, clean, commit, push, deploy, atau menyentuh branch utama. Jangan mengubah arsip `refact_N` yang selesai.
- Jangan memakai data operasional nyata untuk eksperimen tulis/hapus tanpa izin owner. Uji write pada data/rute uji yang jelas.
- Refactor Fase 4–6 tetap backlog; setelah pilot stabil, pekerjaan fitur dapat dilanjutkan sambil merapikan area yang disentuh.
