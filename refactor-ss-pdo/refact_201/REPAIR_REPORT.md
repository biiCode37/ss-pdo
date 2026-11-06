# REPAIR REPORT: REFACTOR 201
**Modul:** Hak Akses Kolom `user_profiles`, KPI Makro Monitoring Wilayah
**Tanggal:** 06 November 2026
**Status:** Selesai. BUG-FMT-201-02 terverifikasi di browser. BUG-MIG-201-01 dipulihkan lewat SQL yang dijalankan pemilik proyek di SQL Editor (penulisan grant oleh agent diblokir sistem izin), lalu diverifikasi agent.

---

## 1. Implementasi Perbaikan

### A. Pemulihan Grant Kolom `user_profiles` (database proyek `znchudtormqsgpukibsn`) — BUG-MIG-201-01
- SQL pemulihan, dijalankan di Supabase SQL Editor proyek baru:
  ```sql
  GRANT UPDATE (full_name, avatar_url, last_login_at, last_active_at, total_active_seconds, updated_at)
    ON TABLE public.user_profiles TO anon, authenticated;
  ```
- Tidak ada perubahan kode aplikasi maupun migrasi baru, karena grant ini sudah ada di `20261021000001_security_critical_hardening.sql`. Yang hilang hanya kondisi database akibat skrip migrasi darurat.
- Pelajaran untuk migrasi berikutnya: perbandingan ACL wajib mencakup `pg_attribute.attacl` (kolom), selain `relacl`, `proacl`, dan `pg_policies`.

### B. Format Angka KPI Makro (`src/components/monitoring/tabs/MonitoringMacroKpiGrid.tsx`) — BUG-FMT-201-02
- Helper lokal `formatId(value, digits)` = `toLocaleString('id-ID', { min/maxFractionDigits: digits })`.
- Total Jarak Tempuh → 1 desimal. Subteks Rit/Bus, KM/Bus, dan Capaian Target → 1 desimal koma. Org/KM → 2 desimal koma. Org/Bus → bilangan bulat dengan pemisah ribuan.
- Ambang warna positif dihitung dari angka (`targetPctNum >= 100`, `paxPerBusNum >= 150`).

---

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| Login & heartbeat menulis `user_profiles` | Gagal `42501 permission denied` | Berhasil (setelah SQL dijalankan) |
| Total Jarak Tempuh | `44.803,292 KM` | `44.803,3 KM` |
| KM per Bus | `82.5 KM per Bus` | `82,5 KM per Bus` |
| Rit per Bus | `2.9 Rit per Bus` | `2,9 Rit per Bus` |
| Capaian Target | `5.1%` | `5,1%` |
| Org per KM | `0.14 Org per KM` | `0,14 Org per KM` |

Nilai After diambil dari DOM app lokal yang terhubung ke data produksi, 6 Nov 2026.

---

## 3. Case: Skenario Lapangan

### Case BUG-MIG-201-01: Superadmin memantau keaktifan PDO
- **Situasi:** Superadmin membuka Manajemen Pengguna untuk melihat siapa yang terakhir login dan berapa lama aktif.
- **Before:** Sejak migrasi 6 Nov, `last_login_at` dan `total_active_seconds` membeku, sehingga semua PDO terlihat tidak aktif walaupun bekerja setiap hari.
- **After:** Login dan heartbeat tercatat kembali seperti sebelum insiden.

### Case BUG-FMT-201-02: Korwil mengutip angka ke laporan WA
- **Situasi:** Korwil membaca kartu Total Jarak Tempuh di layar HP untuk laporan harian.
- **Before:** `44.803,292 KM` dan `82.5 KM per Bus` mudah dibaca sebagai 44 juta km dan 825 km/bus.
- **After:** `44.803,3 KM` dan `82,5 KM per Bus` konsisten dengan format angka Indonesia di seluruh app.

---

## 4. Verifikasi

| Gate | Status | Hasil |
|---|---|---|
| 1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` | Lulus | 116/116 tes |
| 2. `pnpm vitest run src/` | Lulus | 145 file, 1.303/1.303 tes (+1 tes baru `MonitoringMacroKpiGrid.test.tsx`) |
| 3. `pnpm run build` (`tsc -b` + Vite) | Lulus | exit 0, built in 1,20 s |
| 4. `graphify update .` | Lulus | Graf diperbarui |

Verifikasi browser (localhost:5174, data produksi): teks KPI makro sesuai kolom After.

Verifikasi BUG-MIG-201-01 (setelah SQL dijalankan pemilik proyek, 6 Nov 2026):
- Perbandingan proyek lama vs baru: **identik** untuk ACL kolom (`attacl`), ACL tabel (`relacl`), ACL fungsi (`proacl`), dan seluruh `pg_policies` skema `public`.
- Reload app lokal: `last_login_at` akun uji berubah dari `2026-10-27 09:34` ke `2026-11-06 12:12:29`, `last_active_at` ikut terbarui, dan tidak ada lagi error `42501` / `permission denied` di console.
