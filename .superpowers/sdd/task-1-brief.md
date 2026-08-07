# Task 1 Brief — Fondasi: Helper Identitas & Status Result

## Tujuan
Buat 2 module utilitas baru yang akan menjadi fondasi untuk task-task selanjutnya:
1. `src/utils/sheetIdentity.ts` — Helper tunggal untuk identitas sheet/spreadsheet
2. `src/utils/resultStatus.ts` — Tipe dan helper untuk status data result

## File yang Harus Dibuat

### 1. `src/utils/sheetIdentity.ts`

```typescript
import type { Route, RouteSheet } from '../types/supabase';

/**
 * Ekstrak spreadsheet ID dari berbagai format URL Google Sheets.
 * Mendukung:
 * - URL standar: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
 * - URL dengan query string: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit?usp=sharing
 * - URL dengan fragment: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0
 * - Raw spreadsheet ID (string alfanumerik+dash+underscore, panjang >= 20)
 * 
 * @returns spreadsheet ID jika berhasil parse, null jika gagal
 */
export function extractSpreadsheetId(urlOrId: string): string | null;

/**
 * Cari route dan sheet dari daftar routes berdasarkan spreadsheet ID canonical.
 * Menggunakan extractSpreadsheetId() untuk normalisasi, BUKAN includes().
 */
export function matchRouteSheetById(
  routes: Route[],
  spreadsheetId: string
): { route: Route; sheet: RouteSheet } | null;
```

**Aturan implementasi `extractSpreadsheetId`:**
- Coba match regex `/\/d\/([a-zA-Z0-9-_]+)/` terlebih dahulu
- Jika tidak cocok, cek apakah input adalah raw ID (hanya alfanumerik, dash, underscore, panjang >= 20)
- Jika keduanya gagal, return `null` (BUKAN return input mentah — itu bug lama ISS-04)

**Aturan implementasi `matchRouteSheetById`:**
- Untuk setiap route_sheet, extract ID dari `sheet.spreadsheet_id` dan `sheet.sheet_url` menggunakan `extractSpreadsheetId()`
- Compare ID canonical, bukan substring

### 2. `src/utils/resultStatus.ts`

```typescript
/** Status sumber data yang menentukan bagaimana UI menampilkan info */
export type DataSourceStatus = 'live' | 'cache' | 'partial' | 'error' | 'conflict' | 'pending' | 'failed';

/** Wrapper result generik dengan metadata status */
export interface DataResult<T> {
  data: T;
  status: DataSourceStatus;
  message?: string;
  cachedAt?: string; // ISO timestamp kapan data di-cache
}

/** Cek apakah data cache sudah expired berdasarkan maxAgeMs */
export function isStale(cachedAt: string, maxAgeMs: number): boolean;

/** Buat DataResult dengan status 'live' */
export function liveResult<T>(data: T): DataResult<T>;

/** Buat DataResult dengan status 'cache' */
export function cacheResult<T>(data: T, cachedAt: string): DataResult<T>;

/** Buat DataResult dengan status 'error' */
export function errorResult<T>(data: T, message: string): DataResult<T>;
```

### 3. `src/utils/sheetIdentity.test.ts`

Test cases wajib:
- `extractSpreadsheetId` dengan URL standar Google Sheets
- `extractSpreadsheetId` dengan URL + query string
- `extractSpreadsheetId` dengan URL + fragment  
- `extractSpreadsheetId` dengan raw ID (alfanumerik panjang)
- `extractSpreadsheetId` dengan string pendek/invalid return `null`
- `extractSpreadsheetId` dengan string kosong return `null`
- `matchRouteSheetById` menemukan match yang benar
- `matchRouteSheetById` return null jika tidak ada match

### 4. `src/utils/resultStatus.test.ts`

Test cases wajib:
- `isStale` return true untuk data expired
- `isStale` return false untuk data fresh
- `liveResult` menghasilkan status 'live'
- `cacheResult` menghasilkan status 'cache' dengan cachedAt
- `errorResult` menghasilkan status 'error' dengan message

## Konteks Arsitektur

- Proyek ini React + TypeScript (Vite)
- Tipe `Route` dan `RouteSheet` ada di `src/types/supabase.ts`
- `Route` punya `route_sheets?: RouteSheet[]` 
- `RouteSheet` punya field `spreadsheet_id` dan `sheet_url`
- Fungsi `extractSheetId()` yang ada di `src/services/googleSheets.ts` (L394-401) akan di-deprecate dan didelegasi ke module baru ini di task berikutnya

## Acceptance Criteria

- [ ] Kedua file utilitas dibuat dengan TypeScript strict
- [ ] Semua test pass
- [ ] `pnpm run build` sukses
- [ ] Tidak ada `any` type kecuali sangat terpaksa
- [ ] Tidak ada dependency baru
