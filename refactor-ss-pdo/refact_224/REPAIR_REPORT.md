# REPAIR REPORT: REFACTOR 224
**Modul:** Tab Siap Kirim — kontrol terjangkau saat scroll
**Tanggal:** 07 November 2026
**Status:** Selesai di `devmode` (belum di-push). Eksekusi BUG-UX-224-01..03 oleh Antigravity (brief `ag-siap-kirim-sticky`, review 21/25). Aturan §8a dan perbaikan BUG-UI-224-04/BUG-UX-224-05 oleh Claude.

---

## 1. Implementasi Perbaikan

### A. Dialog header–isi–footer — BUG-UX-224-01
- `.submission-modal` menjadi kolom flex `overflow: hidden`. `__header` berisi judul, `ui-status` (tone dari `STATE_TONE`), dan tombol tutup ikon `X` 20 dengan `aria-label` "Tutup", minimal 44×44. `__body` adalah satu-satunya bagian dengan `overflow-y: auto` + `overscroll-behavior: contain`. `__footer` berisi kolom alasan (2 baris) dan tombol Cek ulang / Konfirmasi.
- `WatchlistModal` memakai struktur yang sama.

### B. Baris kontrol sticky — BUG-UX-224-02
- `MonitoringHeader` mengisi `--sticky-header-height` lewat `useLayoutEffect` + `ResizeObserver` dan menghapusnya saat unmount (pola `DashboardHeader`).
- `.submission-control-bar`: `position: sticky; top: var(--sticky-header-height)`, 1 baris, `overflow-x: auto` hanya pada baris itu.
- `filterViewsByProblem(views, 'all' | 'janggal' | 'belum' | 'changed')` di `readinessModel.ts`. Chip "Janggal n", "Belum diisi n", dan "Berubah n" hanya tampil bila n > 0, dan dapat diketuk ulang untuk mematikan filter.

### C. Ketuk tab aktif — BUG-UX-224-03
- `MonitoringBottomNav`: tab aktif → `window.scrollTo({ top: 0, behavior: "smooth" })`; tab lain → `onSelectTab`.

### D. Perbaikan review (Claude) — BUG-UI-224-04, BUG-UX-224-05
- `.ui-chip-btn[aria-pressed="true"]` memakai token status aktif.
- Filter efektif: `problemCounts[problemFilter] > 0 ? problemFilter : 'all'`. Test baru terbukti gagal tanpa perbaikan (diuji dengan melepas perbaikan sementara).
- `.submission-modal__header .ui-status { white-space: nowrap }`.

---

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| Judul dialog saat daftar unit digulir | Ikut hilang | Tetap terlihat (header di posisi 87 px sebelum dan sesudah gulir 294 px) |
| Tombol Konfirmasi | Di ujung bawah isi | Selalu terlihat di footer (posisi 538 px tetap) |
| Tombol tutup dialog | Tidak ada | Ikon X 44 px |
| Ringkasan & pemilih rute saat daftar digulir | Hilang | Menempel di bawah header (top 164 px = tinggi header, setelah gulir 900 px) |
| Menyaring rute bermasalah | Tidak ada | Chip Janggal / Belum diisi / Berubah |
| Chip aktif | — | Kapsul status aktif (bg `rgb(125,211,252)` / fg `rgb(8,47,73)` di tema gelap) |
| Kembali ke atas | Menggulir manual | Ketuk tab aktif (gulir 1.200 → 0) |

---

## 3. Case: Skenario Lapangan

### Case BUG-UX-224-01: PJ memeriksa rute dengan 16 unit bermasalah
- **Before:** Setelah menggulir ke unit terakhir, judul rute tidak terlihat; untuk konfirmasi harus menggulir sampai bawah. Tidak ada tombol tutup.
- **After:** Judul "Kelengkapan JAK.60" + status tetap di atas, dan Konfirmasi selalu di bawah dalam jangkauan jempol.

### Case BUG-UX-224-02 / 224-05: Korlap mengejar rute janggal pukul 21.30
- **Before:** Harus kembali ke atas untuk melihat ringkasan, tanpa cara menyaring.
- **After:** Ketuk chip "Janggal 3" di baris yang selalu terlihat, maka hanya 3 rute tampil. Begitu petugas membetulkan data dan jumlah janggal menjadi 0, daftar otomatis kembali ke semua rute.

### Case BUG-UX-224-03: Kembali ke atas daftar 18 rute
- **After:** Satu ketukan di tab Siap Kirim (zona jempol) menggulir ke atas.

---

## 4. Verifikasi

| Gate | Status | Hasil |
|---|---|---|
| 1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` | Lulus | 180/180 |
| 2. `pnpm vitest run src/` | Lulus | 149 file, 1.451/1.451 |
| 3. `pnpm run build` | Lulus | exit 0 |
| 4. `graphify update .` | Lulus | dijalankan sebelum commit dokumentasi |

Browser (dev server, superadmin, 375×812, tema gelap & terang): semua nilai posisi di bagian Before vs After diukur langsung lewat `getBoundingClientRect`.

**Belum diverifikasi:** perangkat Android/iOS fisik (sticky di dalam bottom sheet pada browser bawaan HP lama). Scroll horizontal 16 px yang tersisa di layar 375 px berasal dari banner lama "Mode Pratinjau Superadmin" (391 px) dan tidak terkait refact ini.
