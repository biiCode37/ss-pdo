# Fleet Status Management & Dynamic Renops Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement automated fleet operational readiness management (SGO/TO/OFF/BA) with an interactive brush-mode full-screen grid, dynamic day-based Renops targets (Weekday, Saturday, Sunday, Holiday), automated Realops calculations per shift, non-blocking bus card editing, and an ultra-clean mobile-first dashboard UI with zero layout clutter.

**Architecture:**
- **Data Layer:** Supabase `routes` schema extension (`renops_weekday`, `renops_saturday`, `renops_sunday`, `renops_holiday`), `holidayUtils` for Indonesian calendar calculations, and `keteranganUtils` per-shift string composition using `" | "`.
- **UI Components:** Slim contextual alert banner (`ShiftConfirmationAlertBar`), Full-Screen Interactive Fleet Manager (`FleetStatusModal`) with brush pallet and Apple spring physics, and SweetAlert2 confirmation dialog on non-SGO bus cards.
- **State & Sync:** Batch update to Google Sheets `keterangan` column and sync to Supabase `daily_route_reports` (`realops_shift1`, `realops_shift2`).

**Tech Stack:** React 19, TypeScript (Strict), Lucide Icons, SweetAlert2, Supabase JS, Vitest, CSS Variables (Dark/Light).

---

## Global Constraints

- Mobile-First layout: Zero layout shift, zero vertical overcrowding on the main dashboard.
- Single Source of Truth (SSOT): SGO = empty keterangan in Google Sheets (normal row color). OFF/TO/BA = canonical string + highlight color. Different notes per shift combined via `" | "`.
- Non-blocking (Opsi B): Friendly confirmation on non-SGO cards, never hard-lock.
- Quality gates: All unit tests must pass 100% (`pnpm vitest run src/`), `pnpm run build` 0 errors.

---

### Task 1: Dynamic Renops Data Engine & Indonesian Holiday Utility

**Files:**
- Create: `supabase/migrations/20260909000001_dynamic_renops.sql`
- Create: `src/utils/holidayUtils.ts`
- Test: `src/utils/holidayUtils.test.ts`
- Modify: `src/types/supabase.ts:1-18`

**Interfaces:**
- `isNationalHoliday(dateStr: string): { isHoliday: boolean; holidayName?: string }`
- `getRenopsForDate(route: Route | null | undefined, dateStr: string): { renops: number; dayType: 'weekday' | 'saturday' | 'sunday' | 'holiday'; label: string }`

- [ ] **Step 1: Write the failing unit tests for holiday and renops calculation**
  Create `src/utils/holidayUtils.test.ts` covering weekday, Saturday, Sunday, national holidays, fallback to `default_renops`, and route undefined handling.
- [ ] **Step 2: Run test to ensure it fails**
  Run `pnpm vitest run src/utils/holidayUtils.test.ts`.
- [ ] **Step 3: Implement `supabase/migrations/20260909000001_dynamic_renops.sql`**
  Add columns `renops_weekday`, `renops_saturday`, `renops_sunday`, `renops_holiday` to `public.routes` with fallback backfill from `default_renops`.
- [ ] **Step 4: Update `src/types/supabase.ts`**
  Add optional fields `renops_weekday?: number; renops_saturday?: number; renops_sunday?: number; renops_holiday?: number;` to `Route` interface.
- [ ] **Step 5: Implement `src/utils/holidayUtils.ts`**
  Implement calendar detection, Indonesian official holidays list (2026), and `getRenopsForDate`.
- [ ] **Step 6: Run tests and verify 100% pass**
  Run `pnpm vitest run src/utils/holidayUtils.test.ts`.
- [ ] **Step 7: Commit Task 1**
  Commit with `feat: dynamic renops & holiday calculation engine`.

---

### Task 2: Multi-Shift Keterangan Standard & Formatting Engine

**Files:**
- Modify: `src/utils/keteranganUtils.ts`
- Test: `src/utils/keteranganUtils.test.ts`
- Modify: `src/utils/sheetColorUtils.ts`

