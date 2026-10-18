# AUDIT BUGS: Bottom Dock Clearance & Aturan Perintah "PA" (Push All)

## Informasi Refactor
- **ID Refactor:** `refact_138`
- **Tanggal:** 18 Oktober 2026
- **Branch:** `devmode`
- **Domain:** UI/UX Spacing Layout, Bottom Navigation Clearance, Standar Operasional Workflow Git

---

## Daftar Temuan Masalah

### 1. BUG-138-01: Double Padding Bottom Berlebih pada Halaman Monitoring Wilayah
- **Lokasi Kode:**
  - `src/components/monitoring/AllRouteMonitoringPage.tsx` (baris 333)
  - `src/components/monitoring/tabs/MonitoringRoutesTab.tsx` (baris 107)
  - `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx` (baris 117)
  - `src/components/monitoring/tabs/MonitoringWaReportTab.tsx` (baris 198)
  - `src/components/monitoring/tabs/MonitoringKorwilTab.tsx` (baris 55 & 106)
  - `src/index.css` (`.monitoring-dashboard-tab`, `.monitoring-korwil-tab`)
- **Keparahan:** Medium (UX Discomfort & Ruang Kosong Ekstrem)
- **Deskripsi:**
  Container pembungkus utama `<main>` pada `AllRouteMonitoringPage` telah menerapkan `paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))"`. Namun di saat bersamaan, masing-masing komponen tab di dalamnya (`MonitoringRoutesTab`, `MonitoringFleetStatusTab`, `MonitoringWaReportTab`, `MonitoringKorwilTab`, dan `.monitoring-dashboard-tab`) menambahkan `paddingBottom: 84px` hingga `100px`. Akibatnya terjadi akumulasi jarak bawah hingga 180px - 200px.
- **Dampak User:**
  Ketika pengguna di lapangan melakukan scroll hingga batas paling bawah layar, muncul area kosong (blank space) yang sangat besar dan menganga di bawah kartu konten sebelum mencapai floating dock capsule.
- **Mitigasi:**
  1. Menetapkan *Single Source of Truth* (SSOT) clearance bawah di tingkat container parent `<main>` sebesar `calc(76px + env(safe-area-inset-bottom, 12px))`.
  2. Menghapus seluruh deklarasi `paddingBottom: "84px"` dan inline kalkulasi redundan pada tab-tab anak serta mereset `padding-bottom: 0` pada kelas CSS terkait.
  3. Menstandarkan `.app-container` (Single Route) menjadi `calc(76px + env(safe-area-inset-bottom, 12px))` sehingga jarak konten terbawah ke floating dock capsule konsisten ~12px–16px di seluruh aplikasi.

---

### 2. BUG-138-02: Ketiadaan Aturan Singkat Perintah Git Multi-Step "PA" (Push All)
- **Lokasi Kode:**
  - `AGENTS.md`
  - `.agents/AGENTS.md`
  - `.agents/rules/git-branch-devmode.md`
- **Keparahan:** Low (Efisiensi DX / Developer Experience)
- **Deskripsi:**
  Sebelumnya pengguna harus mengetikkan instruksi panjang berulang kali: *"commit > push devmode > switch branch main > merge devmode ke main > push main"*. Tanpa aturan resmi tertulis, perintah singkat `"PA"` berisiko disalahartikan atau dieksekusi tanpa klausul keselamatan penanganan error.
- **Dampak User:**
  Pemborosan waktu dan potensi friksi komunikasi saat proses rilis/sinkronisasi dari branch `devmode` ke `main`.
- **Mitigasi:**
  Mendefinisikan perintah cepat `"PA"` (Push All) secara resmi ke seluruh file aturan agent (`AGENTS.md`, `.agents/AGENTS.md`, dan `git-branch-devmode.md`) lengkap dengan **Klausul Keselamatan Wajib (Larangan Keputusan Mandiri)** yang mewajibkan konfirmasi transparan disertai rekomendasi solusi jika terjadi kendala.
