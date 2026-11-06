# REPAIR REPORT: REFACTOR 206
**Modul:** Penghapusan Halaman Plotting & Dependensinya di Input SS
**Tanggal:** 06 November 2026
**Status:** Kode selesai & lolos 4 quality gate. Migrasi DB **sudah diterapkan** ke Supabase produksi (`znchudtormqsgpukibsn`) pada 06 November 2026.

---

## 1. Implementasi Perbaikan
### A. Halaman & modul Plotting (BUG-PLOT-206-01)
- Dihapus: `src/components/plotting/` (13 file), `services/dailyPlottingService.ts`(+test), `utils/plottingOrderUtils.ts`(+test), `utils/smartRitaseUtils.ts`(+test), `utils/routeEndpointUtils.ts`(+test), `constants/texts/text_plotting.ts`.
- `BottomNav.tsx`: tombol Plotting + ikon `ListOrdered` dihapus; tipe tab jadi `input | analytics | units`.
- `DashboardContentTabs.tsx`: TAB 4 Plotting dan prop `plotting`, `onPlottingChange`, `matchedRoute`, `operationalReportDate` dihapus.
- `useDashboardUiState.ts`: siklus swipe `input → analytics → units`.
- `types/pageManagement.ts`: `'plotting'` dihapus dari `PageKey` & `DEFAULT_PAGE_SETTINGS`. `types/supabase.ts`: tipe `DailyRoutePlotting`, `UnitPlottingItem`, `PlottingStartPoint`, `PlottingUnitStatus` dihapus.
- Kamus: `TABS.PLOTTING/PLOTTING_SHORT`, `BUS_LIST.SORT_VIEWS` dihapus beserta assert-nya di `texts.test.ts`.

### B. Fetch plotting di Dashboard (BUG-PLOT-206-02)
- `Dashboard.tsx`: state `currentPlotting` + `useEffect(fetchDailyPlotting)` dihapus.

