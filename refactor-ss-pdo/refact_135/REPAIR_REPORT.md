# REPAIR REPORT — Refactor 135

## Implementasi Perbaikan
- **Tanggal:** 6 Oktober 2026
- **Branch:** `devmode`

---

### 1. Deskripsi Perbaikan
Menyesuaikan format kerapihan penulisan sel pada Google Spreadsheet (SSOT) agar seluruh nilai yang diinput oleh pengguna diformat dengan format **bold aktif (`bold: true`)**:
1. Pada `updateBulkBusData`, seluruh sel dalam `formatCells` yang diupdate (berlaku baik dari modal input mode [Semua Kolom], mode [Fokus Kolom] tunggal, maupun operasi bulk) kini diformat secara otomatis dengan `textFormat: { bold: true }`.
2. Pada `formatWholeSheet` (fitur "Format Kerapihan Sheet" di menu profil), seluruh grid baris data armada bus diformat dengan `textFormat: { bold: true }`.
3. Mempertahankan perataan horizontal di tengah (`CENTER`), vertikal di tengah (`MIDDLE`), dan pemotongan teks rapi (`WRAP`).
4. Mematuhi aturan strict proteksi rumus: pembaruan format ini hanya menyentuh `userEnteredFormat(textFormat.bold,horizontalAlignment,verticalAlignment,wrapStrategy)` tanpa mengubah atau menimpa formula bawaan spreadsheet.

---

### 2. Before vs After

#### `src/services/googleSheets/mutations.ts` (`updateBulkBusData`)
- **Before:**
  ```typescript
  const isKet = headerMap.keterangan !== undefined && cell.colIndex === headerMap.keterangan;
  // ...
  userEnteredFormat: {
    textFormat: { bold: isKet }, // Hanya Keterangan yang bold, angka inputan biasa bold: false
    horizontalAlignment: "CENTER",
    verticalAlignment: "MIDDLE",
    wrapStrategy: "WRAP",
  }
  ```
- **After:**
  ```typescript
  userEnteredFormat: {
    textFormat: { bold: true }, // Seluruh nilai yang diinput (Trip, TOA, KM, Total TOA, Ket) selalu BOLD
    horizontalAlignment: "CENTER",
    verticalAlignment: "MIDDLE",
    wrapStrategy: "WRAP",
  }
  ```

#### `src/services/googleSheets/mutations.ts` (`formatWholeSheet`)
- **Before:**
  ```typescript
  userEnteredFormat: {
    textFormat: { bold: false },
    horizontalAlignment: "CENTER",
    // ...
  }
  ```
- **After:**
  ```typescript
  userEnteredFormat: {
    textFormat: { bold: true },
    horizontalAlignment: "CENTER",
    // ...
  }
  ```

---

### 3. Case: Skenario Lapangan

#### Skenario 1: Petugas Menginput Nilai KM dan TOA pada Mode [Semua Kolom]
- **Kondisi:** Petugas mengisi data lengkap Shift 1 dan Shift 2 untuk unit bus.
- **Sebelum Perbaikan:** Angka KM dan TOA yang masuk ke spreadsheet tampil dengan font normal/tipis, sedangkan kolom keterangan tebal.
- **Setelah Perbaikan:** Seluruh angka KM, TOA, dan Keterangan langsung tercetak dengan font tebal (**BOLD**) di file Google Sheets asli, menghasilkan visual tabel yang seragam, rapi, dan mudah dibaca oleh koordinator operasional.

#### Skenario 2: Petugas Menggunakan Mode [Fokus Kolom] (Speed-Run)
- **Kondisi:** Petugas menginput cepat satu per satu untuk kolom KM Akhir Shift 1.
- **Sebelum Perbaikan:** Angka KM Akhir tersimpan dengan font tipis.
- **Setelah Perbaikan:** Angka KM Akhir langsung diformat tebal (**BOLD**), konsisten dengan mode Semua Kolom.

---

### 4. Hasil Verifikasi
1. `pnpm vitest run src/`: 91 file lulus, 688 unit test lulus 100%.
2. `pnpm run build`: TypeScript Strict Mode (`tsc -b`) dan Vite build berhasil 0 error.
3. `graphify update .`: Knowledge Graph terbarui.
