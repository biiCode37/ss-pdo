# Task 5 Report: Integrasi Tab Catatan Penuh (BusInputModalNotes) & Single Focus (SingleFocusNotes)

## Status: DONE
- **Commit Hash:** `2020ab0f8da95e600d16881133fc5bf2609bdde9`
- **Branch:** `devmode`

---

## 1. Ringkasan Implementasi

Pada Task 5, dilakukan penyelesaian antarmuka pengelolaan catatan per shift pada Tab Catatan penuh (`BusInputModalNotes.tsx`) dan Mode Fokus Tunggal (`SingleFocusNotes.tsx`):

1. **Tab Catatan Penuh (`BusInputModalNotes.tsx`):**
   - **Segmented Shift Selector:** Switch tombol `[Shift 1]` dan `[Shift 2]` dengan indikator visual titik aktif jika shift tersebut telah memiliki catatan.
   - **Checkbox "Terapkan ke Kedua Shift" (`APPLY_ALL_SHIFTS`):** Bila aktif, sinkronisasi nilai catatan aktif ke shift lainnya secara otomatis saat diubah maupun saat checkbox pertama kali diaktifkan.
   - **Komponen Preset `KeteranganPresetBar`:** Terintegrasi langsung untuk shift yang sedang aktif (BA, OFF, TO EVDAL, Normal SGO, dropdown BA.01-04, dan shortcut NP1/NP2).
   - **Textarea Catatan per Shift:** Terhubung reaktif ke `keteranganS1` atau `keteranganS2` sesuai shift aktif.
   - **Live Preview SSOT Box:** Menampilkan kalkulasi kanonik `combineShiftKeterangan(keteranganS1, keteranganS2)` (misal `"BA.01 Ban bocor | SGO"`, `"OFF"`, atau fallback `"Normal (SGO)"`), sehingga pengguna melihat persis format yang akan disimpan ke Google Sheets tanpa menimpa formula.

2. **Single Focus Mode (`SingleFocusNotes.tsx`):**
   - Mendeteksi shift relevan dari `activeCategory` / `effectiveCategory` (Shift 2 jika mengandung angka "2", default Shift 1).
   - Menghubungkan catatan ke `keteranganS1` atau `keteranganS2` serta menyediakan fallback `setKeterangan` untuk kompatibilitas penuh.
   - Mengintegrasikan `KeteranganPresetBar` tepat di atas textarea catatan single focus.

3. **Form Hook Update (`useBusInputForm.ts`):**
   - Mengekspos `activeCategory` pada return object agar dapat diakses oleh komponen anak secara deklaratif dan typed.

---

## 2. File yang Dimodifikasi

1. `src/components/busCard/modal/BusInputModalNotes.tsx`
2. `src/components/busCard/modal/singleFocus/SingleFocusNotes.tsx`
3. `src/components/busCard/modal/useBusInputForm.ts`
4. `src/components/busCard/BusInputModal.test.tsx`
5. `src/components/busCard/modal/BusInputModalSingleFocus.test.tsx`

---

## 3. Hasil Pengujian & Verifikasi

1. **Unit Test Spesifik Modal Bus (`src/components/busCard/BusInputModal.test.tsx`):**
   - Total 39 pengujian lulus 100% (PASS).
   - Pengujian baru mencakup:
     - Render segmented selector shift 1 & 2, toggle terapkan kedua shift, dan live preview SSOT.
     - Pergantian catatan shift 1 dan shift 2 secara independen.
     - Sinkronisasi kedua shift saat toggle "Terapkan ke Kedua Shift" aktif.
     - Integrasi `KeteranganPresetBar` pada Single Focus Mode.

2. **Seluruh Suite Komponen Bus Card (`src/components/busCard/`):**
   - **14 Test Files Passed**
   - **170 Tests Passed** (0 failures).

3. **TypeScript Strict Type Check:**
   - `pnpm tsc -b` -> Lulus 0 error (exit code 0).
