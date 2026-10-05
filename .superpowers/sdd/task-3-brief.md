# Task 3: Form Input Lapangan Petugas PDO di Halaman Rute

**Files:**
- Create: `src/components/RouteOperationalReportCard.tsx`
- Create: `src/components/RouteOperationalReportCard.test.tsx`
- Modify: `src/components/Dashboard.tsx`

**Interfaces:**
- Consumes:
  - `routeId: number`
  - `routeCode: string`
  - `selectedDate: string` (YYYY-MM-DD)
  - `defaultTrafficJamSpots?: string[]`
  - `defaultRenops?: number`
  - `userEmail?: string`
- Produces:
  - Form UI untuk menginput:
    - Renops Shift 1, Realops Shift 1 (number inputs)
    - Renops Shift 2, Realops Shift 2 (number inputs)
    - Headway Tercepat & Terlama (number inputs)
    - Titik Kemacetan (Checklist chips dari template + input teks baru)
    - Catatan Kendala Operasional (textarea)
    - Tombol Submit yang memanggil `upsertDailyRouteReport`
  - Callback: `onSaved?: () => void`
