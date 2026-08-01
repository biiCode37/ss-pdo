# Daily TOA Trend Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a lightweight, interactive SVG Daily TOA Trend Area/Line Chart displaying daily passenger totals from Day 1 up to today's date, with interactive tab switching on point tap.

**Architecture:** Add `getMonthlyToaTrend(sheetId, maxDay)` helper in `src/services/googleSheets.ts`. Build `src/components/DailyToaTrendCard.tsx` using SVG path curves. Integrate into `src/components/AnalyticsDashboard.tsx`.

**Tech Stack:** React 19, TypeScript, Lucide React, Vite, pnpm.

## Global Constraints
- Only fetch & display days 1 to `todayDate` for the active month (or days 1 to 31 for past months).
- Clicking any data point on the chart MUST trigger tab selection to that date.
- Use `pnpm` for build verification (`pnpm run build`).

---

### Task 1: Create Google Sheets Helper for Monthly Daily TOA Summaries

**Files:**
- Modify: `src/services/googleSheets.ts`

**Interfaces:**
- Consumes: Google Sheets API `gapi.client.sheets`
- Produces: `getMonthlyToaTrend(sheetId: string, maxDay: number): Promise<{ day: string; totalToa: number }[]>`

- [ ] **Step 1: Implement `getMonthlyToaTrend` in `src/services/googleSheets.ts`**

```typescript
export async function getMonthlyToaTrend(
  sheetId: string, 
  maxDay: number
): Promise<{ day: string; totalToa: number }[]> {
  const trendData: { day: string; totalToa: number }[] = [];
  
  // Batch fetch day tabs from 1 to maxDay
  for (let day = 1; day <= maxDay; day++) {
    const dayStr = day.toString();
    try {
      const { data, sheetSummary } = await getBusData(sheetId, dayStr);
      const dayTotal = sheetSummary?.totalPassengers || data.reduce((acc, bus) => acc + (parseInt(bus.totalToa) || 0), 0);
      trendData.push({ day: dayStr, totalToa: dayTotal });
    } catch {
      trendData.push({ day: dayStr, totalToa: 0 });
    }
  }

  return trendData;
}
```

- [ ] **Step 2: Verify typecheck & build**

Run: `pnpm run build`
Expected: PASS

---

### Task 2: Create `DailyToaTrendCard.tsx` Component

**Files:**
- Create: `src/components/DailyToaTrendCard.tsx`
- Modify: `src/components/AnalyticsDashboard.tsx`

**Interfaces:**
- Consumes: `getMonthlyToaTrend` from `src/services/googleSheets`
- Produces: Interactive SVG Area/Line Chart Card

- [ ] **Step 1: Implement `DailyToaTrendCard.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { getMonthlyToaTrend } from '../services/googleSheets';

interface Props {
  sheetId: string;
  selectedTab: string;
  onSelectTab?: (tab: string) => void;
}

export function DailyToaTrendCard({ sheetId, selectedTab, onSelectTab }: Props) {
  const [trendData, setTrendData] = useState<{ day: string; totalToa: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date();
  const currentDayNum = today.getDate();

  useEffect(() => {
    if (!sheetId) return;

    let isMounted = true;
    setIsLoading(true);

    getMonthlyToaTrend(sheetId, currentDayNum).then((data) => {
      if (isMounted) {
        setTrendData(data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [sheetId, currentDayNum]);

  if (isLoading) {
    return (
      <div className="analytics-card glass" style={{ textAlign: 'center', padding: '24px' }}>
        <Loader2 className="spinner" size={24} style={{ color: 'var(--accent-color)', margin: '0 auto' }} />
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Memuat grafik tren TOA harian...</p>
      </div>
    );
  }

  if (trendData.length === 0) return null;

  const maxVal = Math.max(...trendData.map((d) => d.totalToa), 1);
  const chartHeight = 120;
  const chartWidth = 320;
  const padding = 20;

  const points = trendData.map((d, idx) => {
    const x = padding + (idx / Math.max(trendData.length - 1, 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (d.totalToa / maxVal) * (chartHeight - padding * 2);
    return { x, y, day: d.day, totalToa: d.totalToa };
  });

  const pathD = points.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  const areaD = `${pathD} L ${points[points.length - 1]?.x || 0} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`;

  return (
    <div className="analytics-card glass">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="analytics-card-title" style={{ color: 'var(--accent-color)' }}>
          <TrendingUp size={18} />
          <span>Tren Capaian TOA Harian (Tgl 1 - {currentDayNum})</span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={12} />
          Bulan Ini
        </span>
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }} className="no-scrollbar">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', minWidth: '280px' }}>
          <defs>
            <linearGradient id="toaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path d={areaD} fill="url(#toaGradient)" />

          {/* Line */}
          <path d={pathD} fill="none" stroke="var(--accent-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((pt) => {
            const isSelected = pt.day === selectedTab;
            return (
              <g key={pt.day} onClick={() => onSelectTab?.(pt.day)} style={{ cursor: 'pointer' }}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? 'var(--warning-color)' : 'var(--accent-color)'}
                  stroke="var(--bg-color)"
                  strokeWidth="2"
                />
                <text x={pt.x} y={chartHeight - 4} fontSize="9" fill="var(--text-secondary)" textAnchor="middle">
                  {pt.day}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Integrate `DailyToaTrendCard` into `AnalyticsDashboard.tsx`**

- [ ] **Step 3: Run build verification**

Run: `pnpm run build`
Expected: PASS
