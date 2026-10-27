# Laporan Perbaikan: Smart Incremental Sync & Server-Side Batch Ingestion (Refactor 159)

## Ringkasan Implementasi
Telah berhasil diselesaikan implementasi **Opsi A (Smart Incremental Sync & Fast Supabase Pre-Check)** dan **Opsi B (Penyempurnaan Server-Side Ingestion Runner Multi-Hari)** untuk mengatasi bottleneck performa, kuota request berlebih (HTTP 429), dan waktu tunggu lama saat penarikan data rentang Mingguan dan Bulanan di halaman Monitoring Wilayah.

---

## Rincian Before vs After

| Aspek | Skenario Lama (Before) | Skenario Baru (After) |
| :--- | :--- | :--- |
| **Penarikan Data Multi-Hari (Frontend)** | Melakukan loop request Google Sheets mentah secara bertubi-tubi ($18 \times 7 = 126$ req, $18 \times 31 = 558$ req) meskipun data di Supabase sudah ada. | **Smart Incremental Pre-Check**: Kueri 1x ke Supabase untuk memeriksa slot yang sudah ada/lengkap. Rute yang sudah lengkap langsung di-skip. |
| **Waktu Tunggu Jika Data Lengkap** | Memakan waktu 3–5 menit di browser HP dan berisiko memicu HTTP 429. | **Instan (< 0,3 detik)** dengan status `allUpToDate: true`, 0 request Google Sheets. |
| **Transparansi & Kontrol Pengguna** | Menarik paksa secara membabi-buta tanpa konfirmasi. | Jika data sudah lengkap di database, sistem menampilkan dialog konfirmasi SweetAlert2 ramah pengguna, menawarkan opsi: *Gunakan Data Database* vs *Tarik Ulang Paksa (Force Sync)*. |
| **Feedback Jumlah Laporan** | Label statis/kurang informatif saat ada skip. | Menampilkan toast ramah: *"Sinkronisasi selesai: X laporan ditarik, Y laporan sudah lengkap di database."* |
| **Server-Side CLI Runner (`scripts/ingest-regional.mjs`)** | Hanya menerima argumen tanggal tunggal (`--date=YYYY-MM-DD`). | Mendukung rentang tanggal `--start-date=YYYY-MM-DD` dan `--end-date=YYYY-MM-DD` dengan jeda pacing ramah kuota. |
| **GitHub Actions Cron Workflow** | `workflow_dispatch` hanya menerima tanggal tunggal. | Mendukung parameter `start_date` dan `end_date` untuk inisialisasi/rekap 1 bulan penuh langsung di server backend tanpa menyentuh kuota HP. |

---

## Case: Skenario Lapangan

### Kasus A: Pengawas/Korwil Membuka Tab Mingguan (Semua Data Sudah Masuk)
- **Skenario:** Pengawas membuka tab Mingguan. Seluruh data 7 hari sebelumnya sudah diserap rapi oleh Webhook Realtime (`sheet-sync-webhook`) dan Cron malam GitHub Actions. Pengawas menekan tombol *"Tarik Mingguan"*.
- **Hasil:** Sistem melakukan Smart Pre-Check dalam 0,1 detik, mendeteksi ke-126 laporan sudah tersimpan lengkap di database. Modal langsung menutup seketika dan menampilkan dialog ramah: *"Seluruh data operasional untuk periode ini sudah lengkap tersimpan di database. Apakah Anda ingin tetap menarik ulang paksa dari spreadsheet Google?"*. Pengguna menekan *"Gunakan Data Database"*, dan data langsung tersaji segar tanpa membuang kuota internet seluler atau baterai peranti.

### Kasus B: Sebagian Rute Terlambat Mengisi Spreadsheet
- **Skenario:** Dari rentang 7 hari (126 slot), 120 slot sudah lengkap di database, namun ada 6 rute pada tanggal kemarin yang baru selesai direvisi.
- **Hasil:** Sistem Smart Incremental mendeteksi hanya 6 slot yang hilang. Sistem **hanya memproses 6 slot tersebut** (bukan 126 slot). Proses selesai dalam ~6 detik tanpa risiko error 429. Toast menampilkan: *"Sinkronisasi selesai: 6 laporan ditarik, 120 laporan sudah lengkap di database."*

### Kasus C: Rekapitulasi Historis 1 Bulan Penuh via GitHub Actions
- **Skenario:** Admin ingin menarik ulang data 1 bulan penuh (31 hari) tanpa membebani browser pengguna di lapangan.
- **Hasil:** Admin membuka tab Actions di GitHub, memilih workflow *Regional Ingestion Cron*, lalu memasukkan `start_date: 2026-10-01` dan `end_date: 2026-10-31`. Server Ubuntu GitHub Actions mengeksekusi penarikan 31 hari di latar belakang dengan batas timeout 6 jam dan jeda anti-rate limit yang aman.

---

## Checklist Verifikasi Quality Gates
- [x] **Vitest Unit Test Suite:** 119 test files passed, 850 unit tests passed (100% lulus tanpa error).
- [x] **TypeScript Strict Typecheck & Vite Build:** `tsc -b && vite build` lulus 0 error (`built in 3.71s`).
- [x] **Centralized Texts Dictionary:** Seluruh string UI baru terdaftar di `src/constants/texts/text_monitoring.ts` dan diverifikasi di `texts.test.ts`.
- [x] **Knowledge Graph:** `graphify update .` berhasil diperbarui (6.111 node, 7.580 edge).
- [x] **Branch Safety:** Berada di branch `devmode`.
