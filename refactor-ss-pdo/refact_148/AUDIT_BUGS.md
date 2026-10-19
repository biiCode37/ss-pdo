# AUDIT BUGS — Laporan A2 Armada (Refactor 148)

Tanggal Audit: 19 Oktober 2026  
Branch: `devmode`  
Domain: Laporan Harian A2 Armada (`A2ReportModal`, `UnifiedRouteControlBar`, `useDashboardFleet`, `daily_fleet_shifts`, `daily_route_reports`)

---

## 1. Daftar Temuan Bug & Inkonsistensi

### BUG-148-01: Tidak Ada Feedback UI Hasil Submit Laporan A2
- **Lokasi Kode:** `src/components/pdoReport/A2ReportModal.tsx` (`handleSubmit`)
- **Keparahan:** High
- **Deskripsi:** Setelah user menekan tombol "Kirim Laporan A2 Shift {shift}", modal hanya memicu `showSuccessToast` lalu langsung menutup modal seketika (`onClose()`). SweetAlert2 toast `pdoToast` tidak memiliki container kelas dengan z-index tinggi di atas layout overlay modal, dan toast berdurasi pendek (2.5s) mudah terlewat/tidak terlihat oleh user. Jika terjadi kegagalan jaringan atau database, modal tidak memiliki in-modal error alert banner maupun opsi coba lagi (*retry*).
- **Dampak User:** Petugas PDO di lapangan tidak mengetahui secara pasti apakah laporan berhasil dikirim ke server atau gagal, menimbulkan keraguan dan potensi submit ganda berulang-ulang.
- **Mitigasi:**
  1. Tampilkan state loading aktif dan spinner pada tombol submit dan kunci seluruh input form (pencegahan double submit).
  2. Saat berhasil, tampilkan dialog konfirmasi sukses SweetAlert2 (`showSuccessAlert` / modal status sukses) yang jelas dan ramah pengguna sebelum modal ditutup.
  3. Saat gagal, pertahankan modal tetap terbuka (data tidak hilang), tampilkan in-modal error banner merah dengan tombol "Coba Lagi" (*retry*), serta dialog error informatif SweetAlert2.

---

### BUG-148-02: Badge dan Tombol "Laporan A2" Tidak Mengalami Perubahan Status Sebelum/Sesudah Submit / Gagal
- **Lokasi Kode:**
  - `src/components/dashboard/DashboardModals.tsx` (tidak meneruskan `onSaveSuccess`, mengabaikan `onOperationalStatusChange: _onOperationalStatusChange`)
  - `src/components/dashboard/useDashboardFleet.ts` (tidak menyediakan mekanisme refresh real-time dan mengabaikan status armada `daily_fleet_shifts` jika baris `daily_route_reports` belum ada)
  - `src/components/routeSelector/UnifiedRouteControlBar.tsx` (tipe status hanya `"draft" | "submitted" | "verified"`, tidak memiliki status `"failed"`, serta tidak menampilkan indikator shift mana yang sudah terkirim)
- **Keparahan:** Critical
- **Deskripsi:** Callback keberhasilan submit `onSaveSuccess` tidak disambungkan ke `A2ReportModal` di `DashboardModals.tsx`. Akibatnya, setelah Laporan A2 berhasil dikirim ke database, state `operationalReportStatus` dan `confirmedShifts` di `Dashboard.tsx` tidak pernah diperbarui. Tombol "Laporan A2" di control bar tetap berstatus "draft" (warna kuning amber) seolah-olah laporan belum pernah dikirim. Selain itu, tidak ada visualisasi status `"failed"` (warna merah) saat pengiriman gagal.
- **Dampak User:** Petugas merasa laporannya tidak tersimpan karena tombol/badge di layar utama tidak pernah berubah warna atau label menjadi "Terkirim" / "Shift 1 Terkirim".
- **Mitigasi:**
  1. Tambahkan status `"failed"` pada `operationalReportStatus` di `useDashboardFleet`, `UnifiedRouteControlBar`, dan `RouteSelectorCard`.
  2. Sambungkan `onSaveSuccess` dan `onSaveFailure` dari `A2ReportModal` melalui `DashboardModals` ke `Dashboard.tsx`.
  3. Sediakan fungsi `refreshFleetData` pada `useDashboardFleet` yang memuat ulang status `daily_fleet_shifts` dan `daily_route_reports` secara instan begitu laporan berhasil disimpan.
  4. Perkaya visualisasi tombol di `UnifiedRouteControlBar`:
     - `"verified"`: Hijau (`Terverifikasi`)
     - `"submitted"`: Biru / Cyan (`Shift 1 Terkirim` / `Shift 2 Terkirim` / `Selesai Terkirim`)
     - `"failed"`: Merah (`Gagal Kirim` dengan tooltip instruksi klik untuk coba lagi)
     - `"draft"`: Kuning Amber (`Laporan A2`)

