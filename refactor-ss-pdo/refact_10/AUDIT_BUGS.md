# AUDIT OVER-ENGINEERING & DEAD CODE (PONYTAIL) - REFACTOR 10

Siklus audit ini berfokus pada eliminasi over-engineering, kode mati (*dead code*), dependensi yang tidak digunakan (*phantom dependencies*), abstraksi spekulatif (*YAGNI*), dan modularisasi arsitektur layanan sesuai prinsip **Ponytail (Lazy Senior Dev / Minimalis)** dan **Golden Rules Proyek SS_PDO**.

---

## Ringkasan Temuan Audit

| ID Temuan | Lokasi Kode | Kategori | Keparahan | Deskripsi & Dampak | Mitigasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PONY-01** | `src/App.css` | `delete` | Low | File stylesheet boilerplate bawaan starter Vite (185 baris) yang tidak pernah diimpor sama sekali ke file mana pun di proyek. Membebani repository dan membingungkan developer baru. | Hapus file `src/App.css`. |
| **PONY-02** | `package.json`<br>`src/types/phantom-ui.d.ts` | `delete` | Medium | Dependensi `@aejkatappaja/phantom-ui` dan deklarasi tipe ambient `src/types/phantom-ui.d.ts` sama sekali tidak pernah dirender atau digunakan di seluruh codebase. Menambah beban `node_modules` dan bundle resolution. | Hapus dependensi via `pnpm remove @aejkatappaja/phantom-ui` dan hapus file `src/types/phantom-ui.d.ts`. |
| **PONY-03** | `src/utils/resultStatus.ts`<br>`src/utils/resultStatus.test.ts` | `delete` (YAGNI) | Low | Abstraksi wrapper generik spekulatif `DataResult`, `liveResult`, `cacheResult`, `errorResult`, `isStale` (89 baris total) yang dibuat tanpa pernah diintegrasikan ke service atau UI produksi. | Hapus file utilitas dan file tesnya. |
| **PONY-04** | `src/hooks/useDebounce.ts` | `delete` | Low | Hook custom debounce 15 baris tanpa satu pun pemanggil (*0 call-sites*) dan tanpa unit test pendukung. | Hapus file `src/hooks/useDebounce.ts`. |
| **PONY-05** | `src/assets/hero.png`<br>`src/assets/react.svg`<br>`src/assets/vite.svg` | `delete` | Low | Aset visual bawaan template awal Vite/React yang tidak pernah diimpor atau ditampilkan dalam UI aplikasi SS_PDO. | Hapus ketiga file aset mati tersebut. |
| **PONY-06** | `src/utils/analytics.ts` | `shrink` | Low | Fungsi wrapper `safeParseNumber` (baris 52-55 dan combineAccumulatedBusData) membungkus ulang `parseIndonesianNumber` secara redundan, padahal `parseIndonesianNumber` sudah memiliki fallback default `0` dan proteksi `isNaN`. | Hapus wrapper `safeParseNumber` dan panggil `parseIndonesianNumber(val)` secara langsung di seluruh fungsi `analytics.ts`. |
| **PONY-07** | `src/components/KPICard.tsx`<br>`src/components/ShiftComparisonCard.tsx` | `shrink` / `stdlib` | Low | Pemformatan angka manual menggunakan duplikasi fungsi inline `toLocaleString("id-ID")` daripada memanfaatkan utilitas terstandarisasi `safeFormatNumber()` dari `src/utils/numberUtils.ts`. | Gunakan `safeFormatNumber()` terpusat untuk menjaga konsistensi format dan mengurangi duplikasi kode. |
| **PONY-08** | `src/services/routeService.ts` | `shrink` (Anti God-File) | Medium | File `routeService.ts` telah membengkak hingga 911 baris dan menangani 5 domain tanggung jawab sekaligus (Route CRUD, User/RBAC, Audit Logging, Sync Queue Backup, Daily Unit Summaries), melanggar Rule 9.4 (Anti God-File). | Pecah menjadi sub-modul terfokus di `src/services/routes/` (`routes.ts`, `users.ts`, `audit.ts`, `sync.ts`, `index.ts`), dan jadikan `routeService.ts` sebagai barrel export (100% backward compatible). |
