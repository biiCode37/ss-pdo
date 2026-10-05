# Bulk Add Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memungkinkan pengawas/admin menambahkan banyak rute sekaligus dalam satu proses copy-paste kumpulan link Google Sheets, lengkap dengan pelacakan judul otomatis, penentuan kode rute/bulan/tahun, pratinjau interaktif, dan penyimpanan massal ke Supabase.

**Architecture:** Client-side orchestration dengan concurrency chunking (4 request paralel) memanfaatkan `sheets-proxy` yang sudah aktif, didukung parser teks fleksibel untuk format array Google Drive/multiline, ekstraktor metadata judul bersyarat (dengan fallback bulan/tahun form), dan batch persistence ke database Supabase.

**Tech Stack:** React 19, TypeScript (Strict Mode), Supabase JS Client, Vitest, CSS Variables / Lucide React.

## Global Constraints

- **Mobile-First Priority:** Seluruh elemen UI baru (tab switcher, textarea, bar progres, kartu pratinjau) harus proporsional dan nyaman di layar sentuh ponsel pengguna operasional.
- **Dua Tema Wajib:** Setiap penambahan warna UI wajib mendukung Light Mode dan Dark Mode melalui CSS variables (`var(--...)`).
- **Anti-Hardcoded String:** Dilarang menuliskan teks antarmuka mentah; wajib menggunakan kamus `src/constants/texts/text_dashboard.ts`.
- **Cabang Git Wajib `devmode`:** Seluruh pengerjaan dan commit wajib berada di branch `devmode`.
- **Format Commit:** Judul commit ringkas $\le 50$ karakter format Conventional Commits (`feat: ...`, `test: ...`).
- **Quality Gates:** `pnpm vitest run src/` lulus 100%, `pnpm run build` lulus 0 error, dan `graphify update .` diperbarui.

---

### Task 1: Kamus Teks Sentral Bulk Add (`text_dashboard.ts`)

**Files:**
- Modify: `src/constants/texts/text_dashboard.ts:40-70`
- Test: `src/constants/texts/texts.test.ts`

**Interfaces:**
- Produces: `TEXT_DASHBOARD.ROUTE_SELECTOR.BULK_ADD`

- [ ] **Step 1: Tulis unit test untuk kamus teks Bulk Add**

Tambahkan pengujian di `src/constants/texts/texts.test.ts`:
```ts
describe('TEXT_DASHBOARD.ROUTE_SELECTOR.BULK_ADD', () => {
  it('harus memiliki seluruh entri teks yang dibutuhkan untuk fitur bulk add', () => {
    const bulkTexts = TEXT_DASHBOARD.ROUTE_SELECTOR.BULK_ADD;
    expect(bulkTexts.TAB_SINGLE).toBe('Satu Rute');
    expect(bulkTexts.TAB_BULK).toBe('Banyak Sekaligus (Bulk)');
    expect(typeof bulkTexts.INSPECTING_PROGRESS).toBe('function');
    expect(bulkTexts.INSPECTING_PROGRESS(2, 5)).toContain('2/5');
    expect(typeof bulkTexts.BTN_SAVE_BULK).toBe('function');
    expect(bulkTexts.BTN_SAVE_BULK(3)).toContain('3');
  });
});
```

- [ ] **Step 2: Jalankan test untuk memastikan test gagal (Red)**

Run: `pnpm vitest run src/constants/texts/texts.test.ts`  
Expected: FAIL dengan `TEXT_DASHBOARD.ROUTE_SELECTOR.BULK_ADD is undefined`

- [ ] **Step 3: Tambahkan definisi teks ke `text_dashboard.ts`**

