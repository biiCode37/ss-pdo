# REPAIR REPORT: REFACTOR 220
**Modul:** Header & toolbar Input SS (komponen bersama `.ui-toolbar-btn` dan `.ui-chip-btn`)
**Tanggal:** 07 November 2026
**Status:** Selesai — 4 quality gate lulus

---

## 1. Implementasi Perbaikan

### A. Komponen CSS bersama (`src/styles/components/actions.css`)
- `.ui-toolbar-btn`: tinggi 40px, radius 12px, border `--color-border-subtle`, latar `--color-surface-default`, huruf 12px/600; status aktif `[aria-pressed="true"]` → `--color-action-primary-*`.
- `.ui-toolbar-select`: varian `<select>` rata kiri dengan ruang chevron.
- `.ui-chip-btn`: tinggi 32px, radius 999px, huruf 12px/700; modifier `--accent`, `--warning`, `--error`, `--success`, `--info` (pasangan token semantik); `.ui-chip-dot` titik status `currentColor`.

### B. Toolbar (`BusListControlBar.tsx`, `src/index.css`)
- Set Jumlah Trip, Pilih, Fokus Kolom, Filter → `.ui-toolbar-btn`; Filter kini `aria-pressed` dan memakai warna aktif yang sama dengan Pilih.
- Ikon `ListChecks` pada "Pilih" dibuang (memberi ruang agar "Semua Kolom" tidak terpotong).
- Kolom cari: tinggi 40px lewat `.buslist-search .search-input`.
- Tata letak baris: `.buslist-controls`, `.buslist-controls-row(--actions)`, `.buslist-select-wrapper`, `.buslist-select-chevron`.
- `<select>` mendapat `aria-label` (`BUS_LIST.FOCUS_COLUMN_ARIA`).

### C. Pil header (`DashboardHeader.tsx`, `UnifiedRouteControlBar.tsx`)
- Pil rute → `.ui-chip-btn--accent`, ikon pin dihapus, chevron tetap.
- Indikator antrean → `<button class="ui-chip-btn --warning|--error">`.
- Pil status laporan A2 → `.ui-chip-btn--{warning|error|success|info}` + `.ui-chip-dot`.
- Keluar akumulasi → `.ui-chip-btn--warning` + ikon `X`; teks dari `ROUTE_SELECTOR.EXIT_ACCUMULATION` & `EXIT_ACCUMULATION_TITLE` (kunci baru).
- Baris tanggal → `.route-date-label`; ikon kalender, garis bawah, dan `backdrop-filter` dihapus.

### D. Bar progres (`BusListProgressBar.tsx`)
- Kelas `.buslist-progress-row/-label/-track/-fill(--done)`; track 4px; teks `BUS_LIST.PROGRESS_COUNT_SUFFIX` ("/21 unit (0%)").

### E. Kamus & test
- Kunci baru: `BUS_LIST.FOCUS_COLUMN_ARIA`, `BUS_LIST.PROGRESS_COUNT_SUFFIX`, `ROUTE_SELECTOR.EXIT_ACCUMULATION_TITLE` (+ uji di `texts.test.ts`).
- `BusList.test.tsx`, `BusListHeader.test.tsx`: ekspektasi teks progres "unit" huruf kecil (termasuk asersi negatif).
- Ratchet diturunkan: `rawHexColor` 780→769, `rgbHslFunction` 925→904, `inlineStyleObject` 1994→1962, `legacyAccentColor` 236→231, `backdropFilter` 34→33.

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| Tombol toolbar | 4 objek style inline, tinggi 36px | 1 kelas `.ui-toolbar-btn`, 40px |
| Warna aktif Pilih vs Filter | Biru vs hijau `rgba` | Sama (aksi utama) |
| Pil header | 4 gaya (radius 8/12/16, fallback hijau) | 1 kelas `.ui-chip-btn` + modifier status |
| Indikator antrean | `<div onClick>` | `<button>` (bisa difokus) |
| Garis pemisah header | Ganda | Tunggal |
| Bar progres | 3px, track `rgba` tipis | 4px, track token |
| Teks hardcoded | "Keluar Akumulasi", "✕", " Unit" | Dari kamus teks |

## 3. Case: Skenario Lapangan

### Case BUG-HEADER-220-01: Menekan tombol toolbar dengan jempol
- **Situasi:** PDO menekan "Pilih" lalu "Filter" sambil berdiri di halte.
- **Before:** Target 36px; status aktif Pilih biru, Filter hijau.
- **After:** Target 40px; kedua tombol aktif berwarna sama sehingga maknanya jelas.

### Case BUG-HEADER-220-02: Membuka antrean offline dengan keyboard / melihat status laporan
- **Situasi:** Admin di laptop menekan Tab ke indikator antrean; PDO melihat status laporan A2.
- **Before:** Antrean tidak bisa difokus; pil-pil header berbeda bentuk.
- **After:** Antrean adalah tombol; semua pil seragam bentuk pill 32px dengan warna status dari token.

### Case BUG-HEADER-220-03/04: Membaca header di mode terang
- **Situasi:** PDO memakai mode terang di siang hari.
- **Before:** Garis ganda dan bar progres nyaris tak terlihat.
- **After:** Satu garis pemisah; bar progres 4px terlihat jelas.

## 4. Verifikasi

1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` — **158/158 lulus**.
2. `pnpm vitest run src/` — **142 file, 1358/1358 lulus**.
3. `pnpm run build` — **exit 0** (`tsc -b` 0 error).
4. `graphify update .` — dijalankan; graf sudah sinkron dengan perubahan.

Verifikasi visual (`localhost:5173`, login role PDO, 375×812; tanpa menyimpan data):
- Ukuran terukur: pil rute & laporan 32px radius 999px; empat tombol toolbar & kolom cari 40px radius 12px; tidak ada scroll horizontal; tinggi header lengket 243px → 249px.
- Percobaan pertama huruf toolbar 13px membuat "Semua Kolom" terpotong → diturunkan ke 12px dan ikon "Pilih" dibuang; teks 80px kini muat dalam select 145px.
- Mode "Pilih" ditekan lalu dimatikan lagi: `aria-pressed="true"` dengan latar aksi utama, kartu menampilkan kotak pilih.
- Mode terang & gelap dicek (atribut tema diubah sementara).
- Belum dilihat: pil status laporan selain "Laporan A2" (draft), indikator antrean (antrean kosong), mode akumulasi, dan HP fisik.
