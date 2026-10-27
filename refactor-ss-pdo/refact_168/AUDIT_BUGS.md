# Audit Bugs - Refactor 168

## Daftar Temuan Masalah & Celah

### BUG-168-01: Tidak Ada Prefix Pembeda Shift 1 vs Shift 2 pada Penyimpanan Keterangan ke Google Sheets
- **Lokasi Kode**: `src/utils/keteranganUtils.ts` (`combineShiftKeterangan`, `splitShiftKeterangan`)
- **Tingkat Keparahan**: Sedang (Integritas Data SSOT)
- **Deskripsi**:
  Ketika pengguna memasukkan catatan berbeda untuk Shift 1 dan Shift 2 (misal Shift 1 unit dinas normal namun Shift 2 unit mogok), aplikasi sebelumnya hanya menggabungkan string mentah `Catatan S1 | Catatan S2` tanpa prefix `S1:` atau `S2:`. Akibatnya, pada file spreadsheet asli (SSOT Google Sheets), pembaca tidak dapat membedakan apakah kendala tersebut terjadi di Shift 1 atau Shift 2.
- **Dampak Pengguna**:
  Pengawas, korlap, dan manajemen yang membaca spreadsheet kehilangan jejak kronologis shift terkait kendala armada.
- **Mitigasi**:
  Memperbarui format kanonikal penggabungan catatan di `combineShiftKeterangan` menjadi `S1: <note1>` (jika hanya S1), `S2: <note2>` (jika hanya S2), atau `S1: <note1> | S2: <note2>` (jika keduanya ada). Untuk status seharian penuh yang identik seperti `OFF` atau `TO EVDAL`, tetap dipertahankan ringkas tanpa prefix. Menyesuaikan `splitShiftKeterangan` untuk mengenali dan memecah prefix `S1:` dan `S2:` secara akurat dalam urutan apa pun.

---

### BUG-168-02: Tidak Adanya Pemilihan Otomatis Shift Default Berdasarkan Jam Operasional
- **Lokasi Kode**: `src/utils/keteranganUtils.ts`, `src/components/busCard/modal/useBusInputForm.ts`, `src/components/busCard/useBusCardModal.ts`, `src/components/busCard/modal/BusInputModalNotes.tsx`
- **Tingkat Keparahan**: Sedang (Efisiensi UX Lapangan)
- **Deskripsi**:
  Aplikasi sebelumnya selalu membuka tab "Shift 1" secara statis pada modal formulir input mode "semua kolom" dan pada selector tab catatan, terlepas dari waktu operasional saat pengawas lapangan melakukan entri data di sore/malam hari.
- **Dampak Pengguna**:
  Pengawas yang bertugas pada sore hari (Shift 2) terpaksa harus selalu mengklik tab "Shift 2" secara manual berulang-ulang untuk setiap bus yang diinput.
- **Mitigasi**:
  Menyediakan fungsi pembantu `getCurrentOperationalShift(now?: Date): 1 | 2` (< 14:00 = 1, >= 14:00 = 2) dan `getDefaultModalTab(now?: Date, overrideShift?: 1 | 2): "shift1" | "shift2"`. Mengintegrasikan penentuan tab default ini pada `useBusInputForm` (mode "all" tanpa tab eksplisit) dan pada selector tab catatan (`BusInputModalNotes` dan `SingleFocusNotes`) sebagai nilai default awal yang tetap fleksibel diubah oleh pengguna.

---

### BUG-168-03: Anomali Operator Logika `isShift2` pada SingleFocusNotes di Atas Jam 14.00
- **Lokasi Kode**: `src/components/busCard/modal/singleFocus/SingleFocusNotes.tsx`
- **Tingkat Keparahan**: Rendah - Sedang (Regresi State UI)
- **Deskripsi**:
  Evaluasi boolean `isShift2` pada `SingleFocusNotes` sempat menggunakan klausa `(form.activeShift === 2 || new Date().getHours() >= 14)`. Di sore hari (jam >= 14:00), klausa ini selalu bernilai `true` meskipun komponen dipanggil dengan `form.activeShift = 1`, sehingga merujuk ke `keteranganS2` yang kosong dan menyamarkan catatan Shift 1.
- **Dampak Pengguna**:
  Pengawas yang mengedit bus dengan fokus Shift 1 di sore hari melihat kolom catatan tampak kosong padahal sudah ada data di Shift 1.
- **Mitigasi**:
  Memperbaiki evaluasi shift menjadi `(form.activeShift ?? getCurrentOperationalShift()) === 2` sehingga prioritas `activeShift` eksplisit selalu dihormati secara mutlak.
