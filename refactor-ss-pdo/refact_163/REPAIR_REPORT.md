# REPAIR REPORT — Refactor 163: Natural Alphanumeric Route Sorting

## Ringkasan Perbaikan

Refactor 163 menyelesaikan masalah pengurutan kode rute di seluruh komponen aplikasi SS_PDO. Sebelumnya, pengurutan rute mengandalkan string comparison ASCII standar PostgreSQL `.order('route_code', { ascending: true })` atau `.sort()`, sehingga kode rute dengan tiga digit nomor (seperti `JAK.115` atau `JAK.112`) salah ditempatkan sebelum rute dua digit (seperti `JAK.15` atau `JAK.29`). Seluruh komponen kini tersentralisasi menggunakan utilitas baru `src/utils/routeSorting.ts` dengan penanganan natural numeric comparison dan normalisasi spasi/titik.

---

## 1. Implementasi & Detail Perubahan

### A. Utilitas Terpusat `src/utils/routeSorting.ts` & Tes `routeSorting.test.ts`
- Dibuat fungsi murni `compareRouteCodes(a, b)`:
  - Melakukan trim, menangani null/undefined/empty string secara aman.
  - Menormalisasi spasi dan underscore menjadi titik (`.`) melalui `normalizeRouteCodeForSort`.
  - Menggunakan `localeCompare(b, 'id', { numeric: true, sensitivity: 'base' })` sehingga angka dalam string diperlakukan sebagai nilai numerik (contoh: `1` < `5` < `15` < `29` < `115`).
- Dibuat fungsi pure helper `sortRoutesByCode(routes, getCode?)`:
  - Mengembalikan salinan array baru tanpa memutasi array asli (*pure function*).
  - Otomatis mendeteksi properti `routeCode` (frontend) maupun `route_code` (database/Supabase), serta mendukung custom accessor callback.

### B. Lapisan Data & Layanan (`src/services/`)
1. **`src/services/routes/routes.ts` (`fetchRoutesWithSheets`)**:
   - Memproses data dari Supabase dengan `sortRoutesByCode(data)` sebelum disimpan ke LocalStorage cache dan dikembalikan ke pemanggil.
   - Mengurutkan pula data fallback dari cache lokal `sortRoutesByCode(JSON.parse(cached))`.
2. **`src/services/dailyRouteReportService.ts` (`fetchRouteMasterList`)**:
   - Mengembalikan `sortRoutesByCode(formattedRoutes)` sehingga pemanggil master rute (monitoring harian, sinkronisasi regional, rekap bulanan) selalu menerima data rute yang terurut rapi.
3. **`src/services/allRouteMonitoringService.ts`**:
   - Mengurutkan `sortedRouteItems` dengan `sortRoutesByCode` pada `fetchRegionalMonitoringData` dan `fetchRegionalPeriodMonitoringData`.
   - Mengurutkan `teamRoutes` dengan `sortRoutesByCode` pada `calculateSupervisorSummaries`.

### C. Komponen Antarmuka Pengguna (`src/components/`)
1. **`src/components/monitoring/tabs/MonitoringRoutesTab.tsx`**:
   - Menyaring dan mengurutkan `filteredRoutes` dengan `sortRoutesByCode(list)`.
2. **`src/components/monitoring/tabs/MonitoringKorwilTab.tsx`**:
   - Menjamin baris rute per korwil `{sortRoutesByCode(team.routes).map(...)}` terurut natural saat accordion dibuka.
3. **`src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx`**:
   - Mengurutkan daftar rute armada non-SGO dengan `sortRoutesByCode(list)` sebelum di-render.
4. **`src/components/monitoring/tabs/MonitoringWaReportTab.tsx`**:
   - Membuat `sortedRoutes` terurut natural untuk pemetaan `routeWaData` (Format 1 & 2), `routeFleetData` (Format 3), dan chip `pendingRoutes`.
5. **`src/components/waReport/useWaReportData.ts`**:
   - Memastikan `filteredRoutes` dan `unconfirmedRoutes` terurut natural.
6. **`src/components/monitoring/tabs/MonitoringToaBarChart.tsx`**:
   - Mengganti inline tie-breaker menjadi `compareRouteCodes(a.routeCode, b.routeCode)`.
7. **`src/components/routeSelector/useRouteCascade.ts`**:
   - Mengganti sort `availableRouteCodes` menjadi `compareRouteCodes(a, b)`.
