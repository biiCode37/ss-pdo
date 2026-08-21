# 🔍 Audit Temuan Masalah — SS_PDO Refactor 6

> **Tanggal Audit:** 21 Agustus 2026
> **Auditor:** AntiGravity AI
> **Cakupan:** Seluruh source code `src/`, konfigurasi, dan infrastruktur (kecuali `graphify-out/`)

---

## Klasifikasi Severitas

| Level | Deskripsi |
|-------|-----------|
| 🔴 **CRITICAL** | Bug yang langsung terasa oleh user atau bisa merusak data |
| 🟠 **HIGH** | Masalah serius yang mempengaruhi reliabilitas atau UX |
| 🟡 **MEDIUM** | Kekurangan yang mempengaruhi maintainability atau edge case |
| 🟢 **LOW** | Improvement yang disarankan tapi tidak urgent |

---

## A. SERVICE LAYER — `googleSheets.ts` (1832 baris, GOD FILE)

### R6-001 🔴 CRITICAL — God File: `googleSheets.ts` Terlalu Besar & Campur Aduk
- **File:** `src/services/googleSheets.ts`
- **Masalah:** File ini 1832 baris, mencampur:
  - Auth management (signIn, signOut, token refresh, ensureValidToken)
  - Data fetching (getBusData, getMonthlyToaTrend, getAccumulatedBusData)
  - Data mutation (updateBusData, updateBulkBusData, formatWholeSheet)
  - Header parsing logic (detectHeaderRowAndBuildComposite, findColumnIndex)
  - Spreadsheet inspection (inspectSpreadsheetHeader)
  - Re-export utilities (parseIndonesianNumber, getKeteranganColor, getRowEndCol)
  - Cache management (monthlyToaTrendCache, tabGidCache)
- **Dampak User:** Tidak langsung, tapi membuat maintenance berbahaya — satu perubahan kecil di auth bisa merusak data fetching. Meningkatkan risiko regresi.

### R6-002 🔴 CRITICAL — Race Condition: `signIn()` Resolve Sebelum `userinfo` Fetch Selesai
- **File:** `src/services/googleSheets.ts:41-70`
- **Masalah:** Di callback `initTokenClient`, flow userinfo fetch adalah fire-and-forget `.then()`. Event `google-login-success` di-dispatch di dalam `.then()`, tapi `signIn()` mendengarkan event ini via `handleSuccess`. **Jika `.then()` lambat** (koneksi buruk di lapangan), ada race condition di mana:
  1. Token sudah valid → user dianggap sudah login
  2. Tapi `PDO_USER_EMAIL` belum tersimpan di localStorage
  3. `LoginScreen.handleLogin()` membaca `PDO_USER_EMAIL` yang masih kosong
- **Dampak User:** Login berhasil tapi verifikasi profil gagal karena email kosong → user ditendang kembali ke login screen. **Sudah ada mitigasi parsial** tapi masih rapuh.

### R6-003 🟠 HIGH — `logActivity` di `signIn()` Membaca Email yang Mungkin Stale
- **File:** `src/services/googleSheets.ts:76-81`
- **Masalah:** `logActivity` dipanggil di baris 76-81 **sebelum** `.then()` userinfo selesai. Jadi `PDO_USER_EMAIL` bisa saja belum di-update dari login sebelumnya (atau masih `google_user`).
- **Dampak User:** Activity log tidak akurat — user yang berbeda bisa tercatat dengan email user sebelumnya.

### R6-004 🟠 HIGH — `signIn()` Selalu `prompt: 'consent'` — UX Buruk untuk Re-login
- **File:** `src/services/googleSheets.ts:145`
- **Masalah:** `tokenClient.requestAccessToken({ prompt: 'consent' })` memaksa user **selalu** melihat layar persetujuan Google, bahkan saat hanya perlu re-login. Ini berbeda dengan `reauthenticateSession()` yang tanpa prompt.
- **Dampak User:** UX lambat dan mengganggu — setiap login fresh memaksa 2 klik consent.

