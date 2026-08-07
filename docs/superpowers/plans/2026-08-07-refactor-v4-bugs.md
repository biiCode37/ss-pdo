# Refactor v4 Bug Fixes & Optimizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement bug fixes (BUG-45), performance optimizations (BUG-46), and API call caching (BUG-47) for SS_PDO Refactor v4 audit findings, while preventing regressions across the codebase.

**Architecture:** Refactor `unitAnalytics.ts` to process raw Indonesian formatted numbers safely via `parseIndonesianNumber` and eliminate $O(n^2)$ lookups by refactoring row metric calculations. Introduce an in-memory TTL/invalidation-aware cache for `getMonthlyToaTrend` in `googleSheets.ts`. Update `.agents/AGENTS.md` with strict rules preventing future `parseInt`/`parseFloat` misuse on sheet data.

**Tech Stack:** TypeScript, React, Vitest, Google Sheets API client, pnpm.

## Global Constraints

- Always use `parseIndonesianNumber` from `src/utils/numberUtils.ts` when parsing numbers from `BusData` or Sheet cells.
- Preserve 100% backward compatibility for functions (`extractUnitList`, `calculateUnitMetrics`).
- All existing and new tests must pass (`pnpm run test`).
- Project must build without type errors (`pnpm run build`).

---

### Task 1: Fix BUG-45 (Parsing Indonesian Numbers in `unitAnalytics.ts`, `googleSheets.ts`, `BusCard.tsx`) & Add Safeguard Rule

**Files:**
- Modify: `src/utils/unitAnalytics.ts`
- Modify: `src/services/googleSheets.ts:616-620`
- Modify: `src/components/BusCard.tsx:320-350`
- Test: `src/utils/unitAnalytics.test.ts`
- Modify: `.agents/AGENTS.md`

**Interfaces:**
- Consumes: `parseIndonesianNumber` from `src/utils/numberUtils.ts`
- Produces: Correct metric numbers when string values contain Indonesian thousand separators (e.g. `"1.234"`, `"1.234,50"`)

- [ ] **Step 1: Write failing unit test cases in `unitAnalytics.test.ts` for Indonesian formatted numbers**

Add test cases to `src/utils/unitAnalytics.test.ts` with mock `BusData` using thousand separators (e.g., `toaShift1: '1.250'`, `kmAwal1: '10.500,5'`, `kmAkhir1: '10.750,5'`).

```ts
it('correctly parses Indonesian formatted numbers with dot thousand separators and comma decimals', () => {
  const formattedData: BusData[] = [
    {
      rowIndex: 2,
      unit: 'SAF-003',
      toaShift1: '1.200',
      toaShift2: '800',
      manualShift1: '50',
      manualShift2: '0',
      totalToa: '2.000',
      kmAwal1: '1.000,5',
      kmAkhir1: '1.150,5',
      kmAwal2: '1.150,5',
      kmAkhir2: '1.250,5',
      keterangan: '',
      originalRow: [],
    },
  ];

  const metrics = calculateUnitMetrics(formattedData, 'SAF-003');
  expect(metrics.toaShift1).toBe(1200);
  expect(metrics.totalToa).toBe(2000);
  expect(metrics.kmShift1).toBe(150);
  expect(metrics.kmShift2).toBe(100);
  expect(metrics.totalKm).toBe(250);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm dlx vitest run src/utils/unitAnalytics.test.ts`
Expected: FAIL (1200 expected but got 1, 2000 expected but got 2 due to `parseInt("1.200")`).

- [ ] **Step 3: Implement `parseIndonesianNumber` in `unitAnalytics.ts`, `googleSheets.ts`, and `BusCard.tsx`**

In `src/utils/unitAnalytics.ts`:
Import `parseIndonesianNumber` from `./numberUtils`.
Replace `parseInt(String(... || '0'), 10)` and `parseFloat(String(... || '0'))` with `parseIndonesianNumber(...)`.

In `src/services/googleSheets.ts`:
Replace `parseInt(totalToaVal, 10)` and `parseInt(toaShift1Val, 10)` with `parseIndonesianNumber(...)`.

