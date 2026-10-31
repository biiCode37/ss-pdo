# REPAIR REPORT — Refactor 175: Perbaikan Deteksi Badge [T.O] & Pertukaran Warna Badge [T.O] / [OFF]

**Tanggal:** 31 Oktober 2026  
**Branch:** `devmode`  
**Quality Gates:** Vitest 126 file (1097 unit tests) lulus 100%, Color Contract 114 tests lulus 100%, TypeScript build 0 error.

---

## 1. Implementasi Perbaikan

### A. Utilitas Standar Domain Keterangan (`src/utils/keteranganUtils.ts`)
1. **Fungsi `isUnitTo(raw?: string | null): boolean`:**
   - Menjamin badge `[T.O]` hanya diberikan kepada unit yang memiliki catatan `[T.O EVDAL / TO EVDAL / TO / T.O]` (termasuk variasi pemisah strip `TO-EVDAL`, titik `T.O.`, tanda kurung `TO (SANKSI)`, strip keterangan `T.O - CADANGAN`, maupun prefix BA seperti `BA.02 - TO`).
   - Mencegah *false-positive* pada kata operasional yang memuat huruf "TO" sebagai substring seperti `RADIATOR`, `TEMPERATUR`, `MOTOR`, `TOKO`, `OTOMATIS`, `FOTO`, `TOA`, `T.O.A`, dll.
2. **Fungsi `isUnitOff(raw?: string | null): boolean`:**
   - Memeriksa kata `OFF` menggunakan pembatas kata utuh (`\bOFF\b`), mendukung variasi shift (`S1: OFF`, `S2: OFF`) serta catatan tambahan (`OFF - BAN PECAH`, `OFF (SPARE)`).
   - Menolak kata yang memuat kata lain seperti `OFFICER`.
3. **Penyelarasan `isUnitOffOrToEvdal(raw?: string | null): boolean`:**
   - Disederhanakan menjadi komposisi murni: `isUnitOff(raw) || isUnitTo(raw)` untuk menjamin konsistensi evaluasi non-operasional di seluruh modul aplikasi.

### B. Komponen Kartu Bus (`src/components/busCard/BusCard.tsx`)
- Mengganti kode naif:
  ```tsx
  // SEBELUM:
  activeShiftStatus.toUpperCase().includes("OFF") ? ... : activeShiftStatus.toUpperCase().includes("TO") ? ...
  ```
  menjadi evaluasi berbasis fungsi domain terstandar:
  ```tsx
  // SESUDAH:
  isUnitOff(activeShiftStatus) ? (
    <span className="unit-status-badge unit-status-badge-off" title={...}>OFF</span>
  ) : isUnitTo(activeShiftStatus) ? (
    <span className="unit-status-badge unit-status-badge-to" title={...}>T.O</span>
  ) : null
  ```

### C. Pertukaran Warna Badge Semantik (`src/index.css` & `src/components/monitoring/monitoringUtils.ts`)
1. **Pertukaran Kelas Badge:**
   - `.unit-status-badge-to`: Dari `--color-warning-*` (kuning) ➔ Menjadi `var(--color-error-bg)`, `var(--color-error-fg)`, `var(--color-error-border)` (**Merah**).
   - `.unit-status-badge-off`: Dari `--color-error-*` (merah) ➔ Menjadi `var(--color-warning-bg)`, `var(--color-warning-fg)`, `var(--color-warning-border)` (**Kuning**).
2. **Badge Rincian Formatted Note (`.note-badge-to` & `.note-badge-off`):**
   - `.note-badge-to` menggunakan `var(--color-error-bg)` & `var(--color-error-fg)` (**Merah**).
   - `.note-badge-off` menggunakan `var(--color-warning-bg)` & `var(--color-warning-fg)` (**Kuning**).
3. **Fungsi Inferensi Monitoring (`monitoringUtils.ts`):**
   - Output kode `OFF` diselaraskan ke tema kuning: `color: "var(--color-warning-fg)"`, `bg: "var(--color-warning-bg)"`.
   - Output kode `TO` / `TO EVDAL` diselaraskan ke tema merah: `color: "var(--color-error-fg)"`, `bg: "var(--color-error-bg)"`.

