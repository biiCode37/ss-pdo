# 🛡️ Aturan, Ketetapan, & Batasan Proyek SS_PDO (Gemini AI Agent)

Dokumen ini adalah acuan dan standar emas (_Golden Rules_) yang **WAJIB dipatuhi oleh Gemini AI Agent tanpa pengecualian** dalam setiap sesi pengembangan dan pemeliharaan proyek **SS_PDO**.

Aturan utama disinkronkan secara penuh dengan [`.agents/AGENTS.md`](./.agents/AGENTS.md) dan [`AGENTS.md`](./AGENTS.md).

---

## 🎨 Standar Sistem Warna & Aksesibilitas Desain UI/UX (Refactor 174)

1. **Aturan Emas Anti-Hardcoded Color Hex/RGB di Komponen UI:**
   - Dilarang keras menuliskan kode warna mentah (*raw hex, rgb, rgba, hsl*) seperti `#3ecf8e`, `#10b981`, `#0284c7`, `#171717`, `rgba(0,0,0,...)` secara langsung pada inline style JSX/TSX atau aturan CSS baru.
   - Seluruh pewarnaan wajib merujuk ke CSS Variables semantik adaptif dari `src/styles/tokens/semantic.css`:
     - Latar kanvas/shell: `var(--color-surface-canvas)`
     - Latar kartu/modal: `var(--color-surface-raised)` atau `var(--color-surface-default)`
     - Teks utama: `var(--color-text-primary)` (rasio kontras 17.85:1 Light / 13.9:1 Dark)
     - Teks sekunder: `var(--color-text-secondary)`
     - Teks petunjuk placeholder: `var(--color-text-muted)` dengan `opacity: 1`
     - Tombol aksi utama: `var(--color-action-primary-bg)` dan `var(--color-action-primary-fg)`
     - Status/Feedback: `var(--color-success-*)`, `var(--color-warning-*)`, `var(--color-error-*)`, `var(--color-info-*)`

2. **Standar Rasio Kontras Aksesibilitas WCAG (Light & Dark Mode):**
   - Setiap komponen atau modul baru **WAJIB lolos uji keterbacaan di 2 Tema (Light Mode & Dark Mode)**.
   - Teks normal (< 18px / < 14px bold): Wajib **WCAG AA (rasio kontras ≥ 4.5:1)**, diutamakan **WCAG AAA (≥ 7.0:1)**.
   - Komponen UI/Ikon/Tombol grafis: Wajib **rasio kontras ≥ 3.0:1**.
   - Dilarang menempatkan teks putih di atas latar hijau muda, cyan, atau kuning (misal: `#fff` di atas `#24b47e` atau `#0ea5e9`).
   - Dilarang menempatkan teks hitam di atas latar abu-abu gelap atau hitam.
   - Dilarang memudarkan batang grafik atau indikator data penting dengan `opacity` transparan rendah (< 80%) di area dasar grafik.

3. **Pemisahan Tegas Domain UI vs Domain Google Sheets (SSOT API):**
   - Dilarang menyamakan fungsi pewarnaan UI aplikasi dengan pewarnaan sel Google Sheets.
   - File `src/utils/sheetColorUtils.ts` adalah **Single Source of Truth (SSOT) Google Sheets API murni**.
   - Dilarang mengubah nilai desimal RGB pada `sheetColorUtils.ts` untuk keperluan styling UI frontend, dan dilarang mengubah payload mutasi spreadsheet yang dapat merusak formula lembar kerja.

4. **Standarisasi Warna Peran Hierarki (Role RBAC):**
   - Dilarang menggunakan warna merah (`error`/`danger`) untuk menandai peran Superadmin.
   - Pewarnaan badge dan indikator identitas peran wajib menggunakan token khusus:
     - **Superadmin:** `var(--color-role-superadmin-bg)` / `fg` / `border` (Amber hangat/wibawa, kontras 8.35:1)
     - **Admin:** `var(--color-role-admin-bg)` / `fg` / `border` (Sky biru korporat)
     - **Korwil:** `var(--color-role-korwil-bg)` / `fg` / `border` (Indigo)
     - **Korlap:** `var(--color-role-korlap-bg)` / `fg` / `border` (Orange)
     - **PDO:** `var(--color-role-pdo-bg)` / `fg` / `border` (Emerald)

5. **Sinkronisasi Status Bar Peramban Ponsel (Theme-Color):**
   - Saat menambah atau memodifikasi pengaturan tampilan, pastikan utilitas `syncThemeChrome()` di `src/utils/themeUtils.ts` terpanggil untuk menjaga keselarasan warna status bar peramban Android/iOS dengan tema aktif.

6. **Verifikasi Mutlak Pengujian Kontrak Warna:**
   - Setiap penambahan pasangan token warna atau elemen baru wajib diuji dengan:
     `pnpm vitest run src/styles/tokens/color-contract.test.ts`
     dan dipastikan lulus 100% sebelum pekerjaan diserahkan.

---

## 📌 Ringkasan Batasan Teknis Wajib SS_PDO

1. **Branch devmode Eksklusif:** Seluruh pekerjaan wajib berada di branch `devmode`. Dilarang menyentuh branch `main`.
2. **Paket Manager PNPM:** Wajib menggunakan `pnpm` (dilarang npm/yarn/npx).
3. **Kamus Teks Sentral (`src/constants/texts/`):** Dilarang keras *hardcoded UI string* di komponen UI.
4. **Proteksi Formula Spreadsheet:** Dilarang menimpa kolom berumus Google Sheets asli.
5. **Quality Gates Otomatis Sebelum Selesai:**
   - `pnpm vitest run src/styles/tokens/color-contract.test.ts` (100% pass)
   - `pnpm vitest run src/` (100% pass)
   - `pnpm run build` (0 error)
   - `graphify update .` (terupdate)

