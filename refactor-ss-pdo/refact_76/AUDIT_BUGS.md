# Audit Bugs & UX Review - Refactor 76

Dokumentasi audit UX dan teknis untuk Date Navigation interaktif (Native Date Picker), konsolidasi tombol Refresh & "Load All" satu baris, dan Ingestion Progress Modal HUD pada Dashboard Monitoring Wilayah.

---

## 1. Daftar Temuan

### BUG-REFACT76-01: Keterbatasan Navigasi Tanggal Tanpa Date Picker Bebas
* **Lokasi Kode:**
  * [`src/components/monitoring/MonitoringHeader.tsx`](file:///d:/MINE/SS_PDO/src/components/monitoring/MonitoringHeader.tsx)
  * [`src/components/monitoring/AllRouteMonitoringPage.tsx`](file:///d:/MINE/SS_PDO/src/components/monitoring/AllRouteMonitoringPage.tsx)
* **Kategori / Keparahan:** UX Usability & Ergonomics / Medium
* **Deskripsi Masalah:**
  Pada komponen `MonitoringHeader`, navigasi tanggal sebelumnya hanya menyediakan tombol stepper panah kiri (`<`) dan kanan (`>`) satu hari per klik. Pengguna tidak dapat melompat ke tanggal tertentu atau memilih bulan secara langsung tanpa menekan tombol berkali-kali. Input `type="date"` yang ada sebelumnya tersembunyi tanpa pemicu (*trigger*) interaktif yang memanggil API native picker sistem operasi.
* **Dampak Pengguna:**
  * Melelahkan dan memakan waktu saat ingin melihat data monitoring minggu lalu atau bulan sebelumnya.
  * Kurang fleksibel bagi manajemen/pengawas wilayah saat merekap data historis.
* **Mitigasi & Solusi:**
  1. Pasang ref `dateInputRef` pada elemen `<input type="date">`.
  2. Jadikan kapsul penampil tanggal (`data-testid="monitoring-date-picker-trigger"`) sebagai trigger interaktif yang memanggil `dateInputRef.current.showPicker()` dengan fallback `.focus()` dan `.click()`.
  3. Tambahkan indikator visual chevron down (`ChevronDown`) dan tooltip kamus sentral `TEXT_COMMON.NAV.CHOOSE_DATE`.

---

### BUG-REFACT76-02: Pemisahan Baris Tombol Aksi & Label Kurang Intuitif
* **Lokasi Kode:**
  * [`src/components/monitoring/MonitoringHeader.tsx`](file:///d:/MINE/SS_PDO/src/components/monitoring/MonitoringHeader.tsx)
  * [`src/constants/texts/text_monitoring.ts`](file:///d:/MINE/SS_PDO/src/constants/texts/text_monitoring.ts)
* **Kategori / Keparahan:** UI Consistency & Usability / Low
* **Deskripsi Masalah:**
  Tombol sinkronisasi penarikan data 18 rute sebelumnya terpisah letaknya dan berlabel "Tarik 18 Rute" dengan icon standar database, yang berpotensi membingungkan pengguna terkait perbedaannya dengan tombol Refresh, serta rentan mengalami pemisahan baris (*wrapping*) di layar mobile sempit.
* **Dampak Pengguna:**
  * Tata letak header di layar sempit terlihat tidak rapi karena tombol refresh dan sinkronisasi rute berada di posisi berbeda.
  * Teks lama kurang ringkas untuk ukuran header mobile.
* **Mitigasi & Solusi:**
  1. Konsolidasi tombol Refresh dan tombol penarikan data ke dalam satu kontainer inline flex dengan `gap: 6px` dan `flexShrink: 0`, menjamin keduanya selalu berdampingan rapat dalam satu baris.
  2. Perbarui kamus sentral `TEXT_MONITORING.INGESTION.BUTTON_LABEL` menjadi `'Load All'` dan icon menjadi `CloudDownload` yang merepresentasikan penarikan/pengambilan data operasional langsung dari Google Sheets rute.

---

### BUG-REFACT76-03: Ketiadaan Feedback Animasi Proses Penarikan 18 Rute (Black Box Sync)
* **Lokasi Kode:**
  * [`src/services/regionalIngestionService.ts`](file:///d:/MINE/SS_PDO/src/services/regionalIngestionService.ts)
  * [`src/components/monitoring/IngestionProgressModal.tsx`](file:///d:/MINE/SS_PDO/src/components/monitoring/IngestionProgressModal.tsx)
  * [`src/components/monitoring/AllRouteMonitoringPage.tsx`](file:///d:/MINE/SS_PDO/src/components/monitoring/AllRouteMonitoringPage.tsx)
* **Kategori / Keparahan:** UX Feedback & Transparency / Medium
* **Deskripsi Masalah:**
  Proses penarikan ringkasan data dari 18 Google Sheet rute memerlukan waktu beberapa detik (chunking batch paralel). Sebelumnya, status proses hanya berupa spinner kecil pada tombol tanpa visualisasi tahap apa yang sedang berjalan (apakah inisialisasi, penarikan rute JAK tertentu, penyimpanan ke Supabase, atau selesai).
* **Dampak Pengguna:**
  * Pengguna merasa ragu apakah aplikasi macet atau sedang bekerja.
  * Tidak ada transparansi progress per rute yang sedang diproses.
* **Mitigasi & Solusi:**
  1. Tambahkan interface `IngestionProgress` dan parameter callback `onProgress` pada `ingestRegionalRouteSummaries`.
  2. Buat komponen glassmorphic HUD modal `IngestionProgressModal` dengan progress bar halus (0–100%), animasi denyut icon `CloudDownload`, chip indikator rute yang sedang diproses, dan transisi centang `CheckCircle2` ketika selesai.
  3. Hubungkan progress state ke `AllRouteMonitoringPage`.
