# Audit Temuan Refact 55: Dekomposisi Handler Modal Input Bus `busModalHandlers.ts` (~759 baris)

Dokumen audit ini mencatat analisis arsitektural dan dekomposisi terhadap modul utilitas handler interaksi modal input bus `src/utils/modals/busInput/busModalHandlers.ts` yang memuat logika pemrosesan Smart Keterangan (prefix, chips preset, dropdown BA.02), setup pendengar event modal SweetAlert2 (focus auto-scroll, segmented tab switcher, quick copy KM, live KM diff preview, mode Satset toggle), dan logika preConfirm validasi multi-mode (Trip, Kolom Tunggal, dan ALL).

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF55-ARCH-001: God File Utility `src/utils/modals/busInput/busModalHandlers.ts` (759 baris)

- **Lokasi Kode**: `src/utils/modals/busInput/busModalHandlers.ts` (759 baris)
- **Tingkat Keparahan**: **MEDIUM-HIGH** (Maintainability, Separation of Concerns & Clean Code)
- **Deskripsi Masalah**:
  Berkas `busModalHandlers.ts` memuat 3 domain fungsionalitas yang sangat berbeda di dalam satu file monolitik:
  1. **Smart Keterangan Logic**: Penanganan interaksi tombol chip preset (`OFF`, `TO EVDAL`, `BA.01-04`), dropdown dinamis `BA.02` (`NP1`, `NP2`, `__CUSTOM__`), badge prefix, tombol clear, dan ekstraksi string normalisasi keterangan.
  2. **Modal Event Listeners**: Pengaturan navigasi tombol segmented tab, auto-focus pada input utama, auto-scroll ke tengah viewport saat keyboard mobile aktif, aksi tombol salin massal KM Akhir Shift 1 ke KM Awal Shift 2, perhitungan live preview selisih KM terhadap batas 230 KM, progressive disclosure chips (`manualShift1`, `manualShift2`, `keterangan`), dan toggle mode Satset (*Auto-Next Bus*).
  3. **PreConfirm Multi-Mode Validation**: Validasi batas angka trip (maksimal 20), validasi batas digit TOA dan manual (maksimal 999), perbandingan logis KM Akhir $\ge$ KM Awal, perbandingan Total TOA $\ge$ TOA Shift 1, pembersihan otomatis nilai operasional untuk unit bertatus `OFF`, serta ekstraksi objek `Partial<BusData>`.

- **Dampak User & Pengembang**:
  - Berkas yang sangat panjang (759 baris) menyulitkan penelusuran aturan validasi baru atau pembaruan UI Smart Keterangan.
  - Pengujian unit untuk logika ekstraksi keterangan dan preConfirm sulit dilakukan secara terisolasi.
  - Risiko regresi tinggi bila terjadi perubahan pada salah satu mode input (Trip vs Kolom Tunggal vs ALL).

- **Mitigasi**:
  Dekomposisi modular di dalam folder `src/utils/modals/busInput/`:
  1. **`busModalKeterangan.ts`** (~190 baris):
     - Mengisolasi `setupSmartKeteranganLogic` dan `extractKeteranganFromForm`.
  2. **`busModalPreConfirm.ts`** (~250 baris):
     - Mengisolasi `handleModalPreConfirm` dengan helper internal `validateAndExtractTripMode`, `validateAndExtractSingleMode`, dan `validateAndExtractAllMode`.
  3. **`busModalEventListeners.ts`** (~220 baris):
     - Mengisolasi `setupModalEventListeners`.
  4. **`busModalHandlers.ts`** (15 baris):
     - Bertindak sebagai facade/re-export bersih untuk menjamin 100% kompatibilitas (*Zero Breaking Change*).
  5. **Pengujian Unit Mandiri**:
     - `src/utils/modals/busInput/busModalKeterangan.test.ts` (5 pengujian).
     - `src/utils/modals/busInput/busModalPreConfirm.test.ts` (5 pengujian).
