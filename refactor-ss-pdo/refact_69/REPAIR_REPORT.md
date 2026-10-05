# 🛠️ Repair Report: Refactor 69 — Penentuan Status Armada Harian Per Shift (Daily Fleet Status)

Dokumen ini mencatat detail teknis perbaikan, perbandingan Sebelum vs Sesudah (*Before vs After*), serta Skenario Lapangan untuk perombakan fitur Penentuan Status Armada.

---

## 1. Ringkasan Implementasi

1. **Migrasi Supabase (`supabase/migrations/20260921000001_create_fleet_status_tables.sql`):**
   - Tabel `fleet_statuses`: Master tipe status armada (SGO, TO, OFF, SO, DPO, dll) dengan flag `is_sgo`, warna badge, urutan sortir, dan audit status.
   - Tabel `daily_fleet_shifts`: Header status harian per tanggal, rute, dan shift (`1` atau `2`). Menyimpan `target_renops`, `realops`, `sgo_count`, `to_count`, `off_count`, `so_count`, `other_count`, serta status konfirmasi kunci (`is_confirmed`, `user_id`, `confirmed_at`).
   - Tabel `daily_fleet_non_sgo_units`: Detail unit armada khusus yang berstatus non-SGO. Mencatat `unit_body`, relasi ke `status_id`, dan `note` (alasan mogok, perbaikan bengkel, perbantuan, dll).
   - RLS Policies: Viewable oleh semua authenticated user, insert/update/delete hanya oleh role berwenang.

2. **Kamus Teks Sentral (`src/constants/texts/text_fleet_status.ts`):**
   - Mendefinisikan seluruh string UI: `MODAL_TITLE`, `CONFIRM_STATUS_TITLE`, `LOCKED_NOTICE`, `TARGET_RENOPS_LABEL`, `REALOPS_LABEL`, `NON_SGO_LABEL`, `SHIFT_1_TITLE`, `SHIFT_2_TITLE`, tombol aksi, placeholder catatan, dan toast notifikasi.
   - Diuji 100% pada `src/constants/texts/texts.test.ts`.

3. **Service Layer & Unit Tests (`src/services/fleetStatusService.ts`):**
   - `getActiveFleetStatuses()`: Mengambil daftar master status aktif terurut.
   - `getDailyFleetShift()`: Mengambil header shift beserta relasi unit non-SGO.
   - `saveDailyFleetShift()`: Menyimpan/meng-upsert header shift dan menyinkronkan unit non-SGO dalam satu transaksi atomik.
   - `confirmDailyFleetShift()`: Mengunci status shift secara permanen.
   - 100% test coverage di `src/services/fleetStatusService.test.ts`.

4. **Komponen UI Modular & Mobile-First (`src/components/fleetStatus/`):**
   - `FleetStatusHeader.tsx`: Ringkasan statistik (Renops editable, Realops, SGO, Non-SGO) dan segmented tab Shift 1 / Shift 2.
   - `FleetStatusToolbar.tsx`: Filter pencarian unit bus dan tombol filter status (Semua, SGO, Non-SGO, TO, OFF, dll).
   - `FleetStatusGrid.tsx`: Grid kartu unit bus dengan status badge, pemilih status cepat (*segmented chip*), dan input catatan langsung untuk non-SGO.
   - `FleetStatusFooter.tsx`: Tombol konfirmasi shift (terkunci dengan gembok jika sudah dikonfirmasi) dan tombol tutup.
   - `FleetStatusModal.tsx`: Orkestrator modal yang reaktif, mendukung dark mode, dan adaptif mobile.

---

## 2. Perbandingan Sebelum vs Sesudah (Before vs After)