---

### BUG-148-03: Putusnya Integrasi Sinkronisasi ke `daily_route_reports` (Data Gagal Tampil di Monitoring 18 Rute & WA Report)
- **Lokasi Kode:**
  - `src/components/pdoReport/A2ReportModal.tsx`
  - `src/services/allRouteMonitoringService.ts`
  - `src/services/dailyRouteReportService.ts`
- **Keparahan:** Critical
- **Deskripsi:** Saat ini `A2ReportModal` hanya melakukan upsert ke tabel `daily_fleet_shifts`. Padahal seluruh agregasi monitoring regional (monitoring 18 rute di `allRouteMonitoringService.ts`, status ringkasan di `MonitoringRoutesTab.tsx`, serta Format 1 & 2 di `MonitoringWaReportTab.tsx`) membaca data dari tabel `daily_route_reports`. Karena tabel `daily_route_reports` tidak disinkronkan saat Laporan A2 dikirim, Realops rute di dashboard monitoring wilayah tetap bernilai 0 dan status rute tetap terbaca `empty`/`draft`.
- **Dampak User:** Korlap, Korwil, dan pimpinan yang memantau monitoring 18 rute melihat laporan masih kosong, meskipun petugas PDO sudah mengirim Laporan A2 di lapangan.
- **Mitigasi:**
  1. Di dalam proses simpan Laporan A2, lakukan sinkronisasi ganda (*dual sync*): selain menyimpan ke `daily_fleet_shifts`, lakukan pembaruan data `daily_route_reports` (`renops_shift1`/`realops_shift1` atau `renops_shift2`/`realops_shift2`, `is_fleet_confirmed_s1`/`s2`, `fleet_status_shift1`/`s2`, serta `status: 'submitted'`).
  2. Tambahkan pencatatan audit log append-only ke `fleet_status_logs` untuk auditibilitas.
  3. Berikan fallback pencarian ke `daily_fleet_shifts` di `allRouteMonitoringService.ts` untuk menjamin ketahanan data (*data resilience*).

---

### BUG-148-04: Kehilangan Data Tersimpan Saat Modal Dibuka Kembali (*Prefill Amnesia*)
- **Lokasi Kode:** `src/components/pdoReport/A2ReportModal.tsx` (`useEffect`)
- **Keparahan:** High
- **Deskripsi:** Saat user membuka `A2ReportModal` atau beralih shift (Shift 1 ke Shift 2), modal selalu mengisi ulang (*prefill*) nilai input murni dari data baris spreadsheet saat ini. Modal sama sekali tidak pernah mengecek apakah shift tersebut sudah memiliki data yang tersimpan di `daily_fleet_shifts`.
- **Dampak User:** Jika petugas sudah mengedit catatan unit non-SGO dan mengirimnya, lalu membuka kembali modal untuk mengecek atau menambahkan unit lain, seluruh catatan tersimpan sebelumnya hilang digantikan oleh prefill mentah spreadsheet.
- **Mitigasi:**
  1. Saat modal dibuka atau tab shift diubah, panggil `fetchDailyFleetShift(routeId, selectedDate, shift)`.
  2. Jika data tersimpan ditemukan di database, gunakan data tersimpan tersebut sebagai nilai form utama dan tampilkan banner informatif "Tersimpan di server pada {waktu}".
  3. Jika data tersimpan belum ada, gunakan fallback prefill otomatis dari spreadsheet.

---

### BUG-148-05: Pelanggaran Standar Kamus Teks Sentral (Hardcoded UI Strings) & Styling Toast Z-Index
- **Lokasi Kode:**
  - `src/components/pdoReport/A2ReportModal.tsx` (teks "Shift 1 (Pagi)", "Shift 2 (Siang/Sore)", `aria-label="Pilih Nomor Body Unit"`)
  - `src/utils/swalBase.ts` & `src/index.css` (`pdoToast` tidak memiliki container kelas z-index `99999`)
- **Keparahan:** Medium
- **Deskripsi:** Terdapat string teks antarmuka yang ditulis langsung (hardcoded) di dalam komponen, melanggar Golden Rule Proyek SS_PDO. Selain itu, container SweetAlert2 toast tidak memiliki styling container khusus yang menjamin posisi z-index di atas seluruh lapisan modal.
- **Dampak User:** Potensi inkonsistensi bahasa dan toast notifikasi tertutup oleh elemen modal.
- **Mitigasi:**
  1. Pindahkan seluruh string teks antarmuka ke `src/constants/texts/text_pdo_form.ts` di bawah namespace `A2_REPORT`.
  2. Tambahkan unit test pada `src/constants/texts/texts.test.ts`.
  3. Terapkan kelas container pada `pdoToast` dengan z-index `99999 !important`.
