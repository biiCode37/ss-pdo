# Route Validation & Formatting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement strict validation, auto-formatting, live connection inspection, and auto-switch UX for route registration in SS_PDO.

**Architecture:** 
- A dedicated pure validation module `src/utils/routeValidation.ts` handles route code sanitization (mandatory `JAK.` prefix, uppercase, single dot, alphanumeric code only), Google Sheets URL validation, and route name extraction from trip headers.
- `src/services/googleSheets.ts` exposes `inspectSpreadsheetHeader(sheetId)` to verify spreadsheet access and extract trip headers during live check.
- `src/services/routeService.ts` integrates validation guards, duplicate checks, and route name detection before saving to Supabase.
- `src/components/RouteSelectorCard.tsx` renders smart input fields with visual prefix helper, real-time debounced live check status, and auto-switches to the newly created route.

**Tech Stack:** TypeScript, React, Vitest, Google Sheets API v4, Supabase.

## Global Constraints

- Mandatory prefix `JAK.` (UPPERCASE + single dot).
- Code after dot must be alphanumeric only (e.g. `115`, `05`, `76`, `78A`), all whitespace and other symbols stripped.
- Single Source of Truth (SSOT) & Non-blocking fallback for offline mode.
- Mobile-first layout with fluid Apple cubic-bezier styling.
- All user-facing error messages in friendly Indonesian.

---

### Task 1: Route Validation Pure Utility Module

**Files:**
- Create: `src/utils/routeValidation.ts`
- Create: `src/utils/routeValidation.test.ts`

**Interfaces:**
- Produces:
  - `formatRouteCode(input: string): string`
  - `validateRouteCode(code: string): { isValid: boolean; error?: string }`
  - `validateGoogleSheetsUrl(urlOrId: string): { isValid: boolean; spreadsheetId?: string; error?: string }`
  - `extractRouteNameFromHeaders(tripPergiLabel?: string, tripPulangLabel?: string): string | null`

- [ ] **Step 1: Write unit tests for routeValidation**

```typescript
// src/utils/routeValidation.test.ts
import { describe, it, expect } from 'vitest';
import {
  formatRouteCode,
  validateRouteCode,
  validateGoogleSheetsUrl,
  extractRouteNameFromHeaders,
} from './routeValidation';

describe('routeValidation', () => {
  describe('formatRouteCode', () => {
    it('automatically prefixes JAK. if user types raw numbers or code', () => {
      expect(formatRouteCode('115')).toBe('JAK.115');
      expect(formatRouteCode('78a')).toBe('JAK.78A');
    });

    it('sanitizes input with spaces, lowercase, and duplicate dots', () => {
      expect(formatRouteCode('jak. 76 ')).toBe('JAK.76');
      expect(formatRouteCode('JAK..15')).toBe('JAK.15');
      expect(formatRouteCode('jak-115')).toBe('JAK.115');
      expect(formatRouteCode('JAK.29-B')).toBe('JAK.29B');
    });

    it('strips all non-alphanumeric characters after JAK.', () => {
      expect(formatRouteCode('JAK.115#@!')).toBe('JAK.115');
    });
  });

  describe('validateRouteCode', () => {
    it('validates correct route codes', () => {
      expect(validateRouteCode('JAK.115').isValid).toBe(true);
      expect(validateRouteCode('JAK.05').isValid).toBe(true);
      expect(validateRouteCode('JAK.78A').isValid).toBe(true);
    });

    it('rejects invalid or empty route codes', () => {
      expect(validateRouteCode('').isValid).toBe(false);
      expect(validateRouteCode('JAK.').isValid).toBe(false);
      expect(validateRouteCode('115').isValid).toBe(false);
      expect(validateRouteCode('BUS.115').isValid).toBe(false);
    });
  });

  describe('validateGoogleSheetsUrl', () => {
    it('validates full Google Sheets URLs and extracts clean ID', () => {
      const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0';
      const result = validateGoogleSheetsUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.spreadsheetId).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
    });

    it('validates raw spreadsheet ID directly', () => {
      const id = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
      const result = validateGoogleSheetsUrl(id);
      expect(result.isValid).toBe(true);
      expect(result.spreadsheetId).toBe(id);
    });

    it('rejects invalid URLs or invalid spreadsheet IDs', () => {
      expect(validateGoogleSheetsUrl('').isValid).toBe(false);
      expect(validateGoogleSheetsUrl('https://google.com').isValid).toBe(false);
      expect(validateGoogleSheetsUrl('invalid-id').isValid).toBe(false);
    });
  });

  describe('extractRouteNameFromHeaders', () => {
    it('extracts route destination from trip pergi label', () => {
      const name = extractRouteNameFromHeaders('TERM. TJ PRIOK - PEGANGSAAN II IGI', 'PEGANGSAAN II IGI - TERM. TJ PRIOK');
      expect(name).toBe('TERM. TJ PRIOK - PEGANGSAAN II IGI');
    });

    it('returns null if trip label is generic or missing', () => {
      expect(extractRouteNameFromHeaders('Trip Pergi', 'Trip Pulang')).toBeNull();
      expect(extractRouteNameFromHeaders(undefined, undefined)).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/utils/routeValidation.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement routeValidation.ts**

```typescript
// src/utils/routeValidation.ts
import { extractSpreadsheetId } from './sheetIdentity';

/**
 * Format string kode rute menjadi format baku JAK.<KODE> (UPPERCASE, alfanumerik saja setelah titik)
 */
