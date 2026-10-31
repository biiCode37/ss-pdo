# Laporan Implementasi & Perbaikan (Refactor 183)

Laporan ini mendokumentasikan implementasi lengkap fitur **Validasi Operasional & Smart Ritase (2 Titik Pengendapan)**, **Halaman Plotting Harian Mandiri**, dan **Pendaftaran ke Manajemen Halaman**.

---

## 1. Rincian Implementasi

### 1.1 Skema Database & Migrasi Supabase
1. **Tabel `daily_route_plottings` (`20261031000002_create_daily_route_plottings.sql`):**
   - Kolom: `id`, `route_id`, `route_code`, `date`, `units_data` (JSONB), `created_at`, `updated_at`, `updated_by`.
   - Index unik: `(route_id, date)`.
   - Row-Level Security (RLS) aktif dengan kebijakan baca publik dan mutasi terbatas.
2. **Pendaftaran ke `app_page_settings` (`20261031000003_add_plotting_to_app_page_settings.sql`):**
   - Menambahkan baris `page_key: 'plotting'`, `page_name: 'Plotting Armada Harian'`, `category: 'tab'`, `is_enabled: true`.

### 1.2 Utilitas Cerdas (Smart Utilities)
1. **`src/utils/routeEndpointUtils.ts`:**
   - Ekstraksi otomatis 2 titik layover dari label spreadsheet (misal: "TERM. TANJUNG PRIOK - PEGANGSAAN II IGI" -> "Priok" & "IGI").
2. **`src/utils/smartRitaseUtils.ts`:**
   - Pembagian trip otomatis untuk 7.5 rit:
     - Start A (Priok): Pergi 8, Pulang 7 -> Finis Seberang (IGI).
     - Start B (IGI): Pergi 7, Pulang 8 -> Finis Seberang (Priok).
   - Validasi batas fisik ($|\text{Pergi} - \text{Pulang}| \le 1$).

### 1.3 Antarmuka Plotting Harian (`src/components/plotting/`)
1. **`DailyPlottingPage.tsx`:**
   - Integrasi tab navigasi bawah `BottomNav.tsx` (Tab ke-4: "Plotting").
   - Segmented base tab: Titik A vs Titik B dengan indikator counter bus.
   - Multi-select komplementer (pilih unit Titik A -> unit tak terpilih otomatis jadi Titik B).
   - Mode `Atur Urutan` mengunci seleksi teks browser, menampilkan drag handle `⋮⋮`, dan tombol `[ ⬇️ Ke Bawah ]`.
   - Tombol cerdas `[ 🔄 Rolling Kemarin ]` (rotasi FIFO harian adil: unit #1 kemarin menjadi unit terakhir pangkalan hari ini).
   - Pencatatan status armada: Siap Jalan, Standby, BKO, Kendala Operasional.

### 1.4 Integrasi Form Input SS & Manajemen Halaman
1. Badge plotting `#1 • 📍 Priok` pada kartu bus di daftar unit.
2. Preset ritase cepat (6.5, 7.0, 7.5, 8.0 Rit) di modal input bus mode penuh dan mode fokus tunggal.
3. Guard akses `canAccessPage("plotting")`, `isUnderMaintenance("plotting")`, dan `SuperadminMaintenanceBanner` di `DashboardContentTabs.tsx`.

---

## 2. Before vs After

### 2.1 Pengisian 7,5 Ritase Rute 2 Titik Pengendapan
- **Before:** Petugas harus menghitung manual pembagian pergi/pulang tanpa mengetahui posisi akhir armada. Sering terjadi kekeliruan input pergi 7 pulang 8 untuk unit yang start dari Priok (seharusnya pergi 8 pulang 7).
- **After:** Cukup tekan tombol preset `[ 7.5 Rit ]`, sistem otomatis mengisi `tripPergi: 8` dan `tripPulang: 7` serta menampilkan badge `📍 Titik Akhir: IGI (Di Seberang)`.

### 2.2 Pengaturan Urutan Dispatch Pagi
- **Before:** Tidak ada fitur plotting digital di aplikasi. Urutan unit subuh dicatat manual atau diingat-ingat oleh petugas.
- **After:** Tab Plotting mandiri di bottom dock ponsel memungkinkan pengaturan urutan bus (#1, #2, #3...), rolling kemarin 1-klik, dan pembagian pangkalan start A/B yang tersimpan realtime ke Supabase dan cache offline.

### 2.3 Kontrol Pemeliharaan Halaman Plotting
- **Before:** Halaman baru tidak terdaftar di Manajemen Halaman; Superadmin tidak bisa mematikan tab plotting saat pemeliharaan.
- **After:** Halaman `plotting` muncul di daftar kartu Manajemen Halaman dengan switch aktif/nonaktif, konfigurasi izin peran RBAC, serta whitelist/blacklist akun.

---

## 3. Case: Skenario Lapangan

### Skenario: Dispatch Pagi Rute JAK.115 di Titik Priok & IGI
1. **Pukul 04.30 WIB:** Petugas shift pagi membuka tab **Plotting** di ponsel.
2. Sistem otomatis memuat daftar bus dan menarik data plotting kemarin.
3. Petugas menekan **"Rolling Kemarin"** -> Unit KWK 222153 yang kemarin urutan #1 di IGI otomatis berotasi ke urutan paling bawah, dan unit KWK 222154 naik menjadi urutan #1.
4. Petugas menekan tombol **"Simpan Plotting"** -> Tersimpan ke Supabase & cache offline.
5. **Sepanjang Hari Operasional:** Di halaman Input SS, kartu bus KWK 222154 menampilkan badge `#1 • 📍 IGI`. Saat input ritase 7.5 rit, form otomatis menyesuaikan trip sesuai pangkalan awal.