---

## 2. Before vs After

| Aspek | Sebelum Refactor 175 | Sesudah Refactor 175 |
|---|---|---|
| **Pengecekan T.O di Kartu Bus** | `activeShiftStatus.toUpperCase().includes("TO")` | `isUnitTo(activeShiftStatus)` dengan *regex boundary* dan *token guard* ketat |
| **Pengecekan OFF di Kartu Bus** | `activeShiftStatus.toUpperCase().includes("OFF")` | `isUnitOff(activeShiftStatus)` dengan `\bOFF\b` |
| **Unit dengan teks "RADIATOR" / "TEMPERATUR"** | Tampil badge palsu `[T.O]` di samping nomor bodi | **TIDAK ada badge `[T.O]`**; catatan teknis tampil rapi pada strip catatan BA.02 |
| **Warna Badge [T.O]** | Kuning / Amber (`--color-warning-*`) | **Merah** (`--color-error-*`) |
| **Warna Badge [OFF]** | Merah (`--color-error-*`) | **Kuning** (`--color-warning-*`) |
| **Aksesibilitas Kontras WCAG** | Lolos AA/AAA | Lolos AA & AAA di kedua tema (Light Mode & Dark Mode) via token semantik resmi |

---

## 3. Case: Skenario Lapangan

### Case 1: Unit KWK 222180 dengan Kendala Radiator (Sesuai Gambar Tangkapan Layar Pengguna)
- **Data Input SSOT:**  
  Unit: `KWK 222180`  
  Keterangan: `BA.02 KENDALA MESIN (TEMPERATUR RADIATOR MENYALA)`
- **Kondisi Sebelum:**  
  Aplikasi mendeteksi huruf "TO" pada "TEMPERA**TO**R" atau "RADIA**TO**R", lalu menambahkan badge `[T.O]` kuning di samping nomor unit, padahal armada tersebut tidak berstatus Tidak Operasi (T.O).
- **Kondisi Sesudah:**  
  `isUnitTo()` mengevaluasi `false`, `isUnitOff()` mengevaluasi `false`. Header kartu hanya menampilkan nomor bodi `KWK 222180` bersih tanpa badge status, dan di bawahnya muncul badge `BA.02` merah dengan teks catatan kendala mesin yang akurat.

### Case 2: Unit Berstatus T.O / TO EVDAL
- **Data Input SSOT:**  
  Unit: `KWK 222170`, Keterangan: `T.O EVDAL` (atau `TO`, `T.O`, `TO EVDAL`)
- **Hasil:**  
  `isUnitTo()` bernilai `true`. Badge `[T.O]` ditampilkan di header dengan latar merah transparan dan teks merah kontras tinggi (`var(--color-error-*)`).

### Case 3: Unit Berstatus OFF (Libur Terjadwal)
- **Data Input SSOT:**  
  Unit: `KWK 222150`, Keterangan: `OFF` (atau `S1: OFF`, `OFF - SPARE`)
- **Hasil:**  
  `isUnitOff()` bernilai `true`. Badge `[OFF]` ditampilkan di header dengan warna kuning hangat (`var(--color-warning-*)`).

### Case 4: Keterangan Operasional Lain yang Mengandung Substring Terkait
- **Data Input SSOT:**  
  `OFFICER TRANSJAKARTA`, `GANTI MOTOR WIPER`, `TOA HILANG`, `FOTO KACA SPION`
- **Hasil:**  
  Baik `isUnitTo()` maupun `isUnitOff()` mengabaikan teks tersebut sehingga tidak ada badge keliru yang muncul.

---

## 4. Hasil Verifikasi Quality Gates

1. **Uji Kontrak Warna Semantik:**  
   `pnpm vitest run src/styles/tokens/color-contract.test.ts` ➔ **114 passed (100%)**
2. **Uji Seluruh Unit Test Repositori:**  
   `pnpm vitest run src/` ➔ **126 test files, 1097 tests passed (100%)**
3. **TypeScript Strict Typecheck & Vite Production Build:**  
   `pnpm run build` ➔ **0 error, build sukses**
