# Mobile Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Analytics & Operational Summary page for SS_PDO with a Bottom Navigation Bar and real-time calculation of 12 Excel-standard operational metrics.

**Architecture:** Split into a pure calculation module (`src/utils/analytics.ts`), presentation cards (`KPICard.tsx`, `ShiftComparisonCard.tsx`, `CompletionStatusCard.tsx`), container (`AnalyticsDashboard.tsx`), and bottom navigation (`BottomNav.tsx`) integrated into `Dashboard.tsx`.

**Tech Stack:** React 19, TypeScript, Lucide React, Vitest (or Node test runner for `analytics.ts`), Vanilla CSS Variables (Light/Dark themes).

## Global Constraints

- Must follow React 19 and strict TypeScript (`strict: true`).
- Must support both Light and Dark themes via CSS variables.
- Must maintain offline-first capability with zero remote API dependencies for calculations.
- Must follow kebab-case for utility files and PascalCase for React component files.

---

### Task 1: Analytics Calculation Utility (`src/utils/analytics.ts`)

**Files:**
- Create: `src/utils/analytics.ts`
- Test: `src/utils/analytics.test.ts`

**Interfaces:**
- Consumes: `BusData` from `src/services/googleSheets.ts`
- Produces: `AnalyticsSummary` interface and `calculateAnalytics(busData: BusData[]): AnalyticsSummary`

- [ ] **Step 1: Define `AnalyticsSummary` interface and test skeleton in `src/utils/analytics.test.ts`**

Create `src/utils/analytics.test.ts`:
```typescript
import { calculateAnalytics } from './analytics';
import type { BusData } from '../services/googleSheets';

const mockBusData: BusData[] = [
  {
    rowIndex: 2,
    unit: 'KMJ 1986',
    toaShift1: '83',
    manualShift1: '0',
    toaShift2: '127',
    manualShift2: '0',
    totalToa: '210',
    kmAwal1: '100',
    kmAkhir1: '200',
    kmAwal2: '200',
    kmAkhir2: '300',
    keterangan: ''
  },
  {
    rowIndex: 3,
    unit: 'KMJ 1987',
    toaShift1: '0',
    manualShift1: '0',
    toaShift2: '0',
    manualShift2: '0',
    totalToa: '0',
    kmAwal1: '',
    kmAkhir1: '',
    kmAwal2: '',
    kmAkhir2: '',
    keterangan: 'NP 1'
  }
];

describe('calculateAnalytics', () => {
  it('correctly calculates total KM, total passengers, and shift totals', () => {
    const summary = calculateAnalytics(mockBusData);
    expect(summary.totalKm).toBe(200); // (200-100) + (300-200)
    expect(summary.totalPassengers).toBe(210);
    expect(summary.totalToaShift1).toBe(83);
    expect(summary.totalToaShift2).toBe(127);
    expect(summary.totalShift1).toBe(83);
    expect(summary.totalShift2).toBe(127);
    expect(summary.totalBuses).toBe(2);
    expect(summary.filledBuses).toBe(1);
    expect(summary.unfilledBuses).toBe(1);
    expect(summary.kmPerBus).toBe(200);
    expect(summary.passengersPerKm).toBe(1.05); // 210 / 200
  });
});
```

- [ ] **Step 2: Implement `calculateAnalytics` in `src/utils/analytics.ts`**

Create `src/utils/analytics.ts`:
```typescript
import type { BusData } from '../services/googleSheets';

export interface AnalyticsSummary {
  totalKm: number;
  totalPassengers: number;
  passengersPerKm: number;
  kmPerBus: number;
  
  // Shift 1
  totalToaShift1: number;
  totalManualShift1: number;
  totalShift1: number;

  // Shift 2
  totalToaShift2: number;
  totalManualShift2: number;
  totalShift2: number;

  // Grand Totals
  grandTotalToa: number;
  grandTotalManual: number;

  // Armada Status
  totalBuses: number;
  filledBuses: number;
  unfilledBuses: number;
  unfilledUnits: string[];
  completionPercentage: number;
}

export function calculateAnalytics(busData: BusData[]): AnalyticsSummary {
  let totalKm = 0;
  let totalToaShift1 = 0;
  let totalManualShift1 = 0;
  let totalToaShift2 = 0;
  let totalManualShift2 = 0;
  let filledBuses = 0;
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
  const kmPerBus = filledBuses > 0 ? parseFloat((totalKm / filledBuses).toFixed(2)) : 0;
  const passengersPerKm = totalKm > 0 ? parseFloat((totalPassengers / totalKm).toFixed(3)) : 0;

  return {
    totalKm: parseFloat(totalKm.toFixed(2)),
    totalPassengers,
    passengersPerKm,
    kmPerBus,
    totalToaShift1,
    totalManualShift1,
    totalShift1,
    totalToaShift2,
    totalManualShift2,
    totalShift2,
    grandTotalToa,
    grandTotalManual,
    totalBuses,
    filledBuses,
    unfilledBuses,
    unfilledUnits,
    completionPercentage
  };
}
```

