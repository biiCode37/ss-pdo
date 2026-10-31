# Repair Report: Refactor 173 — Integrasi Status Kesiapan Armada Bus pada Tab Operasional Bottom Sheet Rute & Standarisasi Ketelitian Global

## Ringkasan Perbaikan
Refactor 173 menyelesaikan permintaan penggabungan konteks armada dan penegakan tata kelola kualitas industri:
1. **Penegakan Aturan Ketelitian Multi-Dimensi Global:**
   - Menambahkan aturan baru pada aturan global pengguna (`GEMINI.md`) dan repositori (`AGENTS.md` & `.agents/AGENTS.md`) mengenai standar kerja teliti, hati-hati, dan optimalisasi 360° lintas bidang (keamanan, performa, UI/UX mobile-first, integritas data SSOT, dan reliabilitas tanpa cela).
2. **Penyatuan Konteks Armada ke Tab Operasional Modal Rute:**
   - Memasukkan seksi **Status Kesiapan Armada Bus** langsung ke dalam Tab Operasional pada `MonitoringRouteDetailModal.tsx`.
   - Mengalirkan prop `fleetShifts` dari `AllRouteMonitoringPage.tsx` ➔ `MonitoringRoutesTab.tsx` ➔ `MonitoringRouteDetailModal.tsx`.
   - Mendukung resolusi ganda: data input manual DB Supabase (`daily_fleet_shifts`) dan fallback otomatis ke data tarikan Google Sheets 18 rute (`fleetStatusShift1`/`fleetStatusShift2`).
3. **Ekstraksi Modul Utilitas Sentral (`monitoringUtils.ts`):**
   - Mengekstrak fungsi murni `inferStatusCode`, `formatUnitNote`, dan `extractRouteTroubledUnits` ke `src/components/monitoring/monitoringUtils.ts`.
   - Menghapus duplikasi kode dan menjamin konsistensi visual badge, warna, dan status di seluruh tab.
4. **Penyempurnaan Regex Parsing BA Code:**
   - Memperbaiki regex `baMatch` menjadi `\bBA[\s.]?0?([1-6])\b` agar mencakup variasi penulisan dengan spasi (`BA 01`, `BA 02`).
5. **Kamus Teks Sentral (`text_monitoring.ts`):**
   - Menambahkan kunci `FLEET_SECTION` pada `ROUTE_DETAIL_MODAL` di `src/constants/texts/text_monitoring.ts` tanpa teks hardcoded, serta memverifikasi dengan uji integritas `texts.test.ts`.
6. **Enrichment Bottom Sheet Korwil (`KorwilRouteDetailBottomSheet.tsx`):**
   - Menampilkan daftar unit bus kendala pada seksi Kesiapan Armada di tab Kinerja Korwil.

---

## Implementasi Kode

### 1. Ekstraksi Utilitas Sentral di `src/components/monitoring/monitoringUtils.ts`
```typescript
export function extractRouteTroubledUnits(
  route: RegionalRouteItem,
  fleetShifts?: DailyFleetShiftWithUnits[]
): TroubledUnitItem[] {
  const routeCode = route.routeCode;
  const unitMap = new Map<string, TroubledUnitItemInternal>();
  // Resolusi data shift 1 & 2 dari DB Supabase dengan fallback ke Google Sheets
  ...
  return Array.from(unitMap.values()).map(...);
}
```

### 2. Seksi Kesiapan Armada di `MonitoringRouteDetailModal.tsx`
```tsx
{/* Status Kesiapan Armada Bus */}
<div data-testid="route-modal-fleet-section" className="fleet-status-section">
  <div className="section-header">
    <Bus size={15} />
    <span>{tFleet.TITLE}</span>
    {troubledUnits.length > 0 ? (
      <span className="badge-warning">{tFleet.BADGE_TROUBLED(troubledUnits.length)}</span>
    ) : realops > 0 ? (
      <span className="badge-success">{tFleet.BADGE_ALL_READY}</span>
    ) : null}
  </div>

  {troubledUnits.length > 0 ? (
    <div className="troubled-units-list">
      {troubledUnits.map((u) => (
        <UnitRow key={u.unit} unit={u} />
      ))}
    </div>
  ) : realops > 0 ? (
    <div className="all-ready-state">{tFleet.ALL_READY_DESC}</div>
  ) : (
    <div className="no-data-state">{tFleet.NO_DATA_DESC}</div>
  )}
</div>
```

---

## Perbandingan: Before vs After

| Aspek | Sebelum (Before) | Sesudah (After) |
| :--- | :--- | :--- |
| **Konteks Armada pada Tab Operasional Modal Rute** | Hanya angka agregat: Renops 10, Realops 8, Kesiapan 80%. Pengguna buta terhadap unit mana yang bermasalah. | **Lengkap & Terintegrasi:** Daftar bus yang kendala langsung tampil dengan nomor bodi, catatan alasan, status badge (`BA`, `TEKNIS`, `TO`, `OFF`), dan shift (`S1`/`S2`). |
| **Status Rute 100% Normal** | Tidak ada penanda status armada di modal rute. | Tampil badge hijau dan pesan: *`100% Siap Jalan` - Tidak ada catatan unit kendala untuk rute ini.* |
| **Duplikasi Kode Ekstraksi Armada** | Logika ekstraksi hanya ada di `MonitoringFleetStatusTab.tsx`. Komponen lain harus menulis ulang. | Terpusat di `monitoringUtils.ts` (`extractRouteTroubledUnits`) dengan uji unit terdedikasi. |
| **Parsing Variasi BA Lapangan** | Mengetik `BA 01 Sakit` menghasilkan badge generic `BA` warna kuning. | Mengetik `BA 01 Sakit` akurat dikenali sebagai `BA.01` dengan warna oranye standar operasional. |
| **Aturan Ketelitian Agen** | Belum tertuang eksplisit klausul zero-mistake multi-dimensi industri global. | Tertuang ketat di `GEMINI.md`, `AGENTS.md`, dan `.agents/AGENTS.md`. |

---

## Case: Skenario Lapangan

### Skenario 1: Evaluasi Mendalam Rute JAK.87 oleh Korwil
- **Kondisi:** Pengawas wilayah membuka menu **Rute** dan mengeklik kartu **JAK.87**.
- **Hasil:** Pada Tab **Operasional**, selain membaca KM tempuh dan rasio pelanggan per KM, pengawas langsung melihat seksi *Status Kesiapan Armada Bus* yang menginformasikan bahwa bus `KWK 222177` berstatus `T.O` karena perbaikan radiator pada Shift 1 dan Shift 2. Pengawas tidak perlu lagi beralih ke menu Status Armada.

### Skenario 2: Pengecekan Rute Tanpa Kendala (100% Siap Jalan)
- **Kondisi:** Pengguna membuka rute **JAK.02** yang seluruh armadanya beroperasi lancar.
- **Hasil:** Seksi Status Kesiapan Armada menampilkan badge hijau `100% Siap Jalan` dan pesan konfirmasi bahwa tidak ada unit armada yang mengalami kendala, memberikan ketenangan dan kepastian data bagi pimpinan.