**Interfaces:**
- `combineShiftKeterangan(s1?: string | null, s2?: string | null): string`
- `splitShiftKeterangan(combined?: string | null): { s1: string; s2: string }`

- [ ] **Step 1: Write failing tests for multi-shift keterangan parsing and combining**
  In `src/utils/keteranganUtils.test.ts`, add test cases for:
  - Both shifts SGO (empty) -> `""`
  - S1 SGO, S2 BA.02 -> `"BA.02"`
  - S1 BA.01, S2 TO EVDAL -> `"BA.01 | TO EVDAL"`
  - S1 OFF, S2 OFF -> `"OFF"`
  - Splitting combined string back into per-shift values.
- [ ] **Step 2: Run tests to ensure they fail**
  Run `pnpm vitest run src/utils/keteranganUtils.test.ts`.
- [ ] **Step 3: Implement `combineShiftKeterangan` and `splitShiftKeterangan` in `src/utils/keteranganUtils.ts`**
  Implement logic handling SGO, identical notes, and differing notes separated by `" | "`.
- [ ] **Step 4: Ensure `sheetColorUtils.ts` handles compound keterangan**
  Ensure that strings with `" | "` are assigned appropriate colors based on the most severe priority.
- [ ] **Step 5: Run tests and verify 100% pass**
  Run `pnpm vitest run src/utils/keteranganUtils.test.ts` and `src/utils/sheetColorUtils.test.ts`.
- [ ] **Step 6: Commit Task 2**
  Commit with `feat: multi-shift keterangan parser and combiner`.

---

### Task 3: Slim Contextual Shift Alert Bar Component

**Files:**
- Create: `src/components/fleetStatus/ShiftConfirmationAlertBar.tsx`
- Test: `src/components/fleetStatus/ShiftConfirmationAlertBar.test.tsx`
- Modify: `src/index.css` (animations and pill theme styles)

**Interfaces:**
- `Props`: `{ isOpen: boolean; shift: 1 | 2; routeCode: string; onOpenModal: () => void; }`

- [ ] **Step 1: Write failing tests for `ShiftConfirmationAlertBar`**
  Test rendering for Shift 1 and Shift 2, button click invoking `onOpenModal`, and hidden when `isOpen` is false.
- [ ] **Step 2: Run tests to ensure they fail**
  Run `pnpm vitest run src/components/fleetStatus/ShiftConfirmationAlertBar.test.tsx`.
- [ ] **Step 3: Implement `ShiftConfirmationAlertBar.tsx`**
  Design an ultra-slim (~38px height) amber/glass floating pill bar with smooth CSS spring animation.
- [ ] **Step 4: Add CSS styles in `src/index.css`**
  Add `.shift-alert-bar` styles with theme support for dark and light mode.
- [ ] **Step 5: Run tests and verify 100% pass**
  Run `pnpm vitest run src/components/fleetStatus/ShiftConfirmationAlertBar.test.tsx`.
- [ ] **Step 6: Commit Task 3**
  Commit with `feat: slim contextual shift alert bar`.

---

### Task 4: Interactive Full-Screen Fleet Status Modal (`FleetStatusModal.tsx`)

**Files:**
- Create: `src/components/fleetStatus/FleetStatusModal.tsx`
- Test: `src/components/fleetStatus/FleetStatusModal.test.tsx`
- Modify: `src/index.css` (grid layout & brush chip styles)

**Interfaces:**
- `Props`:
  ```ts
  interface FleetStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    routeCode: string;
    selectedDate: string;
    renopsTarget: number;
    buses: BusData[];
    initialShift?: 1 | 2;
    onConfirmStatus: (shift: 1 | 2, unitStatuses: Map<string, string>) => Promise<void>;
  }
  ```

- [ ] **Step 1: Write failing tests for `FleetStatusModal`**
  Test rendering grid of bus units, switching active brush mode, tapping a bus card to apply brush, batch "SGO Semua Unit", and confirming status.
