# REPAIR REPORT: SENTRALISASI KAMUS TEKS UI APLIKASI (REFACTOR 18)

Dokumen ini mencatat implementasi perbaikan menyeluruh, perbandingan Sebelum (*Before*) dan Sesudah (*After*), serta Skenario Lapangan nyata untuk perbaikan temuan `TEXT-18-01`, `TEXT-18-02`, dan `TEXT-18-03`.

---

## 1. Implementasi & Detail Solusi

### A. Arsitektur Kamus Teks Terpusat (`src/constants/texts/`)
Dibangun fondasi kamus teks modular dengan TypeScript murni `as const`, tanpa overhead dependensi runtime i18n eksternal (mematuhi prinsip *YAGNI / Ponytail Mode*):
- `text_common.ts`: Tombol aksi global (Simpan, Batal, Tutup, Muat Ulang), status badge (Online, Offline, Menunggu), label umum, dan unit satuan.
- `text_auth.ts`: Copywriter layar masuk, validasi sesi login permanen, placeholder kredensial, dan pesan feedback otentikasi.
- `text_dashboard.ts`: PUSM Header, label tab navigasi, selector rute/tanggal, chip akumulasi, ringkasan statistik.
- `text_pdo_form.ts`: Form laporan PDO, modal Berita Acara, status sinkronisasi lembar kerja, validasi input bus.
- `text_monitoring.ts`: Monitoring wilayah/semua rute, tab jenis armada (BRT Koridor, Non-BRT, Mikrotrans), status input rute.
- `text_wa_report.ts`: Generator laporan WhatsApp, format teks broadcast per koridor, template pesan operasional.
- `text_alerts.ts`: Notifikasi modal SweetAlert2, toast konfirmasi, dialog konfirmasi hapus/salin.
- `text_errors.ts`: Error catalog terpusat, pengubah error teknis menjadi bahasa ramah non-teknis, fallback pesan sistem.
- `index.ts`: Barrel export terpadu untuk memudahkan auto-import di seluruh codebase.
- `texts.test.ts`: 8 unit test suites memastikan integritas key, fungsi interpolasi format string, dan ketahanan data.

### B. Migrasi Komponen & Eliminasi String Literal Mentah
Seluruh string literal di komponen utama telah dimigrasikan ke kamus teks terpusat:
1. `AllRouteMonitoringPage.tsx`: Menggunakan `TEXT_MONITORING` & `TEXT_COMMON`.
2. `WaReportModal.tsx` & `waReportGenerator.ts`: Menggunakan `TEXT_WA_REPORT` & `TEXT_COMMON`.
3. `RouteOperationalReportCard.tsx`: Menggunakan `TEXT_PDO_FORM` & `TEXT_COMMON`.
4. `alertUtils.ts`, `errorFormatter.ts`, & `QueueModal.tsx`: Menggunakan `TEXT_ALERTS`, `TEXT_ERRORS`, & `TEXT_COMMON`.
5. `Dashboard.tsx`, `RouteSelectorCard.tsx`, `BottomNav.tsx`, `ProfileMenuSheet.tsx`, & `LoginScreen.tsx`: Menggunakan `TEXT_DASHBOARD`, `TEXT_AUTH`, & `TEXT_COMMON`.

---

## 2. Before vs After

### A. Form Operasional PDO (`RouteOperationalReportCard.tsx`)
* **Before:**
  ```tsx
  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
    Catatan Operasional / Berita Acara
  </label>
  <textarea
    placeholder="Tuliskan kendala operasional, penggantian bus, laka, mogok, dll..."
  />
  <button className="...">Simpan Laporan Operasional</button>
  ```
* **After:**
  ```tsx
  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
    {TEXT_PDO_FORM.LABEL_OPERATIONAL_NOTES}
  </label>
  <textarea
    placeholder={TEXT_PDO_FORM.PLACEHOLDER_OPERATIONAL_NOTES}
  />
  <button className="...">
    {TEXT_PDO_FORM.BTN_SUBMIT_REPORT}
  </button>
  ```