- [ ] **Step 3: Run TypeScript compiler to verify no type issues**

Run: `pnpm run build`
Expected: Type check passes cleanly.

- [ ] **Step 4: Commit**

```bash
git add src/utils/analytics.ts src/utils/analytics.test.ts
git commit -m "feat(analytics): add operational metrics calculation helper"
```

---

### Task 2: Mobile Bottom Navigation Bar (`src/components/BottomNav.tsx`)

**Files:**
- Create: `src/components/BottomNav.tsx`

**Interfaces:**
- Consumes: `activeTab: 'input' | 'analytics'`, `onSelectTab: (tab: 'input' | 'analytics') => void`, `pendingQueueCount: number`
- Produces: React component `BottomNav`

- [ ] **Step 1: Create `src/components/BottomNav.tsx`**

```tsx
import { ClipboardList, BarChart3 } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'input' | 'analytics';
  onSelectTab: (tab: 'input' | 'analytics') => void;
  pendingQueueCount?: number;
}

export function BottomNav({ activeTab, onSelectTab, pendingQueueCount = 0 }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex justify-around items-center max-w-md mx-auto sm:max-w-xl">
      <button
        type="button"
        onClick={() => onSelectTab('input')}
        className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
          activeTab === 'input'
            ? 'text-sky-400 font-bold bg-sky-500/10'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <ClipboardList className="w-5 h-5" />
          {pendingQueueCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {pendingQueueCount}
            </span>
          )}
        </div>
        <span className="text-[11px]">Input Shift</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('analytics')}
        className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
          activeTab === 'analytics'
            ? 'text-sky-400 font-bold bg-sky-500/10'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <BarChart3 className="w-5 h-5" />
        <span className="text-[11px]">Dashboard</span>
      </button>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/BottomNav.tsx
git commit -m "feat(ui): add mobile BottomNav component"
```

---

### Task 3: Analytics Display Cards & Container (`AnalyticsDashboard.tsx`)

**Files:**
- Create: `src/components/KPICard.tsx`
- Create: `src/components/ShiftComparisonCard.tsx`
- Create: `src/components/CompletionStatusCard.tsx`
- Create: `src/components/AnalyticsDashboard.tsx`

**Interfaces:**
- Consumes: `busData: BusData[]` from `Dashboard.tsx`
- Produces: `AnalyticsDashboard` container component

- [ ] **Step 1: Create `KPICard.tsx`**

```tsx
import { Gauge, Users, TrendingUp, Bus } from 'lucide-react';
import type { AnalyticsSummary } from '../utils/analytics';

interface Props {
  summary: AnalyticsSummary;
}

export function KPICard({ summary }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
        <Gauge className="w-4 h-4" />
        <span>Produktivitas & KM Armada</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-center">
          <div className="text-[10px] font-semibold text-slate-400 flex items-center justify-center gap-1">
            <Gauge className="w-3 h-3 text-emerald-400" />
            TOTAL KM
          </div>
          <div className="text-xl font-black text-emerald-400 mt-1">
            {summary.totalKm.toLocaleString('id-ID')} <span className="text-xs font-normal">KM</span>
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-center">
          <div className="text-[10px] font-semibold text-slate-400 flex items-center justify-center gap-1">
            <Users className="w-3 h-3 text-sky-400" />
            PELANGGAN (TOA)
          </div>
          <div className="text-xl font-black text-sky-400 mt-1">
            {summary.totalPassengers.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/50 flex justify-between text-xs text-slate-300">
        <div className="flex items-center gap-1">
          <Bus className="w-3.5 h-3.5 text-slate-400" />
          <span>KM/Bus: <b>{summary.kmPerBus} KM</b></span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          <span>Pelanggan/KM: <b>{summary.passengersPerKm}</b></span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `ShiftComparisonCard.tsx`**

```tsx
import { Sun, Moon } from 'lucide-react';
import type { AnalyticsSummary } from '../utils/analytics';

