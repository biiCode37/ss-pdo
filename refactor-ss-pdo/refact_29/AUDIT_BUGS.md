# AUDIT BUGS: HARDCODED UI STRINGS & CENTRALIZED TEXT DICTIONARY ENFORCEMENT (REFACTOR 29)

Dokumen ini mendokumentasikan temuan audit kode terhadap teks antarmuka (*hardcoded UI strings*) yang berceceran di luar folder kamus sentral `src/constants/texts/`, dampaknya terhadap maintainability dan konsistensi UX aplikasi SS_PDO, serta penetapan aturan pengikatan agen AI.

---

## DAFTAR TEMUAN AUDIT

| ID Temuan | Komponen / File Terkait | Keparahan | Status |
| :--- | :--- | :--- | :---: |
| **BUG-29-01** | `src/components/fleetStatus/FleetStatusModal.tsx`<br>`src/components/fleetStatus/ShiftConfirmationAlertBar.tsx` | 🟠 **HIGH** (Hardcoded Teks Operasi Armada & Tab Shift) | Terselesaikan |
| **BUG-29-02** | `src/components/UserManagementPage.tsx` | 🟠 **HIGH** (Hardcoded Teks Manajemen Pengguna & RBAC) | Terselesaikan |
| **BUG-29-03** | `src/components/UnitDetailModal.tsx` | 🟠 **HIGH** (Hardcoded Teks Ringkasan Armada, Metrik Shift & Catatan) | Terselesaikan |
| **BUG-29-04** | `src/components/DailyToaTrendCard.tsx`<br>`src/components/KPICard.tsx`<br>`src/components/ShiftComparisonCard.tsx`<br>`src/components/CompletionStatusCard.tsx` | 🟡 **MEDIUM** (Hardcoded Teks Komponen Kartu Dashboard & Tooltip) | Terselesaikan |
| **BUG-29-05** | `src/components/BusList.tsx`<br>`src/components/UnitSummaryDashboard.tsx`<br>`src/components/UnitCard.tsx`<br>`src/components/AccumulationSheet.tsx` | 🟡 **MEDIUM** (Hardcoded Teks Daftar Bus, Rekap, dan Label Kartu Unit) | Terselesaikan |
| **BUG-29-06** | `src/utils/alertUtils.ts`<br>`src/utils/modals/busInputModal.ts`<br>`src/utils/routeValidation.ts` | 🟠 **HIGH** (Hardcoded Dialog SweetAlert2, Pesan Validasi, & Input Modal) | Terselesaikan |
| **BUG-29-07** | `.agents/AGENTS.md`<br>`AGENTS.md` | 🔴 **CRITICAL** (Ketiadaan Aturan Agen Baku Anti-Hardcoding Teks) | Terselesaikan |

---

## RINCIAN TEMUAN

### 🟠 BUG-29-01: Hardcoded Teks Operasi Armada & Banner Konfirmasi Shift
- **ID Temuan:** `BUG-29-01`
- **Lokasi Kode:** `src/components/fleetStatus/FleetStatusModal.tsx` & `ShiftConfirmationAlertBar.tsx`
- **Keparahan:** **HIGH** (Inkonsistensi Kamus Teks Operasional)
- **Deskripsi Masalah:**
  1. Label tab segmented control ("Status Armada", "Laporan Operasional"), judul dialog, tombol shift ("Shift 1 (Pagi)", "Shift 2 (Siang)"), serta teks banner peringatan pergantian shift ditulis langsung sebagai string literal di dalam JSX.
  2. Notifikasi toast berhasil dan gagal simpan status armada ditulis langsung di inline function handler.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Perubahan istilah operasional (misal terminologi SGO, BA, OFF, T.O) di masa mendatang memerlukan penelusuran manual ke dalam struktur komponen presentational yang rentan terlewat.
- **Mitigasi:**
  - Membuat modul kamus sentral baru: `src/constants/texts/text_fleet_status.ts`.
  - Memetakan seluruh label modal, tab shift, status codes, dan banner alert ke objek `TEXT_FLEET_STATUS`.

---

### 🟠 BUG-29-02: Hardcoded Teks Manajemen Pengguna & RBAC
- **ID Temuan:** `BUG-29-02`
- **Lokasi Kode:** `src/components/UserManagementPage.tsx`
- **Keparahan:** **HIGH** (Redundansi Label RBAC & Pesan Alert Pengguna)
- **Deskripsi Masalah:**
  1. Seluruh teks antarmuka manajemen pengguna (judul halaman, filter tab: "Semua", "Petugas", "Admin", "Superadmin", form modal tambah user, konfirmasi perubahan status aktif/nonaktif, peringatan hak akses) ditulis langsung dalam ratusan baris komponen.
  2. Dialog SweetAlert2 untuk konfirmasi penonaktifan akun dan perubahan role di-hardcode tanpa standardisasi.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Pesan peringatan hak akses dan konfirmasi akun rawan tidak seragam dengan pesan error umum sistem lainnya.
