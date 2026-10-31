# Audit Temuan & Analisis Kebutuhan (Refactor 183)

## Ringkasan Eksekutif

Audit dan perancangan arsitektur ini diinisiasi untuk menjawab kebutuhan operasional lapangan pada rute-rute bus Transjakarta yang memiliki 2 titik pengendapan (layover endpoints), seperti contoh rute **JAK.115 TERM. TANJUNG PRIOK - PEGANGSAAN II IGI**. Rute ini memiliki karakteristik operasional harian yang sangat dinamis:
1. Armada terbagi dua titik start awal sejak pagi hari (05.00 WIB): "Unit Priok" dan "Unit IGI".
2. Penetapan ritase dapat berupa bilangan bulat (titik awal = titik akhir) maupun bilangan setengah (contoh: 7,5 ritase PP, di mana titik awal != titik akhir / mengendap di titik seberang).
3. Dibutuhkan halaman perencanaan harian subuh (Plotting Harian) untuk mengatur urutan keberangkatan (#1, #2, #3...), penentuan titik start unit, rotasi harian adil (rolling FIFO), dan pencatatan unit berkendala.
4. Halaman plotting baru wajib terintegrasi dengan modul Manajemen Halaman (`app_page_settings`) agar dapat dikelola hak akses dan status pemeliharaannya oleh Superadmin.

---

## Tabel Temuan & Analisis

| ID Temuan | Lokasi Kode | Keparahan | Deskripsi | Dampak Pengguna | Mitigasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FEAT-183-01** | `src/components/busCard/modal/`<br>`src/utils/smartRitaseUtils.ts` | 🟡 **MEDIUM** | Tidak adanya validasi fisik dan otomasi pembagian trip pada form input ritase untuk rute 2 titik pengendapan (misal 7.5 rit) | Pengawas/petugas harus menghitung manual jumlah trip pergi dan pulang serta rawan salah input posisi akhir unit bus | Implementasi `smartRitaseUtils.ts`, tombol preset cepat (6.5, 7.0, 7.5, 8.0 Rit), kalkulator live titik akhir bus, dan peringatan dini pelanggaran invarian fisik ($|\text{Pergi} - \text{Pulang}| > 1$) |
| **FEAT-183-02** | `src/components/plotting/`<br>`src/services/dailyPlottingService.ts`<br>`supabase/migrations/20261031000002_create_daily_route_plottings.sql` | 🟠 **HIGH** | Belum tersedianya halaman perencanaan plotting harian dan penyimpanan urutan dispatch armada pagi | Petugas shift pagi tidak memiliki tempat terstruktur untuk mem-plot urutan armada, titik start awal, dan rotasi harian rolling kemarin | Pembuatan tabel Supabase `daily_route_plottings`, service layer dengan offline cache fallback, dan halaman mandiri `DailyPlottingPage.tsx` pada bilah navigasi bawah |
| **FEAT-183-03** | `supabase/migrations/20261031000003_add_plotting_to_app_page_settings.sql`<br>`src/types/pageManagement.ts`<br>`src/components/dashboard/DashboardContentTabs.tsx` | 🟡 **MEDIUM** | Halaman plotting baru belum terdaftar pada sistem Manajemen Halaman (`app_page_settings`) | Superadmin tidak dapat menonaktifkan atau mengatur izin akses peran/akun khusus untuk halaman plotting jika sedang pemeliharaan | Mendaftarkan `page_key: 'plotting'` ke tabel `app_page_settings`, memperbarui `DEFAULT_PAGE_SETTINGS` & `PageKey`, serta memasang guard `canAccessPage` dan `SuperadminMaintenanceBanner` di `DashboardContentTabs` |

---

## Analisis Akar Masalah (Root Cause Analysis)

1. **Ketiadaan Konsep Titik Start Awal & Smart Ritase:**
   Sebelumnya, modal entri data bus (`BusInputModalTrip.tsx` dan `SingleFocusTrip.tsx`) memperlakukan trip pergi dan pulang sebagai dua input angka independen tanpa keterkaitan logis dengan titik awal keberangkatan armada. Untuk 7,5 ritase (15 trip), petugas harus berpikir manual apakah pergi 8 atau pulang 8.
2. **Ketiadaan Tab Plotting Khusus:**
   Operasional subuh membutuhkan penetapan urutan bus yang cepat, penataan drag-and-drop, dan tombol "Rolling Kemarin" (di mana unit urutan #1 hari ini bergeser menjadi urutan terakhir besok). Ketiadaan UI plotting menyebabkan koordinasi subuh dilakukan di luar sistem.
3. **Keterpisahan Modul Baru dari Tata Kelola Akses:**
   Setiap fitur/tab baru wajib terintegrasi dengan arsitektur Granular Access Control aplikasi agar tata kelola keamanan dan mode pemeliharaan tetap terpusat di bawah kendali Superadmin.