### R6-005 🟠 HIGH — `refreshTokenInteractiveOrSilent` Error Handler Resolve Tanpa Reject
- **File:** `src/services/googleSheets.ts:255-266`
- **Masalah:** Di `handleError`, saat `silentOnly=false`, kode mencoba `requestAccessToken({ prompt: 'consent' })` tapi langsung `resolve()` tanpa menunggu hasil consent kedua. Ini berarti:
  1. Fungsi mengembalikan `void` (sukses)
  2. Tapi token belum tentu diperbarui
- **Dampak User:** `ensureValidToken()` selesai tanpa error, tapi token tetap expired. API call berikutnya gagal dengan error yang membingungkan.

### R6-006 🟡 MEDIUM — `checkSignedIn()` (Sync) vs `checkSignedInAsync()` — Duplikasi Logik
- **File:** `src/services/googleSheets.ts:367-450`
- **Masalah:** Dua fungsi dengan logika hampir identik tapi perilaku berbeda. `checkSignedIn()` sudah tidak dipakai di manapun (hanya `checkSignedInAsync` yang dipakai di `App.tsx`). Dead code.
- **Dampak User:** Tidak langsung, tapi membingungkan developer dan berisiko salah pakai.

### R6-007 🔴 CRITICAL — `getMonthlyToaTrend` Kembalikan Dummy Data Saat Error
- **File:** `src/services/googleSheets.ts:1598-1608`
- **Masalah:** Saat batch API call gagal (misal error jaringan bukan auth), fungsi mengembalikan array `{ day: 'N', totalToa: 0 }` untuk semua hari. **Data ini diperlakukan sama dengan data asli oleh UI** — user tidak tahu bahwa chart menampilkan data dummy/kosong, bukan data sebenarnya.
- **Dampak User:** Grafik tren menampilkan garis **rata nol** tanpa indikasi error. User bisa salah mengambil keputusan operasional berdasarkan data palsu.

### R6-008 🟡 MEDIUM — `tabGidCache` Tidak Pernah Di-clear
- **File:** `src/services/googleSheets.ts:922`
- **Masalah:** `tabGidCache` (Map) tidak pernah di-clear selama sesi. Jika user berpindah spreadsheet berkali-kali, cache membengkak. Lebih penting: jika struktur tab spreadsheet berubah (admin menambah/hapus tab), cache stale.
- **Dampak User:** Edge case — format sheet bisa diterapkan ke tab yang salah jika admin mengubah struktur spreadsheet di tengah sesi.

### R6-009 🟠 HIGH — `getBusData` Auto-Sync ke Supabase Tanpa Error Handling yang Memadai
- **File:** `src/services/googleSheets.ts:797-853`
- **Masalah:** IIFE async fire-and-forget untuk upsert daily unit summaries. Jika `upsertDailyUnitSummaries` gagal:
  1. Error ditelan silently (`catch (_e) {}`)
  2. Tidak ada retry mechanism
  3. Data Supabase bisa jadi stale tanpa indikasi ke user/admin
- **Dampak User:** Dashboard akumulasi lintas periode bisa menampilkan data yang outdated/incomplete.

### R6-010 🟡 MEDIUM — Import Statements Tersebar (Non-top-level)
- **File:** `src/services/googleSheets.ts:544`, `src/services/googleSheets.ts:957`, `src/services/googleSheets.ts:1048`
- **Masalah:** Import `parseIndonesianNumber`, `extractRouteNameFromHeaders`, `getKeteranganColor` dilakukan di tengah file, bukan di top-level. Ini adalah code smell dan melanggar konvensi ES module.

---

## B. SERVICE LAYER — `routeService.ts`

### R6-011 🟠 HIGH — `verifyUserProfile` Fail-Closed pada Network Error
- **File:** `src/services/routeService.ts:88-94`
- **Masalah:** Jika Supabase tidak bisa dihubungi (offline/timeout), user **ditolak login**. Pesan error menyebutkan "gangguan sistem/koneksi" tapi user tidak bisa masuk sama sekali.
- **Dampak User:** User di lapangan dengan sinyal buruk **tidak bisa login** meskipun akun mereka valid. Ini bertentangan dengan prinsip "fail-graceful" untuk aplikasi mobile-first di lapangan.

> [!WARNING]
> Ini **konflik langsung** dengan Aturan Emas #3 (sesi permanen) saat cold-start. Jika user sudah pernah login berhasil sebelumnya, seharusnya ada fallback ke cache profil lokal.

