# AUDIT BUGS: PONYTAIL CODE PRUNING & LEAN ARCHITECTURE (REFACTOR 19)

Dokumen ini mendokumentasikan temuan audit kode, beban dead-code, dependensi usang, dan redundansi arsitektur pada aplikasi SS_PDO sebelum dilakukannya eliminasi over-engineering berbasis prinsip *Ponytail / Lazy Senior Dev*.

---

## DAFTAR TEMUAN AUDIT

| ID Temuan | Komponen / File Terkait | Keparahan | Status |
| :--- | :--- | :---: | :---: |
| **PONY-19-01** | `src/components/AuditLogPage.tsx`<br>`src/services/routes/audit.ts`<br>`src/utils/conflictMerge.ts`<br>`src/components/Dashboard.tsx`<br>`src/components/ProfileMenuSheet.tsx` | 🔴 **HIGH** (Bundle Bloat & Unmounted Dead Weight) | Terselesaikan |
| **PONY-19-02** | `package.json`<br>`pnpm-lock.yaml`<br>`src/services/googleSheets/auth.ts`<br>`src/services/googleSheets/transport.ts` | 🟡 **MEDIUM** (Security Risk & Obsolete Dependency) | Terselesaikan |
| **PONY-19-03** | `src/services/googleSheets/mutations.ts`<br>`src/utils/routeHelpers.ts`<br>`src/utils/cacheUtils.ts`<br>`src/components/RouteSelectorCard.tsx`<br>`src/components/AccumulationSheet.tsx` | 🟡 **MEDIUM** (Code Duplication & Maintenance Drift) | Terselesaikan |

---

## RINCIAN TEMUAN

### 🔴 PONY-19-01: Dead Code Komponen Raksasa & Unused Activity Logs (~1.200 Baris)

- **ID Temuan:** `PONY-19-01`
- **Lokasi Kode:**
  - `src/components/AuditLogPage.tsx` (1.117 baris)
  - `src/services/routes/audit.ts`
  - `src/utils/conflictMerge.ts`
  - `src/components/Dashboard.tsx`
  - `src/components/ProfileMenuSheet.tsx`
- **Keparahan:** **HIGH** (Bundle Bloat & Arsitektur Terbebani)
- **Deskripsi Masalah:**
  1. File `AuditLogPage.tsx` memiliki ukuran masif (1.117 baris kode) namun tidak pernah di-mount ke antarmuka produksi. Rute menu audit log telah dinonaktifkan dari navigasi utama, menyisakan dead code yang tetap diproses oleh transpiler.
  2. Fungsi `fetchActivityLogs()` di `services/routes/audit.ts` mengelola cache in-memory dan kueri Supabase yang tidak pernah dikonsumsi oleh komponen aktif mana pun.
  3. Di `utils/conflictMerge.ts`, fungsi getter `getEditableBusFields()` hanya membungkus array statis tanpa transformasi tambahan apa pun, menciptakan overhead pemanggilan fungsi.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Ukuran bundle JavaScript aplikasi membengkak signifikan. Pada jaringan seluler 3G/4G lapangan dengan latensi tinggi di pool bus atau halte pelosok, hal ini memperlambat proses first-load aplikasi dan memboroskan kuota data petugas.
- **Mitigasi:**
  - Hapus tuntas `src/components/AuditLogPage.tsx`.
  - Bersihkan handler dan union type `audit_log` di `Dashboard.tsx` dan `ProfileMenuSheet.tsx`.
  - Hapus fungsi `fetchActivityLogs()` dari servis audit.
  - Ekspor langsung konstanta murni `EDITABLE_BUS_FIELDS`.

---

### 🟡 PONY-19-02: Dependensi Usang `gapi-script` Memicu Warning Keamanan `[EVAL] Use of direct eval`

- **ID Temuan:** `PONY-19-02`
- **Lokasi Kode:**
  - `package.json`
  - `pnpm-lock.yaml`
  - `src/services/googleSheets/auth.ts`
  - `src/services/googleSheets/transport.ts`
- **Keparahan:** **MEDIUM** (Keamanan & Higienitas Dependensi)
- **Deskripsi Masalah:**
  1. Proyek menggunakan library pihak ketiga `gapi-script` hanya untuk memuat skrip resmi Google API Client ke browser.
  2. Library tersebut menggunakan mekanisme evaluasi kode lama yang memicu peringatan build Vite/Rollup: `[EVAL] Use of direct eval in "node_modules/gapi-script/..."`.
  3. Menggunakan pihak ketiga untuk sekadar menambahkan `<script src="https://apis.google.com/js/api.js">` melanggar prinsip *YAGNI* dan menambah risiko rantai pasok software (*supply chain risk*).
- **Dampak ke Pengguna Lapangan (User Impact):**
  Eksekusi eval dinamis berisiko melanggar Content Security Policy (CSP) ketat pada browser mobile modern dan menurunkan performa render saat inisialisasi login Google.
- **Mitigasi:**
  - Copot paket `gapi-script` via `pnpm remove gapi-script`.
  - Buat loader native mandiri di `src/services/googleSheets/auth.ts` yang memuat tag skrip asinkron murni ke `document.body` dengan pengembalian singleton `window.gapi`.

---

### 🟡 PONY-19-03: Redundansi Logika Mutasi Spreadsheet & Duplikasi Utilitas Standar

- **ID Temuan:** `PONY-19-03`
- **Lokasi Kode:**
  - `src/services/googleSheets/mutations.ts`
  - `src/utils/routeHelpers.ts`
  - `src/utils/cacheUtils.ts`
  - `src/components/RouteSelectorCard.tsx`
  - `src/components/AccumulationSheet.tsx`
- **Keparahan:** **MEDIUM** (Duplikasi Logika & Fragility)
- **Deskripsi Masalah:**
  1. Fungsi `updateBusData()` di `mutations.ts` menulis ulang logika mapping kolom, validasi range cell, dan eksekusi batch update yang ~120 barisnya identik dengan fungsi `updateBulkBusData()`.
  2. Terdapat file terpisah `src/utils/routeHelpers.ts` yang hanya berisi fungsi 10 baris `flattenRoutes` yang sebenarnya merupakan bawaan standard library JavaScript modern (`.flatMap()`).
  3. Fungsi `findSheetInRoutes()` di `cacheUtils.ts` menduplikasi pencarian canonical sheet yang telah disempurnakan di `sheetIdentity.ts` (`matchRouteSheetById`).
  4. Array nama bulan lokal `MONTH_NAMES_ID` didefinisikan secara lokal di berbagai komponen UI, menduplikasi entri dan berisiko salah eja.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Jika terjadi perbaikan formula atau mitigasi bug pada update data bus, ada kemungkinan `updateBusData` dan `updateBulkBusData` berperilaku berbeda di lapangan, memicu desinkronisasi data lembar kerja Google Sheets.
- **Mitigasi:**
  - Delegasikan `updateBusData` agar langsung memanggil `updateBulkBusData(sheetId, tabName, [{ rowIndex, updates }], headerMap)`.
  - Hapus `routeHelpers.ts` dan gunakan ekspresi `.flatMap()` native.
  - Satukan `findSheetInRoutes = matchRouteSheetById`.
  - Konsolidasikan daftar bulan ke konstanta terpusat `TEXT_COMMON.MONTHS`.
