# AUDIT TEMUAN HEADER & TOOLBAR INPUT SS: REFACTOR 220
**Modul:** `src/components/dashboard/DashboardHeader.tsx` (pil rute, indikator antrean), `src/components/routeSelector/UnifiedRouteControlBar.tsx` (tanggal, status laporan A2, keluar akumulasi), `src/components/busList/BusListProgressBar.tsx`, `src/components/busList/BusListControlBar.tsx`, `src/index.css`, `src/styles/components/actions.css`, `src/constants/texts/text_dashboard.ts`.
**Fokus Masalah:** Header lengket Input SS berisi tombol dan pil sejenis yang masing-masing dibuat ulang dengan objek style inline, sehingga tinggi, sudut, warna, dan perilaku aktifnya berbeda-beda.

---

### ID Temuan: BUG-HEADER-220-01
- **Lokasi Kode:** `BusListControlBar.tsx` (Set Jumlah Trip, Pilih, Fokus Kolom, Filter, kolom cari)
- **Keparahan:** Medium (duplikasi komponen + target sentuh kecil)
- **Deskripsi:** Empat tombol toolbar masing-masing punya objek style inline 15–20 baris yang hampir identik; tinggi 36px; status aktif "Pilih" berwarna biru, sedangkan status aktif "Filter" hijau `rgba(16, 185, 129, …)` mentah.
- **Dampak User:** Tombol aktif terlihat berbeda makna; area ketuk 36px rawan salah tekan di lapangan.
- **Mitigasi:** Kelas bersama `.ui-toolbar-btn` (40px, radius 12, token warna) dengan status aktif seragam lewat `aria-pressed="true"`; `<select>` memakai `.ui-toolbar-select`; tata letak lewat `.buslist-controls*`.

### ID Temuan: BUG-HEADER-220-02
- **Lokasi Kode:** `DashboardHeader.tsx` (pil rute aktif, indikator antrean), `UnifiedRouteControlBar.tsx` (pil status laporan A2, tombol keluar akumulasi)
- **Keparahan:** Medium (duplikasi komponen + aksesibilitas)
- **Deskripsi:** Empat "pil" header ditulis terpisah dengan radius 8/12/16px, warna fallback hijau `#3ECF8E` dan `rgba` mentah. Indikator antrean berupa `<div onClick>` (tidak bisa difokus keyboard). Pil rute memuat 2 ikon (pin + chevron). Tombol keluar akumulasi memakai teks hardcoded "Keluar Akumulasi" dan karakter "✕".
- **Dampak User:** Pil tampak tidak serasi; pengguna keyboard tidak bisa membuka antrean; teks di luar kamus.
- **Mitigasi:** Kelas bersama `.ui-chip-btn` (32px, pill 999px) + modifier `--accent/--warning/--error/--success/--info` dan `.ui-chip-dot`; antrean menjadi `<button>`; ikon pin dibuang; teks keluar akumulasi dari kamus (`ROUTE_SELECTOR.EXIT_ACCUMULATION`, `EXIT_ACCUMULATION_TITLE`).

### ID Temuan: BUG-HEADER-220-03
- **Lokasi Kode:** `UnifiedRouteControlBar.tsx` (baris tanggal), `.unified-input-control-panel`
- **Keparahan:** Low
- **Deskripsi:** Baris tanggal memiliki garis bawah sendiri, padahal panel sudah bergaris atas dan bar progres berada tepat di bawahnya (garis pemisah ganda). Ikon kalender dekoratif pada teks tanggal yang tidak bisa diketuk. Mode mandiri memakai `backdrop-filter: blur`.
- **Dampak User:** Header tampak bergaris-garis dan ramai.
- **Mitigasi:** Garis bawah baris tanggal dan ikon kalender dihapus; tanggal memakai kelas `.route-date-label`; mode mandiri memakai `.glass` tanpa blur.

### ID Temuan: BUG-HEADER-220-04
- **Lokasi Kode:** `BusListProgressBar.tsx`
- **Keparahan:** Low
- **Deskripsi:** Bar progres 3px dengan track `rgba(255,255,255,0.08)` (hampir tak terlihat di tema terang), isi memakai `--accent-color`/`--success-color` warisan, dan teks "Unit" hardcoded.
- **Dampak User:** Progres harian sulit terlihat di mode terang.
- **Mitigasi:** Kelas `.buslist-progress-*`: track `--color-border-subtle` 4px, isi `--color-action-primary-bg` (selesai `--color-success-fg`); teks `BUS_LIST.PROGRESS_COUNT_SUFFIX`.