### R6-012 🟡 MEDIUM — `sendUserHeartbeat` Read-then-Write Race Condition
- **File:** `src/services/routeService.ts:152-175`
- **Masalah:** Fungsi membaca `total_active_seconds` lalu menulis `currentSeconds + secondsInterval`. Jika dua tab/device aktif bersamaan, kedua read yang sama bisa menghasilkan double-counting.
- **Dampak User:** Statistik durasi aktif user menjadi tidak akurat (inflated).

### R6-013 🟡 MEDIUM — `getCrossPeriodAccumulation` Filter Client-Side
- **File:** `src/services/routeService.ts:384-394`
- **Masalah:** Query mengambil SEMUA data route_code dari Supabase, lalu filter di client-side. Untuk rute dengan banyak data historis, ini sangat tidak efisien.
- **Dampak User:** Loading lambat untuk akumulasi data lintas periode, terutama dengan koneksi lemah.

---

## C. HOOK LAYER

### R6-014 🔴 CRITICAL — `useOfflineSync.isAuthError` Berbeda dengan `googleSheets.isAuthError`
- **File:** `src/hooks/useOfflineSync.ts:51-55` vs `src/services/googleSheets.ts:197-231`
- **Masalah:** Dua implementasi `isAuthError` yang sangat berbeda:
  - `useOfflineSync.ts`: Cek `err?.status === 401` atau message mengandung 'Auth'/'Credentials'
  - `googleSheets.ts`: Cek 401, 403, message patterns, statusText — jauh lebih comprehensive
- **Dampak User:** Offline sync queue bisa salah mengklasifikasikan error. Auth error yang seharusnya menghentikan queue bisa lolos dan terus retry. Atau sebaliknya, error biasa bisa salah dianggap auth error dan memblokir queue.

### R6-015 🟠 HIGH — `useOfflineSync.processQueue` Closure Stale `options`
- **File:** `src/hooks/useOfflineSync.ts:241`
- **Masalah:** `useCallback` depend pada `[options]`, tapi `options` adalah object yang dibuat baru setiap render di Dashboard. Ini berarti `processQueue` di-recreate setiap render, dan useEffect di line 290 juga berubah setiap render, menyebabkan listener `online` di-attach/detach berulang kali.
- **Dampak User:** Kemungkinan kecil tapi bisa menyebabkan queue processing terpicu berkali-kali saat navigasi tab.

### R6-016 🟡 MEDIUM — `useOfflineSync` SyncItem ID Menggunakan `Date.now()`
- **File:** `src/hooks/useOfflineSync.ts:122`
- **Masalah:** `id: Date.now().toString()` bisa collision jika user menyimpan 2 item dalam millisecond yang sama (sangat cepat mengetik + save).
- **Dampak User:** Edge case — dua item antrean bisa memiliki ID identik, menyebabkan satu item hilang saat removal.

---

## D. UI/UX COMPONENTS

### R6-017 🔴 CRITICAL — `Dashboard` Inline `localStorage.getItem` Parsing Tanpa Guard
- **File:** `src/components/Dashboard.tsx:112-134`
- **Masalah:** `useMemo` untuk `activeMonth`/`activeYear` melakukan `JSON.parse(cached)` lalu iterasi nested loop. Jika data cache corrupt (misalnya di-truncate oleh quota), `JSON.parse` throw error yang ditangkap, tapi logika fallback mengembalikan `new Date().getMonth() + 1` yang bisa salah bulan jika user membuka data bulan lalu.
- **Dampak User:** Dashboard bisa menampilkan label bulan/tahun yang salah jika cache rusak.

### R6-018 🟠 HIGH — `Dashboard` Duplikasi Logika `localStorage.getItem('PDO_CACHE_ROUTES')` (5x)
- **File:** `src/components/Dashboard.tsx:112-134`, `src/components/Dashboard.tsx:314-328`, `src/components/Dashboard.tsx:1056-1073`, `src/components/Dashboard.tsx:1099-1116`
- **Masalah:** Pattern `localStorage.getItem('PDO_CACHE_ROUTES')` → `JSON.parse` → nested loop untuk match sheet URL diulang **minimal 5 kali** di file yang sama.
- **Dampak User:** Tidak langsung, tapi kode ini sangat rapuh — fix di satu tempat bisa lupa di tempat lain.