### B. Generator Pesan Broadcast WhatsApp (`waReportGenerator.ts`)
* **Before:**
  ```ts
  let report = `*LAPORAN OPERASIONAL BUS TRANSJAKARTA*\n`;
  report += `*Rute:* ${routeCode} - ${routeName}\n`;
  report += `*Hari/Tgl:* ${dayName}, ${dateStr}\n`;
  ```
* **After:**
  ```ts
  let report = `${TEXT_WA_REPORT.HEADER_TITLE}\n`;
  report += `${TEXT_WA_REPORT.FIELD_ROUTE(routeCode, routeName)}\n`;
  report += `${TEXT_WA_REPORT.FIELD_DATE(dayName, dateStr)}\n`;
  ```

### C. Penanganan Error Ramah Pengguna (`errorFormatter.ts`)
* **Before:**
  ```ts
  if (err.message.includes('Quota exceeded')) {
    return 'Batas kuota akses Google Sheets tercapai. Mohon tunggu 1 menit.';
  }
  return 'Terjadi kesalahan pada sistem. Silakan coba kembali.';
  ```
* **After:**
  ```ts
  if (err.message.includes('Quota exceeded')) {
    return TEXT_ERRORS.GOOGLE_SHEETS_QUOTA_EXCEEDED;
  }
  return TEXT_ERRORS.GENERIC_SYSTEM_ERROR;
  ```

---

## 3. Case: Skenario Lapangan

### Skenario 1: Penyesuaian Istilah Regulasi Resmi Transjakarta
- **Kasus:** Manajemen operasional Transjakarta mengubah istilah resmi "Ritase" menjadi "Putaran Layanan" atau "Bus Cadangan" menjadi "Armada Pengganti".
- **Sebelum Refactor:** Pengembang harus melakukan pencarian manual di puluhan file komponen (kartu bus, form PDO, rekap monitor, pesan WA) dengan risiko tinggi ada file yang terlewat sehingga istilah menjadi campur aduk.
- **Sesudah Refactor:** Cukup perbarui satu baris nilai di `src/constants/texts/text_common.ts` atau `text_pdo_form.ts`. Seluruh kartu, form, indikator, dan modal langsung terupdate secara serempak dan otomatis dengan type-safety terjamin.

### Skenario 2: Standardisasi Laporan Jalur via WhatsApp
- **Kasus:** Supervisor jalur menerima laporan operasional dari 15 koridor berbeda di grup WhatsApp. Format dan istilah header laporan harus seragam agar mudah diproses oleh bot rekapitulasi pusat.
- **Sebelum Refactor:** Jika komponen modal WA dan generator pesan memiliki string literal yang berbeda, format laporan di HP petugas bisa berbeda dengan template resmi.
- **Sesudah Refactor:** Template pesan digerakkan oleh `TEXT_WA_REPORT` yang terpusat dengan fungsi pemformatan parameter murni. Seluruh laporan yang dihasilkan seragam 100% tanpa variasi ejaan.

### Skenario 3: Transparansi Kesalahan Ramah Petugas di Area Blank Spot / Sinyal Lemah
- **Kasus:** Petugas penginput PDO berada di ujung terminal dengan sinyal seluler buruk, menyebabkan request API Google Sheets gagal atau time out.
- **Sebelum Refactor:** Beberapa bagian kode menampilkan error mentah (seperti "TypeError: Failed to fetch" atau "Network Error 503"), membingungkan petugas yang mengira data korup.
- **Sesudah Refactor:** Seluruh interceptor dan formatter mengacu pada `TEXT_ERRORS`. Petugas mendapatkan pesan jelas: *"Koneksi internet tidak stabil. Data Anda tersimpan aman di antrean offline dan akan disinkronkan otomatis saat sinyal kembali."*
