# sheets-proxy Whitelist & Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Secure the `sheets-proxy` Supabase Edge Function by enforcing a database-backed `spreadsheetId` whitelist against `public.route_sheets` with resilient in-memory caching (TTL 5 minutes), strict origin-based CORS, and payload validation, eliminating unauthorized spreadsheet access while maintaining 100% smooth operations for field officers.

**Architecture:** The Edge Function `sheets-proxy` acts as the server-to-server gateway between the SS_PDO frontend and Google Sheets API v4 using a Google Service Account. Before forwarding any read or write commands to Google, `sheets-proxy` validates the caller's authorization header, checks the `spreadsheetId` against an in-memory cache of allowed spreadsheets populated from `public.route_sheets` (with a single-record database fallback on cache-miss), validates write payloads, and enforces origin-restricted CORS headers.

**Tech Stack:** 
- Deno / TypeScript (Supabase Edge Runtime)
- Supabase Client (`@supabase/supabase-js@2.39.8`)
- Google Sheets API v4 (Service Account JWT Web Crypto RS256)
- Vitest / TypeScript for frontend transport testing

---

## Global Constraints

- **Strict devmode branch:** All modifications and commits MUST remain on branch `devmode`. Never touch or push to `main`.
- **Zero hardcoded colors:** All UI and error styling must use `src/styles/tokens/semantic.css`.
- **Central text dictionary:** All UI and user-facing messages must be defined in `src/constants/texts/`.
- **Formula preservation (SSOT):** No modifications may overwrite Google Sheets formula columns.
- **Mobile-first & Zero Disruption:** Officers entering body numbers, trips, and KM in terminals must not experience operational blockages or degraded latency.
- **Audit documentation:** Comprehensive audit findings and repair report must be documented in `refactor-ss-pdo/refact_192/` (`AUDIT_BUGS.md` and `REPAIR_REPORT.md`).

---

## File Structure

```
supabase/functions/sheets-proxy/
├── index.ts                     # Edge Function: CORS, Auth header, whitelist checking, Google API proxy
src/constants/texts/
├── text_errors.ts               # Kamus teks: Pesan kesalahan spreadsheet dan validasi rute
├── texts.test.ts                # Unit test kamus teks
src/services/googleSheets/
├── transport.ts                 # Frontend adapter for sheets-proxy and fallback gapi
├── transport.test.ts            # Unit tests for transport layer & proxy error handling
refactor-ss-pdo/refact_192/
├── AUDIT_BUGS.md                # Audit findings documentation
└── REPAIR_REPORT.md             # Implementation report, before vs after, and field scenarios
```

---

### Task 1: Kamus Teks Sentral untuk Penolakan Spreadsheet Tak Terdaftar

**Files:**
- Modify: `src/constants/texts/text_errors.ts:1-28`
- Test: `src/constants/texts/texts.test.ts`

**Interfaces:**
- Produces: `TEXT_ERRORS.UNREGISTERED_SPREADSHEET = 'Dokumen spreadsheet tidak terdaftar dalam rute operasional resmi.'`

- [ ] **Step 1: Write the failing test**

Tambahkan pengujian pada `src/constants/texts/texts.test.ts`:

```typescript
it('exports TEXT_ERRORS.UNREGISTERED_SPREADSHEET for unauthorized spreadsheet error', () => {
  expect(TEXT_ERRORS.UNREGISTERED_SPREADSHEET).toBe(
    'Dokumen spreadsheet tidak terdaftar dalam rute operasional resmi.'
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/constants/texts/texts.test.ts`
Expected: FAIL with `Cannot read property 'UNREGISTERED_SPREADSHEET' of undefined`

- [ ] **Step 3: Write minimal implementation**

Edit `src/constants/texts/text_errors.ts`:

