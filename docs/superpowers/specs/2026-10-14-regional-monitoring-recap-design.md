# Spesifikasi Desain: Fitur Rekap Korwil & Rekap Fleksibel (Harian/Mingguan/Bulanan/Kustom)

- **Tanggal Dokumen:** 2026-10-14
- **Branch Kerja:** `devmode` (Wajib sesuai aturan proyek)
- **Status:** Siap Direview & Dieksekusi

---

## 1. Tujuan & Sasaran Fitur

1. **Pengganti Master Spreadsheet:** Menggantikan seluruh fungsi rekapitulasi pada Master Spreadsheet Monitoring Wilayah (882 baris) ke dalam aplikasi SS_PDO secara mandiri.
2. **Rekap Korwil (Tabel Kanan Replacement):** Menyajikan subtotal dan metrik performa khusus untuk 3 Tim Korlap/Pengawas (Ranto Lumban Toruan, Abdul Manan, Moamar Z.A. Mahu).
3. **Fleksibilitas Periode Waktu:** Mendukung 4 mode periode pemantauan:
   - `Harian`: Data 1 tanggal aktif (dengan stepper H-1 / H+1).
   - `Mingguan`: 7 hari terakhir dari tanggal acuan.
   - `Bulanan`: Tanggal 1 s.d. tanggal aktif/akhir bulan berjalan (pengganti baris 839-864).
   - `Kustom`: Rentang tanggal bebas (Tanggal Mulai s.d. Tanggal Selesai).
4. **Sinkronisasi Lintas Tab:** Seluruh tab (Dashboard, Rute, Rekap Korwil, Laporan WA) otomatis merefleksikan periode waktu yang dipilih.
5. **Nol Ketergantungan Paksaan:** Mendukung skenario hybrid di mana petugas yang masih menggunakan spreadsheet cara lama tetap terserap datanya secara otomatis ke database Supabase.

---

## 2. Struktur Modul & Komponen

```
src/
├── services/
│   └── allRouteMonitoringService.ts       <-- Tambah fungsi query multi-tanggal & kalkulasi Korwil
├── components/
│   └── monitoring/
│       ├── MonitoringHeader.tsx            <-- Integrasi kapsul periode
│       ├── MonitoringPeriodSelector.tsx    <-- Komponen pemilih periode (Harian, Mingguan, Bulanan, Kustom)
│       ├── MonitoringBottomNav.tsx         <-- Tambah tab 'korwil' (5 tab total)
│       ├── AllRouteMonitoringPage.tsx      <-- State periode induk & router tab
│       └── tabs/
│           └── MonitoringKorwilTab.tsx     <-- Komponen tab baru Rekap Korwil
└── constants/
    └── texts/
        ├── text_monitoring.ts              <-- Kamus teks sentral baru
        └── texts.test.ts                   <-- Uji integritas kamus
```

---

## 3. Spesifikasi Teknis & Data Flow

### A. Model Data Periode (`MonitoringPeriodType`)
```typescript
export type MonitoringPeriodMode = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface MonitoringPeriodFilter {
  mode: MonitoringPeriodMode;
  date: string;       // YYYY-MM-DD acuan
  startDate: string;  // YYYY-MM-DD awal rentang
  endDate: string;    // YYYY-MM-DD akhir rentang
  label: string;      // Label bahasa Indonesia ramah pengguna
}
```

### B. Model Data Subtotal Korwil (`SupervisorTeamSummary`)
```typescript
export interface SupervisorTeamSummary {
  id: string;              // 'RANTO' | 'ABDUL' | 'MOAMAR'
  name: string;            // 'Ranto Lumban Toruan' | 'Abdul Manan' | 'Moamar Z.A. Mahu'
  routes: RegionalRouteItem[];
  totalRenops: number;
  totalRealops: number;
  totalKm: number;
  averageKmPerBus: number;
  totalTodayPassengers: number;
  totalTargetPassengers: number;
  targetAchievementPercentage: number;
  totalRitasePp: number;
  averageRitasePerBus: number;
  passengersPerKm: number;
  passengersPerBus: number;
}
```

### C. Service Layer (`allRouteMonitoringService.ts`)
- Fungsi `fetchRegionalMonitoringData(dateStr, periodFilter)`:
  - Jika mode `daily`: Menjalankan alur harian yang sudah ada.
  - Jika mode `weekly`, `monthly`, atau `custom`: Menjalankan query Supabase agregasi rentang tanggal `.gte('date', startDate).lte('date', endDate)` untuk 18 rute.
  - Menghitung agregasi `SUM(total_km)`, `SUM(total_passengers)`, `SUM(total_trip)` serta rata-rata performa.
  - Mengelompokkan hasil ke dalam 3 objek `SupervisorTeamSummary`.

### D. Tab Rekap Korwil (`MonitoringKorwilTab.tsx`)
- Menampilkan Kartu **RANGKUMAN TOTAL 18 RUTE** di bagian atas.
- Menampilkan 3 Kartu Korwil:
  - Header: Nama Korlap, Badge Jumlah Rute (6 Rute), dan Tingkat Capaian Target Tim.
  - Grid Metrik Tim: Total Unit Operasi, Total KM Tempuh, Total Penumpang, Total Ritase PP.
  - Tombol Accordion *"Lihat 6 Rute Tim"* untuk membuka daftar rute mini beserta kontribusi metrik masing-masing.

---

## 4. Rencana Implementasi Bertahap

- **Tahap 1: Kamus Teks Sentral (`src/constants/texts/text_monitoring.ts`)**
  - Mendaftarkan seluruh label, tombol, tooltip, dan pesan kesalahan ramah pengguna.
  - Menjalankan uji integritas pada `texts.test.ts`.

- **Tahap 2: Backend & Service Layer (`allRouteMonitoringService.ts`)**
  - Menambahkan kalkulasi subtotal per Korwil (`calculateSupervisorSummaries`).
  - Menambahkan fungsi query multi-tanggal (`fetchRegionalPeriodMonitoringData`).
  - Unit test vitest untuk kalkulasi korwil & agregasi periode.

- **Tahap 3: Pemilih Periode (`MonitoringPeriodSelector.tsx` & `MonitoringHeader.tsx`)**
  - Membuat UI kapsul periode dengan kurva animasi iOS `cubic-bezier(0.32, 0.72, 0, 1)`.
  - Integrasi date range modal untuk mode kustom.

- **Tahap 4: Tab Rekap Korwil (`MonitoringKorwilTab.tsx`) & Navigasi (`MonitoringBottomNav.tsx`)**
  - Menambahkan tab `korwil` ke BottomNav.
  - Membangun antarmuka mobile-first untuk kartu korwil dan rincian rute.

- **Tahap 5: Integrasi Penuh & Quality Gates**
  - Menghubungkan seluruh tab ke state periode di `AllRouteMonitoringPage.tsx`.
  - Verifikasi tema (Light Mode & Dark Mode).
  - Eksekusi `pnpm vitest run src/`, `pnpm run build`, dan `graphify update .`.
