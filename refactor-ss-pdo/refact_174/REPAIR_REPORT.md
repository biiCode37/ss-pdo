# REPAIR REPORT — Refactor 174: Sistem Warna & Standardisasi Aksesibilitas Desain UI/UX

**Tanggal:** 31 Oktober 2026  
**Status:** **TAHAP 5 SELESAI — VERIFIKASI MENYELURUH & QUALITY GATES FINAL LULUS 100%**  
**Basis Repositori:** branch `devmode`, commit `158590fc9b2f60546d9cae65d6aae0884d660ffa`  
**Sumber Audit:** `refactor-ss-pdo/refact_174/UI_COLOR_AUDIT_SS_PDO.md`  

---

## 1. Rencana Arsitektur & Struktur File Baru

Untuk menyelesaikan 26 masalah warna (CLR-01 s.d. CLR-26) secara sistematis tanpa menambah dependensi berat dan tanpa merusak logika data Google Sheets, dibangun arsitektur 3 lapis token CSS:

```text
src/
├── styles/
│   ├── tokens/
│   │   ├── primitives.css          # Satu-satunya SSOT nilai hex/rgb (palette dasar)
│   │   ├── semantic.css            # Token peran/makna (--color-*) untuk Light & Dark
│   │   ├── legacy.css              # Jembatan kompatibilitas fail-safe untuk token lama
│   │   └── color-contract.test.ts  # Unit test otomatis 114 pasangan rasio kontras WCAG
│   └── components/
│       ├── actions.css             # Standarisasi tombol .ui-button (primary, secondary, danger)
│       ├── status.css              # Standarisasi badge status .ui-status
│       ├── forms.css               # Standarisasi input .ui-input & focus-visible
│       └── charts.css              # Standarisasi warna SVG diagram & grafik
```

### Jembatan Kompatibilitas (`legacy.css`)
Namespace lama (`--bg-card`, `--bg-primary`, `--border-color`, `--shadow`, `--warning-bg`, `--accent-bg`, dll) dipetakan ke semantic token baru di `legacy.css` sehingga seluruh komponen lama terlindungi dari layar gelap/transparan di Light Mode. Verifikasi global memastikan **200 variabel CSS unik terdefinisi dan 0 token hilang**.

---

## 2. Before vs After & Case: Skenario Lapangan

### CLR-01 & CLR-02: Modal & Shell Shell Gelap di Light Mode
- **Lokasi:** `src/components/login/LegalModals.tsx`, `AddRouteModal.tsx`, `PageManagementPage.tsx`, `ReportModalLayout.tsx`
- **Before:**
  ```tsx
  backgroundColor: "var(--bg-card, #171717)", // Fallback gelap aktif di Light Mode!
  color: "var(--text-primary)",                 // Bernilai #171717 -> Kontras 1.00:1 (Teks hilang)
  ```
- **After:**
  ```tsx
  backgroundColor: "var(--color-surface-raised)",
  color: "var(--color-text-primary)",
  border: "1px solid var(--color-border-subtle)",
  boxShadow: "0 -10px 40px var(--color-shadow)",
  ```
- **Case: Skenario Lapangan:**
  Petugas operasional di lapangan membuka form Tambah Rute atau Lembar Legalitas di ponsel saat siang hari dengan tema Light Mode. Pada kondisi *Before*, modal tampak hitam pekat dengan teks hitam sehingga sama sekali tidak bisa dibaca. Pada kondisi *After*, modal tampil dengan permukaan putih bersih (`#FFFFFF`) dan teks biru gelap pekat (`#0F172A`) dengan kontras 17.85:1 (lulus WCAG AAA).

---

### CLR-04 & CLR-06: Tombol Aksi Utama (.btn & Simpan)
- **Lokasi:** `src/index.css:267`, `src/components/busCard/modal/BusInputModalFooter.tsx:71`
- **Before:**
  ```tsx
  // BusInputModalFooter
  background: isDisabled
    ? "rgba(100, 116, 139, 0.25)"
    : "linear-gradient(135deg, #0284c7, #0ea5e9)", // Teks putih pada #0ea5e9 = 2.77:1 (Gagal AA)
  color: isDisabled ? "#64748b" : "#ffffff",
  ```
- **After:**
  ```tsx
  <button
    type="button"
    className="ui-button ui-button--primary"
    disabled={isDisabled}
    onClick={onSave}
  >
    {saveButtonText}
  </button>
  ```
- **Case: Skenario Lapangan:**
  Pengawas rute memasukkan data ritase dan kilometer bus di bawah terik matahari. Tombol "Simpan" sebelumnya memiliki gradien biru muda dengan teks putih yang pudar dan menyilaukan. Dengan perbaikan, tombol menggunakan warna korporat solid `#0846A1` (Light) atau `#93C5FD` dengan teks biru tua `#0B1F3A` (Dark), menghasilkan rasio kontras 8.75:1 dan 9.16:1 yang sangat tajam dan ergonomis (tinggi minimum 44px ramah jempol).