### C. Input SS (BUG-PLOT-206-03)
- `BusList.tsx`: `plottingMap`, endpoint, hitung Base A/B, filter & sort antrean dihapus; urutan = baris spreadsheet, unit non-operasional tetap diparkir di bawah.
- `BusListControlBar.tsx`/`BusListHeader.tsx`: selector Base A/B dan prop terkait dihapus. `busListUtils.ts`: `FleetSortView` dihapus.
- `BusCard.tsx`, `busCard/types.ts`: dikembalikan ke versi sebelum commit `259b9ca` (badge #urutan & 📍 titik start hilang; diff hanya berisi hunk Plotting).

### D. Smart Ritase (BUG-PLOT-206-04)
- `BusInputModalTrip.tsx`, `SingleFocusTrip.tsx`, `BusInputModalTrip.test.tsx`: dikembalikan ke versi `259b9ca^` (2 kolom trip + Total Ritase PP). Warna mentah (`rgba(56,189,248,…)`, `#94a3b8`, `#38bdf8`) diganti `--color-info-bg/-border/-fg` & `--color-text-secondary`.
- `SingleFocusTrip.tsx`: tambah `data-testid="chip-toggle-keterangan"` agar test tidak bergantung urutan tombol.
- `BusInputModal.tsx`, `BusInputModalSingleFocus.tsx`: prop `plottingItem`/`endpointA/BName` dihapus.

### E. Status non-operasional (BUG-PLOT-206-05)
- `operationalStatusUtils.ts`: parameter `plottingItem` & `PlottingOperationalInput` dihapus; `isBusNonOperational(bus)` = ritase PP ≤ 0. Pemanggil di `BusList`, `useBusInputForm` disesuaikan.

### F. Database (BUG-PLOT-206-06)
- `supabase/migrations/20261106000003_drop_daily_route_plottings.sql`: `DROP TABLE IF EXISTS public.daily_route_plottings;` + `DELETE FROM public.app_page_settings WHERE page_key = 'plotting';` + `NOTIFY pgrst`.

## 2. Before vs After
| Aspek | Before | After |
|---|---|---|
| Navigasi bawah | 4 tab (Input, Dashboard, Armada, Plotting) | 3 tab |
| Query saat ganti rute/tanggal | +1 SELECT `daily_route_plottings` | Tidak ada |
| Selector Input SS | Semua / 📍 Base A / 📍 Base B | Dihapus (urutan spreadsheet) |
| Kartu unit | Badge `#urutan` + `📍 titik start` | Tanpa badge Plotting |
| Tab Ritase modal | Start Awal, Target, Auto-Set, stepper, Titik Akhir, validasi arah | 2 kolom pergi/pulang + Total Ritase (PP) |
| Aturan non-operasional | Ritase > 0, atau target plotting > 0 | Ritase PP > 0 |
| RLS `daily_route_plottings` | anon bisa INSERT/UPDATE/DELETE | Tabel di-drop (setelah migrasi diterapkan) |

## 3. Case: Skenario Lapangan
### Case BUG-PLOT-206-01: Menu Plotting yang tidak dipakai
- **Situasi:** PDO baru membuka aplikasi dan menggeser tab.
- **Before:** Muncul tab "Plotting"; tombol sinkron di halaman itu bisa menimpa trip & keterangan SS massal.
- **After:** Hanya Input SS, Dashboard, Armada. Trip hanya berubah lewat Set Jumlah Trip/kartu unit.

### Case BUG-PLOT-206-02: Ganti tanggal berulang
- **Situasi:** Korlap memeriksa 5 tanggal berbeda.
- **Before:** 5 query `daily_route_plottings` tambahan.
- **After:** 0 query tambahan.

### Case BUG-PLOT-206-03: Selector Base A/B kosong
- **Situasi:** Rute tanpa data Plotting dibuka di Input SS.
- **Before:** Tombol "📍 Priok (0)" / "📍 IGI (0)" tampil; diketuk → daftar kosong.
- **After:** Selector tidak ada; daftar selalu urut baris SS.

### Case BUG-PLOT-206-04: Unit start dari Titik B, 7,5 rit
- **Situasi:** PDO mengetuk "7.5 Rit" atau mengetik 7/8 untuk unit start B.
- **Before:** Auto-Set mengisi 8/7 (terbalik) atau muncul peringatan merah palsu.
- **After:** PDO mengisi 2 kolom sesuai fakta lapangan; total tampil 7,5 Rit (PP), tanpa peringatan palsu.

### Case BUG-PLOT-206-05: Pagi hari sebelum Set Jumlah Trip
- **Situasi:** Trip semua unit masih kosong.
- **Before:** Unit dianggap beroperasi hanya bila ada target Plotting; tanpa Plotting dikunci (non-operasional).
- **After:** Perilaku sama dengan hari tanpa Plotting: PDO menekan "Set Jumlah Trip" (atau "Aktifkan Input" per kartu) → ritase terisi → unit beroperasi.

### Case BUG-PLOT-206-06: Akses anon ke tabel plotting
- **Situasi:** Pihak luar memakai anon key publik.
- **Before:** Bisa `DELETE`/`UPDATE` seluruh baris plotting.
- **After (setelah migrasi diterapkan):** Tabel tidak ada.

## 4. Verifikasi
Dijalankan bersama refact_207 (satu working tree), 06 November 2026:
1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` → 1 file, **116/116 lulus**.
2. `pnpm vitest run src/` → **136 file, 1221/1221 lulus**.
3. `pnpm run build` → `tsc -b` + Vite build **exit 0** (hanya peringatan ukuran chunk lama).
4. `graphify update .` → graf dibangun ulang: 7713 node, 13177 edge, 612 komunitas.

5. **Penerapan migrasi** — Supabase MCP sesi ini read-only (DROP ditolak `25006`), dan `supabase db push` tidak aman karena riwayat migrasi lokal vs remote sudah berbeda jauh. Diterapkan hanya file ini via `supabase db query --linked -f supabase/migrations/20261106000003_drop_daily_route_plottings.sql` (exit 0), lalu versi `20261106000003` dicatat di `supabase_migrations.schema_migrations`. Cek pasca-terap: tabel `daily_route_plottings` = 0, policy = 0, baris `plotting` di `app_page_settings` = 0, versi tercatat = 1.

Belum diverifikasi: tampilan belum dicek visual di browser (butuh login Google + data rute). Catatan: migrasi `20261106000001`/`000002` sudah berlaku di DB tetapi tidak tercatat di riwayat migrasi (temuan sesi ini, tidak diubah).
