# REPAIR REPORT: CENTRALIZED UI TEXT DICTIONARY & COMPONENT REFACTOR (REFACTOR 29)

Laporan ini merangkum perbaikan dan standarisasi sentralisasi seluruh teks antarmuka (*UI strings*) ke dalam kamus modul terisolasi di folder `src/constants/texts/` serta penetapan aturan permanen bagi AI Agent pada repositori SS_PDO.

---

## 1. DAFTAR PERUBAHAN & IMPLEMENTASI

### 🔹 1.1 Penetapan Regulasi Baku AI Agent (BUG-29-07)
- **Lokasi File:** `.agents/AGENTS.md` & `AGENTS.md`
- **Rincian Implementasi:**
  - Ditambahkan klausul **Bagian 10: Standar Kamus Teks Sentral (`src/constants/texts/`)**.
  - **Aturan Emas Anti Hardcoded UI String:** Dilarang keras menuliskan teks antarmuka (*hardcoded UI strings*) secara langsung pada kode komponen (`.tsx`), modal (`.ts`), notifikasi, atau utilitas.
  - Setiap pembuatan atau modifikasi komponen **WAJIB** menempatkan seluruh string UI di modul kamus domain terkait.
  - Interpolasi dinamis diwajibkan menggunakan fungsi template murni (misal `(count: number) => string`).
  - Setiap penambahan kunci kamus baru wajib disertakan uji integritas pada `src/constants/texts/texts.test.ts`.

### 🔹 1.2 Pembuatan Modul Kamus Domain Baru
1. **`src/constants/texts/text_fleet_status.ts` (BUG-29-01):**
   - Berisi kamus teks modal status armada, tab segmented kontrol (Shift 1 / Shift 2), aksi massal ("SGO Semua Unit"), teks status codes (SGO, OFF, T.O, BA), banner alert bar pergantian shift, dan toast feedback.
2. **`src/constants/texts/text_user_management.ts` (BUG-29-02):**
   - Berisi kamus teks manajemen pengguna RBAC: judul header, tab filter peran, kolom tabel/kartu pengguna, modal tambah pengguna baru, dialog konfirmasi perubahan peran & toggle status akun, serta peringatan pembatasan hak akses.
3. **`src/constants/texts/text_unit_detail.ts` (BUG-29-03):**
   - Berisi kamus teks modal rincian armada: judul rekapitulasi, metrik shift 1, shift 2, akumulasi total ritase, km, pelanggan, status target ritase, dan catatan khusus unit.

### 🔹 1.3 Pengayaan Modul Kamus Teks Eksisting
1. **`src/constants/texts/text_common.ts`:**
   - Menambahkan pintasan `TEXT_COMMON.CLOSE` dan standar label tombol global.
2. **`src/constants/texts/text_dashboard.ts` (BUG-29-04, BUG-29-05):**
   - Menambahkan entri `HEADER`, `TOA_TREND`, `KPIS`, `SHIFT_COMPARISON`, `COMPLETION_STATUS`, `BUS_LIST`, `UNIT_CARD`, dan `ACCUMULATION_SHEET`.
3. **`src/constants/texts/text_alerts.ts` (BUG-29-06):**
   - Menambahkan konfigurasi teks modal aksi massal `BULK_TRIP`, `BULK_COPY_KM`, serta label input field `BUS_INPUT_MODAL` dan `FORMAT_SHEET`.
4. **`src/constants/texts/text_auth.ts`:**
   - Menambahkan teks kartu fitur halaman login (`FEATURE_CARDS`).

### 🔹 1.4 Migrasi Komponen dan Utilitas ke Kamus Sentral
Komponen dan utilitas berikut telah 100% dimigrasikan dari hardcoded string ke kamus sentral:
- `src/components/fleetStatus/FleetStatusModal.tsx`
- `src/components/fleetStatus/ShiftConfirmationAlertBar.tsx`
- `src/components/UserManagementPage.tsx`
- `src/components/UnitDetailModal.tsx`
- `src/components/DailyToaTrendCard.tsx`
- `src/components/KPICard.tsx`
- `src/components/ShiftComparisonCard.tsx`
- `src/components/CompletionStatusCard.tsx`
- `src/components/BusList.tsx`
- `src/components/UnitSummaryDashboard.tsx`
- `src/components/UnitCard.tsx`
- `src/components/AccumulationSheet.tsx`
- `src/components/login/LoginFeatureCards.tsx`
- `src/components/routeSelector/AddRouteModal.tsx`
- `src/components/routeSelector/RouteSelectorSheet.tsx`
- `src/components/Dashboard.tsx`
- `src/App.tsx`
- `src/utils/alertUtils.ts`
- `src/utils/modals/busInputModal.ts`
- `src/utils/routeValidation.ts`

---

## 2. BEFORE VS AFTER COMPARISON

### 📊 Status Armada & Konfirmasi Shift
| Aspek | Sebelum (Before) | Sesudah (After) |
| :--- | :--- | :--- |
| **Label Modal** | Hardcoded di JSX (`"Status Armada"`, `"Shift 1 (Pagi)"`) | `TEXT_FLEET_STATUS.MODAL.TITLE`, `TEXT_FLEET_STATUS.MODAL.SHIFT_1_TAB` |
| **Banner Alert** | Hardcoded di JSX (`"Status Armada Shift 1 belum dikonfirmasi"`) | `TEXT_FLEET_STATUS.ALERT_BAR.SHIFT_1_UNCONFIRMED` |
| **Status Codes** | String literal (`"SGO"`, `"BA / Kendala"`) | `TEXT_FLEET_STATUS.STATUS_CODES.SGO`, `TEXT_FLEET_STATUS.STATUS_CODES.BA` |