---

### CLR-09 & CLR-10: Status Operasional & Badge Armada Monitoring
- **Lokasi:** `src/components/monitoring/monitoringUtils.ts:182`, `src/index.css:404`
- **Before:**
  ```ts
  // monitoringUtils.ts
  return {
    code: isEvdal ? "TO EVDAL" : "T.O",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.15)", // Kontras teks pada latar putih hanya 1.92:1 (Gagal AA)
  };
  ```
- **After:**
  ```ts
  return {
    code: isEvdal ? "TO EVDAL" : "T.O",
    color: "var(--color-warning-fg)", // #92400E pada Light (6.37:1), #FCD34D pada Dark (9.54:1)
    bg: "var(--color-warning-bg)",    // #FEF3C7 pada Light, #3B2A12 pada Dark
  };
  ```
- **Case: Skenario Lapangan:**
  Di layar monitoring korwil dengan 18 rute, status armada yang mengalami gangguan (seperti TO, BA, SO, KEUR) harus langsung dikenali sekilas. Sebelumnya, teks kuning pudar di atas putih sulit dibaca pengawas saat memantau di ruang kendali atau di koridor. Dengan token semantik, teks status menjadi cokelat gelap di atas latar krem lembut pada Light Mode, sehingga terbaca seketika tanpa mengubah kode/makna operasional.

---

### CLR-11: Standarisasi Angka Metrik Capaian KPI
- **Lokasi:** `src/components/KPICard.tsx:95`, `ShiftComparisonCard.tsx:61, 139`
- **Before:**
  Angka capaian KPI menggunakan warna cyan terang `#38bdf8` (2.14:1) dan violet `#a78bfa` (2.72:1) langsung pada nilai metrik utama di Light Mode.
- **After:**
  Nilai metrik utama dikembalikan ke `var(--color-text-primary)` (kontras 17.85:1), sementara warna shift dialokasikan sebagai aksen pada ikon dan badge pendamping.
- **Case: Skenario Lapangan:**
  Petugas operasional di lapangan mengecek pencapaian target kilometer harian bus di bawah sinar matahari. Angka ritase dan kilometer kini terbaca jelas dan tidak menyilaukan mata.

---

### CLR-13: Batang Grafik Tren TOA Opaque & Kontras
- **Lokasi:** `src/components/dailyToaTrend/ToaBarChart.tsx:68`
- **Before:**
  ```tsx
  <stop offset="100%" stopColor="#059669" stopOpacity="0.25" /> // Transparan 25%, rasio 1.36:1
  ```
- **After:**
  ```tsx
  <rect
    x={bar.x}
    y={bar.y}
    width={barWidth}
    height={bar.barHeight}
    fill="var(--color-chart-1)"
    stroke={bar.isSelected ? "var(--color-text-primary)" : "none"}
    strokeWidth={bar.isSelected ? 2 : 0}
  />
  ```
- **Case: Skenario Lapangan:**
  Manajemen puncak mengevaluasi tren penumpang TOA bulanan. Bagian bawah grafik sebelumnya memudar hingga hampir menghilang di latar belakang layar OLED dan monitor LCD. Perbaikan membuat batang grafik solid opak dengan garis batas seleksi yang jelas dan tetap menyertakan tabel ringkasan numerik.

---

### CLR-14 & CLR-15: Placeholder Input & Indikator Fokus Keyboard
- **Lokasi:** `src/index.css:1761`, `src/index.css:319`
- **Before:**
  ```css
  /* Placeholder pudar */
  ::placeholder { opacity: 0.7; color: var(--text-secondary); }
  /* Outline dimatikan */
  button:focus, input:focus { outline: none; }
  ```
- **After:**
  ```css
  .ui-input::placeholder {
    color: var(--color-text-muted);
    opacity: 1;
  }
  :where(button, a[href], input, select, textarea, [tabindex]):focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }
  ```
- **Case: Skenario Lapangan:**
  Petugas administrasi menginput data bus menggunakan tablet dengan keyboard fisik/eksternal. Indikator fokus cincin biru terang 2px dengan offset memastikan pengguna selalu tahu form mana yang sedang aktif tanpa menebak-nebak posisi kursor.

---

### CLR-17: Harmonisasi Warna Peran (Role) Tanpa Warna 'Error' Merah
- **Lokasi:** `src/components/userManagement/RoleBadge.tsx`, `src/index.css`
- **Before:**
  Superadmin diberi warna merah menyala yang identik dengan status kesalahan sistem/danger.
