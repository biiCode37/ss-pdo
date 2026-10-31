# REPAIR REPORT — Refactor 176: Sinkronisasi Status Badge [OFF] & [T.O] pada Halaman Armada

**Tanggal:** 31 Oktober 2026  
**Branch:** `devmode`  
**Quality Gates:** Vitest 126 file (1100 unit tests) lulus 100%, Color Contract 114 tests lulus 100%, TypeScript build 0 error.

---

## 1. Implementasi Perbaikan

### A. Ekstraksi Data Keterangan & Raw Bus (`src/utils/unitAnalytics.ts`)
- Memperluas interface `UnitSummaryItem` dengan properti `keterangan?: string;` dan `rawBus?: BusData;`.
- Pada fungsi `extractUnitList`, menyertakan field `keterangan: b.keterangan || (metrics.notes.length > 0 ? metrics.notes[0] : '')` dan `rawBus: b` agar komponen presentasional `UnitCard` memiliki akses penuh terhadap catatan operasional unit.

### B. Komponen Kartu Armada (`src/components/UnitCard.tsx`)
1. **Pemeriksaan Status Non-SGO di `renderStatusBadge`:**
   - Memanfaatkan utilitas domain `isUnitOff(note)` dan `isUnitTo(note)` dari `@/utils/keteranganUtils`.
   - Jika unit terdeteksi `OFF`, kembalikan badge semantik identik dengan Input SS:
     ```tsx
     <span
       className="unit-status-badge unit-status-badge-off"
       title={TEXT_DASHBOARD.BUS_CARD_ACTIONS.UNIT_STATUS_TOOLTIP(note)}
     >
       OFF
     </span>
     ```
   - Jika unit terdeteksi `T.O` / `TO EVDAL`, kembalikan badge semantik identik dengan Input SS:
     ```tsx
     <span
       className="unit-status-badge unit-status-badge-to"
       title={TEXT_DASHBOARD.BUS_CARD_ACTIONS.UNIT_STATUS_TOOLTIP(note)}
     >
       T.O
     </span>
     ```
   - Jika tidak ada status `OFF` atau `T.O`, badge beroperasi normal sesuai progres shift (`FULL_COMPLETE`, `SHIFT_1_ONLY`, `SHIFT_2_ONLY`, `INCOMPLETE`, atau `EMPTY` / "Belum Terisi").
2. **Penyelarasan Surface Styling Non-SGO:**
   - Menambahkan kelas CSS `.bus-card-non-sgo` pada kartu `UnitCard` jika unit berstatus `OFF` atau `T.O`, sehingga tampilan visual kartu selaras 100% antara halaman "Input SS" dan halaman "Armada".
3. **Penyelarasan Strip Catatan Bawah:**
   - Memastikan catatan murni `OFF` atau `T.O` disupresi dari strip bawah kartu menggunakan `hasMeaningfulNote(noteText)`, mencegah duplikasi ikon peringatan.

---

## 2. Before vs After

| Aspek | Sebelum Refactor 176 | Sesudah Refactor 176 |
|---|---|---|
| **Badge Unit OFF di Halaman Armada** | `[✖ Belum Terisi]` (abu-abu pudar) | **`[OFF]`** warna kuning (`.unit-status-badge-off`) identik dengan halaman Input SS |
| **Badge Unit T.O di Halaman Armada** | `[✖ Belum Terisi]` (abu-abu pudar) | **`[T.O]`** warna merah (`.unit-status-badge-to`) identik dengan halaman Input SS |
| **Styling Kartu Armada OFF / T.O** | Kartu standar | Kartu beraksen muted terstandar `.bus-card-non-sgo` |
| **Unit Kosong Normal (Tanpa Catatan)** | `[✖ Belum Terisi]` | Tetap `[✖ Belum Terisi]` |

---

## 3. Case: Skenario Lapangan

### Case 1: Unit KWK 222161, 222162, 222163 (Sesuai Gambar Tangkapan Layar Pengguna)
- **Data Input SSOT:**  
  Unit: `KWK 222161`, `KWK 222162`, `KWK 222163`  
  Keterangan: `OFF`
- **Kondisi Sebelum:**  
  - Pada halaman "Input SS": Muncul badge `[OFF]` kuning.
  - Pada halaman "Armada": Muncul badge `[✖ Belum Terisi]`.
- **Kondisi Sesudah:**  
  Kedua halaman kini 100% konsisten. Halaman "Armada" menampilkan badge `[OFF]` kuning (`.unit-status-badge-off`) dan mengeliminasi badge "Belum Terisi".

### Case 2: Unit Berstatus T.O / TO EVDAL
- **Data Input SSOT:**  
  Unit: `KWK 222170`, Keterangan: `T.O EVDAL` (atau `TO`, `T.O`, `TO EVDAL`)
- **Hasil di Halaman Armada:**  
  Muncul badge `[T.O]` merah (`.unit-status-badge-to`).

### Case 3: Unit Kosong Normal Tanpa Catatan (Belum Diinput)
- **Data Input SSOT:**  
  Unit: `KWK 222160`, Keterangan: `""` (kosong), Ritase: `""`
- **Hasil di Halaman Armada:**  
  Tetap menampilkan badge `[✖ Belum Terisi]` sebagai pengingat bagi petugas bahwa data unit ini belum dimasukkan.

---

## 4. Hasil Verifikasi Quality Gates

1. **Uji Kontrak Warna Semantik:**  
   `pnpm vitest run src/styles/tokens/color-contract.test.ts` ➔ **114 passed (100%)**
2. **Uji Unit Test Repositori:**  
   `pnpm vitest run src/` ➔ **126 test files, 1100 tests passed (100%)**
3. **TypeScript Strict Typecheck & Vite Production Build:**  
   `pnpm run build` ➔ **0 error, build sukses**
