# AUDIT BUGS — REFACTOR 155 (Sinkronisasi Mingguan & Realtime Google Sheets Webhook)

## Ringkasan Eksekutif
Siklus perbaikan ini berfokus pada dua keluhan operasional utama pada halaman Monitoring Wilayah:
1. **Keluhan 1 (Kegagalan Ingestion Mingguan & Silent Fail Rute Tunggal):**
   - Tombol penarikan data 18 rute di header membuka modal bulanan saat pengguna berada di tab mingguan.
   - Tombol "Tarik Sheet" pada masing-masing kartu rute di tab mingguan gagal menarik data 7 hari dan mengalami *silent fail*.
2. **Keluhan 2 (Ketiadaan Sinkronisasi Realtime dari Google Sheets Asli):**
   - Data operasional yang diketik petugas di spreadsheet rute tidak langsung tampil secara realtime di dashboard aplikasi web tanpa pemicuan manual.

---

## Rincian Temuan Bug

### 1. BUG-155-01: Tombol Penarikan Data Header Mode Mingguan Keliru Membuka Modal Bulanan
- **Lokasi Kode:** `src/components/monitoring/MonitoringHeader.tsx`
- **Keparahan:** High (UX Blocker)
- **Deskripsi:** Pada tab mingguan (`periodType === 'weekly'`), tombol utama di header memanggil `onOpenBulkMonthlyModal` alih-alih `onSync18Routes`. Hal ini menyebabkan pengguna diarahkan ke pemilihan bulan alih-alih menjalankan proses penarikan data 7 hari aktif.
- **Dampak Pengguna:** Pengguna tidak dapat menyinkronkan 18 rute secara mingguan langsung dari tombol header.
- **Mitigasi:** Modifikasi percabangan header agar `periodType === 'weekly'` mengarahkan aksi ke `onSync18Routes` dengan label dinamis dari kamus sentral `text_monitoring.ts`.

---

### 2. BUG-155-02: Silent Fail Tombol "Tarik Sheet" Kartu Rute pada Rentang Mingguan & Kustom
- **Lokasi Kode:** `src/components/monitoring/AllRouteMonitoringPage.tsx` & `src/services/regionalIngestionService.ts`
- **Keparahan:** High (Data Inconsistency)
- **Deskripsi:** Handler `handleSyncSingleRoute` dan fungsi `ingestSingleRouteSummary` hanya menerima parameter tanggal tunggal (`string`). Ketika pengguna berada di tab Mingguan (yang memiliki `startDate` dan `endDate` 7 hari), sistem hanya menarik hari pertama atau gagal melakukan iterasi.
- **Dampak Pengguna:** Data rute tunggal di tab mingguan tidak ter-update secara akurat sesuai rentang 7 hari.
- **Mitigasi:** Tambahkan fungsi `generateDateRange`, `ingestRegionalRouteSummariesForRange`, dan `ingestSingleRouteSummaryForRange` di `regionalIngestionService.ts`, serta integrasikan ke dalam `AllRouteMonitoringPage.tsx`.

---

### 3. BUG-155-03: Ketiadaan Mekanisme Push Realtime dari Google Sheets ke Dashboard
- **Lokasi Kode:** `supabase/migrations/20261024000002_enable_realtime_for_daily_route_reports.sql`, `supabase/functions/sheet-sync-webhook/index.ts`, `src/components/monitoring/AllRouteMonitoringPage.tsx`
- **Keparahan:** Medium (Operational Lag)
- **Deskripsi:** Perubahan angka/sel yang dilakukan oleh pengawas di file spreadsheet rute tidak memicu pembaruan ke database Supabase secara otomatis. Dashboard web tetap menampilkan data lama sampai ada sinkronisasi manual.
- **Dampak Pengguna:** Manajer korwil dan pimpinan tidak melihat angka capaian terbaru secara instan saat sheet sedang diisi oleh pengawas lapangan.
- **Mitigasi:**
  1. Aktifkan Supabase Realtime pada tabel `daily_route_reports`.
  2. Bangun dan deploy Supabase Edge Function `sheet-sync-webhook` (Zero-Secret, Service Account protected).
  3. Tambahkan listener `postgres_changes` di `AllRouteMonitoringPage.tsx` untuk silent auto-refresh.
  4. Sediakan skrip Google Apps Script `RouteSheetRealtimeSync.js` berfitur debounce untuk dipasang pada 18 spreadsheet rute.

