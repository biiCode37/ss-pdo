# REPAIR REPORT: REFACTOR 202
**Modul:** Sinkron Webhook Sheets, Google Apps Script, Tooling Supabase, GitHub Actions
**Tanggal:** 06 November 2026
**Status:** Perubahan repo selesai (BUG-MIG-202-01, 02, 04). Pemilik sudah memperbarui Apps Script master, GitHub Secrets, dan token MCP. Yang tersisa: deploy frontend ke Vercel agar BUG-MIG-202-01 berlaku di produksi.

---

## 1. Implementasi Perbaikan

### A. URL Webhook Mengikuti Proyek Aktif (`src/services/realtimeSyncService.ts`) — BUG-MIG-202-01
- `WEBHOOK_URL` = `VITE_SHEET_SYNC_WEBHOOK_URL` jika diisi; jika tidak, `<VITE_SUPABASE_URL>/functions/v1/sheet-sync-webhook` (garis miring di akhir dibuang). URL proyek lama dihapus dari kode.
- `triggerRealtimeSheetSync` langsung keluar jika `!isSupabaseConfigured`, supaya tidak memanggil URL relatif.
- `WEBHOOK_URL` diekspor untuk keperluan test.

### B. Sumber Apps Script (`scripts/google-apps-script/*.js`) — BUG-MIG-202-02
- `CentralizedMasterRealtimeSync.js`: `SUPABASE_URL` → `https://znchudtormqsgpukibsn.supabase.co`, `SUPABASE_ANON_KEY` → legacy anon key proyek baru. Klaim `ref` di dalam JWT sudah diverifikasi bernilai `znchudtormqsgpukibsn`. Anon key bersifat publik dan juga tertanam di bundle frontend.
- `RouteSheetRealtimeSync.js`: **dihapus** atas persetujuan pemilik. File ini tidak ter-deploy di mana pun. Skrip ini kode mati yang sudah digantikan master sejak refact_165, dan tanpa header auth akan ditolak 401 sejak refact_193. Tidak ada referensi tersisa di kode, kecuali dokumen riwayat refact_155.
- **Langkah pemilik (hanya proyek master):** tempel isi baru `CentralizedMasterRealtimeSync.js` ke proyek Apps Script master, lalu Simpan. Trigger `onEdit` ke 18 spreadsheet **tidak perlu dipasang ulang**, karena trigger merujuk nama fungsi `handleMultiSheetEdit` yang otomatis memakai konstanta baru. Uji dengan menjalankan `checkInstalledTriggers()`, lalu edit satu sel di tab tanggal salah satu spreadsheet rute dan periksa log Eksekusi (harus HTTP 200).

### C. Tooling & Dokumentasi — BUG-MIG-202-04
- `.mcp.json`: `project_ref=znchudtormqsgpukibsn`.
- `supabase link --project-ref znchudtormqsgpukibsn`: `supabase/.temp/project-ref`, `linked-project.json`, dan `pooler-url` kini menunjuk proyek baru (`pusm-db2`, ap-southeast-1).
- `docs/BACKUP_SETUP_GUIDE.md`: contoh `SUPABASE_URL` diperbarui.
- `.env.example`: `VITE_SHEET_SYNC_WEBHOOK_URL` ditandai opsional dan dijadikan komentar.

### D. GitHub Secrets — BUG-MIG-202-03
- Tidak ada perubahan oleh agent. Pemilik memperbarui secret pada 6 Nov 2026. `gh secret list` menunjukkan `SUPABASE_URL` (13:31 UTC), `SUPABASE_SERVICE_ROLE_KEY` (13:34 UTC), dan `SUPABASE_DB_URL` **baru** (13:36 UTC). Nama secret cocok dengan yang dibaca `nightly-backup.yml`.