### R6-019 🟠 HIGH — `Dashboard` IIFE Render Pattern Menyulitkan React Tree
- **File:** `src/components/Dashboard.tsx:1052-1213`
- **Masalah:** IIFE `{(() => { ... return (<>...</>); })()}` digunakan untuk render BottomNav, ProfileMenuSheet, dan AccumulationSheet. Ini anti-pattern React karena:
  1. Membuat computation di setiap render tanpa memoization
  2. Melakukan `JSON.parse` localStorage di setiap render cycle
  3. Membuat JSX tree sulit di-debug/trace
- **Dampak User:** Jank/lag pada perangkat low-end saat render berulang.

### R6-020 🔴 CRITICAL — `alertUtils.ts` God File (1468 baris)
- **File:** `src/utils/alertUtils.ts`
- **Masalah:** File 1468 baris yang mencampur:
  - Base SweetAlert config (pdoSwal, pdoToast)
  - Simple utility functions (showToast, showErrorAlert, dll)
  - Complex modal builders dengan inline HTML templates (showBusInputModal — 700+ baris)
  - Business logic (validasi KM, validasi TOA, penanganan OFF/NP1/NP2)
  - DOM manipulation (setupSmartKeteranganLogic)
- **Dampak User:** Sangat sulit di-maintain. Bug validasi form tertutupi oleh lautan inline HTML string.

### R6-021 🟠 HIGH — `showBusInputModal` Mode ALL: Keterangan Input Duplikat
- **File:** `src/utils/alertUtils.ts:501` vs `src/utils/alertUtils.ts:682`
- **Masalah:** Di mode ALL, ada DUA instance `renderSmartKeteranganSection`:
  1. Di panel non-all (progressive chip) → ID `swal-wrapper-keterangan`
  2. Di panel "notes" tab → ID `swal-wrapper-keterangan-notes`
  
  Tapi `preConfirm` hanya membaca `#swal-input-keterangan` (dari instance pertama). Jika user mengedit catatan di **Panel Catatan** (tab ke-4), perubahan **diabaikan** karena yang dibaca adalah input dari progressive chip.
- **Dampak User:** 🔴 User mengetik catatan di tab "Catatan" pada mode ALL, klik Simpan, tapi **catatan tidak tersimpan**. Bug langsung terasa.

### R6-022 🟡 MEDIUM — `showBusInputModal` Inline HTML dengan Template Literal Rawan XSS
- **File:** `src/utils/alertUtils.ts:289-345`
- **Masalah:** Nilai `initialKeterangan` langsung di-interpolate ke HTML template literal tanpa sanitasi:
  ```js
  value="${isFixedVal ? cleanVal.toUpperCase() : initialDetail}"
  ```
  Jika keterangan mengandung karakter `"` atau `<script>`, bisa menghasilkan broken HTML atau potensi XSS.
- **Dampak User:** Jika user memasukkan karakter khusus di keterangan (misalnya `BA.01 Rusak "parah"`), form edit berikutnya bisa broken.

### R6-023 🟠 HIGH — `BusList` Props Type Mismatch untuk `addToQueue`
- **File:** `src/components/BusList.tsx:29`
- **Masalah:** Props type `addToQueue: (item: Omit<SyncItem, 'id' | 'status'>) => void` tapi seharusnya `Omit<SyncItem, 'id' | 'status' | 'retryCount'>` sesuai definisi di `useOfflineSync.ts:112`. Missing `retryCount` di Omit.
- **Dampak User:** TypeScript tidak akan error karena excess properties diizinkan, tapi semantically salah.

### R6-024 🟡 MEDIUM — `sheetColorUtils` Regex Redundansi
- **File:** `src/utils/sheetColorUtils.ts:19-37`
- **Masalah:** Fungsi `getKeteranganColor` menggunakan regex `/BA\.0[1-4]/i.test(upper)` **DAN** juga melakukan `upper.includes("BA.01")` / `upper.includes("BA.02")`, dll. Ini sepenuhnya redundan — regex sudah menangkap semua kasus BA.01-04.
- **Dampak User:** Tidak ada, tapi kode tidak clean.