export function formatRouteCode(rawInput: string): string {
  if (!rawInput) return '';

  // 1. Hilangkan spasi dan ubah ke uppercase
  let cleaned = rawInput.trim().toUpperCase().replace(/\s+/g, '');

  // 2. Normalisasi awalan JAK
  if (cleaned.startsWith('JAK')) {
    // Ambil sisa setelah 'JAK' dan buang karakter non-alfanumerik di awal sisa
    const afterJak = cleaned.substring(3).replace(/^[^A-Z0-9]+/, '');
    // Buang semua karakter non-alfanumerik dari bagian kode
    const codePart = afterJak.replace(/[^A-Z0-9]/g, '');
    return codePart ? `JAK.${codePart}` : 'JAK.';
  }

  // Jika tidak diawali JAK, bersihkan karakter non-alfanumerik lalu tambahkan JAK.
  const codePart = cleaned.replace(/[^A-Z0-9]/g, '');
  return codePart ? `JAK.${codePart}` : '';
}

/**
 * Validasi apakah kode rute sesuai format baku JAK.<KODE>
 */
export function validateRouteCode(code: string): { isValid: boolean; error?: string } {
  if (!code || !code.trim()) {
    return { isValid: false, error: 'Kode Rute wajib diisi (misal: JAK.76).' };
  }

  const trimmed = code.trim().toUpperCase();
  const regex = /^JAK\.[A-Z0-9]+$/;

  if (!regex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Format Kode Rute tidak valid. Wajib diawali "JAK." diikuti angka/huruf (contoh: JAK.115, JAK.76, JAK.78A).',
    };
  }

  return { isValid: true };
}

/**
 * Validasi URL / ID Google Sheets dan ekstrak spreadsheetId yang valid
 */
export function validateGoogleSheetsUrl(urlOrId: string): { isValid: boolean; spreadsheetId?: string; error?: string } {
  if (!urlOrId || !urlOrId.trim()) {
    return { isValid: false, error: 'Link Google Sheets wajib diisi.' };
  }

  const spreadsheetId = extractSpreadsheetId(urlOrId.trim());
  if (!spreadsheetId) {
    return {
      isValid: false,
      error: 'Link Google Sheets tidak valid. Pastikan Anda menyalin link spreadsheet Google Sheets yang benar.',
    };
  }

  return { isValid: true, spreadsheetId };
}

/**
 * Mengekstrak nama trayek dari label kolom trip
 */
export function extractRouteNameFromHeaders(tripPergiLabel?: string, tripPulangLabel?: string): string | null {
  if (tripPergiLabel && tripPergiLabel.trim() && !tripPergiLabel.toLowerCase().includes('trip pergi')) {
    return tripPergiLabel.trim();
  }
  if (tripPulangLabel && tripPulangLabel.trim() && !tripPulangLabel.toLowerCase().includes('trip pulang')) {
    return tripPulangLabel.trim();
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/utils/routeValidation.test.ts`
Expected: PASS (4 test suites, all passing).

---

### Task 2: Live Connection & Header Inspection Service

**Files:**
- Modify: `src/services/googleSheets.ts`

**Interfaces:**
- Produces:
  - `inspectSpreadsheetHeader(sheetId: string): Promise<{ success: boolean; routeName?: string; tabNames: string[]; message?: string }>`

- [ ] **Step 1: Add inspectSpreadsheetHeader to googleSheets.ts**

Implement `inspectSpreadsheetHeader(sheetId: string)` using `gapi.client.sheets.spreadsheets.get` to:
1. Fetch spreadsheet metadata (tab names).
2. Fetch row 1 & 2 of the first data tab.
3. Check header structure using `detectHeaderRowAndBuildComposite`.
4. Extract route name from trip header using `extractRouteNameFromHeaders`.
5. Return `{ success: true, routeName, tabNames }` or friendly error message on permission/invalid errors.

- [ ] **Step 2: Update createRouteWithSheet in routeService.ts**

Validate params using `validateRouteCode`, `validateGoogleSheetsUrl`, check duplicate spreadsheet ID per month/year, and use detected `routeName`.

- [ ] **Step 3: Run test suite**

Run: `pnpm test src/services/routeService.test.ts`
Expected: PASS.

---

### Task 3: UI Enhancement in RouteSelectorCard

**Files:**
- Modify: `src/components/RouteSelectorCard.tsx`

**Interfaces:**
- Consumes:
  - `formatRouteCode`, `validateRouteCode`, `validateGoogleSheetsUrl` from `../utils/routeValidation`
  - `inspectSpreadsheetHeader` from `../services/googleSheets`
  - `createRouteWithSheet` from `../services/routeService`

- [ ] **Step 1: Implement Smart Input & Live Status Badge in RouteSelectorCard**

1. Input Kode Rute: Auto-format on change using `formatRouteCode`.
2. Input Link Google Sheets: Debounce 600ms on paste/change to trigger `inspectSpreadsheetHeader`.
3. Render status badge:
   - ⏳ *Memeriksa link spreadsheet...* (Spinner)
   - ✅ *Spreadsheet terhubung: [Nama Trayek]* (Badge hijau)
   - ❌ *Spreadsheet tidak dapat diakses* (Badge merah)
4. Auto-Switch & Load on success:
   - Call `loadRoutes()`.
   - Set `selectedRouteCode`, `selectedMonth`, `selectedYear`, `sheetUrl`.
   - Auto-morph form to compact pill and trigger `onLoadData()`.

- [ ] **Step 2: Verify UI and component builds**

Run: `pnpm test` and `pnpm run build`
Expected: 100% PASS, build succeeds with zero errors.

---

## Plan Review Checklist
1. All constraints from design spec addressed.
2. No placeholders or undefined types.
3. Unit tests and integration checks included.
