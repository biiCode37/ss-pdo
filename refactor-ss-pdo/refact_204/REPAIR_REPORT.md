# REPAIR REPORT: REFACTOR 204
**Modul:** Database Supabase: RLS & grant `public.daily_unit_summaries`
**Tanggal:** 06 November 2026
**Status:** Selesai. Migrasi diterapkan pemilik lewat SQL Editor dan terverifikasi lewat REST. Tidak ada perubahan frontend, jadi tidak perlu deploy Vercel.

---

## 1. Implementasi Perbaikan

### A. Migrasi `supabase/migrations/20261106000002_restrict_daily_unit_summaries_delete.sql` — BUG-SEC-204-01
- `DROP POLICY "Allow public insert/update daily_unit_summaries"` (`FOR ALL TO public USING (true)`): sumber hak DELETE lewat RLS.
- `DROP POLICY "Allow public read daily_unit_summaries"`: duplikat dari `"Allow read daily_unit_summaries"`.
- `REVOKE ALL` lalu `GRANT SELECT, INSERT, UPDATE` ke `anon, authenticated`. Sebelum `REVOKE ALL` sudah dipastikan tabel **tidak** memiliki grant per kolom (`attacl` kosong), untuk menghindari pengulangan kesalahan refact_201.
- Policy yang tersisa: `Allow read` (SELECT), `Allow write` (INSERT), `Allow update` (UPDATE), semuanya untuk `{anon,authenticated}`.
- ponytail: INSERT dan UPDATE anon tetap terbuka karena browser login dengan Google OAuth (role Supabase = anon). Menutupnya perlu memindahkan upsert ke Edge Function tervalidasi, yang dikerjakan di refact terpisah.

---

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| Policy | 5 (termasuk `FOR ALL TO public`, SELECT ganda) | 3 (SELECT, INSERT, UPDATE) |
| Grant anon/authenticated | `arwdDxtm` (termasuk DELETE, TRUNCATE) | `arw` (SELECT, INSERT, UPDATE) |
| `DELETE ?id=eq.-1` sebagai anon | **HTTP 200 `[]`** (diterima) | **HTTP 401** `42501 permission denied for table daily_unit_summaries` |
| `SELECT` sebagai anon | HTTP 200 | HTTP 200 |
| RPC `get_daily_unit_summary_totals` sebagai anon | HTTP 200 | HTTP 200 |
| Upsert `ON CONFLICT` sebagai anon (jalur `core.ts`) | HTTP 200/201 | HTTP 200 (uji idempoten, nilai identik) |

---

## 3. Case: Skenario Lapangan

### Case BUG-SEC-204-01: Anon key disalahgunakan
- **Situasi:** Seseorang mengambil anon key dari bundle JS aplikasi (`bionex-pusm.vercel.app`) lalu mengirim `DELETE /rest/v1/daily_unit_summaries?id=gt.0`.
- **Before:** Seluruh ringkasan unit terhapus. Angka fallback Monitoring dan Rekap Lintas Periode langsung kosong atau salah, dan baru pulih bila PDO membuka ulang setiap tab tanggal di 18 rute.
- **After:** Permintaan ditolak `401 permission denied`, dan data tetap utuh. PDO tetap bisa menyimpan dan memperbarui ringkasan lewat aplikasi seperti biasa.

---

## 4. Verifikasi

| Gate | Status | Hasil |
|---|---|---|
| 1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` | Lulus | 116/116 tes |
| 2. `pnpm vitest run src/` | Lulus | 145 file, 1.307/1.307 tes |
| 3. `pnpm run build` (`tsc -b` + Vite) | Lulus | exit 0 |
| 4. `graphify update .` | Lulus | Graf diperbarui |

Verifikasi database (setelah migrasi):
- `pg_policies`: tersisa 3 policy (SELECT, INSERT, UPDATE) untuk `{anon,authenticated}`.
- `relacl`: `anon=arw/postgres`, `authenticated=arw/postgres`. `service_role` tetap penuh.
- Probe REST sebagai anon: hasilnya seperti pada tabel Before vs After. Uji upsert memakai baris `JAK.01 / 2026-11-06 / KLM 540` dengan `total_km` yang sama (184), sehingga tidak ada nilai yang berubah.

**Belum diverifikasi:** upsert yang dipicu aplikasi sungguhan setelah migrasi. Belum ada aktivitas PDO sejak migrasi; pantau log `POST /rest/v1/daily_unit_summaries` agar tetap 200/201.