Edit `src/constants/texts/text_dashboard.ts` pada bagian `ROUTE_SELECTOR`:
```ts
    BULK_ADD: {
      TAB_SINGLE: 'Satu Rute',
      TAB_BULK: 'Banyak Sekaligus (Bulk)',
      TEXTAREA_LABEL: 'Daftar Link Google Sheets',
      TEXTAREA_PLACEHOLDER: 'Tempel link Google Sheets di sini...\nContoh:\n[https://docs.google.com/spreadsheets/d/...,\nhttps://docs.google.com/spreadsheets/d/...]',
      BTN_INSPECT: 'Lacak & Periksa Link',
      INSPECTING_PROGRESS: (current: number, total: number) => `Memeriksa rute (${current}/${total})...`,
      PREVIEW_TITLE: 'Hasil Pemeriksaan Rute',
      STATUS_READY: 'Siap Disimpan',
      STATUS_DUPLICATE: 'Sudah Terdaftar',
      STATUS_ERROR: 'Akses Ditolak / Tidak Ditemukan',
      STATUS_INVALID_TITLE: 'Judul Tidak Dikenal',
      COPY_SERVICE_ACCOUNT: 'Salin Email Service Account',
      BTN_SAVE_BULK: (count: number) => `Simpan ${count} Rute Terpilih`,
      SAVE_SUCCESS: (count: number) => `Berhasil menyimpan ${count} rute baru.`,
      EMPTY_INPUT_WARNING: 'Tempel minimal satu link Google Sheets terlebih dahulu.',
      NO_VALID_ROUTES: 'Tidak ada rute valid yang siap disimpan.',
    },
```

- [ ] **Step 4: Jalankan test untuk memastikan lulus (Green)**

Run: `pnpm vitest run src/constants/texts/texts.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add src/constants/texts/text_dashboard.ts src/constants/texts/texts.test.ts
git commit -m "feat: text constants for bulk add routes"
```

---

### Task 2: Parser Teks Bulk Sheet URL (`bulkRouteParser.ts`)

**Files:**
- Create: `src/utils/bulkRouteParser.ts`
- Test: `src/utils/bulkRouteParser.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface ParsedBulkUrlItem {
    id: string; // spreadsheetId unik
    originalUrl: string;
    cleanUrl: string; // https://docs.google.com/spreadsheets/d/<id>
  }
  export function parseBulkSheetUrls(rawText: string): ParsedBulkUrlItem[]
  ```

- [ ] **Step 1: Tulis unit test parser**

