# REPAIR REPORT — Laporan A2 Armada (Refactor 148)

Tanggal Perbaikan: 19 Oktober 2026  
Branch: `devmode`  
Domain: Laporan Harian A2 Armada & Sinkronisasi Multi-Komponen

---

## 1. Ringkasan Perbaikan

1. **Feedback UI Hasil Submit (BUG-148-01):**
   - Menambahkan visualisasi state loading pada tombol submit dan memblokir input form saat proses pengiriman berlangsung.
   - Menambahkan dialog konfirmasi sukses SweetAlert2 (`showSuccessAlert`) yang ramah dan jelas mengenai status pengiriman Laporan A2.
   - Menambahkan in-modal error banner merah dengan tombol *Retry* ("Coba Lagi") serta dialog error ramah non-teknis SweetAlert2 ketika pengiriman gagal, sehingga data input petugas tidak hilang.

2. **Reaktivitas Badge & Tombol "Laporan A2" (BUG-148-02):**
   - Menambahkan status `"failed"` ke tipe `operationalReportStatus` dan visualisasi tombol (badge merah "Gagal Kirim").
   - Menghubungkan callback `onSaveSuccess` dan `onSaveFailure` dari `A2ReportModal` ke `DashboardModals` dan `Dashboard.tsx`.
   - Mengimplementasikan `refreshFleetData` pada `useDashboardFleet` untuk menyegarkan data `confirmedShifts`, `confirmedInfo`, dan `operationalReportStatus` secara instan.
   - Mengembangkan visualisasi segmented pada `UnifiedRouteControlBar`:
     - Hijau: `Terverifikasi`
     - Biru / Cyan: `Shift 1 Terkirim` / `Shift 2 Terkirim` / `Selesai Terkirim`
     - Merah: `Gagal Kirim`
     - Kuning Amber: `Laporan A2` (Draft)

3. **Sinkronisasi Ganda ke `daily_route_reports` (BUG-148-03):**
   - Memperbarui `daily_route_reports` saat Laporan A2 disimpan sehingga metrik Renops, Realops, dan status keterisian langsung sinkron ke dashboard monitoring 18 rute (`allRouteMonitoringService.ts`) dan generator laporan WhatsApp (`MonitoringWaReportTab.tsx`).
   - Menyimpan riwayat audit ke `fleet_status_logs`.

4. **Pencegahan Kehilangan Data Tersimpan (*Prefill Resilience*) (BUG-148-04):**
   - Memeriksa ketersediaan data di `daily_fleet_shifts` saat modal dibuka atau shift dipilih.
   - Menampilkan status badge/banner tersimpan jika data sudah pernah dikirim sebelumnya.

5. **Pembersihan String Hardcoded & Standarisasi Kamus Teks (BUG-148-05):**
   - Menambahkan kamus teks di `src/constants/texts/text_pdo_form.ts`.
   - Menambahkan unit test di `src/constants/texts/texts.test.ts`.
   - Menambahkan styling container `pdo-swal-toast-container` dengan z-index `99999 !important`.

---

## 2. Before vs After Perbaikan Kode

### A. Feedback UI & Konfirmasi Hasil Submit (`A2ReportModal.tsx`)
```diff
- // SEBELUM (BUG-148-01): Modal langsung tertutup tanpa menunggu, hanya toast kecil ber-z-index rendah
- showSuccessToast(TEXT_PDO_FORM.CONFIRM_SUBMIT_SUCCESS);
- onClose();
+ // SESUDAH: Form dikunci (isSubmitting), SweetAlert2 Success Alert ber-z-index 99999 + Toast
+ setIsSubmitting(true);
+ setSubmitError(null);
+ try {
+   // Simpan & Sinkronisasi ganda...
+   setIsSubmitting(false);
+   await showSuccessAlert(
+     TEXT_PDO_FORM.ALERT_SUCCESS_TITLE,
+     TEXT_PDO_FORM.ALERT_SUCCESS_DETAIL(shiftTab, currentRealops, dynamicRenops)
+   );
+   onSaveSuccess?.();
+   onClose();
+ } catch (err: any) {
+   setIsSubmitting(false);
+   setSubmitError(userFriendlyMsg);
+   onSaveFailure?.();
+   showErrorAlert(TEXT_PDO_FORM.ALERT_ERROR_TITLE, userFriendlyMsg);
+ }
```

