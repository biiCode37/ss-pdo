# AUDIT TEMUAN PENGHAPUSAN HALAMAN PLOTTING: REFACTOR 206
**Modul:** Plotting Armada Harian, Input SS (BusList, BusCard, modal Trip), Dashboard/BottomNav, Supabase `daily_route_plottings`
**Fokus Masalah:** Halaman Plotting tidak lagi dibutuhkan (keputusan bersama). Halaman beserta seluruh komponen Input SS yang tampil/bekerja karena data Plotting wajib dihapus total. Ritase hanya diinput lewat Input SS (Set Jumlah Trip & kartu unit).

---

### ID Temuan: BUG-PLOT-206-01
- **Lokasi Kode:** `src/components/plotting/*`, `src/services/dailyPlottingService.ts`, `src/utils/plottingOrderUtils.ts`, `src/constants/texts/text_plotting.ts`, `src/components/BottomNav.tsx`, `src/components/dashboard/DashboardContentTabs.tsx`, `src/components/dashboard/useDashboardUiState.ts`, `src/types/pageManagement.ts`
- **Keparahan:** Medium (fitur tidak dipakai tapi tetap tampil, dimuat, dan bisa menulis ke Spreadsheet)
- **Deskripsi:** Tab "Plotting" masih ada di navigasi bawah dan swipe, halaman masih bisa menulis trip + keterangan massal ke Spreadsheet, dan kunci `plotting` masih terdaftar di `PageKey`/`DEFAULT_PAGE_SETTINGS`.
- **Dampak User:** PDO/Korlap melihat menu yang tidak lagi dipakai dan berisiko menimpa trip/keterangan SS lewat jalur yang tidak resmi.
- **Mitigasi:** Hapus folder plotting, service, util, kamus teks, tab navigasi, kunci halaman, dan test terkait.

### ID Temuan: BUG-PLOT-206-02
- **Lokasi Kode:** `src/components/Dashboard.tsx` (efek `fetchDailyPlotting`)
- **Keparahan:** Low (1 query Supabase per ganti rute/tanggal tanpa manfaat)
- **Deskripsi:** Dashboard selalu mengambil data `daily_route_plottings` + cache localStorage setiap rute/tanggal berubah, untuk diteruskan ke Input SS.
- **Dampak User:** Kuota REST/Egress terpakai untuk data yang tidak dibutuhkan.
- **Mitigasi:** Hapus state `currentPlotting` beserta efek fetch-nya.

### ID Temuan: BUG-PLOT-206-03
- **Lokasi Kode:** `src/components/busList/BusList.tsx`, `BusListControlBar.tsx`, `BusListHeader.tsx`, `busListUtils.ts` (`FleetSortView`), `src/components/busCard/BusCard.tsx`
- **Keparahan:** Medium (UI Input SS bergantung pada data yang dihapus)
- **Deskripsi:** Input SS menampilkan selector "Semua / 📍 Base A / 📍 Base B" (filter + urut antrean Plotting) dan badge `#urutan` + `📍 titik start` di kartu unit. Nama titik diambil dari `routeEndpointUtils` yang dibuat khusus untuk Plotting.
- **Dampak User:** Tanpa Plotting, selector Base A/B selalu kosong dan membingungkan.
- **Mitigasi:** Hapus selector, badge, prop `plotting`/`plottingItem`/`endpointA/BName`, `FleetSortView`, `routeEndpointUtils` (+test), dan teks `SORT_VIEWS`.

### ID Temuan: BUG-PLOT-206-04
- **Lokasi Kode:** `src/components/busCard/modal/BusInputModalTrip.tsx`, `singleFocus/SingleFocusTrip.tsx`, `src/utils/smartRitaseUtils.ts`
- **Keparahan:** High (risiko data trip terbalik masuk SS)
- **Deskripsi:** Panel "Smart Ritase" (Start Awal, Target, Auto-Set, stepper ±0,5, Titik Akhir, validasi arah) memecah ritase setengah memakai titik start dari Plotting. Tanpa Plotting semua unit dianggap start dari Titik A.
- **Dampak User:** Unit start B dengan 7,5 rit akan terisi Pergi 8/Pulang 7 (terbalik) via Auto-Set, atau mendapat peringatan merah palsu saat PDO mengetik benar (7/8).
- **Mitigasi:** Hapus Smart Ritase total (keputusan pengguna); kembalikan form Trip ke 2 kolom pergi/pulang + Total Ritase (PP), warna diganti token semantik.

### ID Temuan: BUG-PLOT-206-05
- **Lokasi Kode:** `src/utils/operationalStatusUtils.ts` (`isBusNonOperational`, `getNonOperationalBannerType`), `useBusInputForm.ts`
- **Keparahan:** Low (aturan bercabang pada data yang dihapus)
- **Deskripsi:** Status non-operasional memakai `plottingItem.target_ritase/status` sebagai "rencana beroperasi" saat trip kosong.
- **Dampak User:** Tidak ada setelah Plotting hilang, tapi cabang mati membuat aturan sulit dipahami.
- **Mitigasi:** Sederhanakan: ritase (pergi+pulang)/2 > 0 = beroperasi; selain itu non-operasional. Hasil identik dengan perilaku saat tidak ada data plotting.

### ID Temuan: BUG-PLOT-206-06
- **Lokasi Kode:** Supabase `public.daily_route_plottings` (RLS), `public.app_page_settings` (baris `plotting`)
- **Keparahan:** High (pelanggaran aturan RLS anti-privilege escalation)
- **Deskripsi:** Tabel `daily_route_plottings` punya policy INSERT/UPDATE/DELETE/SELECT untuk role `anon` (`USING (true)`). Isi 11 baris (9 rute, terakhir 2026-11-05), tidak dipakai.
- **Dampak User:** Siapa pun dengan anon key bisa mengubah/menghapus tabel; data tidak bernilai.
- **Mitigasi:** Migrasi `20261106000003_drop_daily_route_plottings.sql`: `DROP TABLE` + hapus baris `plotting` di `app_page_settings`.
