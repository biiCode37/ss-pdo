# Laporan Perbaikan: Implementasi Otomasi Penarikan Data (Tahap 2)

## 1. Ringkasan Implementasi
Telah berhasil dibangun dan diverifikasi sistem otomatisasi penarikan data (*Automated Regional Route Ingestion*) untuk 18 rute Mikrotrans dari Google Sheets ke database Supabase. Sistem ini mengadopsi standar zero-dependency Node.js native, didukung oleh GitHub Actions Cron terjadwal dan CLI runner yang fleksibel.

---

## 2. Rincian Before vs After

| Aspek | Sebelum (Tahap 1) | Sesudah (Tahap 2) |
| :--- | :--- | :--- |
| **Metode Sinkronisasi** | Manual oleh pengguna melalui penekanan tombol di web browser. | Otomatis terjadwal via server cron tanpa perlu keterlibatan interaksi pengguna (*zero-touch*). |
| **Kredensial Akses** | Bergantung pada Google GIS browser login milik user pribadi. | Menggunakan Google Service Account terisolasi (`pusm-service-google-acc@ss-pdo.iam.gserviceaccount.com`). |
| **Jadwal Eksekusi** | Tak terjadwal (bergantung ingat/tidaknya user menekan tombol). | Terjadwal otomatis 2 kali sehari di waktu pergantian operasional krusial: **14:30 WIB** (Shift 1) dan **23:00 WIB** (Shift 2). |
| **Dukungan Odometer** | Rentan mencatat KM 0 jika odometer fisik tidak dicatat di sheet. | Dilengkapi fallback cerdas: membaca kolom "TOTAL KM" sheet jika pembacaan odometer fisik kosong. |
| **Eksekusi Mandiri (CLI)** | Tidak ada script CLI untuk ingestion 18 rute. | Tersedia perintah standar: `pnpm ingest:regional` dengan flag `--date`, `--route`, `--dry-run`, dan `--force`. |

---

## 3. Case: Skenario Lapangan

### Kasus A: Petugas Rute Tetap Menggunakan Cara Lama (Spreadsheet)
- **Skenario:** Petugas di rute JAK 01 dan JAK 113 tidak membuka aplikasi SS_PDO dan hanya mengetik data bus di spreadsheet rute masing-masing seperti biasa.
- **Hasil:** Pukul 14:30 WIB dan 23:00 WIB, GitHub Actions Cron otomatis mengeksekusi `scripts/ingest-regional.mjs`. Data kedua rute tersebut langsung terserap rapi ke tabel `daily_route_reports` Supabase dengan `data_source: 'sheet_ingestion'`. Dashboard Korwil dan Wilayah di aplikasi langsung terbarui 100%.

### Kasus B: Smart Skip (Mencegah Penimpaan Laporan yang Di-submit dari Aplikasi)
- **Skenario:** Petugas rute JAK 115 menggunakan aplikasi SS_PDO dan telah menekan tombol "Kirim Laporan" (*submitted* / *verified*).
- **Hasil:** Runner mendeteksi status `submitted` di database Supabase dan secara cerdas **melewati (skip)** rute JAK 115 agar data resmi dari aplikasi tidak tertimpa oleh pembacaan spreadsheet mentah.

### Kasus C: Pengawasan Visual Eksekusi Cron
- **Skenario:** Pengawas atau developer ingin memastikan apakah penarikan data siang ini berhasil atau mengalami kendala jaringan.
- **Hasil:** Cukup membuka tab **Actions** di repositori GitHub SS_PDO. Riwayat eksekusi, rincian 18 rute yang ditarik, jumlah penumpang, total KM, dan status ritase PP dapat dilihat langsung dalam format log yang rapi dan terperinci.

---

## 4. Checklist Verifikasi Quality Gates
- [x] Audit Service Account: 18 dari 18 sheet rute terverifikasi dapat dibaca (100% PASS).
- [x] Dry-run CLI: `node --env-file=.env scripts/ingest-regional.mjs --date=2026-10-01 --dry-run` berhasil memproses 18 rute dalam < 30 detik tanpa error.
- [x] Unit Tests: `pnpm vitest run src/` ➔ 100 test files passed (760 tests lulus 100%).
- [x] Production Build: `pnpm run build` (`tsc -b && vite build`) ➔ 0 error, build sukses.
