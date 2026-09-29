# Audit Bugs — Refactor 117 (Revisi Fase 3, Batch 3.4)

Dokumen ini mencatat audit perbaikan bug, dekomposisi modularitas KM, perbaikan tema Light/Dark, sentralisasi kamus unit jarak, dan errata laporan sesuai instruksi `refactor-ss-pdo/refact_116/AUDIT_BUGS.md` dan `REPAIR_REPORT.md` (R116-01 sampai R116-04).

---

## 1. Daftar Temuan Audit & Resolusi

### BUG-R116-01: God File Berpindah ke `SingleFocusKm.tsx` (676 Baris)
- **Lokasi Kode**: `src/components/busCard/modal/singleFocus/SingleFocusKm.tsx` (676 baris pada `refact_115`)
- **Keparahan**: Sedang (Modularitas, Kemudahan Pemeliharaan, dan Pelanggaran Batas File Proyek)
- **Deskripsi**:
  Pada Batch 3.4 awal, komponen orkestrator berhasil dirampingkan menjadi 73 baris, namun implementasi seluruh logika KM (KM Awal/Akhir Shift 1, KM Awal/Akhir Shift 2, rollover suggestion, copy button, dan distance badges) dipindahkan dalam satu file `SingleFocusKm.tsx` berukuran 676 baris. Hal ini melanggar batas modularitas proyek (maksimal 400–500 baris atau memegang >1 domain tanggung jawab).
- **Dampak User / Pengembang**:
  Perubahan pada alur KM satu shift (misalnya penyesuaian validasi atau banner rollover Shift 1) berisiko menimbulkan regresi pada Shift 2. Biaya review kode dan pengujian terisolasi meningkat.
- **Mitigasi**:
  1. Pecah `SingleFocusKm.tsx` menjadi komponen fitur lokal terfokus:
     - `SingleFocusKmShift1.tsx` (**259 baris**): Bertanggung jawab khusus untuk `kmAwal1` dan `kmAkhir1`, referensi tanggal kemarin, chip progressive disclosure `+ KM Akhir 1`, cascading lock saat KM Awal 1 belum valid, dan badge live distance S1.
     - `SingleFocusKmShift2.tsx` (**261 baris**): Bertanggung jawab khusus untuk `kmAwal2` dan `kmAkhir2`, tombol aksi salin KM Akhir Shift 1, chip progressive disclosure `+ KM Akhir 2`, cascading lock saat KM Awal 2 belum valid, dan badge live distance S2.
     - `SingleFocusKmRolloverBanner.tsx` (**84 baris**): Komponen bersama untuk banner peringatan rollover odometer yang identik antara S1 dan S2, tanpa membuat framework generik.
     - `SingleFocusKm.tsx` (**33 baris**): Dispatcher tipis yang merutekan kategori aktif ke `SingleFocusKmShift1` atau `SingleFocusKmShift2`.
  2. Pertahankan seluruh atribut: `id` input (`single-input-kmAwal1`, `single-input-kmAkhir1`, `single-input-kmAwal2`, `single-input-kmAkhir2`), ref fokus `singlePrimaryInputRef`, `handleInputFocus`, `handleInputKeyDown`, kursor prefill, status disable, saran rollover, dan urutan submit.
  3. Tambahkan uji unit mendalam di `BusInputModalSingleFocus.test.tsx` untuk memastikan pemetaan ref dan perilaku masing-masing kategori KM.

---

### BUG-R116-02: Teks Single Focus Jatuh ke Fallback Putih di Atas Modal Terang pada Light Mode
- **Lokasi Kode**:
  - `src/components/busCard/modal/singleFocus/singleFocusStyles.ts:7-10,35-40`
  - `src/components/busCard/modal/singleFocus/SingleFocusToa.tsx:49,137`
  - `src/components/busCard/modal/singleFocus/SingleFocusKm.tsx:65,273,370,596`
  - `src/components/busCard/modal/singleFocus/SingleFocusNotes.tsx:44`
- **Keparahan**: Tinggi (Keterbacaan dan Kontras Input Antarmuka Lapangan)
- **Deskripsi**:
  Komponen Single Focus menggunakan `color: "var(--text-main, #f8fafc)"`, padahal variabel `--text-main` tidak didefinisikan dalam `src/index.css`. Pada Light Mode, background modal menggunakan latar terang (`--card-bg: rgba(255, 255, 255, 0.95)`), sehingga teks label dan input jatuh ke fallback `#f8fafc` (putih terang), menyebabkan teks hampir tidak terbaca di atas permukaan terang. Selain itu, input dan sub-input menggunakan background gelap tetap `rgba(0, 0, 0, 0.35)`.
- **Dampak User**:
  Pada perangkat lapangan dengan tema terang (Light Mode), label nama kolom, nilai angka odometer, dan tombol bantuan hampir tidak terlihat oleh pengawas/petugas, menghambat proses input operasional.
