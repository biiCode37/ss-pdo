# AUDIT TEMUAN PASCA-MIGRASI & EKSPLORASI APP: REFACTOR 201
**Modul:** Hak Akses Kolom `user_profiles` (proyek Supabase baru), KPI Makro Monitoring Wilayah
**Fokus Masalah:** Temuan dari eksplorasi app lokal pada 6 Nov 2026 setelah migrasi darurat ke proyek `znchudtormqsgpukibsn` dan perbaikan kuota refact_200.

---

### ID Temuan: BUG-MIG-201-01
- **Lokasi Kode:** Database proyek baru, tabel `public.user_profiles` (ACL kolom). Penulis: `src/services/routes/users.ts` (`upsertUserProfile`, `sendUserHeartbeat`)
- **Keparahan:** High (fitur pencatatan login & durasi aktif mati diam-diam; regresi akibat migrasi)
- **Deskripsi:** Migrasi `20261021000001_security_critical_hardening.sql` memberi `anon`/`authenticated` hak `UPDATE` **per kolom** pada `full_name`, `avatar_url`, `last_login_at`, `last_active_at`, `total_active_seconds`, dan `updated_at`. Saat migrasi darurat, skrip penyamaan grant menjalankan `REVOKE ALL ON TABLE ... FROM anon, authenticated`, yang **ikut mencabut grant per kolom**. Verifikasi pascamigrasi hanya membandingkan ACL level tabel (`relacl`), bukan ACL kolom (`attacl`), sehingga regresi ini lolos. Bukti: proyek lama punya 6 entri `attacl`, proyek baru 0.
- **Dampak User:** Setiap login memunculkan `permission denied for table user_profiles` (42501 / HTTP 401). `last_login_at` tidak tercatat, heartbeat 3 menit selalu gagal sehingga `total_active_seconds` berhenti bertambah, dan pembaruan nama/avatar dari Google tidak tersimpan. Setiap kegagalan juga tetap memakan request dan baris log.
- **Mitigasi:** Pulihkan grant kolom persis seperti proyek lama (`GRANT UPDATE (6 kolom) ON public.user_profiles TO anon, authenticated`). Grant ini sudah tercatat di migrasi yang ada, jadi tidak perlu migrasi baru. Verifikasi ulang dengan membandingkan `attacl`, `relacl`, `proacl`, dan `pg_policies` antara proyek lama dan baru.

---

### ID Temuan: BUG-FMT-201-02
- **Lokasi Kode:** `src/components/monitoring/tabs/MonitoringMacroKpiGrid.tsx`
- **Keparahan:** Medium (angka kunci mudah salah baca oleh pimpinan)
- **Deskripsi:** Nilai "Total Jarak Tempuh" memakai `toLocaleString('id-ID')` tanpa batas desimal, sehingga tampil `44.803,292 KM`. Subteks memakai `toFixed()` yang menghasilkan titik desimal ala Inggris (`82.5 KM per Bus`, `2.9 Rit per Bus`, `5.1%`, `0.14 Org per KM`). Dalam satu kartu tercampur titik ribuan Indonesia dan titik desimal Inggris.
- **Dampak User:** `44.803,292` dan `82.5` mudah terbaca sebagai 44 juta km atau 825 km/bus. Laporan wilayah berpotensi salah kutip.
- **Mitigasi:** Gunakan satu helper `formatId(value, digits)` berbasis `toLocaleString('id-ID')` dengan jumlah desimal tetap untuk nilai dan subteks. Perbandingan ambang (`>= 100`, `>= 150`) dihitung dari nilai numerik, bukan dari string terformat.

---

## Temuan yang Dibatalkan / Tidak Diubah

### (Dibatalkan) Request berulang 3× saat membuka halaman rute
Laporan awal eksplorasi menyebut `routes`, `daily_route_plottings`, dan upsert `daily_unit_summaries` terjadi 3× saat membuka JAK.60. Setelah `StrictMode` dimatikan sementara untuk pengukuran, masing-masing **hanya 1×**. Angka 3× adalah artefak mode dev, karena React StrictMode menjalankan effect dua kali. Tidak ada perubahan kode; `StrictMode` sudah dikembalikan.

### (Keputusan produk) Presisi penuh di `KPICard`
`KM / BUS` pada akumulasi tampil `13.444,5428571429`. Test `KPICard.test.tsx` ("high-precision SSOT numbers") menunjukkan presisi penuh adalah keputusan desain agar sama dengan spreadsheet. Perubahan ditunda sampai pemilik produk memutuskan.
