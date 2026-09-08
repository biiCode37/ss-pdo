# Implementation Plan: Centralized UI Text Dictionary

- **Spec:** `docs/superpowers/specs/2026-09-08-centralized-ui-text-dictionary-design.md`
- **Branch:** `devmode`
- **Location:** `src/constants/texts/`
- **Prefix:** `text_`

---

## Global Constraints & Rules
1. **Branch Wajib `devmode`:** Dilarang menyentuh `main`/`production`.
2. **Commit Messages:** Ringkas ($\le 50$ karakter) Conventional Commits.
3. **Prefix Wajib:** Seluruh file kamus teks wajib diawali `text_`.
4. **Zero-Breakage / Regression Free:** Seluruh 237 pengujian yang sudah ada harus tetap lulus 100%.
5. **No External Libraries:** Murni TypeScript `as const` dan fungsi interpolasi murni tanpa dependensi i18n eksternal.

---

## Tasks

### Task 1: Scaffolding Fondasi Kamus Teks (`src/constants/texts/`)
**Files:**
- Create: `src/constants/texts/text_common.ts`
- Create: `src/constants/texts/text_auth.ts`
- Create: `src/constants/texts/text_dashboard.ts`
- Create: `src/constants/texts/text_pdo_form.ts`
- Create: `src/constants/texts/text_monitoring.ts`
- Create: `src/constants/texts/text_wa_report.ts`
- Create: `src/constants/texts/text_alerts.ts`
- Create: `src/constants/texts/text_errors.ts`
- Create: `src/constants/texts/index.ts`
- Create: `src/constants/texts/texts.test.ts`

**Steps:**
1. Tulis `texts.test.ts` untuk menguji eksistensi key dan fungsi interpolasi pada seluruh modul teks.
2. Implementasikan 8 file `text_*.ts` dan barrel export `index.ts`.
3. Verifikasi dengan `pnpm vitest run src/constants/texts/texts.test.ts`.
4. Commit: `feat: add centralized ui text dictionary files`.

---

### Task 2: Migrasi Modul Monitoring Wilayah & Generator WA
**Files:**
- Modify: `src/components/AllRouteMonitoringPage.tsx`
- Modify: `src/components/WaReportModal.tsx`
- Modify: `src/utils/waReportGenerator.ts`
- Modify: `src/components/AllRouteMonitoringPage.test.tsx`
- Modify: `src/components/WaReportModal.test.tsx`
- Modify: `src/utils/waReportGenerator.test.ts`

**Steps:**
1. Impor `TEXT_MONITORING`, `TEXT_WA_REPORT`, `TEXT_COMMON` di file target.
2. Ganti seluruh teks hardcoded dengan konstanta kamus.
3. Jalankan pengujian:
   `pnpm vitest run src/components/AllRouteMonitoringPage.test.tsx src/components/WaReportModal.test.tsx src/utils/waReportGenerator.test.ts`.
4. Commit: `refactor: migrate monitoring and wa report texts`.

---

### Task 3: Migrasi Form Operasional PDO
**Files:**
- Modify: `src/components/RouteOperationalReportCard.tsx`
- Modify: `src/components/RouteOperationalReportCard.test.tsx`

**Steps:**
1. Impor `TEXT_PDO_FORM` dan `TEXT_COMMON`.
2. Ganti seluruh label form, placeholder, modal macet, dan tombol aksi dengan konstanta kamus.
3. Jalankan pengujian: `pnpm vitest run src/components/RouteOperationalReportCard.test.tsx`.
4. Commit: `refactor: migrate pdo operational form texts`.

---

### Task 4: Migrasi Alerts, Notifikasi, & Error Catalog
**Files:**
- Modify: `src/utils/alertUtils.ts`
- Modify: `src/utils/errorFormatter.ts`
- Modify: `src/components/QueueModal.tsx`

**Steps:**
1. Impor `TEXT_ALERTS`, `TEXT_ERRORS`, `TEXT_COMMON`.
2. Ganti judul, deskripsi dialog konfirmasi SweetAlert2, toast, dan pesan error ramah pengguna.
3. Jalankan pengujian: `pnpm vitest run src/utils/alertUtils.test.ts`.
4. Commit: `refactor: migrate alerts and error texts`.

---

### Task 5: Migrasi Dashboard Utama, Navigasi, & Auth
**Files:**
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/components/RouteSelectorCard.tsx`
- Modify: `src/components/BottomNav.tsx`
- Modify: `src/components/ProfileMenuSheet.tsx`
- Modify: `src/components/LoginScreen.tsx`

**Steps:**
1. Impor `TEXT_DASHBOARD`, `TEXT_AUTH`, `TEXT_COMMON`.
2. Ganti teks header PUSM, label tab, status antrean, menu profil, dan layar login.
3. Jalankan pengujian komponen terkait.
4. Commit: `refactor: migrate dashboard and auth texts`.

---

### Task 6: Quality Gates & Final Verification
**Steps:**
1. Jalankan `pnpm vitest run src/` (wajib lulus 100%).
2. Jalankan `pnpm run build` (`tsc -b && vite build`, wajib 0 error).
3. Jalankan `graphify update .`.
4. Commit: `chore: update knowledge graph after text migration`.
