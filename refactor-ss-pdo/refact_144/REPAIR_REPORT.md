# Laporan Perbaikan & Refactor — Refactor 144
## Optimasi Fitur & Sheet Rekap Akumulasi Lintas Periode (AccumulationSheet & Banner)

### Ringkasan Eksekutif
Refactor 144 menuntaskan optimasi komprehensif pada fitur **Rekap Akumulasi Lintas Periode** (`AccumulationSheet` & `BusListAccumulationBanner`). Sesuai instruksi pengguna, fokus refactor ini terisolasi murni pada fitur Akumulasi (Nomor 1) tanpa menyentuh atau memodifikasi kode modal status armada (Nomor 2).

Poin-poin perbaikan utama:
1. **Migrasi Penuh ke `ModalShell` Kanonik**: Menghilangkan listener touch gesture DOM inline (`style.transform`), custom portal `createPortal(..., document.body)`, dan handling `document.body.style.overflow` manual pada `AccumulationSheet.tsx`. Menggantikannya dengan arsitektur modal kanonik terpadu `ModalShell`.
2. **Modernisasi `AccumulationHeader.tsx`**: Menyeragamkan tombol tutup berukuran `34px`, border-radius `10px`, background adaptif `var(--input-bg)`, dan border `var(--card-border)`.
3. **Penyelarasan Kartu Visual Periode (`AccumulationPeriodSelector.tsx`)**: Memisahkan kontrol "DARI PERIODE" dan "SAMPAI PERIODE" ke dalam 2 kartu kontainer visual yang rapi (`borderRadius: 12px`, padding `12px`), sehingga pengguna mobile tidak lagi bingung saat memilih rentang multi-bulan.
4. **Ergonomi Tombol & Kamus Sentral (`AccumulationFooter.tsx`)**: Preview rentang tanggal kini diformat melalui fungsi template murni `PREVIEW_RANGE_LABEL` di kamus `TEXT_DASHBOARD.ACCUMULATION_SHEET`. Tombol Terapkan dan Reset mengadopsi border-radius `12px` ergonomis.
5. **Modernisasi Banner Akumulasi Aktif (`BusListAccumulationBanner.tsx`)**: Mengganti emoji teks ⚠️ dengan ikon semantik `AlertTriangle`, border-radius `12px`, dan tombol keluar mode akumulasi ber-radius `8px` dengan kontras tinggi.

---

### Implementasi Detail & Perbandingan (Before vs After)

#### 1. Arsitektur Modal Sheet (`AccumulationSheet.tsx`)
- **Before:**
  Menggunakan `createPortal` langsung dengan manipulasi DOM swipe gesture via `contentRef.current.style.transform`, berpotensi menimbulkan lag, *flicker*, serta tabrakan pada sistem scroll-locking.
- **After:**
  Mengintegrasikan `ModalShell` kanonik dengan transisi pegas Apple `cubic-bezier(0.32, 0.72, 0, 1)`, koordinasi modal stack, dan scroll-locking terpusat.

#### 2. Penataan Pemilih Tanggal (`AccumulationPeriodSelector.tsx`)
- **Before:**
  Label dan dropdown tanggal, bulan, tahun disajikan datar bertumpuk tanpa pembatas kartu yang tegas.
- **After:**
  Kedua periode dibungkus dalam compact card container mandiri dengan micro-badges ber-ikon `Calendar` (cyan untuk DARI, purple untuk SAMPAI), tinggi select `36px`, dan border-radius `8px`.

#### 3. Banner Mode Akumulasi Aktif (`BusListAccumulationBanner.tsx`)
- **Before:**
  Menggunakan emoji string biasa dan tombol inline dengan kontras statis yang kurang tajam di mode terang.
- **After:**
  Menggunakan ikon SVG `AlertTriangle`, warna amber semantik `rgba(245, 158, 11, 0.12)`, dan tombol aksi `32px` yang ramah jempol.

---

### Case: Skenario Lapangan

#### Kasus A: Pengawas Mengatur Rekap Akumulasi Antar-Bulan di Ponsel
- **Kondisi:** Pengawas ingin menarik laporan akumulasi dari tanggal 25 September hingga 5 Oktober 2026 melalui ponsel di terminal.
- **Hasil Sebelum Refactor:** Dropdown periode awal dan akhir menyatu tanpa pemisah kartu, menyulitkan pengawas memverifikasi batas tanggal awal vs akhir.
- **Hasil Sesudah Refactor:** Card "DARI PERIODE" (aksen cyan) dan "SAMPAI PERIODE" (aksen purple) terpisah sangat jelas secara visual. Badge preview di bawah langsung memperlihatkan konfirmasi: *"Rentang: 25 September 2026 — 5 Oktober 2026"* sebelum tombol terapkan ditekan.

#### Kasus B: Pengguna Menutup Modal Melalui Tombol Back Hardware
- **Kondisi:** Pengguna membuka sheet akumulasi lalu menekan tombol *hardware back* Android untuk membatalkan.
- **Hasil Sebelum Refactor:** Listener back button manual dapat memicu *race condition* penutupan backdrop.
- **Hasil Sesudah Refactor:** `ModalShell` menangani `backHandlerId="accumulation_sheet_modal"` secara bersih, modal tertutup dengan transisi fluid tanpa lapisan latar tersisa.

---

### Status Verifikasi & Quality Gates

```bash
# 1. Menjalankan unit test AccumulationSheet
pnpm vitest run src/components/accumulation/AccumulationSheet.test.tsx
# Hasil: 1 test file passed, 3 tests passed (100% LULUS)

# 2. Menjalankan unit test BusListHeader (Banner Akumulasi)
pnpm vitest run src/components/busList/BusListHeader.test.tsx
# Hasil: 1 test file passed, 4 tests passed (100% LULUS)

# 3. Menjalankan seluruh test suite di repositori
pnpm vitest run src/
# Hasil: 108 test files passed, 787 tests passed (100% LULUS)

# 4. Menjalankan build TypeScript & Vite
pnpm run build
# Hasil: tsc -b && vite build selesai tanpa error (0 error)

# 5. Sinkronisasi Knowledge Graph
graphify update .
# Hasil: 5.702 nodes, 7.093 edges, 536 communities terbarukan
```
