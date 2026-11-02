# sheet-sync-webhook Authentication & Anti-Spam Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Secure the `sheet-sync-webhook` Supabase Edge Function by validating caller credentials (`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `SHEET_SYNC_WEBHOOK_SECRET`), enforcing origin-restricted CORS, and applying in-flight concurrency guards and a 3-second anti-spam cooldown per route, preventing denial-of-service and quota exhaustion while preserving seamless realtime synchronization.

**Architecture:** The Edge Function `sheet-sync-webhook` receives synchronization triggers from the frontend web application and the centralized Google Apps Script project (`CentralizedMasterRealtimeSync.js`). The function enforces a multi-layer guard: (1) authenticating requests via `apikey` / `Authorization: Bearer <token>` or `x-webhook-secret`, rejecting unauthorized public requests with HTTP 401; (2) enforcing an in-memory 3,000 ms cooldown and in-flight deduplication per route and date to protect the Google Sheets API quota (60 req/min); (3) restricting CORS headers to authorized application origins; and (4) safely updating `daily_route_reports` via the server Service Role Key.

**Tech Stack:**
- Deno / TypeScript (Supabase Edge Runtime)
- Supabase Client (`@supabase/supabase-js@2.39.8`)
- Google Sheets API v4 (Service Account Web Crypto RS256)
- Vitest / TypeScript for frontend sync service testing
- Google Apps Script (JavaScript)

---

## Global Constraints

- **Strict devmode branch:** All modifications and commits MUST remain on branch `devmode`. Never touch or push to `main`.
- **Zero hardcoded colors:** All UI and error styling must use `src/styles/tokens/semantic.css`.
- **Central text dictionary:** All UI and user-facing messages must be defined in `src/constants/texts/`.
- **Formula preservation (SSOT):** No modifications may overwrite Google Sheets formula columns.
- **Mobile-first & Zero Disruption:** Field officers saving bus data in the web app or editing Google Sheets must experience zero interruption and no additional latency.
- **Audit documentation:** Comprehensive audit findings and repair report must be documented in `refactor-ss-pdo/refact_193/` (`AUDIT_BUGS.md` and `REPAIR_REPORT.md`).

---

## File Structure

```
supabase/functions/sheet-sync-webhook/
├── index.ts                                             # Edge Function: Auth, CORS, in-flight cooldown, sheet ingestion
src/services/
├── realtimeSyncService.ts                               # Frontend service: Attaches apikey & Authorization header
└── realtimeSyncService.test.ts                          # Unit test: Asserts apikey and Authorization header on fetch
scripts/google-apps-script/
└── CentralizedMasterRealtimeSync.js                     # Master GAS: Attaches apikey & Authorization header on UrlFetchApp
refactor-ss-pdo/refact_193/
├── AUDIT_BUGS.md                                        # Audit findings documentation
└── REPAIR_REPORT.md                                     # Implementation report, before vs after, and field scenarios
```

---

### Task 1: Pengerasan Header Autentikasi Frontend `realtimeSyncService.ts`

**Files:**
- Modify: `src/services/realtimeSyncService.ts:61-75`
- Test: `src/services/realtimeSyncService.test.ts:51-76`

**Interfaces:**
- Consumes: `import.meta.env.VITE_SUPABASE_ANON_KEY`
- Produces: Header `apikey` dan `Authorization: Bearer <VITE_SUPABASE_ANON_KEY>` pada payload `fetch(WEBHOOK_URL, ...)`

- [ ] **Step 1: Write the failing test**

Perbarui pengujian pada `src/services/realtimeSyncService.test.ts`:

```typescript
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('sheet-sync-webhook'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'apikey': expect.any(String),
          'Authorization': expect.stringContaining('Bearer '),
        }),
        body: JSON.stringify({ routeCode: 'JAK.60', date: '2026-10-24' }),
      })
    );
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/services/realtimeSyncService.test.ts`
Expected: FAIL with `expected headers to contain apikey`

- [ ] **Step 3: Write minimal implementation**

Perbarui fungsi `executeSync` pada `src/services/realtimeSyncService.ts`:

