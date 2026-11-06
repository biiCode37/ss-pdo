---
name: ss-pdo-architecture
description: Peta arsitektur SS_PDO (React 19 + Vite PWA + Supabase + Google Sheets) — folder, service, tabel, Edge Function, halaman/RBAC, dan pola wajib anti-loop/realtime. Pakai sebelum menjelajah kode untuk fitur, debug, audit, atau refactor, agar langsung ke file yang tepat tanpa membaca ulang banyak file.
---

# Peta Arsitektur SS_PDO

Gunakan peta ini untuk langsung menuju file yang relevan. Untuk detail yang tidak ada di sini, query graphify (`graphify-out/`) sebelum grep luas. Verifikasi path bila ragu — peta ini ringkasan, bukan pengganti kode.

## Stack
React 19 + TypeScript 6 (strict) + Vite 8 + vite-plugin-pwa, Vitest 4 (happy-dom), oxlint, pnpm. Data: Google Sheets (SSOT input lapangan) + Supabase (Postgres, RLS, Realtime, Edge Functions Deno). UI: SweetAlert2, lucide-react, CSS token (tanpa Tailwind).

## Entry & alur auth
- `src/main.tsx` → `src/App.tsx`: `initGoogleApi` → `checkSignedInAsync` → `verifyUserProfile(email)` (allowlist `user_profiles`). Identitas disimpan di localStorage: `PDO_USER_EMAIL`, `PDO_USER_ID`, `PDO_USER_ROLE`.
- `src/context/PageAccessContext.tsx` — akses halaman per role dari `app_page_settings`.
- `src/components/Dashboard.tsx` — shell utama & navigasi halaman (`BottomNav.tsx`).

## Halaman (`PageKey` di `src/types/pageManagement.ts`)
`dashboard`, `regional_monitoring`, `user_management`, `input`, `analytics`, `units`, `plotting`, `regional_summary`, `regional_wa_report`, `a2_report`, `accumulation`. Kategori: `page | tab | modal`.

Role (RBAC): `superadmin`, `admin`, `korwil`, `korlap`, `pdo`. Warna badge pakai token `--color-role-*` (`RoleBadge.tsx`).

## Struktur `src/`
| Folder | Isi |
|---|---|
| `components/*.tsx` (root) | Banyak file root hanya **facade re-export** (mis. `BusList.tsx` → `busList/BusList`). Edit di subfolder. |
| `components/busList/` | Halaman Input SS: daftar unit, alur Satset, bulk ops (`useBulkOperations.ts`). |
| `components/busCard/modal/` | Form input bus: `useBusInputForm.ts`, `busInputPayload.ts` (payload builder), `busInputValidation.ts`, tab Shift1/Shift2/Trip/SingleFocus. |
| `components/monitoring/` | Monitoring 18 rute (`AllRouteMonitoringPage.tsx`) — contoh referensi pola realtime + guard. |
| `components/plotting/` | Plotting harian (`DailyPlottingPage.tsx`, order modal). |
| `components/accumulation/`, `waReport/`, `pdoReport/`, `fleetStatus/`, `pageManagement/`, `userManagement/`, `dashboard/`, `dailyToaTrend/` | Fitur per domain. |
| `services/googleSheets/` | Baca/tulis Sheets — lihat skill `ss-pdo-sheets`. |
| `services/routes/` | Rute, users, audit (`logActivity`), sync. `services/routeService.ts` = facade. |
| `services/*Service.ts` | `allRouteMonitoringService`, `dailyRouteReportService`, `dailyPlottingService`, `fleetStatusService`, `fleetResolutionService`, `regionalIngestionService`, `monthlyMasterIngestionService`, `realtimeSyncService`, `adminActionService`, `pageManagementService`, `appSettingsService`. Klien: `services/supabase.ts`. |
| `utils/` | Util murni + test berdampingan. Penting: `numberUtils` (`parseIndonesianNumber`), `keteranganUtils`, `operationalStatusUtils` (`isUnitNonOperational`), `smartRitaseUtils`, `sheetColorUtils` (SSOT warna Sheets — jangan dipakai untuk UI), `cacheUtils` (`CURRENT_CACHE_VERSION`), `errorFormatter`/`errorClassifier`, `alertUtils`/`swalBase`, `themeUtils` (`syncThemeChrome`). |
| `utils/modals/busInput/` | Template & handler modal SweetAlert input bus. |
| `constants/texts/` | Kamus teks UI per domain (`text_*.ts`, diekspor via `index.ts`, diuji `texts.test.ts`). |
| `styles/tokens/` | `primitives.css` → `semantic.css` (token dipakai UI), `color-contract.test.ts`. |
| `hooks/` | `useOfflineSync`, `usePreviousDayOdometer`, `useUserActivityTracking`, `useVisualViewport`, `useMobileBackHandler`. |