Buat `src/utils/bulkRouteParser.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseBulkSheetUrls } from './bulkRouteParser';

describe('parseBulkSheetUrls', () => {
  it('harus mem-parsing format array Google Drive [...] dengan tanda koma', () => {
    const input = `[https://docs.google.com/spreadsheets/d/13okpIzR7cBochPbB6K2iRC9XdMQf_vzE2N8XQImNZGs/edit?usp=sharing, https://docs.google.com/spreadsheets/d/1B2CG7aGIwTwhV6KKqszspsDiE5HZB0xbURujLuNnOe8/edit?usp=sharing]`;
    const result = parseBulkSheetUrls(input);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('13okpIzR7cBochPbB6K2iRC9XdMQf_vzE2N8XQImNZGs');
    expect(result[0].cleanUrl).toBe('https://docs.google.com/spreadsheets/d/13okpIzR7cBochPbB6K2iRC9XdMQf_vzE2N8XQImNZGs');
    expect(result[1].id).toBe('1B2CG7aGIwTwhV6KKqszspsDiE5HZB0xbURujLuNnOe8');
  });

  it('harus mem-parsing format multi-baris dan mengabaikan duplikasi ID', () => {
    const input = `
      https://docs.google.com/spreadsheets/d/13okpIzR7cBochPbB6K2iRC9XdMQf_vzE2N8XQImNZGs/edit#gid=0
      https://docs.google.com/spreadsheets/d/13okpIzR7cBochPbB6K2iRC9XdMQf_vzE2N8XQImNZGs/view
      https://docs.google.com/spreadsheets/d/1H6NFbBS_cZYXOSUGYpbI6UcyqMd5PXIBrbH4lyKXvD8/edit
    `;
    const result = parseBulkSheetUrls(input);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual([
      '13okpIzR7cBochPbB6K2iRC9XdMQf_vzE2N8XQImNZGs',
      '1H6NFbBS_cZYXOSUGYpbI6UcyqMd5PXIBrbH4lyKXvD8'
    ]);
  });

  it('harus mengembalikan array kosong jika input teks tidak memiliki spreadsheet ID valid', () => {
    expect(parseBulkSheetUrls('')).toEqual([]);
    expect(parseBulkSheetUrls('hanya teks biasa tanpa link')).toEqual([]);
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `pnpm vitest run src/utils/bulkRouteParser.test.ts`  
Expected: FAIL (Cannot find module `./bulkRouteParser`)

- [ ] **Step 3: Implementasikan `src/utils/bulkRouteParser.ts`**

Buat file `src/utils/bulkRouteParser.ts`:
```ts
export interface ParsedBulkUrlItem {
  id: string;
  originalUrl: string;
  cleanUrl: string;
}

const SPREADSHEET_ID_REGEX = /\/spreadsheets\/d\/([a-zA-Z0-9-_]{15,})/g;

/**
 * Mem-parsing string teks mentah yang berisi satu atau banyak link Google Sheets
 * dan mengekstrak daftar spreadsheet ID unik beserta URL bersihnya.
 */
export function parseBulkSheetUrls(rawText: string): ParsedBulkUrlItem[] {
  if (!rawText || typeof rawText !== 'string') {
    return [];
  }

  const seenIds = new Set<string>();
  const items: ParsedBulkUrlItem[] = [];

  let match: RegExpExecArray | null;
  // Reset regex state
  SPREADSHEET_ID_REGEX.lastIndex = 0;

  while ((match = SPREADSHEET_ID_REGEX.exec(rawText)) !== null) {
    const id = match[1];
    if (!seenIds.has(id)) {
      seenIds.add(id);
      items.push({
        id,
        originalUrl: match[0],
        cleanUrl: `https://docs.google.com/spreadsheets/d/${id}`,
      });
    }
  }

  return items;
}
```

- [ ] **Step 4: Jalankan test untuk memverifikasi lulus**

Run: `pnpm vitest run src/utils/bulkRouteParser.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add src/utils/bulkRouteParser.ts src/utils/bulkRouteParser.test.ts
git commit -m "feat: parser for bulk spreadsheet urls"
```

---

### Task 3: Inspector Metadata Spreadsheet Cerdas (`bulkRouteInspector.ts`)

**Files:**
- Create: `src/utils/bulkRouteInspector.ts`
- Test: `src/utils/bulkRouteInspector.test.ts`

**Interfaces:**
- Consumes: `fetchSpreadsheetMeta` dari `src/services/googleSheets/transport.ts`
- Produces:
  ```ts
  export interface BulkRouteItem {
    id: string;
    sheetUrl: string;
    spreadsheetTitle?: string;
    routeCode?: string;
    routeName?: string;
    month: number;
    year: number;
    status: 'pending' | 'inspecting' | 'ready' | 'duplicate' | 'error';
    errorMessage?: string;
    selected: boolean;
  }
  export function extractRoutePeriodFromTitle(
    title: string,
    fallbackMonth: number,
    fallbackYear: number
  ): { routeCode?: string; month: number; year: number }
  export async function inspectBulkRoutesWithConcurrency(
    items: Array<{ id: string; cleanUrl: string }>,
    fallbackMonth: number,
    fallbackYear: number,
    existingSheets: Array<{ routeCode: string; sheet: { month: number; year: number } }>,
    onItemUpdate: (updatedItem: BulkRouteItem, index: number) => void
  ): Promise<BulkRouteItem[]>
  ```

- [ ] **Step 1: Tulis unit test inspector**

Buat `src/utils/bulkRouteInspector.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { extractRoutePeriodFromTitle, inspectBulkRoutesWithConcurrency } from './bulkRouteInspector';