interface Props {
  summary: AnalyticsSummary;
}

export function ShiftComparisonCard({ summary }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
        <span>Rekapitulasi Shift 1 vs Shift 2</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Shift 1 */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold border-b border-slate-800 pb-1.5">
            <Sun className="w-3.5 h-3.5" />
            <span>SHIFT 1</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>TOA:</span>
            <span className="font-semibold">{summary.totalToaShift1.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Manual:</span>
            <span className="font-semibold">{summary.totalManualShift1.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-slate-800/60">
            <span>Total:</span>
            <span>{summary.totalShift1.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Shift 2 */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
          <div className="flex items-center gap-1.5 text-purple-400 font-bold border-b border-slate-800 pb-1.5">
            <Moon className="w-3.5 h-3.5" />
            <span>SHIFT 2</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>TOA:</span>
            <span className="font-semibold">{summary.totalToaShift2.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Manual:</span>
            <span className="font-semibold">{summary.totalManualShift2.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-slate-800/60">
            <span>Total:</span>
            <span>{summary.totalShift2.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `CompletionStatusCard.tsx`**

```tsx
import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { AnalyticsSummary } from '../utils/analytics';

interface Props {
  summary: AnalyticsSummary;
  onSelectUnit?: (unit: string) => void;
}

export function CompletionStatusCard({ summary, onSelectUnit }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-pink-400 uppercase tracking-wider">Status Kelengkapan Armada</span>
        <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          {summary.completionPercentage}% Selesai
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
        <div
          className="bg-gradient-to-r from-sky-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${summary.completionPercentage}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-300 pt-1">
        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {summary.filledBuses} Bus Terisi
        </span>
        <span className="flex items-center gap-1 text-amber-400 font-semibold">
          <AlertCircle className="w-3.5 h-3.5" />
          {summary.unfilledBuses} Belum Lengkap
        </span>
      </div>

      {summary.unfilledUnits.length > 0 && (
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5">
          <span className="text-[11px] text-slate-400 font-medium">Unit Belum Lengkap:</span>
          <div className="flex flex-wrap gap-1.5">
            {summary.unfilledUnits.map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => onSelectUnit?.(unit)}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] px-2 py-0.5 rounded-md font-mono transition-colors"
              >
                {unit}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `AnalyticsDashboard.tsx` Container**

```tsx
import type { BusData } from '../services/googleSheets';
import { calculateAnalytics } from '../utils/analytics';
import { KPICard } from './KPICard';
import { ShiftComparisonCard } from './ShiftComparisonCard';
import { CompletionStatusCard } from './CompletionStatusCard';

interface Props {
  busData: BusData[];
  onSelectUnit?: (unit: string) => void;
}

export function AnalyticsDashboard({ busData, onSelectUnit }: Props) {
  const summary = calculateAnalytics(busData);

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto sm:max-w-xl">
      <KPICard summary={summary} />
      <ShiftComparisonCard summary={summary} />
      <CompletionStatusCard summary={summary} onSelectUnit={onSelectUnit} />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/KPICard.tsx src/components/ShiftComparisonCard.tsx src/components/CompletionStatusCard.tsx src/components/AnalyticsDashboard.tsx
git commit -m "feat(ui): add AnalyticsDashboard components and cards"
```

---

### Task 4: Main Dashboard Integration (`src/components/Dashboard.tsx`)

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Interfaces:**
- Incorporates `activeMainTab: 'input' | 'analytics'` state and renders `AnalyticsDashboard` or `BusList` accordingly, plus `BottomNav`.

- [ ] **Step 1: Add main tab state and render condition in `Dashboard.tsx`**

In `src/components/Dashboard.tsx`:
Add state:
```tsx
const [mainTab, setMainTab] = useState<'input' | 'analytics'>('input');
```

In render body:
```tsx
{mainTab === 'input' ? (
  <BusList ... />
) : (
  <AnalyticsDashboard
    busData={busData || []}
    onSelectUnit={(unit) => {
      setMainTab('input');
      // optional: scroll to unit
    }}
  />
)}

<BottomNav
  activeTab={mainTab}
  onSelectTab={setMainTab}
  pendingQueueCount={queue.filter(q => q.status === 'pending' || q.status === 'failed').length}
/>
```

- [ ] **Step 2: Run build and lint verification**

Run: `pnpm run build && pnpm run lint`
Expected: Build passes with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): integrate mobile analytics dashboard and bottom navigation"
```