### 📊 Manajemen Pengguna & Hak Akses
| Aspek | Sebelum (Before) | Sesudah (After) |
| :--- | :--- | :--- |
| **Judul & Tab** | Hardcoded literal (`"Manajemen Pengguna"`, `"Semua"`) | `TEXT_USER_MANAGEMENT.HEADER.TITLE`, `TEXT_USER_MANAGEMENT.TABS.ALL` |
| **Konfirmasi Nonaktif** | Hardcoded HTML string di SweetAlert2 | `TEXT_USER_MANAGEMENT.ALERTS.DEACTIVATE_CONFIRM(name)` |
| **Akses Terbatas** | Hardcoded literal (`"Akses Terbatas"`) | `TEXT_USER_MANAGEMENT.ALERTS.ACCESS_RESTRICTED` |

### 📊 Modal Rincian Unit Bus
| Aspek | Sebelum (Before) | Sesudah (After) |
| :--- | :--- | :--- |
| **Header Ringkasan** | Hardcoded literal (`"Ringkasan Rekapitulasi Armada"`) | `TEXT_UNIT_DETAIL.TITLE` |
| **Status Target** | Hardcoded literal (`"Target Tercapai"`, `"Defisit Ritase"`) | `TEXT_UNIT_DETAIL.TARGET_ACHIEVED`, `TEXT_UNIT_DETAIL.TARGET_DEFICIT` |
| **Keterangan Operasional** | Hardcoded literal (`"Catatan & Keterangan Operasional"`) | `TEXT_UNIT_DETAIL.NOTES_SECTION_TITLE` |

### 📊 Dialog Input Massal & Notifikasi
| Aspek | Sebelum (Before) | Sesudah (After) |
| :--- | :--- | :--- |
| **Salin KM Massal** | Hardcoded template HTML literal di `alertUtils.ts` | `TEXT_ALERTS.BULK_COPY_KM.ELIGIBLE_UNITS(count)` |
| **Input Massal Trip** | Hardcoded HTML di modal SweetAlert2 | `TEXT_ALERTS.BULK_TRIP.DESCRIPTION(count)` |
| **Label Input Bus** | Hardcoded nama kolom di `SINGLE_COLUMN_META` | `TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S1`, dll. |

---

## 3. CASE: SKENARIO LAPANGAN RELEVAN

### 🚌 Kasus 1: Perubahan Terminologi Kebijakan Operasional Transjakarta
- **Skenario:** Manajemen operasional mengubah sebutan kode status armada `"BA / Kendala"` menjadi `"BA Operasional"` dan mengubah label tombol `"SGO Semua Unit"` menjadi `"Siap Operasi Semua"`.
- **Sebelum Refactor:** Pengembang harus menelusuri 4 file komponen berbeda (`FleetStatusModal.tsx`, `ShiftConfirmationAlertBar.tsx`, `Dashboard.tsx`, `pdoForm.ts`), mencari teks di antara ratusan tag JSX dan berisiko melewatkan salah satunya sehingga tampilan antarmuka menjadi belang-belang (*inconsistent*).
- **Setelah Refactor:** Cukup mengubah 2 baris di file kamus tunggal `src/constants/texts/text_fleet_status.ts`. Seluruh modal, tab, chip, dan alert bar di aplikasi langsung terbarui secara otomatis dan seragam.

### 👥 Kasus 2: Penyesuaian Pesan Keamanan & Peringatan Pengguna (RBAC)
- **Skenario:** Tim IT meminta penyesuaian kalimat peringatan hak akses ketika petugas lapangan tanpa sengaja membuka menu manajemen pengguna yang hanya diperuntukkan bagi Superadmin.
- **Sebelum Refactor:** String error dan judul alert tertanam dalam komponen `UserManagementPage.tsx` dan `App.tsx` dengan variasi teks berbeda.
- **Setelah Refactor:** Pesan peringatan terisolasi rapi di `TEXT_USER_MANAGEMENT.ALERTS.ACCESS_RESTRICTED_DESC`. Perubahan kalimat dapat dilakukan dengan cepat tanpa menyentuh logika render komponen.

### 📱 Kasus 3: Agen AI Baru Mengembangkan Fitur Komponen Baru
- **Skenario:** Agen AI masa depan menerima perintah untuk menambahkan fitur atau kartu statistik baru di SS_PDO.
- **Sebelum Refactor:** Agen AI sering kali langsung menuliskan teks antarmuka di dalam file `.tsx` baru, menyebabkan masalah hardcoding terus berulang dan menumpuk hutang teknis (*technical debt*).
- **Setelah Refactor:** Berkas instruksi `AGENTS.md` dan `.agents/AGENTS.md` secara eksplisit melarang hardcoding teks dan mewajibkan penambahan entri di `src/constants/texts/`. Dilengkapi unit test di `texts.test.ts`, agen AI akan langsung terdeteksi gagal jika melanggar standar ini pada saat tahap quality gate `pnpm vitest run src/`.

---

## 4. VERIFIKASI QUALITY GATES

1. **Unit Test Coverage:**
   - Command: `pnpm vitest run src/`
   - Hasil: **39 test files passed, 294 tests passed (100% success)**.
2. **TypeScript Strict Mode & Production Build:**
   - Command: `pnpm run build` (`tsc -b && vite build`)
   - Hasil: **0 errors, bundle berhasil dikompilasi**.
3. **Knowledge Graph Synchronized:**
   - Command: `graphify update .`
   - Hasil: **2825 nodes, 3885 edges, 241 communities terbarui**.