describe('extractRoutePeriodFromTitle', () => {
  it('harus mengekstrak rute JAK, bulan, dan tahun dari format JAK.77_OKTOBER_2026', () => {
    const res = extractRoutePeriodFromTitle('JAK.77_OKTOBER_2026', 9, 2026);
    expect(res.routeCode).toBe('JAK.77');
    expect(res.month).toBe(10);
    expect(res.year).toBe(2026);
  });

  it('harus menangani titik/spasi ekstra seperti JAK.15_OKTOBER._2026', () => {
    const res = extractRoutePeriodFromTitle('JAK.15_OKTOBER._2026', 9, 2026);
    expect(res.routeCode).toBe('JAK.15');
    expect(res.month).toBe(10);
    expect(res.year).toBe(2026);
  });

  it('harus menggunakan fallbackMonth dan fallbackYear jika judul tidak memuat bulan/tahun', () => {
    const res = extractRoutePeriodFromTitle('JAK.115', 8, 2026);
    expect(res.routeCode).toBe('JAK.115');
    expect(res.month).toBe(8);
    expect(res.year).toBe(2026);
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `pnpm vitest run src/utils/bulkRouteInspector.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implementasikan `src/utils/bulkRouteInspector.ts`**

Buat file `src/utils/bulkRouteInspector.ts`:
```ts
import { fetchSpreadsheetMeta } from '../services/googleSheets/transport';

export interface BulkRouteItem {
  id: string;
  sheetUrl: string;
  spreadsheetTitle?: string;
  routeCode?: string;
  routeName?: string;
  month: number;
  year: number;
  status: 'pending' | 'inspecting' | 'ready' | 'duplicate' | 'error';
  errorMessage?: string;
  selected: boolean;
}

const MONTH_MAP: Record<string, number> = {
  JANUARI: 1, JAN: 1,
  FEBRUARI: 2, FEB: 2,
  MARET: 3, MAR: 3,
  APRIL: 4, APR: 4,
  MEI: 5, MAY: 5,
  JUNI: 6, JUN: 6,
  JULI: 7, JUL: 7,
  AGUSTUS: 8, AGU: 8, AGS: 8,
  SEPTEMBER: 9, SEP: 9,
  OKTOBER: 10, OKT: 10,
  NOVEMBER: 11, NOV: 11,
  DESEMBER: 12, DES: 12,
};

export function extractRoutePeriodFromTitle(
  title: string,
  fallbackMonth: number,
  fallbackYear: number
): { routeCode?: string; month: number; year: number } {
  if (!title) return { month: fallbackMonth, year: fallbackYear };

  // Pola: (JAK.77) _ (OKTOBER) ._ (2026)
  const pattern = /(JAK\.\d+[A-Z]?)[_-\s]+([A-Z]+)[._-\s]+(\d{4})/i;
  const match = title.match(pattern);

  if (match) {
    const routeCode = match[1].toUpperCase();
    const rawMonth = match[2].toUpperCase().replace(/[^A-Z]/g, '');
    const detectedMonth = MONTH_MAP[rawMonth] || fallbackMonth;
    const detectedYear = parseInt(match[3], 10) || fallbackYear;

    return { routeCode, month: detectedMonth, year: detectedYear };
  }

  // Coba cari kode JAK saja jika format bulan tidak baku
  const routeOnlyMatch = title.match(/(JAK\.\d+[A-Z]?)/i);
  return {
    routeCode: routeOnlyMatch ? routeOnlyMatch[1].toUpperCase() : undefined,
    month: fallbackMonth,
    year: fallbackYear,
  };
}

/**
 * Menjalankan inspeksi metadata spreadsheet secara concurrent (maksimal 4 paralel).
 */
export async function inspectBulkRoutesWithConcurrency(
  items: Array<{ id: string; cleanUrl: string }>,
  fallbackMonth: number,
  fallbackYear: number,
  existingSheets: Array<{ routeCode: string; sheet: { month: number; year: number } }>,
  onItemUpdate: (updatedItem: BulkRouteItem, index: number) => void
): Promise<BulkRouteItem[]> {
  const initialItems: BulkRouteItem[] = items.map((it) => ({
    id: it.id,
    sheetUrl: it.cleanUrl,
    month: fallbackMonth,
    year: fallbackYear,
    status: 'pending',
    selected: false,
  }));

  const CONCURRENCY = 4;
  let currentIndex = 0;

  async function worker(): Promise<void> {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      const item = items[idx];

      const inspectingItem: BulkRouteItem = {
        ...initialItems[idx],
        status: 'inspecting',
      };
      initialItems[idx] = inspectingItem;
      onItemUpdate(inspectingItem, idx);

      try {
        const meta = await fetchSpreadsheetMeta(item.id, 'properties.title');
        const title: string = meta.result?.properties?.title || meta.properties?.title || '';

        const { routeCode, month, year } = extractRoutePeriodFromTitle(title, fallbackMonth, fallbackYear);

        if (!routeCode) {
          const invalidItem: BulkRouteItem = {
            ...inspectingItem,
            spreadsheetTitle: title || 'Tanpa Judul',
            status: 'error',
            errorMessage: 'Kode rute (misal: JAK.77) tidak ditemukan pada judul spreadsheet.',
            selected: false,
          };
          initialItems[idx] = invalidItem;
          onItemUpdate(invalidItem, idx);
          continue;
        }

        // Cek duplikasi terhadap data existing di database
        const isDuplicate = existingSheets.some(
          (ex) => ex.routeCode === routeCode && ex.sheet.month === month && ex.sheet.year === year
        );

        const finalizedItem: BulkRouteItem = {
          ...inspectingItem,
          spreadsheetTitle: title,
          routeCode,
          routeName: routeCode,
          month,
          year,
          status: isDuplicate ? 'duplicate' : 'ready',
          errorMessage: isDuplicate ? `Rute ${routeCode} periode ${month}/${year} sudah tersimpan di database.` : undefined,
          selected: !isDuplicate,
        };

        initialItems[idx] = finalizedItem;
        onItemUpdate(finalizedItem, idx);
      } catch (err: any) {
        const errItem: BulkRouteItem = {
          ...inspectingItem,
          status: 'error',
          errorMessage: err?.message || 'Akses ditolak (pastikan telah dibagikan ke Service Account).',
          selected: false,
        };
        initialItems[idx] = errItem;
        onItemUpdate(errItem, idx);
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => worker());
  await Promise.all(workers);

  return initialItems;
}
```

- [ ] **Step 4: Jalankan test untuk memverifikasi lulus**

Run: `pnpm vitest run src/utils/bulkRouteInspector.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add src/utils/bulkRouteInspector.ts src/utils/bulkRouteInspector.test.ts
git commit -m "feat: inspector for bulk route metadata"
```

---

### Task 4: Service Layer Batch Insert Database (`routes.ts`)

**Files:**
- Modify: `src/services/routes/routes.ts:140-160`
- Test: `src/services/routes/routes.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface BulkCreateRouteInput {
    routeCode: string;
    routeName?: string;
    year: number;
    month: number;
    sheetUrl: string;
    spreadsheetId: string;
  }
  export async function createBulkRoutesWithSheets(
    routes: BulkCreateRouteInput[]
  ): Promise<{ success: boolean; savedCount: number; message?: string }>
  ```

- [ ] **Step 1: Tulis unit test untuk `createBulkRoutesWithSheets`**

Di `src/services/routes/routes.test.ts`, tambahkan describe blok:
```ts
describe('createBulkRoutesWithSheets', () => {
  it('harus berhasil memproses batch rute dan mengembalikan savedCount', async () => {
    const input: BulkCreateRouteInput[] = [
      {
        routeCode: 'JAK.77',
        routeName: 'JAK.77',
        year: 2026,
        month: 10,
        sheetUrl: 'https://docs.google.com/spreadsheets/d/13okpIzR7cBochPbB6K2iRC9XdMQf_vzE2N8XQImNZGs',
        spreadsheetId: '13okpIzR7cBochPbB6K2iRC9XdMQf_vzE2N8XQImNZGs',
      },
    ];
    const res = await createBulkRoutesWithSheets(input);
    expect(res.success).toBe(true);
    expect(res.savedCount).toBe(1);
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `pnpm vitest run src/services/routes/routes.test.ts`  
Expected: FAIL (`createBulkRoutesWithSheets is not a function`)

- [ ] **Step 3: Implementasikan `createBulkRoutesWithSheets` di `src/services/routes/routes.ts`**

Tambahkan fungsi:
```ts
export async function createBulkRoutesWithSheets(
  routes: Array<{
    routeCode: string;
    routeName?: string;
    year: number;
    month: number;
    sheetUrl: string;
    spreadsheetId: string;
  }>
): Promise<{ success: boolean; savedCount: number; message?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, savedCount: 0, message: 'Layanan Supabase belum dikonfigurasi.' };
  }
  if (!routes || routes.length === 0) {
    return { success: true, savedCount: 0 };
  }

  try {
    let savedCount = 0;
    for (const r of routes) {
      const res = await createRouteWithSheet(r);
      if (res.success) {
        savedCount++;
      }
    }

    await fetchRoutesWithSheets();

    logActivity({
      user_email: localStorage.getItem('PDO_USER_EMAIL') || 'admin',
      action: 'BULK_CREATE_ROUTES',
      route_code: routes.map((r) => r.routeCode).join(', '),
      details: { totalAttempted: routes.length, savedCount },
    }).catch(() => {});

    return {
      success: savedCount > 0,
      savedCount,
      message: `Berhasil menyimpan ${savedCount} dari ${routes.length} rute.`,
    };
  } catch (err: any) {
    console.error('[RouteService] Failed bulk create routes:', err);
    return { success: false, savedCount: 0, message: err?.message || 'Gagal menyimpan bulk rute.' };
  }
}
```

- [ ] **Step 4: Jalankan test untuk memverifikasi lulus**

Run: `pnpm vitest run src/services/routes/routes.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add src/services/routes/routes.ts src/services/routes/routes.test.ts
git commit -m "feat: createBulkRoutesWithSheets service"
```

---

### Task 5: UI Komponen Preview & Modal Segmented Tab (`AddRouteModal.tsx`)

**Files:**
- Modify: `src/components/routeSelector/AddRouteModal.tsx`
- Modify: `src/components/routeSelector/useAddRouteForm.ts`
- Modify: `src/components/routeSelector/RouteSelectorCard.tsx`
- Test: `src/components/routeSelector/RouteSelectorCard.test.tsx`

**Interfaces:**
- Consumes: `parseBulkSheetUrls`, `inspectBulkRoutesWithConcurrency`, `createBulkRoutesWithSheets`, `TEXT_DASHBOARD.ROUTE_SELECTOR.BULK_ADD`

- [ ] **Step 1: Tambahkan state dan handler bulk add pada `useAddRouteForm.ts`**

Tambahkan:
- `activeTab`: `'single' | 'bulk'`
- `bulkRawText`, `setBulkRawText`
- `bulkItems`: `BulkRouteItem[]`
- `isInspectingBulk`: boolean
- `inspectProgress`: `{ current: number; total: number }`
- `onInspectBulk`: `() => Promise<void>`
- `onToggleSelectBulkItem`: `(index: number) => void`
- `onSaveBulk`: `() => Promise<void>`

- [ ] **Step 2: Update `AddRouteModal.tsx` dengan segmented tab & bulk view**

Struktur UI:
1. Di atas form, tambahkan Segmented Tab switcher:
   - Tombol `[ Satu Rute ]` & `[ Banyak Sekaligus (Bulk) ]`.
2. Jika `activeTab === 'bulk'`:
   - Tampilkan dropdown Bulan & Tahun default (sebagai acuan).
   - Tampilkan textarea input `bulkRawText` dengan tombol `[ 🔍 Lacak & Periksa Link ]`.
   - Tampilkan bar progres ketika `isInspectingBulk` aktif.
   - Tampilkan list preview `bulkItems` dengan checkbox per baris, badge rute, badge status (`ready` hijau, `duplicate` kuning, `error` merah).
   - Tombol `[ Simpan (X) Rute Terpilih ]`.

- [ ] **Step 3: Jalankan test `RouteSelectorCard.test.tsx`**

Run: `pnpm vitest run src/components/routeSelector/RouteSelectorCard.test.tsx`  
Expected: PASS

- [ ] **Step 4: Commit**

Run:
```bash
git add src/components/routeSelector/ src/hooks/
git commit -m "feat: bulk add routes UI in AddRouteModal"
```

---

### Task 6: Verifikasi Menyeluruh & Quality Gates

**Files:** Seluruh proyek

- [ ] **Step 1: Jalankan seluruh test suite Vitest**

Run: `pnpm vitest run src/`  
Expected: Seluruh unit test lulus 100% tanpa error.

- [ ] **Step 2: Jalankan TypeScript Strict Mode & Production Build**

Run: `pnpm run build`  
Expected: `tsc -b` lulus 0 error, build bundle sukses.

- [ ] **Step 3: Update knowledge graph**

Run: `graphify update .`  
Expected: Graph AST terbarukan.

- [ ] **Step 4: Final verification commit**

Run:
```bash
git add .
git commit -m "chore: update knowledge graph after bulk add"
```