### R6-025 🟠 HIGH — `sheetColorUtils.getKeteranganColor` Match "OFF" Terlalu Greedy
- **File:** `src/utils/sheetColorUtils.ts:19`
- **Masalah:** `upper.includes("OFF")` akan match **semua** keterangan yang mengandung substring "OFF", termasuk:
  - "BA.01 OFFICE" → diwarnai kuning (OFF), padahal seharusnya biru muda (BA.01)
  - "OFFLOAD" → diwarnai kuning
  
  Urutan pengecekan menempatkan OFF **sebelum** BA.01, jadi prefix BA.01 di-override.
- **Dampak User:** Baris dengan keterangan "BA.01 ..." yang kebetulan mengandung kata "OFF" akan mendapat **warna yang salah** di spreadsheet.

---

## E. SUPABASE & INFRASTRUCTURE

### R6-026 🟡 MEDIUM — `supabase.ts` Placeholder URL Saat Tidak Dikonfigurasi
- **File:** `src/services/supabase.ts:11-14`
- **Masalah:** `createClient('https://placeholder.supabase.co', 'placeholder-anon-key')` membuat koneksi ke URL yang tidak valid. Meskipun ada guard `isSupabaseConfigured`, jika ada bug yang melewati guard, request akan pergi ke domain publik `placeholder.supabase.co`.
- **Dampak User:** Low risk tapi secara prinsip keamanan buruk — credential placeholder bisa terkirim ke domain yang bukan milik kita.

### R6-027 🟠 HIGH — Tidak Ada Mekanisme Migrasi/Versioning Cache `localStorage`
- **Masalah:** Aplikasi menyimpan banyak data di localStorage:
  - `PDO_CACHE_ROUTES` (bisa sangat besar)
  - `PDO_SYNC_QUEUE` (antrean offline)
  - `GAPI_ACCESS_TOKEN`
  - `PDO_LAST_VISITED`
  - `PDO_PROFILE_SYNC_PENDING`
  - `PDO_THEME`
  
  Tidak ada versi schema. Jika format data berubah di update berikutnya, cache lama bisa menyebabkan crash/undefined behavior.
- **Dampak User:** Setelah update aplikasi, user bisa mengalami error aneh karena format cache tidak kompatibel.

---

## F. DATA INTEGRITY & PARSING

### R6-028 🟠 HIGH — `numberUtils.parseIndonesianNumber` Ambiguitas `4.670`
- **File:** `src/utils/numberUtils.ts:13`
- **Masalah:** Regex `/^\d{1,3}(\.\d{3})+$/` mendeteksi apakah string adalah format ribuan Indonesia (titik sebagai separator ribuan). Tapi `4.670` bisa berarti:
  - 4670 (empat ribu enam ratus tujuh puluh — format Indonesia)
  - 4.670 (empat koma enam tujuh nol — format internasional untuk desimal)
  
  Untuk konteks KM Akhir/Awal, `4.670` kemungkinan besar berarti 4670 KM, tapi untuk konteks "Pelanggan/KM" (contoh: 5.23), ini ambigu.
- **Dampak User:** Parsing angka bisa memberikan hasil yang salah 1000x lipat pada kasus tertentu.

### R6-029 🟡 MEDIUM — `getAccumulatedBusData` KM Akumulasi Tidak Mempertahankan Detail
- **File:** `src/services/googleSheets.ts:1773-1776`
- **Masalah:** Dalam akumulasi, `kmAwal1` selalu di-set ke "0" dan `kmAkhir1` menjadi total jarak. Ini menghilangkan informasi KM awal/akhir per hari, yang membuat UnitDetailModal menampilkan informasi yang menyesatkan (seolah-olah bus mulai dari KM 0).
- **Dampak User:** Di mode akumulasi, kartu detail unit menampilkan "KM Awal: 0" yang membingungkan.

---

## G. CONFIGURATION & BUILD

### R6-030 🟡 MEDIUM — PWA Manifest Icons Tidak Lengkap
- **File:** `vite.config.ts:29-45`
- **Masalah:** Hanya ada 2 ukuran icon (192x192 dan 512x512). Tidak ada icon 144x144 untuk Android splash screen, dan tidak ada favicon.ico di folder public (direferensikan tapi mungkin tidak ada).
- **Dampak User:** Splash screen PWA mungkin menampilkan icon buram atau placeholder default browser.

