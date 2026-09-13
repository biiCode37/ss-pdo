# Repair Report Refact 43: Modularisasi Hook State & Dekomposisi Root Dashboard (`Dashboard.tsx`)

Dokumen ini memuat laporan teknis implementasi ekstraksi custom hooks dan perampingan god file terakhir `Dashboard.tsx` menjadi arsitektur modular di `src/components/dashboard/`.

---

## 1. Implementasi & Detail Perubahan

### A. Pembagian Custom Hooks Modular (`src/components/dashboard/`)
1. **`useDashboardData.ts`**:
   - Mengisolasi seluruh state dan efek yang berhubungan dengan pengambilan data spreadsheet Google Sheets:
     - URL sheet, kode rute aktif, tab tanggal terpilih (1..31 & AKUMULASI).
     - Data bus (`busData`), header map (`headerMap`), ringkasan kartu (`sheetSummary`), kolom hilang (`missingColumns`).
     - Pengambilan data akumulasi lintas periode (`handleApplyAccumulation`, `handleExitAccumulation`).
     - Penanganan mutasi baris bus lokal (`handleUpdateBus`).
     - Sinkronisasi resize observer untuk CSS variable `--sticky-header-height`.
2. **`useDashboardFleet.ts`**:
   - Mengisolasi tata kelola konfirmasi armada per shift dan laporan harian:
     - Deteksi status laporan rute (`operationalReportStatus`: draft / submitted / verified).
     - Perhitungan renops dinamis berdasarkan hari libur (`dynamicRenops`).
     - Status konfirmasi shift 1 & shift 2 (`confirmedShifts`, `isShiftConfirmed`).
     - Fungsi mutasi massal status armada (`handleConfirmFleetStatus`), update spreadsheet, dan penyimpanan log audit Supabase (`recordFleetStatusAuditLog`).
3. **`usePullToRefresh.ts`**:
   - Mengisolasi gestur sentuh layar tarik ke bawah (*pull-down to refresh*) khusus peranti seluler (`touchStartY`, `pullDistance`, `isRefreshing`).
4. **`Dashboard.tsx` (Root Orchestrator)**:
   - Berkurang dari 1.040 baris menjadi **~380 baris** (penurunan -660 baris kode / 63%).
   - Menyederhanakan komposisi 5 layer antarmuka dashboard: Header, Status Banners, Content Tabs, Modals, dan Bottom Navigation.
   - Mengeliminasi god file terakhir di seluruh proyek SS_PDO (> 1.000 baris = 0 file).

---

## 2. Perbandingan Before vs After

| Aspek | Sebelum Refactor 43 (Before) | Sesudah Refactor 43 (After) |
| :--- | :--- | :--- |
| **Ukuran `Dashboard.tsx`** | 1.040 baris (God File monolitik) | **~380 baris** (Penurunan -660 baris kode / 63%) |
| **Jumlah God File (> 1.000 baris) di Seluruh Proyek** | 1 file tersisa | **0 FILE (100% Tereliminasi)** |
| **Pemisahan State Logic vs View UI** | Puluhan useState, useEffect, useRef bercampur di JSX | Terisolasi bersih ke `useDashboardData`, `useDashboardFleet`, `usePullToRefresh` |
| **Integritas Unit Test** | - | **41/41 test files passed (331 tests) 100%** |
| **Kompilasi & Bundle** | - | **`tsc -b && vite build` lulus 0 error (1.18s)** |
| **Knowledge Graph** | - | Graphify 3.254 nodes, 4.280 edges terbarui |

---

## 3. Skenario Lapangan (Field Cases)

### Case 1: Refresh Tarik Layar (*Pull-to-Refresh*) Saat Berada di Depo
- **Kondisi**: Petugas lapangan Transjakarta di depo menarik layar ke bawah pada halaman dashboard untuk memuat pembaharuan ritase terbaru dari Google Sheets.
- **Before**: State gestur sentuh (`touchStartY`, `pullDistance`) bercampur langsung dengan render pohon DOM 1.040 baris.
- **After**: Logika gestur dipisah ke `usePullToRefresh.ts`. Pembaruan state jarak tarikan (*pull distance*) tidak membebani komputasi data rute atau armada di sekitarnya.

### Case 2: Konfirmasi Status Kesiapan Armada Shift 2 (14:00 WIB)
- **Kondisi**: Pukul 14:00 WIB, pengawas rute membuka sheet status armada untuk menandai unit bus SGO, Trouble Operasi (TO), dan Hari Libur/Off untuk Shift 2.
- **Before**: Logika pemrosesan status unit, penghitungan agregat renops/realops, penulisan ke Google Sheets, dan pencatatan audit log database Supabase bertumpuk ratusan baris di dalam file komponen visual.
- **After**: Seluruh alur kerja armada shift diisolasi dalam `useDashboardFleet.ts`, mudah diuji secara modular, aman dari side-effect tab dan tanggal.
