# LAPORAN IMPLEMENTASI PERBAIKAN PONYTAIL (REFACTOR 10)

Dokumen ini menjelaskan implementasi perbaikan hasil audit **Ponytail (Minimalisme, YAGNI, & Zero Over-Engineering)** pada codebase **SS_PDO**. Seluruh perbaikan dirancang untuk merampingkan codebase, menghapus kode mati, modularisasi god-file, dan mencegah pemborosan komputasi/dependensi tanpa mengubah fungsionalitas aplikasi yang sudah berjalan.

---

## 1. PONY-01: Eliminasi File Stylesheet Boilerplate Mati (`src/App.css`)

- **Lokasi:** `src/App.css`
- **Sebelum Perbaikan:** File `App.css` berisi 185 baris aturan CSS bawaan template starter Vite/React (seperti class `.hero`, `.base`, `.vite`, `#center`, `#next-steps`, `.ticks`). File ini sama sekali tidak pernah diimpor oleh file TypeScript/React manapun, namun tetap berada dalam direktori proyek.
- **Sesudah Perbaikan:** File `src/App.css` dihapus sepenuhnya dari repositori.
- **Case / Skenario Lapangan:** Pengembang baru atau AI agent yang melakukan penjelajahan kode tidak lagi bingung membaca class-class palsu yang tidak digunakan oleh antarmuka aplikasi. Ukuran repositori menjadi lebih ramping.

---

## 2. PONY-02: Pembersihan Dependensi & Tipe Phantom (`@aejkatappaja/phantom-ui`)

- **Lokasi:** `package.json`, `pnpm-lock.yaml`, `src/types/phantom-ui.d.ts`
- **Sebelum Perbaikan:** Paket `@aejkatappaja/phantom-ui` tercatat dalam `dependencies` dan file ambient declaration `src/types/phantom-ui.d.ts` dibuat untuk elemen `<phantom-ui>`. Namun di seluruh aplikasi, tidak ada satu pun elemen ini dirender.
- **Sesudah Perbaikan:** Dependensi `@aejkatappaja/phantom-ui` dicopot menggunakan `pnpm remove @aejkatappaja/phantom-ui` (mengurangi 7 sub-dependensi di `node_modules`), dan file `src/types/phantom-ui.d.ts` dihapus.
- **Case / Skenario Lapangan:** Mempercepat instalasi `pnpm install` di lingkungan CI/CD dan mencegah paket tak bertuan membebani proses build atau memicu celah keamanan dari rantai dependensi pihak ketiga.

---

## 3. PONY-03: Eliminasi Abstraksi Spekulatif (`src/utils/resultStatus.ts`)

- **Lokasi:** `src/utils/resultStatus.ts`, `src/utils/resultStatus.test.ts`
- **Sebelum Perbaikan:** Terdapat utilitas `resultStatus.ts` berisi interface `DataResult<T>`, `DataSourceStatus`, serta fungsi factory `liveResult`, `cacheResult`, `errorResult`, dan `isStale` (total 89 baris termasuk unit test). Tidak ada satu pun consumer di seluruh codebase yang memakai abstraksi pembungkus ini (YAGNI).
- **Sesudah Perbaikan:** File `src/utils/resultStatus.ts` dan file tes unitnya `src/utils/resultStatus.test.ts` dihapus sepenuhnya.
- **Case / Skenario Lapangan:** Menghilangkan "abstraksi spekulatif masa depan" yang tidak pernah digunakan. Kode menjadi to the point dan mudah dirawat.

---

## 4. PONY-04: Penghapusan Custom Hook Tanpa Pemanggil (`src/hooks/useDebounce.ts`)

- **Lokasi:** `src/hooks/useDebounce.ts`
- **Sebelum Perbaikan:** File 15 baris berisi custom hook `useDebounce` tersimpan di `src/hooks/` tanpa satu pun pemanggil di komponen manapun dan tanpa unit test.
- **Sesudah Perbaikan:** File `src/hooks/useDebounce.ts` dihapus.
- **Case / Skenario Lapangan:** Menghindari dead code yang menumpuk di folder hooks tanpa kejelasan fungsi di aplikasi operasional.

---

## 5. PONY-05: Penghapusan Aset Bawaan Vite Starter

- **Lokasi:** `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`
- **Sebelum Perbaikan:** File gambar logo template awal Vite dan React tersimpan di `src/assets/` tanpa pernah diimpor atau ditampilkan di antarmuka manapun.
- **Sesudah Perbaikan:** Ketiga file aset visual template tersebut dihapus dari proyek.
- **Case / Skenario Lapangan:** Asset folder hanya berisi gambar/aset yang benar-benar dipakai oleh aplikasi operasional SS_PDO.

---

## 6. PONY-06: Perampingan Wrapper Redundan `safeParseNumber` di `analytics.ts`