- **Mitigasi:**
  - Membuat modul kamus sentral baru: `src/constants/texts/text_user_management.ts`.
  - Seluruh label, placeholder, judul modal, badge peran, serta pesan konfirmasi SweetAlert2 diekstraksi ke `TEXT_USER_MANAGEMENT`.

---

### 🟠 BUG-29-03: Hardcoded Teks Ringkasan Armada, Metrik Shift & Catatan
- **ID Temuan:** `BUG-29-03`
- **Lokasi Kode:** `src/components/UnitDetailModal.tsx`
- **Keparahan:** **HIGH** (Inkonsistensi Label Metrik Detail Bus)
- **Deskripsi Masalah:**
  Label metrik operasional unit (Shift 1, Shift 2, Akumulasi Total, Target Ritase, Target Tercapai, Defisit Ritase, Pnp/Km, Km/Rit, Catatan Kendala) ditulis langsung di elemen HTML JSX modal.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Jika istilah metrik operasional disesuaikan dengan pedoman Transjakarta terkini, developer harus mengubah puluhan elemen visual di dalam modal.
- **Mitigasi:**
  - Membuat modul kamus sentral baru: `src/constants/texts/text_unit_detail.ts`.
  - Mengisolasi seluruh teks presentasi modal ke `TEXT_UNIT_DETAIL`.

---

### 🟡 BUG-29-04 & BUG-29-05: Hardcoded Teks Kartu Dashboard & Daftar Armada
- **ID Temuan:** `BUG-29-04`, `BUG-29-05`
- **Lokasi Kode:** `DailyToaTrendCard.tsx`, `KPICard.tsx`, `ShiftComparisonCard.tsx`, `CompletionStatusCard.tsx`, `BusList.tsx`, `UnitCard.tsx`, `AccumulationSheet.tsx`
- **Keparahan:** **MEDIUM** (Teks Berceceran di Lapisan UI Dashboard)
- **Deskripsi Masalah:**
  Teks deskripsi chart, tooltip perbandingan shift, judul kartu ringkasan unit berketerangan, placeholder pencarian nomor body, serta label badge status kelengkapan data (misal: "S1 & S2 Lengkap", "Negatif Data S1") ditulis langsung di komponen presentational.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Potensi ketidakcocokan narasi status antara tampilan kartu unit dan tabel ringkasan.
- **Mitigasi:**
  - Memperluas kamus `src/constants/texts/text_dashboard.ts` dengan sub-objek: `TOA_TREND`, `KPIS`, `SHIFT_COMPARISON`, `COMPLETION_STATUS`, `BUS_LIST`, `UNIT_CARD`, dan `ACCUMULATION_SHEET`.

---

### 🟠 BUG-29-06: Hardcoded Dialog SweetAlert2, Pesan Validasi, & Input Modal
- **ID Temuan:** `BUG-29-06`
- **Lokasi Kode:** `src/utils/alertUtils.ts`, `src/utils/modals/busInputModal.ts`, `src/utils/routeValidation.ts`
- **Keparahan:** **HIGH** (Pesan Pop-up & Pesan Validasi Tidak Terstandarisasi)
- **Deskripsi Masalah:**
  1. Modal SweetAlert2 untuk input massal trip (`showBulkTripModal`), salin massal KM (`showBulkCopyKmModal`), dan konfirmasi format sheet berisikan teks HTML literal langsung di dalam fungsi utilitas.
  2. Label form input bus per-kolom (`LABEL_TOA_S1`, `LABEL_TOTAL_TOA`, `LABEL_KM_AWAL_S1`, dsb.) belum tersentralisasi.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Pesan validasi dan modal aksi massal sulit dipelihara dan rawan inkonsistensi tone of voice.
- **Mitigasi:**
  - Memperbarui `src/constants/texts/text_alerts.ts` dengan modul `BULK_TRIP`, `BULK_COPY_KM`, `BUS_INPUT_MODAL`, dan `FORMAT_SHEET`.
  - Menggunakan fungsi template murni untuk interpolasi dinamis dengan escaping HTML yang aman.

---

### 🔴 BUG-29-07: Ketiadaan Aturan Agen Baku Anti-Hardcoding Teks
- **ID Temuan:** `BUG-29-07`
- **Lokasi Kode:** `.agents/AGENTS.md` & `AGENTS.md`
- **Keparahan:** **CRITICAL** (Akar Masalah Regresi Teks UI di Masa Mendatang)
- **Deskripsi Masalah:**
  Sebelumnya, berkas panduan AI Agent tidak memiliki aturan tertulis yang secara tegas melarang penulisan teks UI langsung di komponen baru atau modifikasi file. Akibatnya, setiap ada penambahan fitur baru oleh agent, teks kembali ditulis secara hardcoded.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Siklus audit teks harus terus berulang setiap beberapa sesi pengembangan karena agen terus mengulangi antipola hardcoding.
- **Mitigasi:**
  - Menetapkan aturan emas permanen pada Bagian 10 di `.agents/AGENTS.md` dan `AGENTS.md`: "Standar Kamus Teks Sentral (`src/constants/texts/`)".
  - Mewajibkan penempatan teks di modul kamus domain terkait, fungsi template murni untuk variabel, dan verifikasi otomatis melalui `texts.test.ts`.
