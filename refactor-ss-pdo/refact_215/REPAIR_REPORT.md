# REPAIR REPORT: REFACTOR 215
**Modul:** Penghapusan gradasi & glow, penyatuan kotak ikon header modal
**Tanggal:** 07 November 2026
**Status:** Selesai — 4 quality gate lulus

---

## 1. Implementasi Perbaikan

### A. Teks bergradasi (`src/index.css`, `LoginHeroCard.tsx`)
- Hapus `--title-gradient` (tema gelap & terang).
- `.gradient-title-text` dan `.analytics-card-title > span` → `color: var(--color-text-primary)`.
- Judul `h1` login → `color: var(--color-text-primary)` tanpa `background-clip`.

### B. Progress bar & grafik
- `IngestionProgressModal`, `MonitoringDashboardTab`: proses → `--color-action-primary-bg`, selesai → `--color-success-fg`; glow dihapus.
- `MonitoringReadinessBanner`, `MonitoringKorwilTab` (strip atas), `.progress-bar-fill` → `--color-action-primary-bg`.
- `MonitoringToaBarChart`: terpilih → `--color-action-primary-bg`, lainnya → `--color-chart-1`; glow dihapus.

### C. Tombol aksi utama
- Tombol verifikasi (`MonitoringRouteCardModern`, `MonitoringRoutesTab`), tambah pengguna (`UserManagementHeader`), kirim WA (`MonitoringWaReportTab`) → `--color-action-primary-bg` / `--color-action-primary-fg`; glow dihapus.

### D. Kotak ikon header modal (`src/styles/components/status.css`)
- Kelas baru `.ui-icon-tile`; tiga salinan inline di `AccumulationHeader`, `BusInputModalHeader`, `UnitDetailModal` diganti `<div className="ui-icon-tile" aria-hidden="true">`.

### E. Shift split bar (`MonitoringShiftSplitBar.tsx`)
- Track → `--color-surface-subtle`; batang, kartu, ikon, dan label Shift 1/Shift 2 → token `--color-shift-1-*` / `--color-shift-2-*`.

### F. Efek dekoratif lain
- Hapus glow radial di `LoginHeroCard` dan `IngestionProgressModal`, serta drop-shadow logo login.
- Kartu rekor `KorwilRouteDetailBottomSheet` → `--color-success-bg` + border `--color-success-border`.
- Badge `CompletionStatusCard` → `--color-success-bg` / `--color-success-fg`, glow dihapus.
- Avatar `ProfileUserCard` → `--color-action-secondary-bg` / `-fg`, glow foto & avatar dihapus.
- Skeleton: shimmer gradasi diganti animasi `skeleton-pulse` (opasitas), nonaktif saat `prefers-reduced-motion`.

### G. Baseline ratchet (`src/styles/ui-debt-ratchet.test.ts`)
- Diturunkan: `rawHexColor` 837→786, `rgbHslFunction` 972→931, `gradient` 28→0, `gradientText` 6→0, `inlineStyleObject` 2013→2008, `legacyAccentColor` 264→247. Gradasi kini terkunci di nol.

### H. Aturan mockup
- Sesuai keputusan pengguna, mockup hanya dibuat bila diminta: `.agents/rules/ui-consistency.md`, `AGENTS.md`, `GEMINI.md`, `.agents/AGENTS.md` diperbarui.

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| Jumlah gradasi | 28 (6 teks bergradasi) | 0, dikunci ratchet |
| Judul kartu analitik & login | Putih/hitam → hijau, ujung pudar | Warna teks utama solid |
| Progress bar & grafik | Gradasi hijau Supabase + glow | Biru aksi utama / hijau sukses solid |
| Tombol utama di monitoring & manajemen pengguna | Gradasi hijau, biru, hijau WA + glow | Token aksi utama yang teruji kontras |
| Kotak ikon header modal | 3 salinan inline bergradasi | 1 kelas `.ui-icon-tile` |
| Label Shift 1 | `#F59E0B` (±2,1:1 di terang) | `--color-shift-1-fg` (lolos kontrak) |
| Skeleton loading | Shimmer bergradasi | Denyut solid, hormati reduced-motion |

## 3. Case: Skenario Lapangan

### Case BUG-GRAD-215-01: Membaca judul kartu analitik di bawah terik
- **Situasi:** Korlap membuka dashboard di HP di luar ruangan.
- **Before:** Ujung judul kartu berwarna hijau muda pudar dan sulit dibaca.
- **After:** Seluruh judul berwarna teks utama yang tegas.

### Case BUG-GRAD-215-02: Memantau progres konfirmasi rute
- **Situasi:** Korwil memantau progres konfirmasi 18 rute dan sinkron bulanan.
- **Before:** Progress bar hijau bergradasi dengan glow, berbeda warna dengan tombol.
- **After:** Progress bar biru solid saat berjalan dan hijau solid saat selesai.

### Case BUG-GRAD-215-03: Verifikasi rute dan kirim laporan WA
- **Situasi:** Admin menekan "Verifikasi" atau "Kirim WA".
- **Before:** Setiap tombol utama punya gradasi dan glow berbeda.
- **After:** Semua tombol utama tampil sama: biru aksi utama.

### Case BUG-GRAD-215-04: Membuka modal input bus, detail unit, dan akumulasi
- **Situasi:** PDO membuka ketiga modal bergantian.
- **Before:** Kotak ikon header memakai warna aksen warisan bergradasi (disalin 3 kali).
- **After:** Kotak ikon solid yang sama di ketiga modal dari satu kelas.

### Case BUG-GRAD-215-05: Membaca pembagian shift
- **Situasi:** Korwil melihat perbandingan Shift 1 vs Shift 2 di mode terang.
- **Before:** Angka Shift 1 berwarna amber dengan kontras rendah.
- **After:** Warna shift mengikuti token shift yang lolos kontras, konsisten dengan bagian lain.

### Case BUG-GRAD-215-06: Halaman login dan loading
- **Situasi:** Pengguna membuka aplikasi lalu menunggu data dimuat.
- **Before:** Glow hijau di belakang logo dan shimmer bergradasi.
- **After:** Tampilan bersih tanpa glow; skeleton berdenyut lembut (diam bila pengguna memilih kurangi animasi).

## 4. Verifikasi

1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` — **158/158 lulus**.
2. `pnpm vitest run src/` — **142 file, 1356/1356 lulus** (ratchet dengan baseline baru lulus).
3. `pnpm run build` — **exit 0**.
4. `graphify update .` — 7963 node, 13571 edge, 625 komunitas.

Verifikasi visual (dev server, viewport 375×812):
- Halaman login, light & dark: judul `PUSM` solid (`rgb(15, 23, 42)` terang, `rgb(226, 232, 240)` gelap), `background-image: none`, tanpa glow.
- Elemen uji sementara (dihapus setelahnya), light & dark: `.ui-icon-tile` (latar `rgb(240, 249, 255)`/teks `rgb(7, 89, 133)` terang; `rgb(21, 45, 74)`/`rgb(125, 211, 252)` gelap; radius 12px), `.gradient-title-text` & `.analytics-card-title > span` solid, `.skeleton-box` animasi `skeleton-pulse` tanpa gradasi, `.progress-bar-fill` solid.
- Belum dilihat langsung: layar monitoring, modal, dan menu profil di aplikasi yang sudah login (butuh login Google).