### B. Status Indikator Badge & Kontrol Bar (`UnifiedRouteControlBar.tsx` & `Dashboard.tsx`)
```diff
- // SEBELUM (BUG-148-02): Status statis, tidak ada penanganan "failed", dashboardModals membuang callback
- const statusLabel = reportStatus === "verified" ? "Terverifikasi" : reportStatus === "submitted" ? "Terkirim" : "Laporan A2";
- <A2ReportModal ... onOperationalStatusChange={undefined} />
+ // SESUDAH: Dinamis per shift, mendukung "failed" badge merah, sinkron real-time ke useDashboardFleet
+ const getBadgeLabel = () => {
+   if (reportStatus === "failed") return TEXT_PDO_FORM.STATUS_FAILED;
+   if (reportStatus === "verified") return TEXT_PDO_FORM.STATUS_VERIFIED;
+   if (confirmedShifts?.[1] && confirmedShifts?.[2]) return TEXT_PDO_FORM.STATUS_SUBMITTED_BOTH;
+   if (confirmedShifts?.[1]) return TEXT_PDO_FORM.STATUS_SUBMITTED_SHIFT_1;
+   if (confirmedShifts?.[2]) return TEXT_PDO_FORM.STATUS_SUBMITTED_SHIFT_2;
+   return reportStatus === "submitted" ? TEXT_PDO_FORM.STATUS_SUBMITTED : TEXT_PDO_FORM.BTN_REPORT_A2;
+ };
+ <A2ReportModal ... onSaveSuccess={() => { onOperationalStatusChange("submitted"); onRefreshFleetData?.(); }} />
```

### C. Sinkronisasi Cross-Component & Fallback Defensif (`allRouteMonitoringService.ts`)
```diff
- // SEBELUM (BUG-148-03): allRouteMonitoringService hanya query daily_route_reports
- const realopsS1 = todayReport?.realops_shift1 ?? 0;
- const realopsS2 = todayReport?.realops_shift2 ?? 0;
+ // SESUDAH: Dual-sync di A2ReportModal + defensive fallback ke daily_fleet_shifts di allRouteMonitoringService
+ const fsS1 = fleetShifts.find((fs) => fs.route_id === r.id && fs.shift === 1);
+ const fsS2 = fleetShifts.find((fs) => fs.route_id === r.id && fs.shift === 2);
+ const realopsS1 = (todayReport?.realops_shift1 !== undefined && todayReport.realops_shift1 > 0)
+   ? todayReport.realops_shift1
+   : (fsS1?.realops ?? 0);
+ const isFleetConfirmedS1 = Boolean(todayReport?.is_fleet_confirmed_s1 || fsS1?.is_confirmed);
```

### D. Prefill Amnesia & Ketahanan Data Tersimpan (`A2ReportModal.tsx`)
```diff
- // SEBELUM (BUG-148-04): State form selalu di-reset ke nilai default setiap modal dibuka atau shift berganti
- setTargetRenops(defaultRenops);
- setUnitStatuses(initialStatuses);
+ // SESUDAH: Cek database via fetchDailyFleetShift terlebih dahulu
+ const savedShift = await fetchDailyFleetShift(routeId, selectedDate, shiftTab);
+ if (savedShift) {
+   setIsAlreadySaved(true);
+   setTargetRenops(savedShift.target_renops);
+   // Restore status unit & catatan...
+ }
```

---

## 3. Case: Skenario Lapangan

