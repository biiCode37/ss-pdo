# AUDIT TEMUAN GRADASI & EFEK GLOW: REFACTOR 215
**Modul:** Login, monitoring 18 rute (dashboard, korwil, rute, TOA, shift, laporan WA, modal ingest), header modal (akumulasi, input bus, detail unit), kartu status penyelesaian, menu profil, manajemen pengguna, kelas global `src/index.css`.
**Fokus Masalah:** 28 gradasi (6 di antaranya teks bergradasi) yang melanggar aturan "tanpa gradasi", ditambah glow box-shadow/drop-shadow dan warna hijau warisan Supabase yang menyertainya.

---

### ID Temuan: BUG-GRAD-215-01
- **Lokasi Kode:** `src/index.css` (`--title-gradient`, `.gradient-title-text`, `.analytics-card-title > span`), `src/components/login/LoginHeroCard.tsx` (judul `h1`)
- **Keparahan:** Medium (keterbacaan judul; melanggar larangan teks bergradasi)
- **Deskripsi:** Judul kartu analitik dan judul login memakai `background-clip: text` dengan gradasi putih/hitam → hijau `#3ECF8E`/`#24B47E`. Bagian ujung judul berwarna hijau muda dengan kontras rendah.
- **Dampak User:** Judul tampak pudar di sebagian huruf, terutama di layar HP saat terang; kesan "AI slop".
- **Mitigasi:** Warna teks solid `var(--color-text-primary)`; variabel `--title-gradient` dihapus.

### ID Temuan: BUG-GRAD-215-02
- **Lokasi Kode:** `IngestionProgressModal.tsx`, `MonitoringReadinessBanner.tsx`, `MonitoringDashboardTab.tsx`, `MonitoringKorwilTab.tsx`, `MonitoringToaBarChart.tsx`, `src/index.css` (`.progress-bar-fill`)
- **Keparahan:** Low (dekoratif, tidak merusak data)
- **Deskripsi:** Progress bar dan batang grafik memakai gradasi hijau Supabase (`#3ECF8E` → `#10B981`/`#00C573`) dan glow `box-shadow`.
- **Dampak User:** Warna aksen di luar palet brand dan berbeda dari tombol/aksi lain.
- **Mitigasi:** Warna solid `var(--color-action-primary-bg)`; status selesai `var(--color-success-fg)`; batang grafik tidak terpilih `var(--color-chart-1)`; glow dihapus.

### ID Temuan: BUG-GRAD-215-03
- **Lokasi Kode:** `MonitoringRouteCardModern.tsx` & `MonitoringRoutesTab.tsx` (tombol verifikasi), `UserManagementHeader.tsx` (tombol tambah pengguna), `MonitoringWaReportTab.tsx` (tombol kirim WA)
- **Keparahan:** Low
- **Deskripsi:** Tombol aksi utama memakai gradasi hijau/biru/hijau WhatsApp dengan teks putih mentah dan glow.
- **Dampak User:** Tiap halaman punya gaya tombol utama berbeda.
- **Mitigasi:** Pasangan token teruji `var(--color-action-primary-bg)` / `var(--color-action-primary-fg)`; glow dihapus.

### ID Temuan: BUG-GRAD-215-04
- **Lokasi Kode:** `AccumulationHeader.tsx`, `BusInputModalHeader.tsx`, `UnitDetailModal.tsx` (kotak ikon header)
- **Keparahan:** Low (duplikasi komponen)
- **Deskripsi:** Tiga salinan identik kotak ikon 36px dengan gradasi biru langit, warna `--accent-color` warisan, dan border `rgba` mentah.
- **Dampak User:** Tidak langsung terlihat, tetapi setiap perubahan harus dilakukan di 3 tempat dan mudah tidak konsisten.
- **Mitigasi:** Satu kelas bersama `.ui-icon-tile` di `src/styles/components/status.css` (latar/teks `--color-action-secondary-*`, radius 12px).

### ID Temuan: BUG-GRAD-215-05
- **Lokasi Kode:** `MonitoringShiftSplitBar.tsx`
- **Keparahan:** Medium (kontras teks gagal WCAG)
- **Deskripsi:** Batang shift memakai gradasi amber/indigo; label dan ikon Shift 1 memakai `#F59E0B` (amber) yang di latar terang hanya ±2,1:1, dan Shift 2 `#818CF8`.
- **Dampak User:** Angka/label Shift 1 sulit dibaca di light mode; warna shift berbeda dari token shift di bagian lain aplikasi.
- **Mitigasi:** Seluruh komponen memakai token `--color-shift-1-*` dan `--color-shift-2-*` (bg, border, fg) yang sudah lolos kontrak kontras.

### ID Temuan: BUG-GRAD-215-06
- **Lokasi Kode:** `LoginHeroCard.tsx` (glow radial & drop-shadow logo), `IngestionProgressModal.tsx` (glow radial), `KorwilRouteDetailBottomSheet.tsx` (kartu rekor), `CompletionStatusCard.tsx` (badge), `ProfileUserCard.tsx` (avatar), `src/index.css` (`.skeleton-box::after` shimmer)
- **Keparahan:** Low
- **Deskripsi:** Glow radial dekoratif, drop-shadow hijau, latar kartu/badge/avatar bergradasi hijau, dan shimmer skeleton bergradasi.
- **Dampak User:** Efek "neon" yang tidak konsisten dan warna di luar palet.
- **Mitigasi:** Elemen glow dihapus; kartu/badge memakai `--color-success-bg/-fg/-border`; avatar memakai `--color-action-secondary-*`; skeleton diganti animasi denyut solid (`skeleton-pulse`, menghormati `prefers-reduced-motion`).
