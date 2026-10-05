# Task 6 Brief: AllRouteMonitoringPage Component

## Objective
Create `src/components/AllRouteMonitoringPage.tsx` and test file `src/components/AllRouteMonitoringPage.test.tsx`.
This component is the standalone Regional Monitoring & Daily Report Dashboard for Korlap / Korwil / Pimpinan.

## Requirements
1. **Header & Controls:**
   - Back button (`<- Operasi Rute`) to switch back to single-route view.
   - Date picker with Prev / Next day buttons and date input.
   - Refresh button (triggers re-fetch).
   - "📊 Buat Laporan WA" button in the header (or floating action bar) to open `WaReportModal`.
2. **Progress / Completeness Banner:**
   - Shows readiness indicator: e.g. "16 / 18 Rute Siap" (persentase & visual bar).
   - Info highlight if any route hasn't submitted yet.
3. **Supervisor Filter Tabs:**
   - `Semua (18)`
   - `Ranto Lumban Toruan (6)`
   - `Abdul Manan (6)`
   - `Moamar Z.A. Mahu (6)`
4. **Regional Aggregate KPI Cards (4 Cards):**
   - **Armada (Realops / Renops):** Total Realops / Renops & % Armada.
   - **Total Pelanggan:** Total H, perbandingan vs H-1 jika ada.
   - **Total KM Tempuh:** Total KM & rata-rata KM per bus.
   - **Distribusi Shift:** Pelanggan Shift 1 vs Shift 2.
5. **Route Cards Grid:**
   - 18 routes rendered in responsive grid (1 col mobile, 2 col tablet, 3 col desktop).
   - Each card displays:
     - Route Code (badge) & Name
     - Operator & Korlap
     - Status Badge: `Verified` (green), `Submitted` (blue), `Draft` (amber), `Belum Diisi` (slate/red)
     - Shift metrics: S1 (Ren/Real), S2 (Ren/Real)
     - Pelanggan (Total, TOA, Manual)
     - KM Tempuh & Capaian KM
     - Titik Macet & Kendala (jika ada)
     - Tombol Verifikasi: toggle status verifikasi oleh Korlap (calls `verifyDailyRouteReport`).
6. **Mobile-First & Fluid UX:**
   - Light & Dark mode support.
   - Smooth transitions `cubic-bezier(0.32, 0.72, 0, 1)`.
   - Loading skeleton state while fetching.
   - User-friendly error message with retry button.