```typescript
async function executeSync(key: string, routeCode: string, date?: string): Promise<void> {
  const entry = syncEntries.get(key);
  syncEntries.delete(key);

  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(anonKey
          ? {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
            }
          : {}),
      },
      body: JSON.stringify({
        routeCode,
        date,
      }),
    });
  } catch (err) {
    console.warn('[RealtimeSync] Gagal memicu Edge Function sheet-sync-webhook:', err);
  } finally {
    if (entry) {
      entry.resolvers.forEach((res) => {
        try {
          res();
        } catch {}
      });
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/services/realtimeSyncService.test.ts`
Expected: PASS (all tests in `realtimeSyncService.test.ts` pass)

- [ ] **Step 5: Commit**

```bash
git add src/services/realtimeSyncService.ts src/services/realtimeSyncService.test.ts
git commit -m "feat: add auth headers to realtimeSyncService"
```

---

### Task 2: Implementasi Autentikasi, Anti-Spam Cooldown, dan CORS pada `sheet-sync-webhook`

**Files:**
- Modify: `supabase/functions/sheet-sync-webhook/index.ts`

**Interfaces:**
- Consumes: `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SHEET_SYNC_WEBHOOK_SECRET`
- Produces: `isAuthorizedRequest(req)` (HTTP 401 guard), `getCorsHeaders(req)`, dan `routeCooldowns` (HTTP 200 early-return pada duplicate requests < 3s).

- [ ] **Step 1: Implement Dynamic CORS & Auth Validator Helper**

Tambahkan fungsi pembantu di `supabase/functions/sheet-sync-webhook/index.ts`:

```typescript
function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4173",
  ];

  const isAllowed =
    !origin ||
    allowedOrigins.includes(origin) ||
    origin.endsWith(".vercel.app") ||
    origin.endsWith(".supabase.co") ||
    (Deno.env.get("ALLOWED_ORIGIN") && origin === Deno.env.get("ALLOWED_ORIGIN"));

  return {
    "Access-Control-Allow-Origin": isAllowed ? (origin || "*") : "https://sspdo.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function isAuthorizedRequest(req: Request): boolean {
  const rawAuth = req.headers.get("authorization") || "";
  const rawApiKey = req.headers.get("apikey") || "";
  const rawSecret = req.headers.get("x-webhook-secret") || "";

  const expectedAnonKey = (Deno.env.get("SUPABASE_ANON_KEY") || "").trim();
  const expectedServiceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();
  const expectedSecret = (Deno.env.get("SHEET_SYNC_WEBHOOK_SECRET") || "").trim();

  // 1. Cek x-webhook-secret jika dikonfigurasi
  if (expectedSecret && rawSecret && rawSecret.trim() === expectedSecret) {
    return true;
  }

  // 2. Cek apikey header
  if (rawApiKey) {
    const cleanKey = rawApiKey.trim();
    if ((expectedAnonKey && cleanKey === expectedAnonKey) || (expectedServiceKey && cleanKey === expectedServiceKey)) {
      return true;
    }
  }

  // 3. Cek authorization Bearer header
  if (rawAuth.startsWith("Bearer ")) {
    const token = rawAuth.slice(7).trim();
    if (
      (expectedAnonKey && token === expectedAnonKey) ||
      (expectedServiceKey && token === expectedServiceKey) ||
      (expectedSecret && token === expectedSecret)
    ) {
      return true;
    }
  }

  return false;
}
```

- [ ] **Step 2: Implement In-Flight Deduplication & Cooldown Map**

Tambahkan tracker status in-flight dan jeda 3 detik per rute + tanggal:

```typescript
const inFlightSyncs = new Set<string>();
const routeCooldowns = new Map<string, number>();
const COOLDOWN_MS = 3000; // 3 detik per rute
```

- [ ] **Step 3: Integrate Guards into Request Handler**

Perbarui fungsi `Deno.serve(async (req: Request) => { ... })`:
1. Tangani `OPTIONS` menggunakan `getCorsHeaders(req)`.
2. Validasi autentikasi:
   ```typescript
   if (!isAuthorizedRequest(req)) {
     return new Response(
       JSON.stringify({ error: "Otorisasi tidak valid atau tidak disertakan", code: "UNAUTHORIZED" }),
       { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
   ```
