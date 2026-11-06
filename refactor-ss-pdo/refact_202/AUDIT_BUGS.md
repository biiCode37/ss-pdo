# AUDIT TEMUAN SISA KONFIGURASI PASCA-MIGRASI PROYEK SUPABASE: REFACTOR 202
**Modul:** Sinkron Webhook Sheets (frontend), Google Apps Script, Konfigurasi Tooling (MCP, Supabase CLI), GitHub Actions
**Fokus Masalah:** Setelah migrasi darurat 6 Nov 2026 dari proyek `sejttnsanzogsykmtwym` ke `znchudtormqsgpukibsn`, ada bagian kode dan konfigurasi yang masih menunjuk ke proyek lama yang sedang diblokir (402).

## Metode
- Grep seluruh repo (di luar `node_modules`, `dist*`, `graphify-out`, `.git`, `.worktrees`) untuk ref proyek lama dan literal JWT.
- Memindai bundle produksi `https://bionex-pusm.vercel.app` (seluruh chunk JS) untuk host `*.supabase.co`.
- `gh secret list` dan `gh run list` untuk konfigurasi GitHub Actions.
- Memastikan nilai sequence ≥ `max(id)` di semua tabel proyek baru. Hasil: semua aman, tidak ada temuan.

Dokumen historis (`refactor-ss-pdo/refact_*`, `docs/superpowers/plans/*`) sengaja **tidak diubah** karena merupakan catatan riwayat.

---

### ID Temuan: BUG-MIG-202-01
- **Lokasi Kode:** `src/services/realtimeSyncService.ts` (`DEFAULT_WEBHOOK_URL`)
- **Keparahan:** High (fitur produksi gagal diam-diam)
- **Deskripsi:** URL webhook `sheet-sync-webhook` di-hardcode ke proyek lama sebagai fallback ketika `VITE_SHEET_SYNC_WEBHOOK_URL` kosong. Variabel itu tidak diset di Vercel. Bundle produksi terbukti berisi `sejttnsanzogsykmtwym.supabase.co/functions/v1/sheet-sync-webhook`, padahal URL Supabase lain di bundle sudah menunjuk proyek baru.
- **Dampak User:** Pemicu sinkron Sheets → `daily_route_reports` dari aplikasi (setelah simpan input SS) selalu ditolak 402, sehingga Monitoring tidak ter-update dari jalur ini.
- **Mitigasi:** Turunkan URL webhook dari `VITE_SUPABASE_URL` (`<url>/functions/v1/sheet-sync-webhook`). `VITE_SHEET_SYNC_WEBHOOK_URL` tetap tersedia sebagai override opsional. Tambah guard `isSupabaseConfigured`.

---

### ID Temuan: BUG-MIG-202-02
- **Lokasi Kode:** `scripts/google-apps-script/CentralizedMasterRealtimeSync.js` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`), `scripts/google-apps-script/RouteSheetRealtimeSync.js` (`WEBHOOK_URL`)
- **Keparahan:** High (sinkron otomatis dari spreadsheet lapangan mati)
- **Deskripsi:** Kedua skrip Apps Script masih memakai URL proyek lama. Skrip master juga masih memakai anon key JWT proyek lama.
- **Dampak User:** Edit petugas di spreadsheet tidak lagi mengalir otomatis ke Supabase, sehingga Monitoring 18 rute tertinggal.
- **Mitigasi:** Perbarui sumber di repo ke URL dan anon key proyek baru. Salinan yang **ter-deploy di Google Apps Script** wajib diperbarui manual oleh pemilik.
- **Koreksi (konfirmasi pemilik, 6 Nov 2026):** Yang ter-deploy hanya **1 proyek Apps Script master** (`CentralizedMasterRealtimeSync.js`). Skrip ini memasang installable trigger `onEdit` ke 18 spreadsheet rute dari satu proyek (`ScriptApp.newTrigger("handleMultiSheetEdit").forSpreadsheet(ss)`), jadi tidak ada skrip di masing-masing spreadsheet. `RouteSheetRealtimeSync.js` adalah pendekatan per-spreadsheet lama (refact_155) yang sudah digantikan master (refact_165). Skrip lama itu juga tidak mengirim header `apikey`/`Authorization`, sehingga sejak guard autentikasi refact_193 permintaannya pasti ditolak 401. Dengan begitu, file tersebut adalah kode mati.

---

### ID Temuan: BUG-MIG-202-03
- **Lokasi Kode:** GitHub Repository Secrets (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` terakhir diubah 18 Okt 2026; `SUPABASE_DB_URL` tidak ada), dipakai `.github/workflows/nightly-backup.yml` dan `regional-ingestion-cron.yml`
- **Keparahan:** High (backup harian dan ingestion terjadwal gagal)
- **Deskripsi:** Secrets masih menunjuk proyek lama. Run `Nightly Dual-Engine Backup` 5 Nov 23:53 UTC berstatus **failure**. Karena `SUPABASE_DB_URL` tidak ada, dump database selama ini juga selalu dilewati.
- **Dampak User:** Tidak ada cadangan baru sejak migrasi. Ingestion regional terjadwal (14:30 dan 23:00 WIB) akan gagal menulis ke database.
- **Mitigasi:** Pemilik memperbarui tiga secret ke proyek baru. Agent tidak dapat dan tidak boleh menulis secret.

---

### ID Temuan: BUG-MIG-202-04
- **Lokasi Kode:** `.mcp.json` (`project_ref`), `supabase/.temp/*` (link CLI), `docs/BACKUP_SETUP_GUIDE.md` (contoh URL), `.env.example`
- **Keparahan:** Low (tooling developer dan dokumentasi)
- **Deskripsi:** MCP Supabase, link Supabase CLI, dan contoh di panduan backup masih menunjuk proyek lama. Komentar `.env.example` menyatakan `VITE_SHEET_SYNC_WEBHOOK_URL` wajib, padahal setelah BUG-MIG-202-01 variabel itu opsional.
- **Dampak User:** Developer atau agent berikutnya bisa membaca atau men-deploy ke proyek yang salah.
- **Mitigasi:** Ganti `project_ref` MCP, jalankan `supabase link` ke proyek baru, perbarui contoh dokumentasi dan komentar `.env.example`. Env var Windows `SUPABASE_ACCESS_TOKEN` yang dipakai MCP masih token akun lama dan harus diganti pemilik.