- [ ] **Step 2: Run tests to ensure they fail**
  Run `pnpm vitest run src/components/fleetStatus/FleetStatusModal.test.tsx`.
- [ ] **Step 3: Implement `FleetStatusModal.tsx`**
  - Full screen portal (`createPortal(..., document.body)`), `z-index: 99999`, body scroll lock.
  - Header: Route, Date, Renops target, Shift 1/2 toggle, Close button.
  - Brush Bar: `[ 🟢 SGO ]`, `[ 🟡 OFF ]`, `[ 🔴 T.O ]`, `[ 🔵 Keterangan / BA ]`, and `[ ⚡ SGO Semua ]`.
  - Grid: Responsive cards, single tap applies brush, long press triggers detail modal.
  - Footer dock: Real-time counts (SGO = Realops, OFF, TO, BA) + CTA button.
- [ ] **Step 4: Add CSS styling in `src/index.css`**
  Ensure fluid iOS-like transitions and dark/light mode tokens.
- [ ] **Step 5: Run tests and verify 100% pass**
  Run `pnpm vitest run src/components/fleetStatus/FleetStatusModal.test.tsx`.
- [ ] **Step 6: Commit Task 4**
  Commit with `feat: interactive full-screen fleet status modal`.

---

### Task 5: Dashboard Integration, Storage, & Non-Blocking Card Editing (Opsi B)

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/components/BusCard.tsx`
- Modify: `src/components/RouteSelectorCard.tsx`
- Test: `src/components/Dashboard.test.tsx` (or new integration test)
- Test: `src/components/BusCard.test.tsx`

**Features:**
- Shift detection logic (Shift 1 vs Shift 2 based on local time / 14:00 boundary).
- Tracking shift confirmation state per route and date.
- Auto-sync to Google Sheets (batch update `Keterangan` using `combineShiftKeterangan`).
- Auto-sync to Supabase `daily_route_reports` (`realops_shift1` & `realops_shift2`).
- SweetAlert2 friendly confirmation when tapping non-SGO bus card in `BusCard.tsx`.
- Manual quick-access button to open `FleetStatusModal` at any time.

- [ ] **Step 1: Write failing tests for non-SGO bus card tap confirmation**
  In `src/components/BusCard.test.tsx`, test tapping a bus with `keterangan="OFF"` triggers confirmation dialog before editing.
- [ ] **Step 2: Implement friendly confirmation in `BusCard.tsx`**
  When tapping a bus with non-SGO status, show SweetAlert2 prompt: "Unit berstatus [OFF]. Apakah unit ini dioperasikan (SGO)?"
- [ ] **Step 3: Connect `ShiftConfirmationAlertBar` and `FleetStatusModal` in `Dashboard.tsx`**
  Wire shift detection, confirmation alert, and modal submission handler.
- [ ] **Step 4: Connect manual trigger button in header / `RouteSelectorCard.tsx`**
  Add a compact icon button or pill `[ 📋 Armada ]` allowing operators to open the fleet manager at any time.
- [ ] **Step 5: Run all unit tests**
  Run `pnpm vitest run src/`.
- [ ] **Step 6: Run production build**
  Run `pnpm run build`.
- [ ] **Step 7: Commit Task 5**
  Commit with `feat: dashboard integration of fleet status and non-blocking card edit`.

---

### Task 6: Documentation, Graphify, & Final Quality Gate

**Files:**
- Create: `refactor-ss-pdo/refact_25/AUDIT_BUGS.md`
- Create: `refactor-ss-pdo/refact_25/REPAIR_REPORT.md`

- [ ] **Step 1: Create documentation in `refactor-ss-pdo/refact_25/`**
- [ ] **Step 2: Run `graphify update .`**
- [ ] **Step 3: Run final verification**
  - `pnpm vitest run src/`
  - `pnpm run build`
- [ ] **Step 4: Commit Task 6**
  Commit with `docs: refactor 25 fleet status and renops report`.