| Aspek | Sebelum (Legacy) | Sesudah (Refactor 69) |
|---|---|---|
| **Penyimpanan Data** | Menulis status langsung ke kolom `keterangan` di Google Sheets. | **Zero-Touch Google Sheets**: Disimpan murni di tabel Supabase (`daily_fleet_shifts` & `daily_fleet_non_sgo_units`). |
| **Penyimpanan Unit SGO** | Membutuhkan baris keterangan untuk setiap bus jika ingin melacak status. | **Agregat Cerdas**: SGO tidak membebani baris database, hanya dihitung otomatis sebagai angka `sgo_count` & `realops`. |
| **Target Renops** | Nilai statis dari rute tanpa opsi penyesuaian lapangan saat ada penambahan/pengurangan rute khusus. | **Prefill Default & Editable**: Otomatis terisi dari master `routes`, tetapi pengawas dapat menyesuaikan jika target operasi hari itu berubah, tanpa merusak master routes. |
| **Kalkulasi Realops & SGO** | Sering salah hitung jika format penulisan keterangan tidak seragam. | **100% Otomatis & Real-time**: Dihitung instan dari rumus `realops = target_renops - off_count - to_count - other_count`. |
| **Locking Data Shift** | Tidak ada status penguncian, data rawan diubah sewaktu-waktu. | **Permanent Confirmation Lock**: Setelah pengawas menekan konfirmasi, status terkunci rapat (`is_confirmed = true`) dengan audit siapa dan kapan dikonfirmasi. |
| **Tampilan Mobile** | Form sederhana yang sempit dan teks mudah terpotong. | **Mobile-First Ergonomic**: Segmented chip status, badge berpenampilan iOS modern, input notes adaptif, support Light & Dark mode. |

---

## 3. Case: Skenario Lapangan

### Skenario 1: Penentuan Status Armada Pagi Hari oleh Pengawas Rute 7B
- **Kasus:** Pukul 05.00 WIB, Pengawas membuka aplikasi untuk Rute 7B (Target Renops default: 25 unit). Dari hasil apel pagi, terdapat 22 bus siap operasi, 2 bus mogok di pool (TO), dan 1 bus perpal (OFF).
- **Alur Kerja:**
  1. Pengawas membuka modal *Tentukan Status Armada* Shift 1.
  2. Target Renops otomatis terisi `25`.
  3. Pengawas mencari unit bus `KWK 222177` dan `KWK 222178`, men-tap chip `TO`, lalu mengisi alasan `Perbaikan Radiator`.
  4. Pengawas mencari unit bus `KWK 222179`, men-tap chip `OFF`, lalu mengisi alasan `Kurang Pramudi`.
  5. Sisa 22 bus lainnya otomatis berstatus default `SGO`.
  6. Header statistik seketika menampilkan: `Renops: 25 | Realops: 22 | SGO: 22 | Non-SGO: 3 (TO: 2, OFF: 1)`.
  7. Pengawas menekan `[Konfirmasi Status Shift 1]`. Data tersimpan ke Supabase dan shift terkunci rapi.
- **Hasil:** Google Sheets spreadsheet laporan tidak tersentuh sama sekali, tidak ada risiko konflik sel atau API limit, dan dashboard monitoring 18 rute langsung menerima data realops terkini.

### Skenario 2: Penyesuaian Target Renops Khusus Hari Libur / Peristiwa Khusus
- **Kasus:** Rute memiliki target normal 20 bus, namun karena ada rekayasa jalur atau pembatasan operasional hari besar, dinas memutuskan target operasional hari itu dipangkas menjadi 15 bus.
- **Alur Kerja:**
  1. Pengawas membuka modal penentuan status armada.
  2. Target renops default muncul `20`.
  3. Pengawas langsung mengedit angka pada input target renops menjadi `15`.
  4. Perubahan target renops tersimpan pada header shift hari tersebut tanpa mengubah konfigurasi master tabel `routes`.
- **Hasil:** Laporan harian akurat merefleksikan target operasi riil hari itu (15 unit) tanpa merusak nilai acuan dasar master rute.

---

## 4. Status Quality Gates

- **Unit Test Suite:** `pnpm vitest run src/` ➔ **63 passed, 476 tests passed (100%)**
- **Typecheck & Build:** `pnpm run build` (`tsc -b && vite build`) ➔ **Lulus 0 error, build time 1.39s**
- **Knowledge Graph:** `graphify update .` ➔ **Rebuilt 4059 nodes, 5250 edges, 360 communities**
- **Git Branch:** `devmode` (isolasi terjaga penuh, bebas dari modifikasi branch master/main).
