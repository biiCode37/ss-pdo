# Audit Bugs — Refactor 115 (Fase 3, Batch 3.4)

Dokumen ini mencatat audit bug, hardcoded UI literal, modularitas komponen, dan klarifikasi errata pada komponen Single Focus UI (`src/components/busCard/modal/BusInputModalSingleFocus.tsx`) sesuai instruksi Fase 3 Batch 3.4 (`PHASE_03_BATCH_PLAN.md` dan review Codex `refact_114`).

---

## 1. Daftar Temuan Audit

### BUG-R114-01: Hardcoded UI Strings & Fallback Literals pada Single Focus UI
- **Lokasi Kode**: `src/components/busCard/modal/BusInputModalSingleFocus.tsx` (baris 131, 142, 237, 248, 258, 308, 482, 597, 617)
- **Keparahan**: Sedang (Pelanggaran Standar Kamus Teks Sentral Proyek SS_PDO)
- **Deskripsi**:
  Ditemukan sejumlah string antarmuka pengguna yang di-hardcode langsung di dalam komponen Single Focus UI tanpa merujuk ke kamus sentral `src/constants/texts/`:
  1. Fallback tanggal kemarin: `form.previousDayDateLabel || "Kemarin"` pada acuan KM Awal S1.
  2. Label chip progressive disclosure:
     - `"+ Manual S1"` dan `"- Manual S1"`
     - `"+ Manual S2"` dan `"- Manual S2"`
     - `"+ KM Akhir"` dan `"- KM Akhir"` (pada Shift 1 dan Shift 2)
     - `"+ Catatan"` dan `"- Catatan"`
  3. Tombol aksi copy KM: `"Salin KM Akhir Shift 1"` pada bantuan KM Awal Shift 2.
  4. Prefix label acuan KM: `"KM Awal Shift 1: "` dan `"KM Awal Shift 2: "` pada bantuan KM Akhir.
- **Dampak User**:
  Inkonsistensi bahasa dan terminologi pada UI, ketidakmampuan pelokalan sentral, potensi regresi tampilan jika teks diperbarui di modul lain namun tertinggal di Single Focus modal, serta pelanggaran Golden Rule Kamus Teks Sentral.
- **Mitigasi**:
  1. Tambahkan konstanta dan fungsi template murni ke `src/constants/texts/text_alerts.ts` di bawah namespace `BUS_INPUT_MODAL`:
     - `LABEL_PREVIOUS_DAY`: `"Kemarin"`
     - `CHIP_KM_AKHIR_1`: `"+ KM Akhir"` / `"- KM Akhir"`
     - `CHIP_KM_AKHIR_2`: `"+ KM Akhir"` / `"- KM Akhir"`
     - `CHIP_ACTIVE_MANUAL_S1`: fungsi dinamis `(active: boolean) => ...`
     - `CHIP_ACTIVE_MANUAL_S2`: fungsi dinamis `(active: boolean) => ...`
     - `CHIP_ACTIVE_KM_AKHIR_1`: fungsi dinamis `(active: boolean) => ...`
     - `CHIP_ACTIVE_KM_AKHIR_2`: fungsi dinamis `(active: boolean) => ...`
     - `CHIP_ACTIVE_KETERANGAN`: fungsi dinamis `(active: boolean) => ...`
     - `COPY_KM_AKHIR_S1_ACTION`: `"Salin KM Akhir Shift 1"`
     - `REF_KM_AWAL_S1`: `"KM Awal Shift 1: "`
     - `REF_KM_AWAL_S2`: `"KM Awal Shift 2: "`
  2. Tambahkan uji unit integritas kamus pada `src/constants/texts/texts.test.ts`.
  3. Migrasikan seluruh call-site di komponen Single Focus untuk menggunakan token kamus ini secara konsisten.

---

