# Executive SSOT Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Google Sheets Single Source of Truth (SSOT) summary parsing and executive number formatting (1-decimal KM/Bus, 2-decimal Pnp/KM, id-ID locale, manual ticket alerts) for SS_PDO.

**Architecture:** Extend `getBusData` in `googleSheets.ts` to parse summary rows into `sheetSummary`, update `analytics.ts` to prioritize `sheetSummary` with `AVERAGEIF(KM > 0)` fallback, and format numbers cleanly in `KPICard.tsx` and `ShiftComparisonCard.tsx`.

**Tech Stack:** React 19, TypeScript, Vanilla CSS Variables (`id-ID` number formatting).

## Global Constraints

- Must follow strict TypeScript (`strict: true`).
- Must use `id-ID` locale for all displayed numbers (`toLocaleString('id-ID')`).
- `kmPerBus` must be formatted to at most 1 decimal place.
- `passengersPerKm` must be formatted to at most 2 decimal places with `Pnp/KM` label.
- Must maintain offline-first capability with fallback Excel formula emulation (`AVERAGEIF(KM > 0)`).

---

### Task 1: Google Sheets Summary Parser (`src/services/googleSheets.ts`)

**Files:**
- Modify: `src/services/googleSheets.ts:234-405`

**Interfaces:**
- Consumes: Google Sheets API rows
- Produces: `sheetSummary: Record<string, number>` in `getBusData` return type

- [ ] **Step 1: Update `getBusData` return signature in `src/services/googleSheets.ts`**

Update `getBusData` return type to include `sheetSummary`:
```typescript
export const getBusData = async (
  sheetId: string,
  tabName: string
): Promise<{
  data: BusData[];
  headerMap: HeaderMap;
  missingColumns: string[];
  sheetSummary: Record<string, number>;
}> => { ... }
```

- [ ] **Step 2: Add summary row parser in `getBusData`**

After reading data rows, scan subsequent rows for summary labels:
```typescript
const sheetSummary: Record<string, number> = {};

// Scan rows after data start index to find summary rows
for (let i = dataStartIndex; i < rows.length; i++) {
  const row = rows[i];
  if (!row || row.length === 0) continue;

  // Check cells in row for known summary keywords
  row.forEach((cellVal: any, colIdx: number) => {
    if (!cellVal) return;
    const str = String(cellVal).trim().toLowerCase();

    // Map summary labels to normalized keys
    let key = '';
    if (str.includes('total pelanggan/km') || str.includes('pelanggan/km')) key = 'passengersPerKm';
    else if (str.includes('total pelanggan')) key = 'totalPassengers';
    else if (str.includes('total km')) key = 'totalKm';
    else if (str.includes('km/bus') || str.includes('km / bus')) key = 'kmPerBus';
    else if (str.includes('total toa shift 1') || str.includes('total toa s1')) key = 'totalToaShift1';
    else if (str.includes('total manual shift 1') || str.includes('total manual s1')) key = 'totalManualShift1';
    else if (str.includes('total shift 1') || str.includes('total s1')) key = 'totalShift1';
    else if (str.includes('total toa shift 2') || str.includes('total toa s2')) key = 'totalToaShift2';
    else if (str.includes('total manual shift 2') || str.includes('total manual s2')) key = 'totalManualShift2';
    else if (str.includes('total shift 2') || str.includes('total s2')) key = 'totalShift2';
    else if (str.includes('total toa')) key = 'grandTotalToa';
    else if (str.includes('total manual')) key = 'grandTotalManual';

    if (key) {
      // Look for adjacent cell containing numeric value
      for (let offset = 1; offset <= 3; offset++) {
        const nextVal = row[colIdx + offset];
        if (nextVal !== undefined && nextVal !== null && nextVal !== '' && !isNaN(Number(nextVal))) {
          sheetSummary[key] = parseFloat(Number(nextVal).toFixed(4));
          break;
        }
      }
    }
  });
}
```

- [ ] **Step 3: Run `pnpm run build` to verify type check**

Run: `pnpm run build`
Expected: Build passes.

- [ ] **Step 4: Commit**

```bash
git add src/services/googleSheets.ts
git commit -m "feat(sheets): add summary row parser for SSOT metrics"
```

---

### Task 2: SSOT Analytics Calculator (`src/utils/analytics.ts`)

**Files:**
- Modify: `src/utils/analytics.ts`
- Modify: `src/utils/analytics.test.ts`

**Interfaces:**
- Consumes: `busData: BusData[]`, `sheetSummary?: Record<string, number>`
- Produces: Updated `calculateAnalytics` function

- [ ] **Step 1: Update `calculateAnalytics` in `src/utils/analytics.ts`**