### Skenario 1: Petugas Mengirim Laporan A2 Shift 1 di Pool
- **Kondisi:** Petugas lapangan PDO membuka modal Laporan A2 pada pukul 05:45 WIB untuk rute JAK.10B, mencatat 12 unit SGO dan 2 unit Non-SGO (1 Mogok TO, 1 Service AP).
- **Aksi:** Petugas menekan tombol `[Kirim Laporan A2 Shift 1]`.
- **Hasil:**
  1. Tombol langsung berubah menampilkan spinner berputar dan teks "Menyimpan Laporan...". Semua input terkunci sehingga petugas tidak bisa melakukan submit ganda secara tidak sengaja.
  2. Dialog SweetAlert2 muncul secara jelas di tengah layar: *"Laporan A2 Berhasil Dikirim"* dengan rincian: *"Shift 1: Realops 12 dari Renops 14 unit"*.
  3. Badge Laporan A2 di header berubah menjadi biru dengan teks *"Shift 1 Terkirim"*.
  4. Pada menu Monitoring Wilayah 18 Rute dan Generator Laporan WhatsApp Pengawas, rute JAK.10B langsung menunjukkan status *"Terkirim"* dan Realops Shift 1 terisi 12 unit tanpa menunggu sinkronisasi manual.

### Skenario 2: Gangguan Koneksi Internet / Timeout saat Pengiriman
- **Kondisi:** Petugas berada di area terminal/pool dengan sinyal lemah. Ketika menekan tombol kirim, koneksi timeout.
- **Aksi:** Tombol ditekan, request jaringan gagal.
- **Hasil:**
  1. Form modal **TIDAK tertutup** dan data yang telah diketik petugas **TIDAK hilang**.
  2. Muncul banner merah di dalam modal: *"Koneksi terputus saat menyimpan. Data Anda tetap aman di formulir ini"* disertai tombol `[Coba Lagi]`.
  3. Notifikasi error ramah non-teknis muncul memberi tahu kondisi jaringan.
  4. Badge Laporan A2 di header berubah menjadi merah: *"Gagal Kirim"*, menandakan data belum tersimpan di server.
  5. Setelah sinyal kembali pulih, petugas cukup menekan `[Coba Lagi]` dan data langsung terkirim tanpa perlu input ulang dari nol.

### Skenario 3: Buka Ulang Modal untuk Pengecekan / Edit Shift
- **Kondisi:** Pengawas atau petugas membuka kembali modal Laporan A2 yang sebelumnya telah dikirim pada Shift 1.
- **Hasil:**
  1. Modal mendeteksi data tersimpan dari `daily_fleet_shifts` dan menampilkan banner informatif *"Data Shift 1 telah tersimpan sebelumnya. Anda dapat memperbarui jika ada penyesuaian."*
  2. Seluruh status unit, catatan kendala, dan target renops terisi kembali persis sesuai yang dikirim sebelumnya (tidak ter-reset ke default).
  3. Ketika berpindah ke tab Shift 2, formulir otomatis memuat status Shift 2 (atau default jika Shift 2 belum dikirim).

---

## 4. Status Checklist Verifikasi
- [x] UI feedback konfirmasi sukses & loading state interaktif
- [x] Error handling ramah pengguna dengan in-modal retry banner
- [x] Indikator badge Laporan A2 reaktif (Shift 1 Terkirim, Shift 2 Terkirim, Selesai Terkirim, Gagal Kirim)
- [x] Sinkronisasi ganda ke `daily_route_reports` & log audit
- [x] Defensive fallback di `allRouteMonitoringService.ts`
- [x] Pencegahan prefill amnesia (`fetchDailyFleetShift`)
- [x] Kamus teks sentral `src/constants/texts/text_pdo_form.ts` (Zero hardcoded string)
- [x] Z-index SweetAlert2 toast & modal diatur aman (`z-index: 99999`)
- [x] Seluruh unit test lulus (`pnpm vitest run src/`)
- [x] TypeScript Strict Mode & Vite build lulus 0 error (`pnpm run build`)

