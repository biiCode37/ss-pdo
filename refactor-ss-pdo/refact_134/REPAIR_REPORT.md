# REPAIR REPORT — Refactor 134

## Implementasi Perbaikan
- **Tanggal:** 6 Oktober 2026
- **Branch:** `devmode`

---

### 1. Deskripsi Perbaikan
Memperbaiki alur input data "Total TOA" pada tab [Shift 2] di Mode [Semua Kolom] (`all`):
1. Mengikat input "Total TOA" pada `BusInputModalShift2.tsx` langsung ke state `totalToa` dan fungsi `setTotalToa`, tanpa menyentuh `toaShift2`.
2. Menghapus pengiriman `updates.toaShift2` dalam `buildBusInputPayload` pada mode `all`, sehingga cell spreadsheet pada kolom "TOA SHIFT 2" tetap mempertahankan rumus bawaan Google Sheets (`=TOTAL_TOA - TOA_SHIFT_1`) tanpa tertimpa data teks statis.
3. Memperbaiki `computeEffectiveTotalToa` agar mempertahankan nilai input murni `totalToa` tanpa menjumlahkan kembali dengan Shift 1.
4. Menyesuaikan modul validasi `busInputValidation.ts` untuk memvalidasi pasangan `toaShift1` dan `totalToa` secara langsung.
5. Memperbarui seluruh pengujian unit (`busInputPayload.test.ts`, `busInputValidation.test.ts`, `BusInputModal.test.tsx`, `useBusInputForm.test.tsx`).

---

### 2. Before vs After

#### Komponen UI Tab Shift 2 (`BusInputModalShift2.tsx`)
- **Before:**
  ```tsx
  const displayToaValue = totalToa || toaShift2;
  const handleToaChange = (val: string) => {
    setTotalToa(val);
    setToaShift2(val);
  };
  // Input menggunakan value={displayToaValue} dan onChange={(e) => handleToaChange(e.target.value)}
  ```
- **After:**
  ```tsx
  // Input menggunakan value={totalToa} dan onChange={(e) => setTotalToa(e.target.value)}
  // toaShift2 dan setToaShift2 dihilangkan sepenuhnya dari props dan handler tab Shift 2
  ```

#### Payload Mutasi Spreadsheet (`busInputPayload.ts`)
- **Before:**
  ```typescript
  updates.toaShift2 = toaShift2.trim();
  // Menimpa rumus kolom "TOA SHIFT 2" di Google Sheets
  ```
- **After:**
  ```typescript
  // updates.toaShift2 ditiadakan agar rumus kolom "TOA SHIFT 2" pada spreadsheet asli tidak tertimpa/rusak.
  // Nilai input Total TOA dikirim langsung ke kolom Total TOA via updates.totalToa.
  ```

---

### 3. Case: Skenario Lapangan

#### Skenario 1: Petugas Mencatat Tiket Kumulatif di Akhir Shift 2
- **Kondisi:**
  - Shift 1 mencatat TOA S1 = `120` tiket.
  - Petugas Shift 2 membaca total akumulasi pada mesin tiket fisik di akhir operasional = `250` tiket.
- **Sebelum Perbaikan:**
  - Petugas memasukkan angka `250` pada input "Total TOA" tab Shift 2.
  - Aplikasi mengirimkan `toaShift2 = "250"` dan `totalToa = "370"` (120 + 250).
  - Kolom "TOA SHIFT 2" di Google Sheets tertimpa menjadi angka statis `250`, dan Total TOA menjadi `370` (kacau dan salah rumus).
- **Setelah Perbaikan:**
  - Petugas memasukkan angka `250` pada input "Total TOA".
  - Aplikasi mengirimkan `totalToa = "250"`, tanpa menyertakan `toaShift2`.
  - Kolom "Total TOA" pada Google Sheets terisi `250`.
  - Rumus otomatis di kolom "TOA SHIFT 2" (`=250 - 120`) tetap utuh dan menghasilkan angka `130` yang presisi.

---

### 4. Hasil Verifikasi
1. `pnpm vitest run src/`: 91 file lulus, 688 unit test lulus 100%.
2. `pnpm run build`: TypeScript Strict Mode (`tsc -b`) dan Vite bundling berhasil 0 error.
3. `graphify update .`: Knowledge Graph terbarui.