---

### 4. BUG-155-04: Layar Kedip Skeleton & Bottom Sheet Tertutup Paksa Saat Realtime Update
- **Lokasi Kode:** `src/components/monitoring/AllRouteMonitoringPage.tsx`, `src/components/monitoring/tabs/MonitoringKorwilTab.tsx`, `src/components/monitoring/tabs/MonitoringRoutesTab.tsx`
- **Keparahan:** High (Disruptive UX)
- **Deskripsi:** Ketika event WebSocket Realtime diterima, listener memanggil `loadData(false)` yang memicu `setLoading(true)`. Akibatnya, `MonitoringStates` me-render skeleton loading dan seluruh pohon DOM konten tab di-unmount. Tab Korwil hancur, local state `selectedRouteForSheet` terhapus sehingga Bottom Sheet detail rute tertutup seketika, dan pengguna terlempar kembali ke layout awal.
- **Dampak Pengguna:** Pengguna tidak dapat menatap detail rute saat sheet sedang diedit; aplikasi terasa me-reload penuh dan menutup modal/sheet secara sepihak.
- **Mitigasi:**
  1. Pisahkan mode pemuatan di `loadData`: mode `"initial"`, `"refresh"`, dan `"silent"`. Panggilan realtime wajib menggunakan mode `"silent"` tanpa mengaktifkan `loading` atau `refreshing`.
  2. Jaga agar `{(!loading || data) && ...}` tidak pernah meng-unmount konten jika data sudah ada di memori.
  3. Simpan `activeTab` di `sessionStorage` agar persisten.
  4. Ubah `selectedRouteForSheet` dan `selectedRouteForModal` menjadi derived state berbasis `selectedRouteCode` agar bottom sheet tetap terbuka dan angka di dalamnya langsung terbarui secara reaktif.

---

### 5. BUG-155-05: Ketiadaan Sinkronisasi Realtime Saat Input Dilakukan via Aplikasi Web
- **Lokasi Kode:** `src/services/googleSheets/mutations.ts`, `src/services/realtimeSyncService.ts`, `src/components/dashboard/useDashboardData.ts`
- **Keparahan:** High (Operational Parity)
- **Deskripsi:** Ketika pengguna melakukan input armada bus melalui aplikasi web, data berhasil disimpan ke Google Sheets melalui API v4. Namun, arsitektur Google Sheets sengaja memblokir trigger `onEdit` Apps Script untuk mutasi yang datang dari REST API v4 guna mencegah infinite loop. Akibatnya:
  1. Halaman Monitoring Wilayah tidak ter-update seketika (Skenario A tertahan).
  2. Perangkat lain yang sedang membuka rute & tab yang sama tidak menerima pembaruan kartu armada bus secara seketika (Skenario B tertahan).
- **Dampak Pengguna:** Pengguna di perangkat lain harus merefresh manual untuk melihat data yang baru saja disimpan oleh rekannya, dan dashboard monitoring wilayah tertinggal.
- **Mitigasi:**
  1. Bangun `src/services/realtimeSyncService.ts` yang menangani pemicuan Webhook Edge Function (`triggerRealtimeSheetSync`) dan penyiaran broadcast Supabase Realtime peer-to-peer (`broadcastBusUpdate` & `subscribeToBusUpdates`).
  2. Integrasikan ke dalam `updateBulkBusData` di `src/services/googleSheets/mutations.ts` sehingga setiap kali mutasi berhasil ditulis ke Google Sheets, Skenario A dan Skenario B dieksekusi secara otomatis.
  3. Hubungkan subscription broadcast di `src/components/dashboard/useDashboardData.ts` sehingga kartu bus pada peranti lain langsung ter-update di memori secara mulus (*zero reload*).