- **After:**
  Dibuat token semantik terdedikasi untuk masing-masing peran:
  - Superadmin: `amber-50` / `amber-800` (wibawa kepemimpinan tanpa konotasi galat)
  - Admin: `sky-50` / `sky-800`
  - Korwil: `indigo-50` / `indigo-800`
  - Korlap: `orange-50` / `orange-800`
  - PDO: `emerald-50` / `emerald-800`
- **Case: Skenario Lapangan:**
  Saat superadmin membuka profil atau panel manajemen user, badge perannya tidak lagi menimbulkan persepsi adanya akun bermasalah atau status bahaya, melainkan penanda hierarki yang elegan dan kontras tinggi (7.15:1 s.d. 9.54:1).

---

### CLR-22: Sinkronisasi Status Bar Peramban (Theme-Color)
- **Lokasi:** `index.html:11`, `src/utils/themeUtils.ts` (helper baru)
- **Before:**
  Meta tag `theme-color` statis hanya membaca preferensi sistem operasi ponsel (`prefers-color-scheme`), sehingga saat pengguna mengganti tema di dalam aplikasi ke Light, status bar Android/iOS tetap berwarna gelap (#0f172a).
- **After:**
  Disediakan utilitas `syncThemeChrome()` yang secara dinamis memperbarui atribut `#app-theme-color` sesuai nilai `--color-surface-canvas` tema aplikasi aktif.
- **Case: Skenario Lapangan:**
  Pengguna dengan ponsel Android bernuansa tema gelap sistem memilih tema Light di aplikasi SS-PDO saat bekerja di siang hari. Status bar peramban langsung sinkron menjadi putih bersih (`#F8FAFC`) serasi dengan kanvas aplikasi, tanpa garis belang yang mengganggu estetika antarmuka.

---

## 3. Rangkuman Eksekusi Bertahap

1. **Tahap 0 (Baseline & Checkpoint):** SELESAI.
   - Commit & Tag Git Checkpoint `checkpoint-pre-refact-174` dibuat.
2. **Tahap 1 (P0 Blockers - Surface & Token Hilang):** SELESAI.
   - `primitives.css`, `semantic.css`, `legacy.css`, dan `color-contract.test.ts` aktif.
   - Modal-modal kritis (CLR-01, CLR-02, CLR-03, CLR-16) teratasi.
3. **Tahap 2 (P1 Actions & Input Controls):** SELESAI.
   - `actions.css`, `forms.css`, dialog SweetAlert2, tombol WhatsApp, banner offline terstandarisasi (CLR-04 s.d. CLR-08, CLR-14, CLR-15).
4. **Tahap 3 (P1 Status, Monitoring, KPI, Charts):** SELESAI.
   - Standarisasi badge armada, `monitoringUtils.ts`, angka KPI, odometer, dan grafik TOA opak (CLR-09 s.d. CLR-13). Proteksi SSOT Google Sheets (CLR-24).
5. **Tahap 4 (P2 Konsolidasi Desain, Brand & Aset):** SELESAI.
   - Role badge terpisah, reduksi glow, tab seleksi terpadu, favicon TJ, pembersihan kamus teks, penghapusan opacity tembus non-SGO (CLR-17 s.d. CLR-23, CLR-25, CLR-26).
6. **Tahap 5 (Verifikasi Menyeluruh & Quality Gates Final):** SELESAI.
   - Audit global CSS token: 200 token terdefinisi, 0 missing token.
   - Migrasi tuntas komponen pendukung (`DashboardContentTabs.tsx`, `DashboardHeader.tsx`, `UserProfileHeader.tsx`, `BulkRouteSection.tsx`, `UnifiedRouteControlBar.tsx`).
   - Kontrak rasio kontras WCAG: **114 passed (100%)**.
   - Seluruh test suite Vitest: **126 test files passed (1090+ tests, 100% hijau)**.
   - TypeScript Strict Mode & Vite Build: **Lulus 0 error**.
   - Knowledge graph `graphify`: Terbarukan.

---

## 4. Hasil Pengujian & Quality Gates Final

| Quality Gate | Perintah Verifikasi | Status | Catatan |
|---|---|---|---|
| Kontrak Rasio Kontras WCAG | `pnpm vitest run src/styles/tokens/color-contract.test.ts` | **PASS (114/114 tests)** | Lulus kriteria AA & AAA di Light & Dark Mode |
| Test Suite Komprehensif | `pnpm vitest run src/` | **PASS (126 files / 1090+ tests)** | 100% lulus tanpa kegagalan atau regresi |
| TypeScript Strict Mode | `pnpm tsc -b` | **PASS (0 error)** | Strict typecheck tuntas |
| Vite Production Build | `pnpm vite build` | **PASS (0 error)** | Bundle produksi siap rilis |
| Knowledge Graph | `graphify update .` | **PASS** | Graf relasi arsitektur terupdate |
