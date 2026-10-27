# REPAIR REPORT — REFACTOR 155 (Sinkronisasi Mingguan & Realtime Google Sheets Webhook)

## Ringkasan Perbaikan
Refactor 155 menyelesaikan dua keluhan operasional utama pada halaman Monitoring Wilayah:
1. Menyelaraskan alur penarikan data mingguan dan kustom pada header serta tombol kartu rute sehingga rentang tanggal 7 hari ditarik secara utuh tanpa hambatan.
2. Membangun infrastruktur sinkronisasi realtime ujung-ke-ujung (Zero-Secret Webhook dari Google Apps Script ➔ Supabase Edge Function ➔ PostgreSQL Realtime ➔ Frontend React).

---

## Implementasi & Before vs After

### 1. Ingestion Rentang Tanggal Mingguan (BUG-155-01 & BUG-155-02)
- **File Dimodifikasi:**
  - `src/services/regionalIngestionService.ts`
  - `src/components/monitoring/MonitoringHeader.tsx`
  - `src/components/monitoring/AllRouteMonitoringPage.tsx`
  - `src/components/monitoring/IngestionProgressModal.tsx`
  - `src/constants/texts/text_monitoring.ts`

| Aspek | Sebelum Perbaikan (Before) | Sesudah Perbaikan (After) |
| :--- | :--- | :--- |
| **Header Tab Mingguan** | Mengklik tombol utama membuka modal bulanan (`onOpenBulkMonthlyModal`). | Mengklik tombol utama memanggil `onSync18Routes` dengan label dinamis "Tarik Data Mingguan (18 Rute)". |
| **Penarikan Rute Tunggal di Kartu** | `handleSyncSingleRoute` hanya mengirim satu string tanggal, gagal memproses rentang 7 hari. | Menggunakan `ingestSingleRouteSummaryForRange` yang menghasilkan array seluruh tanggal dalam rentang dan memprosesnya secara berurutan. |
| **Progress Modal Feedback** | Judul modal statis untuk 18 rute saja. | Mendukung `title` dan `subtitle` dinamis yang menyesuaikan apakah proses berlangsung untuk 18 rute atau 1 rute tunggal. |

---

### 2. Arsitektur Realtime Zero-Secret Webhook (BUG-155-03)
- **File Dimodifikasi / Ditambahkan:**
  - `supabase/migrations/20261024000002_enable_realtime_for_daily_route_reports.sql`
  - `supabase/functions/sheet-sync-webhook/index.ts`
  - `src/components/monitoring/AllRouteMonitoringPage.tsx`
  - `scripts/google-apps-script/RouteSheetRealtimeSync.js`

| Aspek | Sebelum Perbaikan (Before) | Sesudah Perbaikan (After) |
| :--- | :--- | :--- |
| **Reaktivitas Perubahan Sheets** | Data di web tidak berubah sampai user merefresh halaman atau menekan tombol tarik manual. | Petugas mengisi angka di sheets ➔ Apps Script memicu webhook ➔ Supabase Realtime WebSocket mengabari frontend ➔ Halaman web ter-update otomatis secara hening (*silent auto-refresh*). |
| **Keamanan Kredensial Apps Script** | Berpotensi menyimpan kredensial Supabase sensitif di 18 skrip Google Sheets. | **Zero-Secret:** Skrip hanya memanggil public webhook endpoint. Autentikasi dan pembacaan sheets dilakukan di sisi server via Google Service Account yang terproteksi. |
### 3. Pembaruan Hening Realtime & Reaktivitas Bottom Sheet (BUG-155-04)
- **File Dimodifikasi:**
  - `src/components/monitoring/AllRouteMonitoringPage.tsx`
  - `src/components/monitoring/tabs/MonitoringKorwilTab.tsx`
  - `src/components/monitoring/tabs/MonitoringRoutesTab.tsx`

| Aspek | Sebelum Perbaikan (Before) | Sesudah Perbaikan (After) |
| :--- | :--- | :--- |
| **Realtime Reload UX** | Panggilan `loadData(false)` mengaktifkan `loading = true` ➔ memunculkan full skeleton dan me-unmount seluruh komponen tab. | Realtime memanggil mode `"silent"`. Jika data sudah ada di memori, `loading` tidak diaktifkan sehingga komponen tab tetap utuh tanpa kedipan skeleton. |
| **Status Bottom Sheet** | State modal tersimpan sebagai objek statis local. Saat data berubah, tab di-unmount sehingga bottom sheet tertutup seketika. | State modal berbasis kode rute (`selectedRouteCode`). Konten bottom sheet diturunkan (*derived*) dari data terbaru secara instan tanpa menutup sheet. |
| **Persistensi Tab Navigasi** | `activeTab` mengandalkan `useState` murni yang terancam reset ke `"dashboard"` saat reload. | `activeTab` dipersistensikan ke `sessionStorage` sehingga tab pilihan pengguna (misal "Korwil") tetap terkunci stabil. |

