# LAPORAN IMPLEMENTASI PERBAIKAN ARSITEKTUR LOGIN & GOOGLE SHEETS ACCESS (REFACTOR 11)

Dokumen ini menjelaskan implementasi perbaikan hasil audit **Refactor 11: Migrasi Opsi A (Google Service Account Proxy via Supabase Edge Function & Sesi Permanen)** pada aplikasi **SS_PDO**. Seluruh perbaikan dirancang untuk mengeliminasi batasan sesi 1 jam, menyelaraskan alur dengan **Aturan Emas #3 (Sesi Login Permanen Tanpa Timeout)**, dan memberikan pengalaman pengguna (*mobile-first*) yang mulus di lapangan.

---

## 1. AUTH-11-01: Deployment Supabase Edge Function `sheets-proxy` (Opsi A)

- **Lokasi:** `supabase/functions/sheets-proxy/index.ts`, `supabase/functions/sheets-proxy/deno.json`
- **Sebelum Perbaikan:** Seluruh operasi baca/tulis Google Sheets (`spreadsheets.get`, `values.get`, `values.batchGet`, `values.batchUpdate`, `batchUpdate`) dipanggil langsung dari peramban ponsel pengguna menggunakan Google OAuth token client-side yang kedaluwarsa mati setiap 60 menit.
- **Sesudah Perbaikan:** Dibuat dan dideploy Supabase Edge Function `sheets-proxy` (berstatus `ACTIVE`) di proyek Supabase `ss-pdo` (`sejttnsanzogsykmtwym`). Edge Function ini:
  1. Menggunakan kredensial Google Cloud Service Account (`GOOGLE_SERVICE_ACCOUNT_KEY`).
  2. Melakukan penandatanganan RS256 JWT secara native (Web Crypto API) dan pertukaran token otomatis dengan Google OAuth2 token endpoint.
  3. Menyimpan token di memori instance dengan refresh otomatis tanpa intervensi pengguna.
  4. Mendukung endpoint health-check (`{ action: 'health' }`) untuk deteksi otomatis status konfigurasi.
- **Before vs After:**
  ```ts
  // BEFORE (Browser Client OAuth):
  await (gapi.client as any).sheets.spreadsheets.values.batchUpdate({...}); // Wajib token user yang expired tiap 1 jam

  // AFTER (Server-to-Server Service Account):
  await supabase.functions.invoke('sheets-proxy', {
    body: { action: 'values.batchUpdate', spreadsheetId, payload }
  }); // Berjalan otomatis selamanya tanpa timeout
  ```
- **Case / Skenario Lapangan:** Petugas pencatat di terminal bus yang sedang menginput data ritase jam ke-2 atau ke-3 tidak lagi mengalami kegagalan simpan akibat token Google expired. Operasi penulisan spreadsheet diproses oleh Service Account yang selalu aktif.

---

## 2. AUTH-11-02: Isolasi & Pembuatan Transport Adapter Terpadu (`transport.ts`)

- **Lokasi:** `src/services/googleSheets/transport.ts`, `src/services/googleSheets/transport.test.ts`
- **Sebelum Perbaikan:** Logika pemanggilan `(gapi.client as any).sheets` tersebar di seluruh `core.ts`, `mutations.ts`, dan `analytics.ts`. Jika token expired, pemanggilan gagal dan memicu event error.
- **Sesudah Perbaikan:** Dibuat modul adapter `transport.ts` yang mengimplementasikan *Dual-Mode Pattern*:
  - **Jalur Utama:** Otomatis mendeteksi dan memprioritaskan Service Account proxy via Edge Function.
  - **Jalur Fallback:** Jika proxy belum terkonfigurasi, otomatis melakukan *fallback* ke `gapi.client` dengan proteksi token dan *zero downtime*.
- **Before vs After:**
  ```ts
  // BEFORE: Tersebar pemanggilan gapi langsung
  const res = await (gapi.client as any).sheets.spreadsheets.get({ spreadsheetId, fields });

  // AFTER: Terabstraksi terpusat dengan deteksi proxy cerdas
  const res = await fetchSpreadsheetMeta(sheetId, fields);
  ```
- **Case / Skenario Lapangan:** Saat konfigurasi Service Account di Supabase Secrets sedang disiapkan, aplikasi tetap dapat berjalan normal dan tidak mengalami *crash* atau *downtime*.

---

## 3. AUTH-11-03: Refactor Lifecycle Sesi Permanen & Pembersihan Timer (`auth.ts`)

- **Lokasi:** `src/services/googleSheets/auth.ts`
- **Sebelum Perbaikan:** Terdapat timer `startTokenRefreshTimer()` yang berjalan setiap 55 menit mencoba meminta token diam-diam (`prompt: ''`), yang kemudian gagal akibat pemblokiran cookie pihak ketiga peramban dan memicu pop-up blocker.
- **Sesudah Perbaikan:**
  1. `checkSignedInAsync()` kini memeriksa ketersediaan Service Account. Pada mode Service Account, sesi login dinyatakan `authenticated: true` secara permanen tanpa pernah mengembalikan status `needs_reauth`.
  2. `startTokenRefreshTimer()` dinonaktifkan saat mode Service Account aktif, menghemat siklus komputasi dan mencegah panggilan latar belakang yang sia-sia.
  3. `withAuthRetry` tidak lagi memblokir eksekusi saat menggunakan Service Account.