### ERRATA-R114-02: Klarifikasi Errata — Kategori Trip Tidak Berada dalam `SINGLE_COLUMN_META`
- **Lokasi Dokumentasi**: `refactor-ss-pdo/refact_113/REPAIR_REPORT.md` vs `src/components/busCard/modal/useBusInputForm.ts`
- **Keparahan**: Rendah (Dokumentasi Errata & Spesifikasi Arsitektur)
- **Deskripsi**:
  Dokumentasi sebelumnya secara tidak sengaja mengesankan bahwa input ritase/trip memiliki cabang Single Focus terpisah. Faktanya, `SINGLE_COLUMN_META` pada domain model hanya mendefinisikan 7 kategori fokus cepat:
  1. `toaShift1` (TOA Shift 1)
  2. `kmAwal1` (KM Awal Shift 1)
  3. `kmAkhir1` (KM Akhir Shift 1)
  4. `totalToa` (Total TOA / TOA Shift 2)
  5. `kmAwal2` (KM Awal Shift 2)
  6. `kmAkhir2` (KM Akhir Shift 2)
  7. `keterangan` (Catatan Operasional)
  
  Kategori `tripPergi` dan `tripPulang` **tidak pernah** menjadi target Single-Column Focus Speed-Run mode. Ketika pengguna menekan sel trip pada tabel dashboard, aplikasi secara otomatis membuka mode penuh (*Mode All*) dengan tab Ritase aktif (`BusInputModalTrip.tsx`), bukan mode Single Focus.
- **Dampak User**:
  Tidak ada bug langsung pada pengguna; namun terdapat risiko developer lain atau LLM menambahkan cabang "Single Focus Trip" hipotetis yang melanggar spesifikasi UX operasional lapangan.
- **Mitigasi**:
  Catat errata secara eksplisit di `AUDIT_BUGS.md` dan `REPAIR_REPORT.md` Batch 3.4. Tegaskan bahwa Single Focus hanya merender kelompok TOA, KM, dan Catatan. Tidak ada cabang trip hipotetis yang ditambahkan.

---

### ARCH-R115-01: Pelanggaran Batas Ukuran Modularitas & Tanggung Jawab God-File
- **Lokasi Kode**: `src/components/busCard/modal/BusInputModalSingleFocus.tsx` (806 baris sebelum refactor)
- **Keparahan**: Sedang (Pelanggaran Golden Rule Modularitas Proyek SS_PDO)
- **Deskripsi**:
  File `BusInputModalSingleFocus.tsx` mengelola seluruh rendering input TOA Shift 1, Total TOA, KM Awal/Akhir Shift 1, KM Awal/Akhir Shift 2, banner saran rollover, peringatan selisih KM, chip progressive disclosure, dan textarea catatan operasional dalam satu file raksasa (> 800 baris). Hal ini menyulitkan pemeliharaan kode, pengujian unit terisolasi, dan review diff.
- **Dampak User**:
  Risiko tinggi regresi saat mengubah satu jenis input (misal penambahan validasi KM dapat merusak layout TOA atau tombol catatan), serta beban render kognitif yang besar bagi developer.
- **Mitigasi**:
  Pecah `BusInputModalSingleFocus.tsx` menjadi komponen fitur lokal mandiri di dalam direktori `src/components/busCard/modal/singleFocus/`:
  1. `singleFocusStyles.ts`: Menampung utility classes Tailwind bersama untuk field input, chip buttons, dan hint helpers yang identik tanpa membuat design system generik baru.
  2. `SingleFocusToa.tsx`: Bertanggung jawab penuh pada rendering TOA Shift 1 dan Total TOA, chip manual, input manual terlipat, serta navigasi fokus.
  3. `SingleFocusKm.tsx`: Bertanggung jawab penuh pada rendering KM Awal/Akhir S1 & S2, banner rollover dinamis, badge selisih KM, tombol copy KM Akhir S1, dan cascading lock states.
  4. `SingleFocusNotes.tsx`: Bertanggung jawab penuh pada rendering textarea catatan operasional dan chip keterangan.
  5. `BusInputModalSingleFocus.tsx`: Berubah menjadi orkestrator ramping (62 baris) yang bersih dan hanya mengarahkan kategori fokus aktif ke sub-komponen terkait dengan kontrak props `BusInputFormReturn` yang utuh.