3. Cek in-flight dan cooldown setelah mendapatkan `normalizedCode` dan `targetDateStr`:
   ```typescript
   const syncKey = `${normalizedCode}_${targetDateStr}`;
   const now = Date.now();

   if (inFlightSyncs.has(syncKey)) {
     return new Response(
       JSON.stringify({
         ok: true,
         message: `Sinkronisasi rute ${normalizedCode} untuk ${targetDateStr} sedang berjalan di server.`,
         skipped: true,
       }),
       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }

   const lastSyncTime = routeCooldowns.get(syncKey) || 0;
   if (now - lastSyncTime < COOLDOWN_MS) {
     return new Response(
       JSON.stringify({
         ok: true,
         message: `Sinkronisasi rute ${normalizedCode} baru saja diproses. Cooldown aktif.`,
         skipped: true,
       }),
       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
   ```
4. Bungkus eksekusi Google Sheets fetch dan database upsert dalam blok `try ... finally` untuk mengelola `inFlightSyncs` dan memperbarui `routeCooldowns`.

- [ ] **Step 4: Verify syntax & build**

Run: `pnpm run build`
Expected: PASS (build 0 error).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/sheet-sync-webhook/index.ts
git commit -m "feat: add auth, cooldown & CORS to sheet-sync-webhook"
```

---

### Task 3: Deploy Edge Function `sheet-sync-webhook` ke Supabase

**Files:**
- Deploy: `supabase/functions/sheet-sync-webhook/`

- [ ] **Step 1: Deploy Edge Function via Supabase CLI**

Run: `npx supabase functions deploy sheet-sync-webhook --no-verify-jwt`
Expected: `Deployed Function sheet-sync-webhook on project ss-pdo (sejttnsanzogsykmtwym)`

- [ ] **Step 2: Verify live endpoint with unauthorized and authorized requests**

1. Uji request tanpa header otorisasi:
   - Expected: HTTP 401 Unauthorized (`code: "UNAUTHORIZED"`).
2. Uji request dengan header `apikey: <SUPABASE_ANON_KEY>` dan route terdaftar:
   - Expected: HTTP 200 OK (`ok: true`).
3. Uji request beruntun dalam rentang 1 detik:
   - Expected: Request kedua mengembalikan HTTP 200 dengan `skipped: true` (cooldown aktif).

---

### Task 4: Pembaruan Skrip Master Google Apps Script

**Files:**
- Modify: `scripts/google-apps-script/CentralizedMasterRealtimeSync.js:240-258`

**Interfaces:**
- Consumes: `SUPABASE_ANON_KEY`
- Produces: `headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": "Bearer " + SUPABASE_ANON_KEY }` pada panggilan `UrlFetchApp.fetch(WEBHOOK_URL, ...)`

- [ ] **Step 1: Update UrlFetchApp options in `handleMultiSheetEdit`**

Perbarui pemanggilan `UrlFetchApp.fetch(WEBHOOK_URL, ...)` di baris 248:

```javascript
    const options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
```

- [ ] **Step 2: Commit**

```bash
git add scripts/google-apps-script/CentralizedMasterRealtimeSync.js
git commit -m "feat: add auth headers to master GAS sync"
```

---

### Task 5: Dokumentasi Audit & Refactor Report (`refactor-ss-pdo/refact_193`)

**Files:**
- Create: `refactor-ss-pdo/refact_193/AUDIT_BUGS.md`
- Create: `refactor-ss-pdo/refact_193/REPAIR_REPORT.md`

- [ ] **Step 1: Create `AUDIT_BUGS.md`**

Dokumentasikan temuan:
- ID: `SEC-193-01`
- Lokasi: `supabase/functions/sheet-sync-webhook/index.ts`
- Keparahan: High / Broken Access Control & Unthrottled Resource Consumption
- Deskripsi: Webhook menggunakan `SUPABASE_SERVICE_ROLE_KEY` tanpa verifikasi header/secret pemanggil, CORS terbuka ke semua origin, dan tidak ada pembatasan frekuensi eksekusi (rawan DoS kuota Google Sheets API 60 req/min).
- Mitigasi: Validasi `apikey` / `Authorization` / `x-webhook-secret`, pembatasan CORS origin, dan *In-Flight Anti-Spam Cooldown (3 detik per rute)*.

- [ ] **Step 2: Create `REPAIR_REPORT.md`**

Dokumentasikan implementasi:
- Before vs After.
- Arsitektur pengamanan multi-lapis.
- Skenario kasus lapangan (input bus di frontend, edit sel di Google Sheets, dan percobaan DoS pihak luar).

- [ ] **Step 3: Commit**

```bash
git add refactor-ss-pdo/refact_193/
git commit -m "docs: add Refactor 193 audit & repair report"
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
