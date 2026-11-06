# REPAIR REPORT: REFACTOR 203
**Modul:** Monitoring 18 Rute, Pelacakan Waktu Aktif Pengguna
**Tanggal:** 06 November 2026
**Status:** Kode selesai, 4 gate lulus. Migrasi RPC sudah diterapkan ke database proyek baru dan terverifikasi end-to-end, sehingga frontend aman di-deploy. (Urutan wajib: migrasi dulu, baru frontend. Jika terbalik, angka fallback Monitoring menjadi 0 sampai migrasi diterapkan.)

---

## 1. Implementasi Perbaikan

### A. RPC Agregasi Ringkasan Unit (`supabase/migrations/20261106000001_daily_unit_summary_totals_rpc.sql`) — BUG-QUOTA-203-01
- `public.get_daily_unit_summary_totals(p_dates date[])` mengembalikan `route_code, year, month, day` beserta `SUM` dari `total_passengers, total_km, toa_shift1, manual_shift1, toa_shift2, manual_shift2` per (rute, tanggal). Nilai `NULL` dijumlahkan sebagai 0, sama seperti `reduce` di frontend.
- `LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public`. RLS dan grant SELECT tabel tetap berlaku. Input dibatasi `p_dates[1:31]`.
- `REVOKE EXECUTE ... FROM PUBLIC`, `GRANT EXECUTE ... TO anon, authenticated`, lalu `NOTIFY pgrst, 'reload schema'`.
- Memakai indeks yang sudah ada: `idx_daily_unit_range (route_code, year, month, day)`.

### B. Service Monitoring (`src/services/allRouteMonitoringService.ts`) — BUG-QUOTA-203-01
- Langkah 3 `fetchRegionalMonitoringData` kini memanggil `supabase.rpc('get_daily_unit_summary_totals', { p_dates: [H, H-1, H-7] })`, menggantikan `.from('daily_unit_summaries').select(...).or(...)`.
- Hasil RPC berbentuk `DailyUnitSummary` (1 baris per rute dan tanggal), sehingga logika `filter` + `reduce` per rute dan `calculateRegionalTotals` **tidak diubah** (jumlah dari 1 baris = nilai baris itu). Retry 2× tetap dipertahankan.

### C. Heartbeat (`src/hooks/useUserActivityTracking.ts`, `src/services/routes/users.ts`) — BUG-QUOTA-203-02
- `VISIBILITY_HEARTBEAT_MIN_GAP_MS = 60_000`: pulsa `visibilitychange` dilewati bila pulsa terakhir (mount, interval, atau visibility) < 60 detik. `lastHeartbeatRef` tetap di-reset agar waktu saat tab tersembunyi tidak ikut dihitung.
- `sendUserHeartbeat(email, 0)` hanya mengirim 1 `update({ last_active_at, updated_at })` tanpa `select`. Pulsa berdurasi (> 0) tetap memakai baca lalu tulis seperti sebelumnya.

### D. Test
- `allRouteMonitoringService.test.ts`: mock `supabase.rpc`. Test agregasi memastikan RPC dipanggil **tepat 1×** dengan `['2026-09-02','2026-09-01','2026-08-26']` dan `from('daily_unit_summaries')` tidak lagi dipanggil.
- `useUserActivityTracking.test.tsx`: 10 `visibilitychange` dalam 30 detik → 0 pulsa tambahan. Setelah ≥60 detik, 2 event → tepat 1 pulsa.
- `routeService.test.ts`: `sendUserHeartbeat(…, 0)` → 1× `from`, `select` tidak dipanggil, payload tanpa `total_active_seconds`, dan email dinormalisasi.

---

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| Baris ringkasan unit per muat Monitoring (6/5 Nov + 30 Okt) | 1.000 dari 1.523 (terpotong) | 47 baris agregat (lengkap) |
| Payload JSON ringkasan per muat | ±160 KB | 7,9 KB (diukur via REST) |
| Total payload per muat Monitoring (reports + summaries) | ±230 KB | ±77 KB (≈ −66%) |
| Kebenaran total penumpang 3 tanggal | Subset acak | 218.853 = jumlah mentah (diverifikasi SQL) |
| Request per pulsa tanpa durasi | 2 (GET + PATCH) | 1 (PATCH) |
| Pulsa saat ganti tab/aplikasi | Setiap event | Maks. 1 per 60 detik |

---

## 3. Case: Skenario Lapangan

### Case BUG-QUOTA-203-01: Korwil membiarkan Monitoring terbuka sepanjang shift
- **Situasi:** Korwil membuka Monitoring 18 Rute di laptop kantor dari pagi sampai malam, sementara petugas terus mengedit Google Sheets sehingga realtime memicu muat ulang setiap 60 detik.
- **Before:** Setiap muat menarik 1.000 baris per unit (±160 KB) dan tetap tidak lengkap. Rute yang laporannya belum tersinkron bisa menampilkan penumpang kemarin atau minggu lalu lebih kecil dari seharusnya. Sepuluh jam terbuka ≈ 140 MB JSON mentah.
- **After:** Setiap muat hanya ±77 KB dengan angka per rute yang lengkap. Sepuluh jam terbuka ≈ 46 MB JSON mentah.

### Case BUG-QUOTA-203-02: PDO berpindah-pindah aplikasi di ponsel
- **Situasi:** PDO bolak-balik antara aplikasi SS_PDO, WhatsApp, dan Google Sheets puluhan kali per jam.
- **Before:** Setiap kembali ke SS_PDO = 2 request heartbeat. Ratusan request per jam per orang.
- **After:** Maksimal 1 request per menit dari peralihan tampilan, ditambah 2 request setiap 3 menit dari pulsa berdurasi.

---

## 4. Verifikasi

| Gate | Status | Hasil |
|---|---|---|
| 1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` | Lulus | 116/116 tes |
| 2. `pnpm vitest run src/` | Lulus | 145 file, 1.307/1.307 tes (+2 tes baru; test agregasi Monitoring diperbarui) |
| 3. `pnpm run build` (`tsc -b` + Vite) | Lulus | exit 0 |
| 4. `graphify update .` | Lulus | Graf diperbarui |

Verifikasi tambahan (read-only, database proyek baru):
- Isi fungsi dijalankan sebagai kueri dengan 3 tanggal: 47 baris, total penumpang dan KM sama dengan `SUM` mentah (218.853 / 116.866).
- Migrasi diterapkan pemilik lewat SQL Editor (6 Nov 2026). `pg_proc`: `prosecdef=false` (INVOKER), volatilitas `s` (STABLE), `search_path=public`, EXECUTE untuk `anon` dan `authenticated` (tanpa PUBLIC).
- End-to-end REST sebagai anon: `POST /rest/v1/rpc/get_daily_unit_summary_totals` dengan 3 tanggal → HTTP 200, 47 baris, 7.955 byte, total penumpang 218.853.

**Belum diverifikasi:** tampilan halaman Monitoring di browser setelah deploy, dan penghematan egress aktual di halaman Usage.
