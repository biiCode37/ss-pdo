# AUDIT TEMUAN MODAL INPUT BUS: REFACTOR 222
**Modul:** `src/components/busCard/` — `BusInputModalTabs.tsx`, `BusInputModalNotes.tsx`, `notes/KeteranganPresetBar.tsx`, `fields/ShiftOptionChip.tsx`, `fields/CrossDayKmIndicator.tsx`, `singleFocus/*` (KM S1/S2, TOA, Trip, `singleFocusStyles.ts`), `BusInputModalShift1/2.tsx`, `BusInputModalHeader.tsx`, `BusInputModal.tsx`, dll.
**Fokus Masalah:** Modal input (layar utama petugas) memakai tab, segmen, dan tombol preset yang dibuat ulang di tiap file dengan tint tipis; beberapa teks hampir tak terbaca; 277 nilai warna mentah/variabel lama; kotak di dalam kotak.

---

### ID Temuan: BUG-MODAL-222-01
- **Lokasi Kode:** `BusInputModalTabs.tsx`, segmen Shift 1/2 di `BusInputModalNotes.tsx`
- **Keparahan:** High (penanda tab aktif tidak terlihat)
- **Deskripsi:** Tab aktif memakai `--card-bg` di atas wadah `--input-bg`: kontras terukur **1,08:1 (gelap) / 1,10:1 (terang)**. Setiap tab diberi ikon dekoratif (Gauge, Gauge, Bus, FileText).
- **Dampak User:** PDO tidak yakin sedang mengisi Shift 1 atau Shift 2 — risiko salah isi data shift.
- **Mitigasi:** Komponen bersama `.ui-segmented` + `.ui-segmented-btn` (aktif `--color-state-active-*`), ikon dihapus.

### ID Temuan: BUG-MODAL-222-02
- **Lokasi Kode:** `KeteranganPresetBar.tsx` (BA, OFF, TO EVDAL, OKB, Renop, Reset, kode BA), `ShiftOptionChip.tsx`, `singleFocusStyles.ts` (`getSingleFocusChipStyle`) + 4 pemanggilnya
- **Keparahan:** High (teks tak terbaca + duplikasi)
- **Deskripsi:** 8 tombol preset ditulis sebagai 8 objek style terpisah; status aktif berupa tint `rgba(… 0.2)`. Tombol "Reset" non-aktif memakai `opacity: 0.4` + teks `rgba(255,255,255,0.2)`: **1,91:1 (gelap) / 1,00:1 (terang)** — tidak terlihat di mode terang.
- **Dampak User:** Preset yang terpilih tidak jelas; tombol Reset "hilang" di mode terang.
- **Mitigasi:** Komponen bersama `.ui-option-btn` (aktif `aria-pressed` → `state-active`; preset bermakna status memakai `data-tone` → latar solid status dengan teks warna permukaan, diuji kontras); tombol non-aktif `--color-text-muted` tanpa opacity. Helper `getSingleFocusChipStyle` dihapus.

### ID Temuan: BUG-MODAL-222-03
- **Lokasi Kode:** `BusInputModalShift1/2.tsx`, `singleFocus/SingleFocusKmShift1/2.tsx` (badge jarak tempuh), 13 file modal
- **Keparahan:** Medium (teks gagal WCAG di mode terang)
- **Deskripsi:** Badge "0.0 KM" memakai `#38bdf8` di atas `rgba(56,189,248,0.15)`: **1,81:1** di mode terang (ternary multi-baris lolos perbaikan sebelumnya). Total 93 fallback warna di dalam `var()`, 90 variabel lama (`--shift1-*`, `--card-*`, `--input-bg`, `--text-*`, dst.), dan 94 hex/rgba mentah.
- **Dampak User:** Jarak tempuh hasil hitung sulit dibaca.
- **Mitigasi:** Pemetaan otomatis ke token semantik berdasarkan rona & properti (latar/garis/teks/bayangan); 0 warna mentah tersisa di `src/components/busCard`.

### ID Temuan: BUG-MODAL-222-04
- **Lokasi Kode:** `fields/CrossDayKmIndicator.tsx`
- **Keparahan:** Low
- **Deskripsi:** Info selisih KM lintas hari ditampilkan sebagai kotak bertepi di dalam panel KM yang juga bertepi (kotak di dalam kotak).
- **Dampak User:** Panel KM terasa padat dan berlapis.
- **Mitigasi:** Kondisi normal tampil sebagai baris biasa; kotak hanya untuk peringatan selisih ekstrem.

### ID Temuan: BUG-MODAL-222-05
- **Lokasi Kode:** `singleFocus/SingleFocusKmShift1/2.tsx`
- **Keparahan:** Low (aksesibilitas)
- **Deskripsi:** Status KM negatif hanya ditandai warna border merah mentah; tidak ada atribut yang dibacakan pembaca layar.
- **Dampak User:** Pengguna pembaca layar tidak tahu input bermasalah.
- **Mitigasi:** `aria-invalid` saat negatif; border memakai `--color-error-fg`.