### R6-031 🟢 LOW — `package.json` Name Generik `"app"`
- **File:** `package.json:2`
- **Masalah:** `"name": "app"` terlalu generik. Bisa konflik di monorepo atau dependency resolution.

### R6-032 🟢 LOW — `tsconfig.app.json` Belum Diverifikasi Strict Mode
- **Masalah:** Perlu verifikasi apakah `strict: true` aktif. Non-strict mode bisa menyembunyikan bug null/undefined.

---

## H. KEAMANAN & PRIVASI

### R6-033 🟠 HIGH — Token Google Disimpan di localStorage Tanpa Enkripsi
- **File:** `src/services/googleSheets.ts:45-48`
- **Masalah:** Access token Google disimpan plaintext di localStorage:
  ```js
  localStorage.setItem('GAPI_ACCESS_TOKEN', JSON.stringify({
    token: tokenResponse.access_token,
    expiresAt: Date.now() + tokenResponse.expires_in * 1000
  }));
  ```
  Siapapun yang bisa mengakses browser/device bisa mencuri token ini.
- **Dampak User:** Risiko keamanan di perangkat shared (jika device dipakai bergantian tanpa logout).

### R6-034 🟡 MEDIUM — `signOut` Silent Error di Revoke Token
- **File:** `src/services/googleSheets.ts:157-163`
- **Masalah:** `google.accounts.oauth2.revoke(tokenObj.token, () => {})` dengan empty callback. Jika revoke gagal, token masih valid di sisi Google tapi user sudah "logout" di UI.
- **Dampak User:** Token lama bisa disalahgunakan jika device dicuri/diakses orang lain.

---

## I. REACT PATTERNS & PERFORMANCE

### R6-035 🟠 HIGH — `Dashboard` State Management Overload (25+ useState)
- **File:** `src/components/Dashboard.tsx:50-110`
- **Masalah:** Komponen Dashboard memiliki 25+ state variables, membuatnya sangat sulit di-maintain dan berisiko re-render berlebihan.
- **Dampak User:** Jank/lag di perangkat low-end karena setiap state change bisa trigger re-render seluruh tree.

### R6-036 🟡 MEDIUM — `LoginScreen` 1374 Baris, Kebanyakan Inline JSX/CSS
- **File:** `src/components/LoginScreen.tsx`
- **Masalah:** 1374 baris untuk login screen, mayoritas berisi inline style objects dan JSX statis untuk modal Privacy Policy/Terms/Developer. Konten legal seharusnya di-extract ke komponen terpisah atau bahkan markdown files.
- **Dampak User:** Tidak langsung, tapi waktu parse/compile meningkat → first paint bisa lebih lambat.

### R6-037 🟡 MEDIUM — `useEffect` Dependencies Warning di `Dashboard`
- **File:** `src/components/Dashboard.tsx:269-275`
- **Masalah:** `useEffect` memanggil `handleLoadData` tapi `handleLoadData` tidak ada di dependency array. Ini bisa menyebabkan stale closure.

---

## J. TESTING GAPS

### R6-038 🟡 MEDIUM — Test Coverage Tidak Merata
- **Masalah:** Unit test hanya ada untuk:
  - `alertUtils.test.ts` — partial
  - `analytics.test.ts` — partial
  - `errorFormatter.test.ts` — partial
  - `numberUtils.test.ts` — partial
  - `resultStatus.test.ts` — partial
  - `routeValidation.test.ts`
  - `sheetIdentity.test.ts`
  - `unitAnalytics.test.ts`
  - `routeService.test.ts`
  
  **Tidak ada test** untuk:
  - `googleSheets.ts` (service paling kritikal!)
  - `useOfflineSync.ts` (hook paling kompleks!)
  - `sheetColorUtils.ts` (match order bug R6-025)
  - Semua komponen React

---

## Ringkasan Statistik

| Severitas | Jumlah |
|-----------|--------|
| 🔴 CRITICAL | 6 |
| 🟠 HIGH | 14 |
| 🟡 MEDIUM | 14 |
| 🟢 LOW | 3 |
| **TOTAL** | **37** |