### 4. Realtime Dua Arah untuk Input via Aplikasi Web (BUG-155-05)
- **File Dimodifikasi / Ditambahkan:**
  - `src/services/realtimeSyncService.ts` (baru)
  - `src/services/realtimeSyncService.test.ts` (baru)
  - `src/services/googleSheets/mutations.ts`
  - `src/components/dashboard/useDashboardData.ts`

| Aspek | Sebelum Perbaikan (Before) | Sesudah Perbaikan (After) |
| :--- | :--- | :--- |
| **Skenario A: Input App ➔ Monitoring** | Pengguna menginput via aplikasi, data tersimpan di Google Sheets tetapi trigger `onEdit` Apps Script tidak berjalan (diblokir Google API v4). Monitoring Wilayah tidak ter-update. | Setelah mutasi tersimpan, aplikasi otomatis memicu `triggerRealtimeSheetSync` ke Supabase Edge Function berfitur debounce. Monitoring Wilayah langsung ter-update realtime (0 detik). |
| **Skenario B: Input App ➔ Perangkat B** | Petugas A menginput via aplikasi di Perangkat A, kartu bus di Perangkat B tetap menampilkan data lama sampai halaman direload. | Aplikasi menyiarkan perubahan via Supabase Realtime Broadcast (`broadcastBusUpdate`). Perangkat B yang membuka rute & tab yang sama langsung meng-update `busData` di memori secara instan tanpa reload. |

---

## Case: Skenario Lapangan

### Skenario 1: Evaluasi Performa Mingguan Rute JAK 60
- **Kondisi:** Koordinator wilayah membuka tab "Mingguan" pada tanggal 24 Oktober 2026 (rentang 18 - 24 Oktober) dan menekan tombol "Tarik Sheet" pada kartu JAK 60.
- **Hasil:** Modal progres menampilkan *"Memproses Penarikan Rute JAK.60... (1/7 hari, 2/7 hari, dst.)"*. Data dari tanggal 18 hingga 24 Oktober ditarik lengkap dan rekapitulasi kartu langsung diperbarui secara presisi.

### Skenario 2: Petugas Mengisi Angka TOA Shift 2 di Google Sheets
- **Kondisi:** Pengawas rute JAK 120 mengetikkan angka TOA Shift 2 pada tab "24" di Google Sheets resmi.
- **Hasil:**
  1. Trigger Google Apps Script `onSpreadsheetEditTrigger` mendeteksi perubahan pada tab tanggal "24".
  2. Webhook dikirim ke Supabase Edge Function `sheet-sync-webhook`.
  3. Edge Function mengambil data resmi sheet, menghitung metrik, dan menyimpan ke tabel `daily_route_reports`.
  4. Postgres Realtime memancarkan mutasi ke browser korwil yang sedang membuka dashboard.
  5. UI Monitoring Wilayah langsung memperbarui angka penumpang dan KM JAK 120 secara hening (*silent background update*) tanpa kedipan skeleton.

### Skenario 3: Membuka Bottom Sheet Detail Rute Saat Spreadsheet Diedit
- **Kondisi:** Pengguna sedang membuka *Bottom Sheet Detail Metrik Rute JAK 60* di dalam tab Korwil. Pada saat yang sama, pengawas memasukkan data ritase baru di spreadsheet JAK 60.
- **Hasil:**
  1. Bottom Sheet **TETAP TERBUKA** dan tidak tertutup paksa.
  2. Tab Korwil tidak ter-reset kembali ke tab Dashboard.
  3. Angka-angka metrik di dalam Bottom Sheet yang sedang ditatap pengguna (Penumpang, KM, Ritase PP, dsb.) langsung berubah ke angka terbaru secara mulus (*in-place update*).

### Skenario 4: Petugas A Menginput Ritase via Aplikasi di Lapangan
- **Kondisi:** Petugas A menginput ritase bus MYS 17001 di aplikasi pada ponselnya (rute JAK 60, tanggal 25). Sementara itu, Petugas B sedang membuka halaman dashboard rute JAK 60 di laptop, dan Koordinator Wilayah sedang memantau tab Korwil di tablet.
- **Hasil:**
  1. Data tersimpan ke Google Sheets rute JAK 60 tab 25.
  2. **Skenario B Aktif:** Kartu bus MYS 17001 di laptop Petugas B langsung berubah angkanya seketika via broadcast peer-to-peer tanpa perlu refresh.
  3. **Skenario A Aktif:** Monitoring Wilayah di tablet Koordinator Wilayah langsung ter-update hening menerima data akumulasi terbaru via Webhook Edge Function & Supabase Realtime.

---

## Verifikasi & Quality Gates
1. **Unit Testing:**
   - Command: `pnpm vitest run src/`
   - Hasil: 118 file lolos, **843 tests passed 100%**.
2. **Typecheck & Production Build:**
   - Command: `pnpm run build`
   - Hasil: TypeScript strict check lulus 0 error, build Vite PWA selesai dengan sukses.

