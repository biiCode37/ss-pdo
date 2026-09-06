# REPAIR REPORT: PENAMBAHAN CAPAIAN RITASE/TRIP PADA HALAMAN DAFTAR UNIT (REFACTOR 15)

Dokumen ini mencatat implementasi penambahan indikator capaian ritase/trip armada pada halaman "Daftar Unit" untuk menyelesaikan temuan audit `UNIT-15-01`.

---

## 1. Implementasi & Detail Solusi

### A. Ekstraksi Data Ritase Terpusat (`src/utils/unitAnalytics.ts`)
1. **Interface Data:**
   - Memperluas `UnitSummaryItem` dan `UnitSummaryMetrics` dengan kolom `tripPergi: string` dan `tripPulang: string`.
2. **Helper Terpusat (`detectTargetTrip`):**
   - Mengonsolidasikan logika deteksi target ritase rute ke dalam satu fungsi terpusat (`detectTargetTrip`).
   - Mengambil nilai modus ritase harian dari armada aktif (mengabaikan armada berstatus `OFF`).
   - Digunakan kembali (*reused*) oleh `BusList.tsx`, `UnitSummaryDashboard.tsx`, dan `UnitCard.tsx`.

### B. Pembaruan Kartu Unit (`src/components/UnitCard.tsx`)
1. **Penyajian Metrik Trip pada Line 2:**
   - Menambahkan metrik Trip berdampingan secara proporsional dengan metrik KM dan Pnp: `[KM] | [Pnp] | [Ritase]`.
   - Menggunakan ikon `Repeat` dengan ukuran ringkas (13px) yang selaras dengan tema mobile-first.
2. **Status Indikator Visual Terpadu:**
   - **Target Tercapai (misal 7/7 Rit saat target 7 ritase):**
     - Angka ritase berwarna Hijau Emerald (`#10b981`), font weight 800.
     - Tooltip: `Target Tercapai: 7/7 Rit`.
   - **Kurang Ritase (misal 5/5 Rit saat target 7 ritase):**
     - Angka ritase berwarna Kuning Amber (`var(--warning-text, #f59e0b)`) dengan ikon `⚠️ 5/5 Rit`.
     - Tooltip: `Kurang Ritase: 5/5 Rit (Target Rute: 7/7 Rit)`.
   - **Trip Tidak Seimbang (misal 4/3 Rit):**
     - Angka ritase berwarna Oranye (`#f97316`) dengan penanda `⚠️ 4/3 Rit`.
   - **Unit Tanpa Trip / 0:**
     - Menampilkan `- Rit` atau `0/0 Rit` netral tanpa visual yang mengganggu.

### C. Pembaruan Modal Rincian Unit (`src/components/UnitDetailModal.tsx`)
- Menambahkan baris akumulasi ritase pada kartu *Executive Summary Total*:
  - Menampilkan `X/Y Ritase` lengkap dengan badge status `(Target Tercapai)` atau `(Kurang Ritase: Target A/B)` yang responsif dan konsisten.

---

## 2. Before vs After

| Area | Sebelum Perbaikan (Before) | Sesudah Perbaikan (After) |
| :--- | :--- | :--- |
| **Line 2 Kartu Unit** | Hanya menampilkan `Total KM | Total Pnp`. | Menampilkan `Total KM | Total Pnp | Total Ritase (Trip)`. |
| **Pembedaan Capaian di Tab Unit** | Petugas tidak dapat membedakan mana unit yang sudah 7/7 ritase dan mana yang baru 5/5 ritase. | Unit 7/7 ritase tampil hijau solid, unit 5/5 ritase tampil amber dengan badge peringatan `⚠️ 5/5 Rit`. |
| **Executive Summary Modal** | Hanya menampilkan KM Total dan Pnp Total. | Menampilkan KM Total, Pnp Total, dan Ritase Total beserta status target rute. |
| **Konsistensi Logika Target** | Komputasi auto-detect target trip sempat terduplikasi secara parsial. | Terpusat dalam satu helper `detectTargetTrip` yang dipakai bersama di `BusList` dan `UnitSummaryDashboard`. |

---

## 3. Case: Skenario Lapangan

### Skenario Lapangan: Pemeriksaan Rutin Armada di Tab "Daftar Unit"
- **Kondisi:**
  - Pengawas sedang memantau kesehatan performa operasional 15 armada Mikrotrans pada rute `JAK.115`.
  - Di sore hari, armada `JAK-115-08` baru menyelesaikan 4 ritase karena perbaikan radiator di bengkel pukul 14:00, sedangkan armada lain rata-rata sudah menyelesaikan 6 atau 7 ritase.
- **Sebelum Perbaikan:**
  - Di halaman "Daftar Unit", kartu `JAK-115-08` hanya menampilkan KM: 65 dan Pnp: 120.
  - Pengawas tidak langsung sadar berapa ritase yang hilang kecuali membuka kembali tab "Input SS" atau spreadsheet manual.
- **Sesudah Perbaikan:**
  - Di halaman "Daftar Unit", kartu `JAK-115-08` langsung memperingatkan dengan jelas: `65 KM | 120 Pnp | ⚠️ 4/4 Rit`.
  - Ketika kartu ditekan, modal rincian armada langsung menampilkan `4/4 Ritase - Kurang Ritase (Target: 7/7)`.
  - Pengawas langsung dapat mendokumentasikan Berita Acara (BA) kendala operasional dengan cepat dan akurat.
