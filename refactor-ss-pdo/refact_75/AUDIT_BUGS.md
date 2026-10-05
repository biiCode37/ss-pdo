# Audit Bugs & UX Review - Refactor 75

Dokumentasi penataan posisi dan hierarki tab pada bilah navigasi bawah (*Bottom Navigation*) Dashboard Monitoring Wilayah.

---

## 1. Daftar Temuan

### BUG-REFACT75-01: Posisi Tab Dashboard sebagai Titik Fokus Utama (Center Anchor)
* **Lokasi Kode:**
  * [`src/components/monitoring/MonitoringBottomNav.tsx`](file:///d:/MINE/SS_PDO/src/components/monitoring/MonitoringBottomNav.tsx)
  * [`src/components/monitoring/MonitoringBottomNav.test.tsx`](file:///d:/MINE/SS_PDO/src/components/monitoring/MonitoringBottomNav.test.tsx)
* **Kategori / Keparahan:** UX Ergonomics / Low (Layout Symmetry & Usability)
* **Deskripsi Masalah:**
  Pada tata letak bilah navigasi bawah 5 item:
  `[Dashboard] [Rute] [Status Armada] [Laporan WA] [Profil]`
  Tab Dashboard yang berperan sebagai ringkasan eksekutif makro dan pusat informasi wilayah berada di posisi paling kiri (pinggir). Pada desain antarmuka mobile modern (5-tab navigation bar), posisi tengah (center slot) merupakan titik fokus visual utama (*focal center*) yang paling mudah dijangkau secara simetris oleh kedua jempol tangan pengguna.
* **Dampak Pengguna:**
  * Alur navigasi terasa berat ke kiri (*asymmetrical visual balance*).
  * Pengguna harus menjangkau jempol ke sudut kiri bawah setiap kali ingin kembali ke ringkasan utama wilayah.
* **Mitigasi & Solusi:**
  1. Ubah urutan tab pada `NAV_ITEMS` menjadi:
     * **Slot 1 (Kiri Luar):** Rute (`routes`) ➔ Akses cepat daftar 18 rute & filter korlap.
     * **Slot 2 (Kiri Dalam):** Status Armada (`fleet_status`) ➔ Monitoring kesiapan armada bus S1 & S2.
     * **Slot 3 (TENGAH / Hero Anchor):** **Dashboard (`dashboard`)** ➔ Ringkasan eksekutif makro, grafik tren TOA, dan leaderboard.
     * **Slot 4 (Kanan Dalam):** Laporan WA (`wa_report`) ➔ Studio generator laporan WhatsApp.
     * **Slot 5 (Kanan Luar):** Profil (`profile`) ➔ Menu akun, tema, dan administrasi.
  2. Pertahankan seluruh token teks sentral kamus `TEXT_MONITORING.NAV`.
  3. Perbarui unit test pada `MonitoringBottomNav.test.tsx` untuk memvalidasi urutan posisi tab secara deterministik.