```typescript
export const TEXT_ERRORS = {
  DEFAULT_FALLBACK: 'Terjadi kesalahan sistem yang tidak terduga. Silakan coba beberapa saat lagi.',
  GENERIC_ISSUE: 'Terjadi kendala sistem. Silakan coba beberapa saat lagi atau hubungi admin.',
  NETWORK_FAILURE: 'Koneksi internet Anda terputus. Silakan periksa jaringan dan coba beberapa saat lagi.',
  LOAD_REGIONAL_FAILED: 'Gagal memuat data monitoring wilayah. Silakan periksa koneksi internet Anda dan coba lagi.',
  SCHEMA_MIGRATION_REQUIRED: 'Struktur database memerlukan pembaruan kolom metrik operasional. Silakan terapkan migrasi database terbaru pada Supabase SQL Editor.',
  VERIFY_FAILED: 'Terjadi kesalahan saat memverifikasi laporan rute.',
  SAVE_REPORT_FAILED: 'Terjadi kesalahan saat menyimpan laporan operasional rute.',
  LOAD_DATA_FAILED: 'Gagal memuat data operasional spreadsheet.',
  SESSION_EXPIRED: 'Sesi anda telah berakhir. Ketuk tombol "Perbarui Sesi" untuk melanjutkan.',
  SHEET_NOT_FOUND: 'Data tab spreadsheet untuk periode ini tidak ditemukan.',
  UNREGISTERED_SPREADSHEET: 'Dokumen spreadsheet tidak terdaftar dalam rute operasional resmi.',
  EMPTY_QUEUE: 'Tidak ada item antrean yang perlu disinkronkan.',
  PERMISSION_DENIED_FILE: 'Gagal mengakses Google Sheets (Hak Akses Ditolak). Akun Google Anda tidak memiliki akses ke dokumen ini. Pastikan dokumen telah dibagikan (share) ke akun Anda.',
  PERMISSION_DENIED_GENERAL: 'Gagal mengakses Google Sheets. Pastikan akun Anda memiliki hak akses ke dokumen tersebut.',
  CONFIG_MISSING: 'Layanan belum siap dikonfigurasi. Silakan hubungi admin operasional.',
  AUTH_TIMEOUT: 'Koneksi ke layanan autentikasi terganggu atau membutuhkan waktu lebih lama. Silakan coba lagi.',
  COLUMN_MISMATCH: 'Format kolom pada tabel Google Sheets tidak sesuai. Mohon periksa kembali dokumen Anda.',
  EMPTY_SHEET: 'Tidak ditemukan data pada lembar kerja ini.',
  ROUTE_VALIDATION: {
    CODE_REQUIRED: 'Kode Rute wajib diisi (misal: JAK.76).',
    CODE_FORMAT: 'Format Kode Rute tidak valid. Wajib diawali "JAK." diikuti angka/huruf (contoh: JAK.115, JAK.76, JAK.78A).',
    URL_REQUIRED: 'Link Google Sheets wajib diisi.',
    URL_INVALID: 'Link Google Sheets tidak valid. Pastikan Anda menyalin link spreadsheet Google Sheets yang benar.',
  },
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/constants/texts/texts.test.ts`
Expected: PASS (all tests pass)

- [ ] **Step 5: Commit**

```bash
git add src/constants/texts/text_errors.ts src/constants/texts/texts.test.ts
git commit -m "feat: add UNREGISTERED_SPREADSHEET error text"
```

---

### Task 2: Implementasi Whitelist Database, In-Memory Caching, dan Pengerasan CORS pada `sheets-proxy`

**Files:**
- Modify: `supabase/functions/sheets-proxy/index.ts`

**Interfaces:**
- Consumes: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `public.route_sheets(spreadsheet_id)`
- Produces: Whitelist validation check `isSpreadsheetAllowed(spreadsheetId)`, CORS origin restriction `getCorsHeaders(req)`, and payload integrity checking for write actions.

- [ ] **Step 1: Inspect and update imports & CORS in `supabase/functions/sheets-proxy/index.ts`**