### E. Tindak Lanjut Pemilik (6 Nov 2026)
- Proyek Apps Script master sudah diperbarui oleh pemilik.
- Token MCP Windows sudah diganti. `get_project_url` MCP kini mengembalikan `https://znchudtormqsgpukibsn.supabase.co`.
- Hak baca `route_sheets` dan `routes` oleh anon (dibutuhkan `syncMonthlyTriggers()` setiap tanggal 1) sudah terverifikasi: grant `SELECT` ada, dan policy `Allow public read *` berlaku untuk `{anon,authenticated}`. Ada 18 baris `route_sheets` untuk periode 2026-11.
- Setelah skrip master diperbarui, `daily_route_reports` tanggal 2026-11-06 (`data_source=sheet_ingestion`) di 6 rute terbarui pada 13:45–13:50 UTC. Ini bukti tidak langsung bahwa jalur Sheets → Supabase kembali berjalan.

---

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| URL webhook di bundle produksi | `sejttnsanzogsykmtwym…/sheet-sync-webhook` (402) | Diturunkan dari `VITE_SUPABASE_URL` → proyek baru (berlaku setelah deploy) |
| Ref proyek lama di build terbaru (graf chunk dari `dist/index.html`) | 1 | **0** (3 ref proyek baru) |
| Apps Script (sumber repo) | URL + anon key proyek lama | URL + anon key proyek baru |
| MCP / Supabase CLI link | Proyek lama | Proyek baru |
| GitHub Secrets | Proyek lama, backup gagal, `SUPABASE_DB_URL` tidak ada | Proyek baru (diperbarui pemilik), `SUPABASE_DB_URL` tersedia |
| `RouteSheetRealtimeSync.js` | Kode mati di repo | Dihapus |

---

## 3. Case: Skenario Lapangan

### Case BUG-MIG-202-01: PDO menyimpan input SS dari aplikasi
- **Situasi:** PDO JAK.60 menyimpan TOA Shift 2. Aplikasi memicu `sheet-sync-webhook` agar `daily_route_reports` dan Monitoring ikut terbarui.
- **Before:** Request menuju proyek lama dan ditolak 402. Monitoring Korwil tidak menampilkan angka baru sampai ada sinkron manual.
- **After:** Request menuju `znchudtormqsgpukibsn.supabase.co/functions/v1/sheet-sync-webhook` tanpa perlu menyetel env tambahan di Vercel.

### Case BUG-MIG-202-02: Petugas mengedit spreadsheet langsung
- **Situasi:** Petugas mengisi KM di Google Sheets rute.
- **Before:** Trigger Apps Script memanggil webhook proyek lama dan gagal, sehingga Supabase tidak terbarui.
- **After (setelah pemilik memperbarui proyek Apps Script master):** Trigger `handleMultiSheetEdit` mengirim event ke webhook proyek baru dengan anon key baru, dan Monitoring terbarui.

### Case BUG-MIG-202-03: Backup malam
- **Situasi:** Workflow `Nightly Dual-Engine Backup` berjalan pukul 02:00 WIB.
- **Before:** Gagal (run 5 Nov 23:53 UTC), dan dump database tidak pernah diambil karena `SUPABASE_DB_URL` tidak ada.
- **After (setelah secrets diperbarui):** Backup data rute dan dump database proyek baru tersimpan ke Google Drive.

---

## 4. Verifikasi

| Gate | Status | Hasil |
|---|---|---|
| 1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` | Lulus | 116/116 tes |
| 2. `pnpm vitest run src/` | Lulus | 145 file, 1.305/1.305 tes (+2 tes `realtimeSyncService.test.ts`: URL turunan & override) |
| 3. `pnpm run build` (`tsc -b` + Vite) | Lulus | exit 0, built in 1,22 s |
| 4. `graphify update .` | Lulus | Graf diperbarui |

Verifikasi tambahan:
- Graf chunk build terbaru: 11 file, 0 ref proyek lama, 3 ref proyek baru. Folder `dist/` menyimpan chunk build lama karena `emptyOutDir: false`, sehingga grep mentah di `dist/assets` tidak representatif.
- Sequence semua tabel proyek baru ≥ `max(id)` (dicek 15 tabel).

**Belum diverifikasi:** webhook dari bundle produksi dan Apps Script ter-deploy (keduanya menunggu deploy/pembaruan oleh pemilik), serta run GitHub Actions setelah secrets diperbarui.