Update `calculateAnalytics` signature and logic:
```typescript
export function calculateAnalytics(
  busData: BusData[],
  sheetSummary?: Record<string, number>
): AnalyticsSummary {
  let totalKm = 0;
  let totalToaShift1 = 0;
  let totalManualShift1 = 0;
  let totalToaShift2 = 0;
  let totalManualShift2 = 0;
  let filledBuses = 0;
  let activeBusCount = 0;
  const unfilledUnits: string[] = [];

  busData.forEach((bus) => {
    const kmAwal1 = parseFloat(bus.kmAwal1) || 0;
    const kmAkhir1 = parseFloat(bus.kmAkhir1) || 0;
    const kmAwal2 = parseFloat(bus.kmAwal2) || 0;
    const kmAkhir2 = parseFloat(bus.kmAkhir2) || 0;

    const kmShift1 = kmAkhir1 > kmAwal1 ? kmAkhir1 - kmAwal1 : 0;
    const kmShift2 = kmAkhir2 > kmAwal2 ? kmAkhir2 - kmAwal2 : 0;
    const busTotalKm = kmShift1 + kmShift2;
    totalKm += busTotalKm;

    if (busTotalKm > 0) {
      activeBusCount += 1;
    }

    const toa1 = parseInt(bus.toaShift1, 10) || 0;
    const man1 = parseInt(bus.manualShift1, 10) || 0;
    const toa2 = parseInt(bus.toaShift2, 10) || 0;
    const man2 = parseInt(bus.manualShift2, 10) || 0;

    totalToaShift1 += toa1;
    totalManualShift1 += man1;
    totalToaShift2 += toa2;
    totalManualShift2 += man2;

    const isFilled = busTotalKm > 0 || (toa1 + man1 + toa2 + man2) > 0;
    if (isFilled) {
      filledBuses += 1;
    } else {
      unfilledUnits.push(bus.unit);
    }
  });

  const totalShift1 = totalToaShift1 + totalManualShift1;
  const totalShift2 = totalToaShift2 + totalManualShift2;
  const grandTotalToa = totalToaShift1 + totalToaShift2;
  const grandTotalManual = totalManualShift1 + totalManualShift2;
  const totalPassengers = grandTotalToa + grandTotalManual;

  const totalBuses = busData.length;
  const unfilledBuses = totalBuses - filledBuses;
  const completionPercentage = totalBuses > 0 ? Math.round((filledBuses / totalBuses) * 100) : 0;

  // Use sheetSummary SSOT values if available, otherwise calculate with Excel formula emulation (AVERAGEIF(KM > 0))
  const finalTotalKm = sheetSummary?.totalKm ?? parseFloat(totalKm.toFixed(2));
  const finalTotalPassengers = sheetSummary?.totalPassengers ?? totalPassengers;

  // AVERAGEIF(KM > 0): Only divide total KM by active operating buses (KM > 0)
  const calcKmPerBus = activeBusCount > 0 ? totalKm / activeBusCount : 0;
  const finalKmPerBus = sheetSummary?.kmPerBus ?? calcKmPerBus;

  const calcPnpPerKm = finalTotalKm > 0 ? finalTotalPassengers / finalTotalKm : 0;
  const finalPnpPerKm = sheetSummary?.passengersPerKm ?? calcPnpPerKm;

  return {
    totalKm: parseFloat(finalTotalKm.toFixed(1)),
    totalPassengers: Math.round(finalTotalPassengers),
    passengersPerKm: parseFloat(finalPnpPerKm.toFixed(2)),
    kmPerBus: parseFloat(finalKmPerBus.toFixed(1)),
    totalToaShift1: sheetSummary?.totalToaShift1 ?? totalToaShift1,
    totalManualShift1: sheetSummary?.totalManualShift1 ?? totalManualShift1,
    totalShift1: sheetSummary?.totalShift1 ?? totalShift1,
    totalToaShift2: sheetSummary?.totalToaShift2 ?? totalToaShift2,
    totalManualShift2: sheetSummary?.totalManualShift2 ?? totalManualShift2,
    totalShift2: sheetSummary?.totalShift2 ?? totalShift2,
    grandTotalToa: sheetSummary?.grandTotalToa ?? grandTotalToa,
    grandTotalManual: sheetSummary?.grandTotalManual ?? grandTotalManual,
    totalBuses,
    filledBuses,
    unfilledBuses,
    unfilledUnits,
    completionPercentage
  };
}
```

- [ ] **Step 2: Update unit test in `src/utils/analytics.test.ts`**

