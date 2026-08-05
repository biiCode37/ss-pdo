# Implementation Plan: Halaman Ringkasan Per Unit (Read-Only Unit Dashboard)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan tab navigasi baru "Per Unit" dengan grid kartu armada dan modal detail bottom sheet iOS 90% height untuk rekapitulasi data armada secara read-only.

**Architecture:** Memanfaatkan data SSOT `busData` yang sudah ada dari `googleSheets.ts`, mengabstraksikan kalkulasi statistik per unit ke `src/utils/unitAnalytics.ts`, dan merender komponen presentational `UnitSummaryDashboard.tsx` & `UnitDetailModal.tsx`.

**Tech Stack:** React 19, TypeScript, Lucide Icons (`Bus`, `CheckCircle`, `Calendar`, `TrendingUp`, `X`), Vitest (`pnpm test`), Vite.

## Global Constraints
- Bahasa Komunikasi: Bahasa Indonesia
- Tooling & Package Manager: `pnpm`
- Animasi: iOS spring curve `cubic-bezier(0.32, 0.72, 0, 1)`
- Design Tokens: CSS variables (`var(--accent-color)`, `var(--surface-color)`)

---

### Task 1: `unitAnalytics.ts` Abstraksi Logic Rekapitulasi Data Unit

**Files:**
- Create: `src/utils/unitAnalytics.ts`
- Test: `src/utils/unitAnalytics.test.ts`

**Interfaces:**
- Produces: 
  - `extractUnitList(data: BusData[]): { unit: string; totalToa: number; isFilled: boolean; noteCount: number }[]`
  - `calculateUnitMetrics(data: BusData[], targetUnit: string): UnitSummaryMetrics`

- [ ] **Step 1: Write the failing unit test**

Create `src/utils/unitAnalytics.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { extractUnitList, calculateUnitMetrics } from './unitAnalytics';
import type { BusData } from '../services/googleSheets';

const mockBusData: BusData[] = [
  {
    rowIndex: 2,
    unit: 'SAF-001',
    toaShift1: '50',
    manualShift1: '0',
    manualShift2: '0',
    totalToa: '120',
    kmAwal1: '100',
    kmAkhir1: '150',
    kmAwal2: '150',
    kmAkhir2: '200',
    keterangan: 'Servis AC',
  },
  {
    rowIndex: 3,
    unit: 'SAF-002',
    toaShift1: '40',
    manualShift1: '0',
    manualShift2: '0',
    totalToa: '80',
    kmAwal1: '50',
    kmAkhir1: '90',
    kmAwal2: '',
    kmAkhir2: '',
    keterangan: '',
  },
];

describe('unitAnalytics helper', () => {
  it('extracts unique unit list with basic summary stats', () => {
    const list = extractUnitList(mockBusData);
    expect(list).toHaveLength(2);
    expect(list[0].unit).toBe('SAF-001');
    expect(list[0].totalToa).toBe(120);
    expect(list[0].noteCount).toBe(1);
  });

  it('calculates detailed metrics for a single unit', () => {
    const metrics = calculateUnitMetrics(mockBusData, 'SAF-001');
    expect(metrics.unit).toBe('SAF-001');
    expect(metrics.toaShift1).toBe(50);
    expect(metrics.totalToa).toBe(120);
    expect(metrics.kmShift1).toBe(50);
    expect(metrics.kmShift2).toBe(50);
    expect(metrics.totalKm).toBe(100);
    expect(metrics.notes).toHaveLength(1);
    expect(metrics.notes[0]).toBe('Servis AC');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/utils/unitAnalytics.test.ts`
Expected: FAIL with "Cannot find module './unitAnalytics'"

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/unitAnalytics.ts`:
```typescript
import type { BusData } from '../services/googleSheets';

export interface UnitSummaryItem {
  unit: string;
  totalToa: number;
  isFilled: boolean;
  noteCount: number;
}