- **Mitigasi**:
  1. Ganti seluruh referensi `var(--text-main, #f8fafc)` dengan token semantik yang didefinisikan resmi di `src/index.css`:
     - Teks primer / input: `var(--text-primary, #171717)` (berwarna `#171717` di Light Mode, `#ededed` di Dark Mode).
     - Teks sekunder / hint: `var(--text-secondary, #6b7280)` (berwarna `#6b7280` di Light Mode, `#8b8b8b` di Dark Mode).
     - Background input: `var(--input-bg, rgba(243, 244, 246, 0.9))` (berwarna abu-abu terang di Light Mode, gelap transparan di Dark Mode).
     - Border card / separator: `var(--card-border, rgba(0, 0, 0, 0.12))` di Light Mode, `rgba(255, 255, 255, 0.08)` di Dark Mode.
     - Aksen Shift 1: `var(--shift1-color, #0284c7)` dan `var(--shift1-bg, rgba(2, 132, 199, 0.08))` di Light Mode; `var(--shift1-color, #38bdf8)` di Dark Mode.
     - Aksen Shift 2: `var(--shift2-color, #7e22ce)` dan `var(--shift2-bg, rgba(126, 34, 206, 0.08))` di Light Mode; `var(--shift2-color, #c084fc)` di Dark Mode.
     - Warning Rollover: `var(--warning-color, #d97706)`, `var(--warning-badge-bg, rgba(249, 115, 22, 0.12))`.
  2. Perbaiki `singleFocusStyles.ts`, `SingleFocusToa.tsx`, `SingleFocusKmShift1.tsx`, `SingleFocusKmShift2.tsx`, `SingleFocusKmRolloverBanner.tsx`, dan `SingleFocusNotes.tsx`.

---

### BUG-R116-03: Unit `KM` Masih Hardcoded dalam Komponen Baru
- **Lokasi Kode**: `src/components/busCard/modal/singleFocus/SingleFocusKm.tsx:248,333,571,656` (sebelum pemecahan)
- **Keparahan**: Rendah (Kepatuhan Kamus Teks Sentral Proyek SS_PDO)
- **Deskripsi**:
  Badge jarak tempuh pada form menuliskan literal unit `{kmDistanceS1} KM` dan `{kmDistanceS2} KM` secara hardcoded langsung di dalam JSX.
- **Dampak User**:
  Inkonsistensi format unit jika sewaktu-waktu format pelaporan jarak disesuaikan di kamus sentral.
- **Mitigasi**:
  1. Tambahkan konstanta `UNIT_KM: 'KM'` dan fungsi template murni `DISTANCE_VALUE_KM: (km: number | string) => `${km} KM`` pada `TEXT_ALERTS.BUS_INPUT_MODAL` di `src/constants/texts/text_alerts.ts`.
  2. Tambahkan uji unit integritas pada `src/constants/texts/texts.test.ts`.
  3. Gantikan seluruh 4 pemanggilan di `SingleFocusKmShift1.tsx` dan `SingleFocusKmShift2.tsx` dengan fungsi template tersebut.

---

### ERRATA-R116-04: Ketidakakuratan Ukuran File, Klaim CSS, dan Perilaku Tombol Salin KM
- **Lokasi Dokumen**: `refactor-ss-pdo/refact_115/REPAIR_REPORT.md` (Ringkasan Eksekutif, Before vs After, Case 3, Evaluasi Visual Mobile)
- **Keparahan**: Rendah (Akurasi Laporan Kualitas & Dokumentasi)
- **Deskripsi**:
  1. Ukuran file yang dilaporkan pada `refact_115` (`SingleFocusKm.tsx` 299 baris, orkestrator 62 baris) tidak sesuai ukuran riil saat review (676 dan 72 baris).
  2. Laporan mengklaim penggunaan kelas Tailwind `bg-white`, `dark:bg-slate-800`, dan `min-h-[48px]`, padahal komponen menggunakan inline style dengan variabel CSS.
  3. Case 3 menyatakan tombol salin KM memindahkan kursor ke field selanjutnya, padahal `handleCopyKmAkhir1ToAwal2` hanya memutasi nilai state `kmAwal2` tanpa memindahkan fokus.
  4. Laporan mengesankan evaluasi visual mobile telah diuji secara interaktif pada browser nyata, padahal pengujian dilakukan pada lingkungan headless.
- **Dampak**:
  Dapat menimbulkan bias atau asumsi keliru dalam pengambilan keputusan review fase selanjutnya.
- **Mitigasi**:
  Koreksi seluruh klaim dalam laporan revisi `refactor-ss-pdo/refact_117/REPAIR_REPORT.md`:
  - Sertakan data baris riil hasil pengukuran script `file-sizes.txt`.
  - Jelaskan token CSS variabel yang sebenarnya digunakan.
  - Koreksi penjelasan Case 3 sesuai implementasi aktual hook `handleCopyKmAkhir1ToAwal2`.
  - Nyatakan secara transparan keterbatasan lingkungan browser dan sajikan bukti matematis kontras kode.
