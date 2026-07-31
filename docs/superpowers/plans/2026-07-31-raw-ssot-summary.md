# Raw Pure SSOT Summary Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display pure raw values from Google Sheets summary cells without rounding or truncating decimal places, preserving exact values from the original spreadsheet.

**Architecture:** Remove `.toFixed(1)` and `.toFixed(2)` truncation in `googleSheets.ts` and `analytics.ts`, and update `KPICard.tsx` to display all decimal places via `maximumFractionDigits: 10`.

**Tech Stack:** TypeScript, React 19, `id-ID` locale formatting.

## Global Constraints

- Must follow strict TypeScript (`strict: true`).
- Display pure unrounded summary values from Google Sheets SSOT.
- Preserve full decimal precision from the original file without forced truncation.

---

### Task 1: Preserve Raw Floating-Point Precision (`src/services/googleSheets.ts` & `src/utils/analytics.ts`)

**Files:**
- Modify: `src/services/googleSheets.ts:400-415`
- Modify: `src/utils/analytics.ts`
- Modify: `src/utils/analytics.test.ts`

**Interfaces:**
- Consumes: Summary numbers from Google Sheets
- Produces: Unrounded pure `AnalyticsSummary`

- [ ] **Step 1: Update `googleSheets.ts` to preserve raw numbers without `.toFixed(4)`**

In `src/services/googleSheets.ts`:
Change:
```typescript
sheetSummary[key] = parseFloat(Number(nextVal).toFixed(4));
```
To:
```typescript
sheetSummary[key] = Number(nextVal);
```

- [ ] **Step 2: Update `analytics.ts` to preserve raw numbers without forced rounding**

In `src/utils/analytics.ts`:
Change:
```typescript
  return {
    totalKm: finalTotalKm,
    totalPassengers: Math.round(finalTotalPassengers),
    passengersPerKm: finalPnpPerKm,
    kmPerBus: finalKmPerBus,
    ...
  };
```

- [ ] **Step 3: Update `analytics.test.ts` to assert exact unrounded values**

Update `src/utils/analytics.test.ts`:
```typescript
  const ssotSummary = calculateAnalytics(mockBusData, {
    totalKm: 5589.06,
    totalPassengers: 4670,
    kmPerBus: 192.7262,
    passengersPerKm: 0.83556011204
  });

  console.assert(ssotSummary.totalKm === 5589.06, 'SSOT totalKm preserved exact value');
  console.assert(ssotSummary.kmPerBus === 192.7262, 'SSOT kmPerBus preserved exact value');
  console.assert(ssotSummary.passengersPerKm === 0.83556011204, 'SSOT passengersPerKm preserved exact value');
```

- [ ] **Step 4: Commit**

```bash
git add src/services/googleSheets.ts src/utils/analytics.ts src/utils/analytics.test.ts
git commit -m "feat(analytics): preserve raw pure values from Google Sheets summary cells"
```

---

### Task 2: Display Pure Raw Decimal Values in UI (`src/components/KPICard.tsx`)

**Files:**
- Modify: `src/components/KPICard.tsx`

**Interfaces:**
- Consumes: Raw `AnalyticsSummary`
- Produces: Pure unrounded UI display

- [ ] **Step 1: Update `KPICard.tsx` to display all decimal places**

Update `KPICard.tsx`:
```tsx
export function KPICard({ summary }: Props) {
  const formatInt = (val: number) => val.toLocaleString('id-ID');
  const formatRaw = (val: number) =>
    val.toLocaleString('id-ID', { maximumFractionDigits: 10 });

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
            {formatRaw(summary.totalKm)} <span style={{ fontSize: '12px', fontWeight: 400 }}>KM</span>
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
          <span>KM/Bus: <b>{formatRaw(summary.kmPerBus)} KM</b></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={16} />
          <span>Kepadatan: <b>{formatRaw(summary.passengersPerKm)} Pnp/KM</b></span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run `pnpm run build`**

Run: `pnpm run build`
Expected: Build passes with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/KPICard.tsx
git commit -m "feat(ui): display pure unrounded summary numbers matching original spreadsheet"
```