Update `src/utils/analytics.test.ts`:
```typescript
import { calculateAnalytics } from './analytics';
import type { BusData } from '../services/googleSheets';

const mockBusData: BusData[] = [
  {
    rowIndex: 2,
    unit: 'KMJ 1986',
    toaShift1: '83',
    toaShift2: '127',
    manualShift1: '0',
    manualShift2: '0',
    totalToa: '210',
    kmAwal1: '100',
    kmAkhir1: '200',
    kmAwal2: '200',
    kmAkhir2: '300',
    keterangan: '',
    originalRow: []
  },
  {
    rowIndex: 3,
    unit: 'KMJ 1987 (Mogok)',
    toaShift1: '0',
    toaShift2: '0',
    manualShift1: '0',
    manualShift2: '0',
    totalToa: '0',
    kmAwal1: '',
    kmAkhir1: '',
    kmAwal2: '',
    kmAkhir2: '',
    keterangan: 'NP 1',
    originalRow: []
  }
];

export function runAnalyticsTest() {
  // Test local calculation with AVERAGEIF(KM > 0)
  const localSummary = calculateAnalytics(mockBusData);
  console.assert(localSummary.totalKm === 200, 'totalKm should be 200');
  console.assert(localSummary.kmPerBus === 200, 'kmPerBus should be 200 (200 KM / 1 active bus)');
  console.assert(localSummary.passengersPerKm === 1.05, 'passengersPerKm should be 1.05 (210 / 200)');

  // Test SSOT priority from sheetSummary
  const ssotSummary = calculateAnalytics(mockBusData, {
    totalKm: 5589.06,
    totalPassengers: 4670,
    kmPerBus: 192.7262,
    passengersPerKm: 0.8355
  });

  console.assert(ssotSummary.totalKm === 5589.1, 'SSOT totalKm formatted to 1 decimal');
  console.assert(ssotSummary.kmPerBus === 192.7, 'SSOT kmPerBus formatted to 1 decimal');
  console.assert(ssotSummary.passengersPerKm === 0.84, 'SSOT passengersPerKm formatted to 2 decimals');

  console.log('✅ SSOT Executive Analytics unit test passed');
}

runAnalyticsTest();
```

- [ ] **Step 3: Run `pnpm run build`**

Run: `pnpm run build`
Expected: Build passes with zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/utils/analytics.ts src/utils/analytics.test.ts
git commit -m "feat(analytics): implement SSOT priority and AVERAGEIF emulation with executive formatting"
```

---

### Task 3: Executive Formatting UI (`KPICard.tsx`, `ShiftComparisonCard.tsx`)

**Files:**
- Modify: `src/components/KPICard.tsx`
- Modify: `src/components/ShiftComparisonCard.tsx`

**Interfaces:**
- Consumes: Updated `AnalyticsSummary`
- Produces: Executive formatted cards

- [ ] **Step 1: Update `KPICard.tsx` with executive formatting and Indonesian locale**

Update `src/components/KPICard.tsx`:
```tsx
import { Gauge, Users, TrendingUp, Bus } from 'lucide-react';
import type { AnalyticsSummary } from '../utils/analytics';

interface Props {
  summary: AnalyticsSummary;
}

