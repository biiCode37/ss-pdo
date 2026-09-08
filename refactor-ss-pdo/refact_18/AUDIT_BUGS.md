# AUDIT BUGS: SENTRALISASI KAMUS TEKS UI APLIKASI (REFACTOR 18)

Dokumen ini mendokumentasikan temuan audit kode, arsitektur string literal, dan konsistensi terminologi antarmuka pengguna (UI/UX) pada aplikasi SS_PDO sebelum dilakukannya refactor sentralisasi kamus teks.

---

## DAFTAR TEMUAN AUDIT

| ID Temuan | Komponen / File Terkait | Keparahan | Status |
| :--- | :--- | :---: | :---: |
| **TEXT-18-01** | `src/components/*`<br>`src/utils/*`<br>`src/services/*` | 🟡 **MEDIUM** (Maintainability & Fragility) | Terselesaikan |
| **TEXT-18-02** | `src/components/RouteOperationalReportCard.tsx`<br>`src/components/WaReportModal.tsx`<br>`src/utils/waReportGenerator.ts`<br>`src/components/AllRouteMonitoringPage.tsx` | 🟡 **MEDIUM** (Operational Inconsistency) | Terselesaikan |
| **TEXT-18-03** | `src/utils/alertUtils.ts`<br>`src/utils/errorFormatter.ts`<br>`src/components/QueueModal.tsx` | 🟡 **MEDIUM** (DX & Resilience) | Terselesaikan |

---

## RINCIAN TEMUAN

### 🟡 TEXT-18-01: String Literal UI Tersebar (Scattered Hardcoded Copy) Tanpa Tata Kelola Terpusat

- **ID Temuan:** `TEXT-18-01`
- **Lokasi Kode:**
  - `src/components/Dashboard.tsx`
  - `src/components/RouteSelectorCard.tsx`
  - `src/components/BottomNav.tsx`
  - `src/components/ProfileMenuSheet.tsx`
  - `src/components/LoginScreen.tsx`
- **Keparahan:** **MEDIUM** (Maintainability & Clean Architecture)
- **Deskripsi Masalah:**
  1. Seluruh teks antarmuka (labels, placeholders, badge status, judul kartu, tombol aksi navigasi) ditulis secara hardcoded langsung di dalam file komponen JSX.
  2. Ketika ada pembaruan copywriting, perubahan istilah regulasi operasional Transjakarta, atau perbaikan tata bahasa/ejaan, pengembang harus menyisir puluhan file komponen satu per satu.
  3. Ketiadaan kamus terpusat menyulitkan audit teks, meningkatkan risiko duplikasi string literal, dan membuka celah inkonsistensi antar tampilan.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Pengguna lapangan dan petugas operasional mendapati label antarmuka yang berubah-ubah secara sporadis ketika ada update parsial, serta potensi kebingungan akibat nama menu atau instruksi yang tidak seragam di layar berbeda.
- **Mitigasi:**
  Membangun arsitektur kamus teks terpusat berbasis modul domain di `src/constants/texts/` dengan konvensi penamaan prefix `text_` (`text_common.ts`, `text_auth.ts`, `text_dashboard.ts`, dll.) menggunakan TypeScript murni `as const` tanpa beban dependensi eksternal.

---

### 🟡 TEXT-18-02: Inkonsistensi Istilah Operasional & Format Laporan WhatsApp Antara Form dan Broadcast

- **ID Temuan:** `TEXT-18-02`
- **Lokasi Kode:**
  - `src/components/RouteOperationalReportCard.tsx`
  - `src/components/WaReportModal.tsx`
  - `src/utils/waReportGenerator.ts`
  - `src/components/AllRouteMonitoringPage.tsx`
- **Keparahan:** **MEDIUM** (Operasional & Integritas Pelaporan)
- **Deskripsi Masalah:**
  1. Istilah operasional penting seperti "Laporan Operasional", "Kendala Operasional / Laka / Mogok", "Ritase", "Kesiapan Operasi", dan header pesan WhatsApp ditulis manual secara inline di beberapa file logika dan komponen terpisah.
  2. Format teks template broadcast WhatsApp rentan mengalami desinkronisasi label dengan form input PDO jika salah satu file diubah tanpa memperbarui file generator pesan.
  3. Label filter status wilayah pada monitoring (seperti "Semua Wilayah", "Telah Input", "Belum Input") didefinisikan secara lokal di dalam komponen halaman.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Laporan broadcast WhatsApp yang di-generate petugas lapangan berisiko memiliki perbedaan istilah dengan ringkasan yang tertera di form PDO aplikasi, menimbulkan keraguan pengawas jalur dan supervisor saat membaca rekapan harian.
- **Mitigasi:**
  Menyentralisasikan teks formulir operasional ke `text_pdo_form.ts`, teks monitoring semua rute ke `text_monitoring.ts`, dan template broadcast WhatsApp ke `text_wa_report.ts`. Menggunakan parameter interpolasi fungsi murni untuk menyusun pesan dinamis secara konsisten.

---

### 🟡 TEXT-18-03: Ketiadaan Kontrak Tipe Aman untuk Pesan Notifikasi, Alert Modal, dan Error Catalog

- **ID Temuan:** `TEXT-18-03`
- **Lokasi Kode:**
  - `src/utils/alertUtils.ts`
  - `src/utils/errorFormatter.ts`
  - `src/components/QueueModal.tsx`
- **Keparahan:** **MEDIUM** (DX, Error Handling & User-Friendliness)
- **Deskripsi Masalah:**
  1. Pesan dialog SweetAlert2 (judul, teks instruksi, konfirmasi batal/simpan) serta katalog pesan kesalahan jaringan/Google Sheets (`formatFriendlyError`) didefinisikan sebagai raw strings di dalam utilitas.
  2. Ketiadaan proteksi tipe data (*type safety*) meningkatkan risiko typo dalam pesan kesalahan yang berakibat pesan teknis bocor ke sisi pengguna lapangan (melanggar aturan emas transparansi error non-teknis).
  3. Modal antrean offline (`QueueModal.tsx`) menduplikasi teks instruksi sinkronisasi dan status antrean di dalam komponen presentasional.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Pesan kesalahan berisiko menggunakan bahasa teknis atau tidak informatif saat terjadi kendala jaringan di lapangan, membingungkan petugas input dan pengemudi.
- **Mitigasi:**
  Mengisolasi seluruh salinan alert ke `text_alerts.ts` dan seluruh katalog pesan ramah kesalahan ke `text_errors.ts`. Memastikan seluruh pesan ramah pengguna non-teknis memiliki SSOT dan divalidasi dengan unit test `texts.test.ts`.