export interface UnitSummaryMetrics {
  unit: string;
  toaShift1: number;
  toaShift2: number;
  totalToa: number;
  kmShift1: number;
  kmShift2: number;
  totalKm: number;
  notes: string[];
}

export function extractUnitList(data: BusData[]): UnitSummaryItem[] {
  if (!data || data.length === 0) return [];
  
  return data.map((b) => {
    const totalToaNum = parseInt(String(b.totalToa || '0'), 10) || 0;
    const hasNote = !!(b.keterangan && String(b.keterangan).trim() !== '');
    const isFilled = !!(b.toaShift1 || b.totalToa || b.kmAwal1);
    
    return {
      unit: b.unit || 'Tanpa Nama',
      totalToa: totalToaNum,
      isFilled,
      noteCount: hasNote ? 1 : 0,
    };
  });
}

export function calculateUnitMetrics(data: BusData[], targetUnit: string): UnitSummaryMetrics {
  const defaultResult: UnitSummaryMetrics = {
    unit: targetUnit,
    toaShift1: 0,
    toaShift2: 0,
    totalToa: 0,
    kmShift1: 0,
    kmShift2: 0,
    totalKm: 0,
    notes: [],
  };

  if (!data || !targetUnit) return defaultResult;

  const item = data.find((b) => b.unit === targetUnit);
  if (!item) return defaultResult;

  const toaShift1 = parseInt(String(item.toaShift1 || '0'), 10) || 0;
  const totalToa = parseInt(String(item.totalToa || '0'), 10) || 0;
  const toaShift2 = Math.max(0, totalToa - toaShift1);

  const kmAwal1 = parseFloat(String(item.kmAwal1 || '0')) || 0;
  const kmAkhir1 = parseFloat(String(item.kmAkhir1 || '0')) || 0;
  const kmShift1 = kmAkhir1 > kmAwal1 ? kmAkhir1 - kmAwal1 : 0;

  const kmAwal2 = parseFloat(String(item.kmAwal2 || '0')) || 0;
  const kmAkhir2 = parseFloat(String(item.kmAkhir2 || '0')) || 0;
  const kmShift2 = kmAkhir2 > kmAwal2 ? kmAkhir2 - kmAwal2 : 0;

  const notes: string[] = [];
  if (item.keterangan && String(item.keterangan).trim() !== '') {
    notes.push(String(item.keterangan).trim());
  }

  return {
    unit: targetUnit,
    toaShift1,
    toaShift2,
    totalToa,
    kmShift1,
    kmShift2,
    totalKm: kmShift1 + kmShift2,
    notes,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/utils/unitAnalytics.test.ts`
Expected: PASS (2 tests passed)

- [ ] **Step 5: Commit**

```bash
git add src/utils/unitAnalytics.ts src/utils/unitAnalytics.test.ts
git commit -m "feat: add unit analytics utility and unit tests"
```

---

### Task 2: Komponen `UnitCard.tsx` & `UnitSummaryDashboard.tsx`

**Files:**
- Create: `src/components/UnitCard.tsx`
- Create: `src/components/UnitSummaryDashboard.tsx`

**Interfaces:**
- Consumes: `extractUnitList` dari `src/utils/unitAnalytics.ts`
- Produces: Komponen `UnitSummaryDashboard` yang menampilkan grid kartu unit dengan pencarian.

- [ ] **Step 1: Write `UnitCard.tsx`**

Create `src/components/UnitCard.tsx`:
```tsx
import { memo } from 'react';
import { Bus, ArrowRight, MessageSquare } from 'lucide-react';
import type { UnitSummaryItem } from '../utils/unitAnalytics';

interface Props {
  item: UnitSummaryItem;
  onClick: () => void;
}

function UnitCardComponent({ item, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="bus-card glass"
      style={{
        padding: '16px',
        borderRadius: '16px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'transform 0.18s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.18s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '16px' }}>
          <Bus size={18} style={{ color: 'var(--accent-color)' }} />
          <span>{item.unit}</span>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: '10px',
            backgroundColor: item.isFilled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: item.isFilled ? 'var(--success-color, #22c55e)' : 'var(--danger-color, #ef4444)',
          }}
        >
          {item.isFilled ? 'Operasional' : 'Belum Ada Data'}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <div>
          Total TOA: <strong style={{ color: 'var(--text-primary)' }}>{item.totalToa.toLocaleString('id-ID')} Pnp</strong>
        </div>
        {item.noteCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning-color, #f59e0b)', fontSize: '12px' }}>
            <MessageSquare size={14} />
            <span>Ada Catatan</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent-color)', fontWeight: 600 }}>
        <span>Lihat Detail Ringkasan</span>
        <ArrowRight size={14} />
      </div>
    </div>
  );
}