8. **`src/components/routeSelector/useBulkRouteForm.ts`**:
   - Menyimpan hasil inspeksi rute massal secara terurut `sortRoutesByCode(results)`.

---

## 2. Before vs After Perubahan

### Komparasi Pengurutan Master Rute
```diff
- // SEBELUM (ASCII String Sort):
- [ "JAK.01", "JAK.112", "JAK.113", "JAK.115", "JAK.118", "JAK.15", "JAK.29", "JAK.30", "JAK.90" ]
- Catatan: JAK.115 mendahului JAK.15 karena karakter '1' < '5'.

+ // SESUDAH (Natural Alphanumeric Sort):
+ [ "JAK.01", "JAK.05", "JAK.15", "JAK.29", "JAK.30", "JAK.90", "JAK.112", "JAK.113", "JAK.115", "JAK.118" ]
+ Catatan: Angka diurai secara numerik (1 < 5 < 15 < 29 < 30 < 90 < 112 < 113 < 115 < 118).
```

### Komparasi Normalisasi Penulisan
```diff
- // SEBELUM (Pemisah Spasi vs Titik Terpisah Kelompok):
- [ "JAK 05", "JAK 115", "JAK.01", "JAK.15", "JAK.29" ]
- Spasi (ASCII 32) dikelompokkan sebelum titik (ASCII 46).

+ // SESUDAH (Normalisasi Format):
+ [ "JAK.01", "JAK 05", "JAK.15", "JAK.29", "JAK 115" ]
+ Penulisan rute seragam dalam urutan nomor tanpa membedakan titik maupun spasi.
```

---

## 3. Case: Skenario Lapangan

### Skenario 1: Pencarian Rute oleh Petugas Pengawas di Dropdown Selector
- **Kondisi:** Petugas ingin memilih rute `JAK.15` pada lembar kerja harian.
- **Sebelum:** Petugas membuka dropdown rute dan menemukan `JAK.115` berada di antara `JAK.01` dan `JAK.15`. Petugas salah klik memilih `JAK.115` karena mengira urutan rute naik beraturan.
- **Sesudah:** Dropdown rute menampilkan urutan nomor naik yang wajar (`JAK.01, JAK.05, JAK.15, ..., JAK.115`). Petugas dengan mudah dan cepat menemukan rute `JAK.15` di posisi baris awal.

### Skenario 2: Pemantauan Capaian Rute Wilayah di Tab Korwil
- **Kondisi:** Koordinator Wilayah (Korwil) membuka accordion daftar rute binaannya untuk mengecek capaian armada dan ritase bus.
- **Sebelum:** Rute di dalam accordion tampil tidak teratur (`JAK.118` muncul di atas sebelum `JAK.29`).
- **Sesudah:** Rute Mikrotrans di dalam accordion pengawas terurut rapi dari nomor terkecil hingga terbesar, memudahkan evaluasi bertahap rute per rute.

### Skenario 3: Pembuatan & Broadcast Laporan WhatsApp Format 3
- **Kondisi:** Pengawas menyalin format laporan kesiapan armada WhatsApp Format 3 ke grup koordinasi operasional Transjakarta.
- **Sebelum:** Baris laporan menampilkan:
  `1. JAK 01 - (KLM): Target 15 | Real 15`
  `2. JAK 115 - (KWK): Target 23 | Real 23`
  `3. JAK 15 - (KWK): Target 24 | Real 24`
- **Sesudah:** Laporan WhatsApp terurut rapi dan profesional:
  `1. JAK 01 - (KLM): Target 15 | Real 15`
  `...`
  `4. JAK 15 - (KWK): Target 24 | Real 24`
  `...`
  `16. JAK 115 - (KWK): Target 23 | Real 23`

---

## 4. Status Verifikasi & Quality Gates

1. **Unit Test Coverage:**
   - Command: `pnpm vitest run src/`
   - Hasil: **120 test files passed (862 tests passed, 0 failed)**.
2. **TypeScript & Bundling Check:**
   - Command: `pnpm run build`
   - Hasil: **`tsc -b && vite build` sukses 0 error**.
3. **Knowledge Graph Status:**
   - Command: `graphify update .`
   - Hasil: **Graph diperbarui dengan 6178 nodes, 7665 edges, 581 communities**.