export function KPICard({ summary }: Props) {
  // Format numbers using Indonesian locale
  const formatInt = (val: number) => val.toLocaleString('id-ID');
  const formatDec = (val: number, decimals: number) =>
    val.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return (
    <div className="analytics-card glass">
      <div className="analytics-card-title" style={{ color: 'var(--accent-color)' }}>
        <Gauge size={18} />
        <span>Produktivitas & KM Armada</span>
      </div>

      <div className="analytics-grid-2">
        <div className="analytics-stat-box">
          <div className="analytics-stat-label">
            <Gauge size={14} style={{ color: 'var(--success-color)' }} />
            <span>TOTAL KM</span>
          </div>
          <div className="analytics-stat-value" style={{ color: 'var(--success-color)' }}>
            {formatDec(summary.totalKm, 1)} <span style={{ fontSize: '12px', fontWeight: 400 }}>KM</span>
          </div>
        </div>

        <div className="analytics-stat-box">
          <div className="analytics-stat-label">
            <Users size={14} style={{ color: 'var(--accent-color)' }} />
            <span>PELANGGAN (TOA)</span>
          </div>
          <div className="analytics-stat-value" style={{ color: 'var(--accent-color)' }}>
            {formatInt(summary.totalPassengers)}
          </div>
        </div>
      </div>

      <div className="analytics-sub-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bus size={16} />
          <span>KM/Bus: <b>{formatDec(summary.kmPerBus, 1)} KM</b></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={16} />
          <span>Kepadatan: <b>{formatDec(summary.passengersPerKm, 2)} Pnp/KM</b></span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `ShiftComparisonCard.tsx` with Tiket Manual alert badge**

Update `src/components/ShiftComparisonCard.tsx`:
```tsx
import { Sun, Moon, AlertTriangle } from 'lucide-react';
import type { AnalyticsSummary } from '../utils/analytics';

interface Props {
  summary: AnalyticsSummary;
}

export function ShiftComparisonCard({ summary }: Props) {
  const formatInt = (val: number) => val.toLocaleString('id-ID');
  const hasManualTickets = summary.grandTotalManual > 0;

  return (
    <div className="analytics-card glass">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="analytics-card-title" style={{ color: 'var(--warning-color)' }}>
          <Sun size={18} />
          <span>Rekapitulasi Shift 1 vs Shift 2</span>
        </div>
        {hasManualTickets && (
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--warning-color)',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '2px 8px',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <AlertTriangle size={12} /> {formatInt(summary.grandTotalManual)} Tiket Manual
          </span>
        )}
      </div>

      <div className="analytics-grid-2">
        {/* Shift 1 */}
        <div className="shift-box">
          <div className="shift-header" style={{ color: 'var(--warning-color)' }}>
            <Sun size={16} />
            <span>SHIFT 1</span>
          </div>
          <div className="shift-row">
            <span>TOA:</span>
            <b>{formatInt(summary.totalToaShift1)}</b>
          </div>
          <div className="shift-row">
            <span>Manual:</span>
            <b style={{ color: summary.totalManualShift1 > 0 ? 'var(--warning-color)' : 'inherit' }}>
              {formatInt(summary.totalManualShift1)}
            </b>
          </div>
          <div className="shift-total">
            <span>Total:</span>
            <span>{formatInt(summary.totalShift1)}</span>
          </div>
        </div>

        {/* Shift 2 */}
        <div className="shift-box">
          <div className="shift-header" style={{ color: '#a78bfa' }}>
            <Moon size={16} />
            <span>SHIFT 2</span>
          </div>
          <div className="shift-row">
            <span>TOA:</span>
            <b>{formatInt(summary.totalToaShift2)}</b>
          </div>
          <div className="shift-row">
            <span>Manual:</span>
            <b style={{ color: summary.totalManualShift2 > 0 ? 'var(--warning-color)' : 'inherit' }}>
              {formatInt(summary.totalManualShift2)}
            </b>
          </div>
          <div className="shift-total">
            <span>Total:</span>
            <span>{formatInt(summary.totalShift2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run `pnpm run build`**

Run: `pnpm run build`
Expected: Build passes with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/KPICard.tsx src/components/ShiftComparisonCard.tsx
git commit -m "feat(ui): apply executive number formatting and manual ticket alerts"
```

---

### Task 4: Integration in `src/components/Dashboard.tsx` and `AnalyticsDashboard.tsx`

**Files:**
- Modify: `src/components/AnalyticsDashboard.tsx`
- Modify: `src/components/Dashboard.tsx`

**Interfaces:**
- Consumes: `sheetSummary` from `getBusData`
- Produces: Integrated SSOT dashboard

- [ ] **Step 1: Pass `sheetSummary` prop through `AnalyticsDashboard.tsx`**

In `src/components/AnalyticsDashboard.tsx`:
```tsx
interface Props {
  busData: BusData[];
  sheetSummary?: Record<string, number>;
  onSelectUnit?: (unit: string) => void;
}

export function AnalyticsDashboard({ busData, sheetSummary, onSelectUnit }: Props) {
  const summary = calculateAnalytics(busData, sheetSummary);

  return (
    <div className="analytics-container">
      <KPICard summary={summary} />
      <ShiftComparisonCard summary={summary} />
      <CompletionStatusCard summary={summary} onSelectUnit={onSelectUnit} />
    </div>
  );
}
```

- [ ] **Step 2: Store and pass `sheetSummary` in `Dashboard.tsx`**

In `src/components/Dashboard.tsx`:
Add state:
```tsx
const [sheetSummary, setSheetSummary] = useState<Record<string, number>>({});
```

In `handleLoadData`:
```tsx
const { data, headerMap, missingColumns, sheetSummary } = await getBusData(id, selectedTab);
setBusData(data);
setHeaderMap(headerMap);
setMissingColumns(missingColumns);
setSheetSummary(sheetSummary || {});
```

In render:
```tsx
<AnalyticsDashboard
  busData={busData}
  sheetSummary={sheetSummary}
  onSelectUnit={(unit) => { ... }}
/>
```

- [ ] **Step 3: Run build and lint verification**

Run: `pnpm run build && pnpm run lint`
Expected: Build passes with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/AnalyticsDashboard.tsx src/components/Dashboard.tsx
git commit -m "feat(dashboard): connect SSOT sheetSummary state to AnalyticsDashboard"
```