- **Before vs After:**
  ```ts
  // BEFORE:
  if (tokenObj.expiresAt && tokenObj.expiresAt < Date.now()) {
    return { authenticated: true, reason: 'needs_reauth' }; // Memicu banner merah
  }

  // AFTER:
  const proxy = await checkProxyHealth();
  if (proxy.active) {
    return { authenticated: true }; // 100% Permanen sesuai Aturan Emas #3
  }
  ```
- **Case / Skenario Lapangan:** Pengawas atau petugas yang membuka aplikasi keesokan harinya (*cold start*) langsung mendapati antarmuka dashboard siap digunakan tanpa harus login ulang atau menyetujui pop-up berulang kali.

---

## 4. AUTH-11-04: Eliminasi Banner Merah Kedaluwarsa di UI Dashboard (`Dashboard.tsx`)

- **Lokasi:** `src/components/Dashboard.tsx`
- **Sebelum Perbaikan:** Terdapat banner merah intimidatif dengan pesan: *"Sesi Google Sheets kedaluwarsa. Ketuk tombol untuk perbarui sesi."* yang menempati ruang vertikal berharga di layar ponsel dan mengaburkan data bus harian.
- **Sesudah Perbaikan:** Banner merah tersebut diisolasi sehingga tidak akan pernah muncul saat mode Service Account aktif (`!isUsingServiceAccount() && isAuthExpired`).
- **Before vs After:**
  ```tsx
  // BEFORE:
  {isAuthExpired && (
    <div style={{ background: "var(--danger-color, #ef4444)" ... }}>
      Sesi Google Sheets kedaluwarsa...
    </div>
  )}

  // AFTER:
  {!isUsingServiceAccount() && isAuthExpired && (
    <div style={{ background: "var(--danger-color, #ef4444)" ... }}>
      Sesi Google Sheets kedaluwarsa...
    </div>
  )}
  ```
- **Case / Skenario Lapangan:** Antarmuka dashboard di ponsel petugas selalu bersih, lapang, dan siap menerima input nomor body, ritase, dan kilometer tanpa gangguan elemen peringatan teknis yang tidak perlu.

---

## 5. AUTH-11-05: Migrasi Menyeluruh Seluruh Layanan Data (`core.ts`, `mutations.ts`, `analytics.ts`)

- **Lokasi:**
  - `src/services/googleSheets/core.ts` (`getTabGid`, `getBusData`, `getBusRowData`)
  - `src/services/googleSheets/mutations.ts` (`updateBusData`, `updateBulkBusData`, `formatWholeSheet`)
  - `src/services/googleSheets/analytics.ts` (`getMonthlyToaTrend`, `getAccumulatedBusData`, `inspectSpreadsheetHeader`)
  - `src/services/googleSheets/index.ts`
- **Sebelum Perbaikan:** 100% pemanggilan Sheets REST API terikat secara kaku pada instance global `gapi.client`.
- **Sesudah Perbaikan:** Seluruh 5 metode Sheets API (`spreadsheets.get`, `values.get`, `values.batchGet`, `values.batchUpdate`, `batchUpdate`) telah dialihkan 100% melalui `transport.ts` (*Zero Call-Site Left Behind* sesuai Aturan 9.1).
- **Case / Skenario Lapangan:** Seluruh proses baca data, simpan single-cell, simpan bulk dari antrean offline, pewarnaan baris otomatis sesuai status bus (BA, NP, Reguler), dan grafik analitik bulanan berjalan secara konsisten melalui saluran Service Account yang cepat dan andal.

---

## 6. Hasil Pengujian & Quality Gates

1. **Status Edge Function `sheets-proxy`:**
   - Status: `ACTIVE` (Version 4).
   - Health Check: `{ ok: true, configured: true, client_email: 'pusm-service-google-acc@ss-pdo.iam.gserviceaccount.com' }`.
   - Real Data Test: Berhasil membaca metadata spreadsheet `1Z5uB5HbeAKcHmG4EOw3rf2J8NpyvDiha6RReERAMvA0` (`JAK.117_SEPTEMBER_2026`) dan data rentang cell `1!A1:B5` dengan Google Sheets REST API v4.
2. **Unit Tests Vitest:**
   - 23 test suites, 205 unit tests **PASS 100%** (`pnpm vitest run src/`).
3. **Build & Typecheck:**
   - `tsc -b` dan `vite build` **0 error** (PWA assets & service worker ter-generate sempurna).
4. **Knowledge Graph:**
   - `graphify update .` **berhasil terbarukan** (2298 nodes, 3121 edges).