Ganti `import "@supabase/functions-js/edge-runtime.d.ts";` dengan runtime standar dan import Supabase client:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
  ];

  const isAllowed =
    !origin ||
    allowedOrigins.includes(origin) ||
    origin.endsWith(".vercel.app") ||
    origin.endsWith(".supabase.co") ||
    (Deno.env.get("ALLOWED_ORIGIN") && origin === Deno.env.get("ALLOWED_ORIGIN"));

  return {
    "Access-Control-Allow-Origin": isAllowed ? (origin || "*") : "https://sspdo.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-google-token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
```

- [ ] **Step 2: Implement In-Memory Whitelist Cache & Validation Logic**

Tambahkan fungsi pemeriksaan whitelist di `supabase/functions/sheets-proxy/index.ts`:

```typescript
interface WhitelistCache {
  allowedSpreadsheetIds: Set<string>;
  lastFetched: number;
}

let whitelistCache: WhitelistCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit

function getSupabaseAdmin() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function isSpreadsheetAllowed(spreadsheetId: string): Promise<boolean> {
  const trimmedId = spreadsheetId.trim();
  const now = Date.now();

  // 1. Cek in-memory cache jika masih segar (< 5 menit)
  if (whitelistCache && now - whitelistCache.lastFetched < CACHE_TTL_MS) {
    if (whitelistCache.allowedSpreadsheetIds.has(trimmedId)) {
      return true;
    }
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error("[SheetsProxy] Supabase Admin client gagal diinisialisasi (SUPABASE_URL atau SERVICE_ROLE_KEY tidak ada)");
    return false;
  }

  // 2. Jika cache kosong atau kedaluwarsa, segarkan dari database route_sheets
  if (!whitelistCache || now - whitelistCache.lastFetched >= CACHE_TTL_MS) {
    const { data, error } = await supabase
      .from("route_sheets")
      .select("spreadsheet_id");

    if (!error && Array.isArray(data)) {
      const idSet = new Set<string>();
      for (const row of data) {
        if (typeof row.spreadsheet_id === "string" && row.spreadsheet_id.trim()) {
          idSet.add(row.spreadsheet_id.trim());
        }
      }
      whitelistCache = {
        allowedSpreadsheetIds: idSet,
        lastFetched: now,
      };

      if (whitelistCache.allowedSpreadsheetIds.has(trimmedId)) {
        return true;
      }
    } else {
      console.warn("[SheetsProxy] Gagal memuat whitelist dari route_sheets:", error?.message);
    }
  }

  // 3. Fallback cache-miss (jika rute baru saja didaftarkan beberapa detik lalu)
  const { data: singleMatch, error: singleError } = await supabase
    .from("route_sheets")
    .select("id")
    .eq("spreadsheet_id", trimmedId)
    .limit(1)
    .maybeSingle();

  if (!singleError && singleMatch) {
    if (whitelistCache) {
      whitelistCache.allowedSpreadsheetIds.add(trimmedId);
    }
    return true;
  }

  return false;
}
```

- [ ] **Step 3: Integrate Whitelist & Payload Validation into Request Handler**

Perbarui blok penanganan request pada `Deno.serve(async (req: Request) => { ... })`:

1. Menangani OPTIONS dengan `getCorsHeaders(req)`.
2. Pada aksi non-health:
   - Validasi `authHeader`: `req.headers.get("authorization") || req.headers.get("apikey")`.
   - Validasi format regex `spreadsheetId`.
   - Validasi whitelist:
     ```typescript
     const isAllowed = await isSpreadsheetAllowed(spreadsheetId);
     if (!isAllowed) {
       return new Response(
         JSON.stringify({
           error: "Akses ditolak: Spreadsheet ID tidak terdaftar dalam rute operasional resmi.",
           code: "SPREADSHEET_NOT_ALLOWED",
         }),
         { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
     ```
3. Validasi payload mutasi:
   - Untuk `values.batchUpdate`: pastikan `payload` berupa objek dan memiliki properti `data` berupa array.
   - Untuk `batchUpdate`: pastikan `payload` berupa objek dan memiliki properti `requests` berupa array.

- [ ] **Step 4: Verify syntax & types of Edge Function**

Jalankan pemeriksaan lokal (atau deno lint jika terpasang):
Run: `pnpm run build`
Expected: PASS (tidak mengganggu build proyek).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/sheets-proxy/index.ts
git commit -m "feat: add whitelist & CORS to sheets-proxy"
```

---

### Task 3: Deploy Edge Function `sheets-proxy` ke Supabase

**Files:**
- Deploy: `supabase/functions/sheets-proxy/`

- [ ] **Step 1: Deploy Edge Function via Supabase CLI**

Run: `npx supabase functions deploy sheets-proxy --no-verify-jwt`
Expected: `Deployed Function sheets-proxy on project ss-pdo (sejttnsanzogsykmtwym)`

- [ ] **Step 2: Verify live health endpoint**

Run curl/powershell web request ke live endpoint:
Run: `(Invoke-RestMethod -Uri "https://sejttnsanzogsykmtwym.supabase.co/functions/v1/sheets-proxy" -Method Post -Body '{"action":"health"}' -ContentType "application/json" -Headers @{ "apikey" = "sbp_..." })`
Expected: `{ ok: true, configured: true, client_email: "..." }`

---

### Task 4: Pembaruan & Penambahan Unit Test Transport Adapter

**Files:**
- Modify: `src/services/googleSheets/transport.ts`
- Modify: `src/services/googleSheets/transport.test.ts`

**Interfaces:**
- Tests that `fetchSpreadsheetMeta`, `fetchSheetValues`, `fetchSheetValuesBatch`, and `updateSheetValuesBatch` handle `SPREADSHEET_NOT_ALLOWED` gracefully and throw human-friendly error messages.

- [ ] **Step 1: Write test for SPREADSHEET_NOT_ALLOWED in `transport.test.ts`**

Tambahkan skenario pengujian penolakan spreadsheet yang tidak terdaftar:

```typescript
it('throws friendly error when sheets-proxy returns SPREADSHEET_NOT_ALLOWED (403)', async () => {
  (supabase.functions.invoke as any).mockImplementation((_fnName: string, options: any) => {
    if (options.body.action === 'health') {
      return Promise.resolve({ data: { ok: true, configured: true }, error: null });
    }
    return Promise.resolve({
      data: {
        error: 'Akses ditolak: Spreadsheet ID tidak terdaftar dalam rute operasional resmi.',
        code: 'SPREADSHEET_NOT_ALLOWED',
      },
      error: null,
    });
  });

  await expect(fetchSpreadsheetMeta('unregistered_sheet_id')).rejects.toThrow(
    'Akses ditolak: Spreadsheet ID tidak terdaftar dalam rute operasional resmi.'
  );
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `pnpm vitest run src/services/googleSheets/transport.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/services/googleSheets/transport.test.ts
git commit -m "test: add SPREADSHEET_NOT_ALLOWED test"
```

---

### Task 5: Dokumentasi Audit & Refactor Report (`refactor-ss-pdo/refact_192`)

**Files:**
- Create: `refactor-ss-pdo/refact_192/AUDIT_BUGS.md`
- Create: `refactor-ss-pdo/refact_192/REPAIR_REPORT.md`

- [ ] **Step 1: Create `AUDIT_BUGS.md`**

Dokumentasikan temuan:
- ID: `SEC-192-01`
- Lokasi: `supabase/functions/sheets-proxy/index.ts`
- Keparahan: High / Broken Access Control
- Deskripsi: `sheets-proxy` hanya memeriksa keberadaan header otorisasi tanpa validasi ID spreadsheet yang diizinkan, CORS terbuka ke semua origin, dan tidak ada pembatasan muatan mutasi.
- Dampak pengguna & sistem: Potensi penyalahgunaan Google Service Account untuk membaca/menulis spreadsheet di luar rute resmi jika anon key diketahui.
- Mitigasi: Validasi `spreadsheetId` terhadap tabel `public.route_sheets` dengan in-memory cache (TTL 5 menit), pengetatan CORS ke origin resmi, dan validasi payload tulis.

- [ ] **Step 2: Create `REPAIR_REPORT.md`**

Dokumentasikan:
- Before vs After implementasi.
- Arsitektur in-memory cache dan fallback database.
- Skenario kasus lapangan (petugas operasional resmi vs akses tak berizin).

- [ ] **Step 3: Commit**

```bash
git add refactor-ss-pdo/refact_192/
git commit -m "docs: add Refactor 192 audit & repair report"
```

---

### Task 6: Verifikasi Menyeluruh & Quality Gates

**Files:**
- Check: Seluruh test suite dan build

- [ ] **Step 1: Run Color Contract Test**

Run: `pnpm vitest run src/styles/tokens/color-contract.test.ts`
Expected: 100% PASS (116/116 tests)

- [ ] **Step 2: Run Entire Vitest Test Suite**

Run: `pnpm vitest run src/`
Expected: 100% PASS (all test files pass, 0 failure)

- [ ] **Step 3: Run Production Build**

Run: `pnpm run build`
Expected: TypeScript Strict Mode (`tsc -b`) and Vite build pass with 0 errors.

- [ ] **Step 4: Update Graphify Knowledge Graph**

Run: `graphify update .`
Expected: Graph updated cleanly.

---