## Supabase
Tabel (public): `routes`, `route_sheets` (whitelist spreadsheet per rute/bulan), `route_operators`, `operators`, `user_profiles`, `roles`, `app_page_settings`, `app_settings`, `daily_route_reports`, `daily_fleet_shifts`, `daily_fleet_non_sgo_units`, `daily_unit_summaries`, `daily_route_plottings`, `fleet_statuses`, `fleet_status_logs`, `activity_logs`, `sync_queue_backups`.

Migrasi: `supabase/migrations/` (urut timestamp). Mutasi admin (role, status aktif, page settings) **wajib** lewat RPC `SECURITY DEFINER` / Edge Function `admin-action`, bukan update langsung dari klien.

Edge Functions (`supabase/functions/`):
- `sheets-proxy` — proxy Google Sheets API dengan service account; validasi `spreadsheetId` (regex + whitelist `route_sheets`, cache TTL), action: `health`, get/values/batchGet, `values.batchUpdate`, `batchUpdate`.
- `admin-action` — aksi admin: `create_admin_session`, `update_user_role`, `toggle_user_status`, `add_user_profile`, `set_page_setting`, `update_page_permissions`, `bulk_update_page_settings`.
- `sheet-sync-webhook` — sinkron Sheets → `daily_route_reports` (dipicu `triggerRealtimeSheetSync`).

Untuk inspeksi skema/RLS/log produksi gunakan Supabase MCP (read-only): `list_tables`, `get_advisors`, `query_logs`, `execute_sql` (SELECT saja).

## Pola wajib (salin dari kode yang sudah ada)
- **In-flight guard**: `isFetchingRef` + early return untuk silent refresh — contoh `AllRouteMonitoringPage.tsx` (sekitar baris 142–200).
- **Realtime listener**: `postgres_changes` dibungkus debounce ≥ 3000 ms, cleanup `clearTimeout` + `supabase.removeChannel` — contoh `AllRouteMonitoringPage.tsx` (sekitar 217–246). Pengecualian: listener yang hanya memakai `payload.new` tanpa memicu query (mis. `subscribeToPageSettings` di `pageManagementService.ts`) tidak perlu debounce, tapi tetap wajib `removeChannel` saat cleanup.
- **Broadcast antar perangkat**: `realtimeSyncService.ts` (`broadcastBusUpdate`, `subscribeToBusUpdates`, channel per `sheetId+tabName`).
- **Jangan** taruh state yang di-set fungsi ke dependency array-nya sendiri; pakai `useRef`.
- **Log audit**: 1 baris `logActivity` per aksi batch (lihat `updateBulkBusData`).
- Test unit jaringan: assert `toHaveBeenCalledTimes(1)` saat mount + debounce meredam event beruntun.

## Domain
- 1 ritase = PP = 2 trip. Ritase PP = `(tripPergi + tripPulang) / 2` atau `totalKm / km_baku` (lihat `allRouteMonitoringService.ts`, `dailyPlottingService.ts`).
- Unit non-operasional (ritase 0/kosong/OFF/LIBUR/NP) → `operationalStatusUtils.isUnitNonOperational`; dilewati Satset, diparkir di bawah, tanpa nomor urut.
- Angka dari Sheets selalu lewat `parseIndonesianNumber` ("5.589,06", "4.670").
