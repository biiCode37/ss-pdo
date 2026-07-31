# Design Specification: Mobile Analytics Dashboard (SS_PDO)

**Tanggal:** 31 Juli 2026  
**Status:** Disetujui (Approved)  
**Fokus Utama:** Mobile-First Operational Analytics & Real-Time Calculations  

---

## 1. Ringkasan Fitur (Feature Overview)

Aplikasi **SS_PDO** akan dilengkapi dengan halaman **Dashboard Analitik & Ringkasan Performa Operasional** baru berbasis *Mobile-First*. Halaman ini secara otomatis melakukan kalkulasi *real-time* dari data bus (`BusData[]`) yang dimuat dari Google Sheets maupun data lokal *Offline Queue*, menyajikan 12 metrik operasional standar sesuai format rekapitulasi Excel `contoh_file_ss`.

Petugas dan supervisor di lapangan dapat dengan mudah mengakses halaman ini melalui **Bottom Navigation Bar** tanpa mengganggu alur kerja pengisian data utama.

---

## 2. Arsitektur Komponen & Alur Data (Architecture & Component Hierarchy)

### 2.1 Struktur Komponen Baru
```
src/
├── components/
│   ├── AnalyticsDashboard.tsx   # Container utama halaman dashboard analitik
│   ├── BottomNav.tsx            # Komponen navigasi bawah (Mobile-First)
│   ├── KPICard.tsx              # Card metrik utama (Total KM, Pelanggan, KM/Bus, Pelanggan/KM)
│   ├── ShiftComparisonCard.tsx  # Card perbandingan Shift 1 vs Shift 2
│   └── CompletionStatusCard.tsx # Card status kelengkapan data armada & quick jump
└── utils/
    └── analytics.ts             # Helper fungsi murni kalkulasi data operasional
```

### 2.2 Alur Data (Data Flow)
1. `Dashboard.tsx` memuat `busData` (`BusData[]`) dari Google Sheets atau cache antrean lokal.
2. State `activeTab` mengontrol tampilan antara `'input'` (daftar card bus yang ada) dan `'analytics'` (halaman dashboard baru).
3. `analytics.ts` menerima `busData` dan menghitung:
   - **Total KM Ditempuh** ($\sum (\text{KM Akhir} - \text{KM Awal})$ per shift).
   - **Total Pelanggan (TOA)** ($\sum \text{toaShift1} + \sum \text{toaShift2}$).
   - **Rasio Pelanggan / KM** ($\frac{\text{Total Pelanggan}}{\text{Total KM}}$).
   - **Rata-rata KM / Bus** ($\frac{\text{Total KM}}{\text{Jumlah Bus Aktif}}$).
   - **Rincian Shift 1 & 2** (TOA, Manual, Total Shift).
   - **Kelengkapan Entri Bus** (Terisi vs Belum Terisi).
4. `AnalyticsDashboard.tsx` merender metrik tersebut dengan indikator visual dan animasi yang responsif.

---

## 3. Spesifikasi UI & Layout Mobile-First

### 3.1 Bottom Navigation Bar (`BottomNav.tsx`)
- Terletak di posisi `fixed bottom-0` dengan z-index tinggi.
- Menggunakan backdrop blur (`backdrop-blur-md`) dan border atas yang halus.
- Memiliki 2 Tab Utama:
  1. 📋 **Input Shift** (Menampilkan `BusList`)
  2. 📊 **Dashboard** (Menampilkan `AnalyticsDashboard`)

### 3.2 Halaman Dashboard (`AnalyticsDashboard.tsx`)
- **Card 1: Performa & Efisiensi Utama**
  - Grid 2 kolom untuk Total KM (Vibrant Green `#4ade80`) dan Total Pelanggan (Cyan `#38bdf8`).
  - Baris sub-metrik untuk KM/Bus dan Pelanggan/KM.
- **Card 2: Rekapitulasi Shift 1 vs Shift 2**
  - Side-by-side comparison card dengan warna aksen Amber (Shift 1) dan Purple (Shift 2).
  - Menampilkan TOA, Manual, dan Total Per-Shift.
- **Card 3: Status Kelengkapan Armada**
  - Progress bar kelengkapan pengisian data (% selesai).
  - Badges untuk unit bus yang belum lengkap diisi, dilengkapi tombol *Quick Jump* kembali ke form bus tersebut.

---

## 4. Penanganan Edge Cases & Keandalan (Edge Cases & Error Handling)

1. **KM Kosong / Belum Terisi:**
   - Jika KM Awal atau KM Akhir belum diisi pada suatu bus, kalkulasi selisih KM untuk bus tersebut diabaikan (dianggap `0`) sampai data valid diisi, tanpa menyebabkan error `NaN`.
2. **Nilai KM Anomali (KM Akhir < KM Awal):**
   - Diidentifikasi oleh `analytics.ts` dan ditampilkan sebagai peringatan visual halus pada card status tanpa menghentikan kalkulasi total bus lainnya.
3. **Koneksi Offline:**
   - Kalkulasi dilakukan 100% di client-side (in-memory `busData` & `SyncQueue`), sehingga dashboard analitik dapat diakses secara penuh meskipun dalam mode offline tanpa sinyal internet.

---

## 5. Rencana Verifikasi (Verification Plan)

1. **Automated Unit Test (`src/utils/analytics.test.ts`):**
   - Menguji fungsi `calculateAnalytics(busData)` dengan mock data bus (lengkap, parsial, dan kosong).
   - Memastikan kalkulasi Total KM, Total Pelanggan, KM/Bus, dan Pelanggan/KM tepat sesuai formula Excel `contoh_file_ss`.
2. **Verifikasi Build & Typecheck:**
   - Menjalankan `pnpm run build` dan `pnpm run lint` untuk memastikan tidak ada lint error / type issue.
3. **Manual Verification (UI & Mobile Layout):**
   - Menguji di layar mobile (375px - 430px) untuk memastikan Bottom Navigation Bar dan KPI Cards ter-render secara efisien dan responsif di tema Light & Dark.