export const UnitCard = memo(UnitCardComponent);
```

- [ ] **Step 2: Write `UnitSummaryDashboard.tsx`**

Create `src/components/UnitSummaryDashboard.tsx`:
```tsx
import { useState, useMemo } from 'react';
import { Search, Bus } from 'lucide-react';
import type { BusData } from '../services/googleSheets';
import { extractUnitList } from '../utils/unitAnalytics';
import { UnitCard } from './UnitCard';
import { UnitDetailModal } from './UnitDetailModal';

interface Props {
  busData: BusData[] | null;
  sheetId: string;
  selectedTab: string;
}

export function UnitSummaryDashboard({ busData, sheetId, selectedTab }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  const unitList = useMemo(() => {
    if (!busData) return [];
    return extractUnitList(busData);
  }, [busData]);

  const filteredUnits = useMemo(() => {
    if (!searchQuery) return unitList;
    const q = searchQuery.toLowerCase();
    return unitList.filter((u) => u.unit.toLowerCase().includes(q));
  }, [unitList, searchQuery]);

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Header & Search */}
      <div className="search-container" style={{ marginBottom: '16px' }}>
        <div className="search-input-wrapper" style={{ flex: 1 }}>
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Cari No. Body Armada (misal: SAF-001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Kartu Unit */}
      {filteredUnits.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {filteredUnits.map((item) => (
            <UnitCard
              key={item.unit}
              item={item}
              onClick={() => setSelectedUnit(item.unit)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ textAlign: 'center', padding: '32px' }}>
          <Bus size={32} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }} />
          <p>Tidak ada armada yang sesuai dengan kata kunci "{searchQuery}"</p>
        </div>
      )}

      {/* iOS-Style Expandable Bottom Sheet Modal Detail */}
      {selectedUnit && (
        <UnitDetailModal
          unit={selectedUnit}
          busData={busData}
          sheetId={sheetId}
          selectedTab={selectedTab}
          onClose={() => setSelectedUnit(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/UnitCard.tsx src/components/UnitSummaryDashboard.tsx
git commit -m "feat: add UnitCard and UnitSummaryDashboard components"
```

---

### Task 3: Komponen `UnitDetailModal.tsx` (iOS-Style 90% Bottom Sheet)

**Files:**
- Create: `src/components/UnitDetailModal.tsx`

**Interfaces:**
- Consumes: `calculateUnitMetrics` dari `src/utils/unitAnalytics.ts` dan `DailyToaTrendCard` (atau trend mini chart).
- Produces: Bottom sheet modal interaktif 90% height dengan swipe-down & backdrop overlay.

- [ ] **Step 1: Write `UnitDetailModal.tsx`**

Create `src/components/UnitDetailModal.tsx`:
```tsx
import { useEffect, useMemo } from 'react';
import { X, Bus, TrendingUp, Navigation, MessageSquare } from 'lucide-react';
import type { BusData } from '../services/googleSheets';
import { calculateUnitMetrics } from '../utils/unitAnalytics';
import { DailyToaTrendCard } from './DailyToaTrendCard';

interface Props {
  unit: string;
  busData: BusData[] | null;
  sheetId: string;
  selectedTab: string;
  onClose: () => void;
}

export function UnitDetailModal({ unit, busData, sheetId, selectedTab, onClose }: Props) {
  const metrics = useMemo(() => {
    return calculateUnitMetrics(busData || [], unit);
  }, [busData, unit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          height: '90vh',
          backgroundColor: 'var(--surface-color, #1e293b)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
          animation: 'slideUp 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Swipe Handle & Header */}
        <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--text-secondary)', opacity: 0.4, borderRadius: '2px', margin: '0 auto 16px auto' }}></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-color)' }}>
              <Bus size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{unit}</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ringkasan Rekapitulasi Armada</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '6px', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 4 KPI Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div className="card glass" style={{ padding: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} /> TOA Shift 1
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{metrics.toaShift1.toLocaleString('id-ID')} Pnp</div>
          </div>
          <div className="card glass" style={{ padding: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} /> TOA Shift 2
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{metrics.toaShift2.toLocaleString('id-ID')} Pnp</div>
          </div>
          <div className="card glass" style={{ padding: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Navigation size={12} /> KM Shift 1
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{metrics.kmShift1.toLocaleString('id-ID')} KM</div>
          </div>
          <div className="card glass" style={{ padding: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Navigation size={12} /> KM Shift 2
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{metrics.kmShift2.toLocaleString('id-ID')} KM</div>
          </div>
        </div>

        {/* Chart Tren Harian */}
        <div style={{ marginBottom: '20px' }}>
          <DailyToaTrendCard
            sheetId={sheetId}
            selectedTab={selectedTab}
          />
        </div>

        {/* Riwayat Catatan */}
        <div className="card glass" style={{ padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning-color, #f59e0b)' }}>
            <MessageSquare size={16} /> Catatan & Keterangan Operasional
          </div>
          {metrics.notes.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {metrics.notes.map((n, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{n}</li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              Tidak ada catatan khusus yang dilaporkan untuk unit ini.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/UnitDetailModal.tsx
git commit -m "feat: add UnitDetailModal iOS-style bottom sheet modal"
```

---

### Task 4: Integrasi Tab Navigasi `mainTab === "units"` di `BottomNav.tsx` & `Dashboard.tsx`

**Files:**
- Modify: `src/components/BottomNav.tsx`
- Modify: `src/components/Dashboard.tsx`

- [ ] **Step 1: Update `BottomNav.tsx`**

Update `src/components/BottomNav.tsx` to include `Bus` icon tab:
```tsx
import { FileSpreadsheet, BarChart2, Bus } from 'lucide-react';

interface Props {
  activeTab: 'input' | 'analytics' | 'units';
  onTabChange: (tab: 'input' | 'analytics' | 'units') => void;
}

export function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <div className="bottom-nav glass">
      <button
        className={`nav-item ${activeTab === 'input' ? 'active' : ''}`}
        onClick={() => onTabChange('input')}
      >
        <FileSpreadsheet size={20} />
        <span>Input Data</span>
      </button>
      <button
        className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
        onClick={() => onTabChange('analytics')}
      >
        <BarChart2 size={20} />
        <span>Analitik Rute</span>
      </button>
      <button
        className={`nav-item ${activeTab === 'units' ? 'active' : ''}`}
        onClick={() => onTabChange('units')}
      >
        <Bus size={20} />
        <span>Per Unit</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Update `Dashboard.tsx`**

Mount `UnitSummaryDashboard` when `mainTab === "units"`.

- [ ] **Step 3: Run Build & Verification**

Run: `pnpm run build` and `pnpm test`
Expected: Build succeeds, all unit tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/BottomNav.tsx src/components/Dashboard.tsx
git commit -m "feat: integrate Per Unit tab in BottomNav and Dashboard"
```