In `src/components/BusCard.tsx`:
Replace `parseInt`/`parseFloat` calls on `bus.*` and `formData.*` fields with `parseIndonesianNumber(...)`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm dlx vitest run src/utils/unitAnalytics.test.ts`
Expected: PASS

- [ ] **Step 5: Add Structural Rule to `.agents/AGENTS.md`**

Append an explicit rule under "Integritas Data" or "Standar Coding" in `.agents/AGENTS.md`:
"**Parsing Angka Sheet:** Semua parsing angka dari data `BusData`/sheet WAJIB menggunakan `parseIndonesianNumber()` dari `utils/numberUtils.ts`. Dilarang menggunakan `parseInt` atau `parseFloat` langsung pada field data spreadsheet."

---

### Task 2: Fix BUG-46 (Eliminate $O(n^2)$ Complexity in `extractUnitList`)

**Files:**
- Modify: `src/utils/unitAnalytics.ts`
- Test: `src/utils/unitAnalytics.test.ts`

**Interfaces:**
- Produces: `calculateUnitMetricsFromRow(item: BusData): UnitSummaryMetrics`

- [ ] **Step 1: Write test to verify `calculateUnitMetricsFromRow` performance and correctness**

In `src/utils/unitAnalytics.test.ts`:
Verify `extractUnitList` output matches `calculateUnitMetricsFromRow` results accurately and handles empty data cleanly.

- [ ] **Step 2: Refactor `unitAnalytics.ts`**

Split `calculateUnitMetrics` into:
1. Core function: `calculateUnitMetricsFromRow(item: BusData): UnitSummaryMetrics` which calculates metrics directly from a single row in $O(1)$ time.
2. `calculateUnitMetrics(data: BusData[], targetUnit: string)`: Wrapper function that finds the item with `data.find(b => b.unit === targetUnit)` once and delegates to `calculateUnitMetricsFromRow(item)`.
3. `extractUnitList(data: BusData[])`: Uses `data.map(b => ... calculateUnitMetricsFromRow(b))` to eliminate the redundant $O(n)$ search per row, reducing overall complexity to $O(n)$.

- [ ] **Step 3: Run all unit tests**

Run: `pnpm dlx vitest run`
Expected: PASS

---

### Task 3: Fix BUG-47 (In-Memory Cache for `getMonthlyToaTrend`)

**Files:**
- Modify: `src/services/googleSheets.ts`
- Modify: `src/components/DailyToaTrendCard.tsx`
- Test: `src/services/googleSheets.test.ts` (or add new test file if needed)

**Interfaces:**
- Consumes: `getMonthlyToaTrend(sheetId, maxDay, unitFilter, bypassCache?)`
- Produces: Cached daily TOA trend data to prevent redundant API fetches when opening unit modals.

- [ ] **Step 1: Write unit test for `getMonthlyToaTrend` caching**

Create or update test verifying that consecutive calls to `getMonthlyToaTrend` with the same arguments return cached data without repeated fetch calls unless `bypassCache` is true or cache is invalidated.

- [ ] **Step 2: Add in-memory cache map to `googleSheets.ts`**

In `src/services/googleSheets.ts`:
Add a module-level `toaTrendCache` map: `Map<string, { day: string; totalToa: number }[]>`.
Key: `${sheetId}-${maxDay}-${unitFilter || 'ALL'}`.
Add cache clearing logic on manual data reload / clear cache triggers.

In `DailyToaTrendCard.tsx`:
Pass `refreshKey` trigger to invalidate or bypass cache when manual reload is triggered.

- [ ] **Step 3: Verify build and run all tests**

Run: `pnpm run build && pnpm dlx vitest run`
Expected: PASS with 0 build errors.

---

## Verification Plan

### Automated Tests
- Run unit test suite: `pnpm dlx vitest run`
- Build check: `pnpm run build`

### Manual Verification
- Test Unit Summary page and unit detail modal with data containing dots for thousand separators.
- Confirm chart loads fast without duplicate API calls when opening unit detail modal.