- **Lokasi:** `src/utils/analytics.ts`
- **Sebelum Perbaikan:** Fungsi `calculateAnalytics` dan `combineAccumulatedBusData` memanggil wrapper lokal:
  ```ts
  const safeParseNumber = (val: any): number => {
    const num = parseIndonesianNumber(val);
    return isNaN(num) ? 0 : num;
  };
  ```
  Padahal fungsi standar `parseIndonesianNumber(val, 0)` sudah memiliki fallback default `0` dan otomatis mengembalikan angka fallback jika `isNaN`.
- **Sesudah Perbaikan:** Wrapper `safeParseNumber` dihilangkan. Seluruh 20+ pemanggilannya diganti langsung memanggil `parseIndonesianNumber(...)` secara seragam sesuai kaidah *Zero Call-Site Left Behind*.
- **Case / Skenario Lapangan:** Eksekusi kalkulasi analitik armada (TOA, Manual, KM) berjalan lebih cepat dan lebih bersih tanpa lapisan fungsi pembungkus ganda.

---

## 7. PONY-07: Standardisasi Formatter Angka Terpusat di Komponen KPI & Shift

- **Lokasi:** `src/components/KPICard.tsx`, `src/components/ShiftComparisonCard.tsx`
- **Sebelum Perbaikan:** Kedua komponen mendefinisikan fungsi format inline duplikat:
  ```ts
  const formatInt = (val: number) =>
    (isNaN(val) || val === undefined || val === null ? 0 : val).toLocaleString("id-ID");
  ```
- **Sesudah Perbaikan:** Mengganti logika manual tersebut dengan utilitas kanonik yang sudah ada:
  ```ts
  import { safeFormatNumber } from "../utils/numberUtils";
  // ponytail: reuse centralized safeFormatNumber instead of duplicate inline formatters
  const formatInt = (val: number) => safeFormatNumber(val);
  const formatRaw = (val: number) => safeFormatNumber(val, 0, { maximumFractionDigits: 10 });
  ```
- **Case / Skenario Lapangan:** Tampilan angka di dashboard kartu KPI dan perbandingan shift tetap presisi dalam format ribuan Indonesia (`"id-ID"`), tidak ada logika pemformatan yang tercecer atau berbeda antar kartu.

---

## 8. PONY-08: Modularisasi God-File `routeService.ts` (911 Baris ➔ Modul Terfokus)

- **Lokasi:** `src/services/routeService.ts` ➔ `src/services/routes/`
- **Sebelum Perbaikan:** File `routeService.ts` berisi 911 baris kode yang menggabungkan 5 domain sekaligus:
  1. Sinkronisasi lokal offline & pending queues (`flushPendingLocalSync`)
  2. Manajemen rute dan spreadsheet (`fetchRoutesWithSheets`, `createRouteWithSheet`, `deleteRouteSheet`, `getCrossPeriodAccumulation`)
  3. Autentikasi profil pengguna dan RBAC (`verifyUserProfile`, `upsertUserProfile`, `sendUserHeartbeat`, `fetchAllUserProfiles`, `addUserProfile`, dll.)
  4. Audit logging & telemetri (`logActivity`, `fetchActivityLogs`)
  5. Sinkronisasi ringkasan unit harian (`upsertDailyUnitSummaries`)
  Kondisi ini melanggar Rule 9.4 (Anti God-File, batas 400–500 baris).
- **Sesudah Perbaikan:**
  Dipecah menjadi sub-modul terisolasi di dalam `src/services/routes/`:
  - `types.ts`: Tipe data hasil kueri periode silang (`CrossPeriodSummaryResult`).
  - `audit.ts`: Layanan activity logs, memory cache TTL 3 menit, dan antrean offline fallback (~135 baris).
  - `users.ts`: Layanan verifikasi profil, cache offline 30 hari, heartbeat, dan manajemen RBAC (~350 baris).
  - `routes.ts`: Layanan CRUD rute, verifikasi URL Google Sheets, akumulasi lintas periode, dan ringkasan unit harian (~250 baris).
  - `sync.ts`: Layanan flush pending sync saat event `online` dipicu (~45 baris).
  - `index.ts`: Barrel export untuk folder `routes`.
  - `src/services/routeService.ts`: Direduksi menjadi barrel export murni (`export * from './routes/index'`) sehingga 100% backward compatible dengan seluruh pemanggil lama dan file tes tanpa modifikasi eksternal.
- **Case / Skenario Lapangan:** Struktur layanan kini modular, mudah diaudit, tidak ada ketergantungan melingkar (*circular dependency*), dan setiap fungsi fokus pada satu domain kerja tanpa membebani satu file raksasa.

---

## Ringkasan Verifikasi

1. **Unit Test:** `pnpm vitest run` ➔ **22 test files passed, 200 tests passed 100%**.
2. **Build Verification:** `pnpm run build` (`tsc -b && vite build`) ➔ **0 error, build lulus dalam 2.78s**.
3. **Knowledge Graph:** `graphify update .` ➔ Graf pengetahuan diperbarui (2157 nodes, 2947 edges, 178 communities).
4. **Git Branch:** Tetap konsisten di branch `devmode`.
