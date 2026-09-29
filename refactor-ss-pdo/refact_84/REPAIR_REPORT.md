# Laporan Perbaikan Refactor Batch 2.1 (Refact 84)

**Status:** `READY_FOR_REVIEW`  
**Branch:** `devmode`  
**Git Baseline Commit:** `1fb52a63db24788af7f87a0a6a02e708f8928e20`  
**Siklus:** Fase 2 — Batch 2.1 (Akurasi Tampilan Ritase & Kamus Label Validasi)

---

## 1. Ringkasan Eksekutif Perbaikan

Batch 2.1 menuntaskan dua jalur kritis yang langsung berdampak pada akurasi tampilan operasional dan standardisasi pesan validasi pengguna:
1. **Akurasi Fallback Total Ritase PP (`MonitoringRouteDetailModal.tsx`):**
   - Menghilangkan pembulatan sepihak `Math.round(totalTrips / 2)`.
   - Menggunakan kalkulasi presisi domain murni `route.totalTrips / 2` tanpa pemotongan desimal.
   - Mempertahankan prioritas nilai eksplisit `route.totalRitasePp !== undefined` (termasuk nilai `0`).
2. **Presisi Metrik Ritase per Bus (`MonitoringRouteDetailModal.tsx`):**
   - Menghilangkan `.toFixed(1)` pada seluruh 3 cabang kalkulasi ritase per bus (`route.ritasePerBus`, `route.tripsPerBus / 2`, dan `totalRitasePp / realops`).
   - Nilai presisi seperti `5.05` dapat tampil murni dan utuh tanpa distorsi.
3. **Sentralisasi Kamus Label Validasi Form Bus (`text_alerts.ts` & `useBusInputForm.ts`):**
   - Menambahkan konstanta `LABEL_SHIFT_1: 'Shift 1'`, `LABEL_SHIFT_2: 'Shift 2'`, dan `LABEL_TOA_S2: 'TOA Shift 2'` pada `TEXT_ALERTS.BUS_INPUT_MODAL`.
   - Mengganti seluruh 9 call-site literal UI `"Shift 1"`, `"Shift 2"`, dan `"TOA Shift 2"` pada fungsi validator form bus dengan referensi kamus teks sentral.
   - Melengkapi pengujian integritas kamus pada `texts.test.ts` dan pengujian kemunculan label pada pesan error validasi form bus pada `useBusInputForm.test.tsx`.

---

## 2. Implementasi & Before vs After

### Perbaikan A: Fallback Total Ritase PP & Presisi Ritase per Bus
- **File:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`

#### Before:
```tsx
  const totalRitasePp = route.totalRitasePp !== undefined
    ? route.totalRitasePp
    : route.totalTrips
    ? Math.round(route.totalTrips / 2)
    : 0;
  const kmBaku = route.kmBaku || 0;
  const ritasePerBus = route.ritasePerBus !== undefined
    ? Number(route.ritasePerBus).toFixed(1)
    : route.tripsPerBus !== undefined
    ? Number((route.tripsPerBus / 2).toFixed(1))
    : realops > 0
    ? (totalRitasePp / realops).toFixed(1)
    : 0;
```

#### After:
```tsx
  const totalRitasePp = route.totalRitasePp !== undefined
    ? route.totalRitasePp
    : route.totalTrips
    ? route.totalTrips / 2
    : 0;
  const kmBaku = route.kmBaku || 0;
  const ritasePerBus = route.ritasePerBus !== undefined
    ? route.ritasePerBus
    : route.tripsPerBus !== undefined
    ? route.tripsPerBus / 2
    : realops > 0
    ? totalRitasePp / realops
    : 0;
```

---

### Perbaikan B: Penambahan Kamus Teks Sentral
- **File:** `src/constants/texts/text_alerts.ts`

#### Before:
```ts
  BUS_INPUT_MODAL: {
    SAVE_BTN: 'Simpan',
    CANCEL_BTN: 'Batal',
    LABEL_TOA_S1: 'TOA Shift 1',
    LABEL_TOTAL_TOA: 'Total TOA',
    ...
```

#### After:
```ts
  BUS_INPUT_MODAL: {
    SAVE_BTN: 'Simpan',
    CANCEL_BTN: 'Batal',
    LABEL_SHIFT_1: 'Shift 1',
    LABEL_SHIFT_2: 'Shift 2',
    LABEL_TOA_S1: 'TOA Shift 1',
    LABEL_TOA_S2: 'TOA Shift 2',
    LABEL_TOTAL_TOA: 'Total TOA',
    ...
```

---

### Perbaikan C: Migrasi Call-Site Validator Form Bus
- **File:** `src/components/busCard/modal/useBusInputForm.ts`

#### Before:
```ts
// Baris 652 & 658
const errCrossDay = validateKmCrossDay(kmAwal1, previousDayKmAkhir2, "Shift 1", ...);
const err = validateKmPair(kmAwal1, kmAkhir1, "Shift 1");

// Baris 679 & 693
const errCrossDay = validateKmCrossDay(kmAwal2, previousDayKmAkhir2, "Shift 2", ...);
const err = validateKmPair(kmAwal2, kmAkhir2, "Shift 2");

// Baris 724 & 730
const errCrossDay1 = validateKmCrossDay(kmAwal1, previousDayKmAkhir2, "Shift 1", ...);
const errKmS1 = validateKmPair(kmAwal1, kmAkhir1, "Shift 1");

// Baris 742, 757, 767
const errCrossDay2 = validateKmCrossDay(kmAwal2, previousDayKmAkhir2, "Shift 2", ...);
const errToaS2 = validateToaValue(toaShift2, "TOA Shift 2");
const errKmS2 = validateKmPair(kmAwal2, kmAkhir2, "Shift 2");
```

#### After:
```ts
// Baris 652 & 658
const errCrossDay = validateKmCrossDay(kmAwal1, previousDayKmAkhir2, TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_1, ...);
const err = validateKmPair(kmAwal1, kmAkhir1, TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_1);

// Baris 679 & 693
const errCrossDay = validateKmCrossDay(kmAwal2, previousDayKmAkhir2, TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_2, ...);
const err = validateKmPair(kmAwal2, kmAkhir2, TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_2);

// Baris 724 & 730
const errCrossDay1 = validateKmCrossDay(kmAwal1, previousDayKmAkhir2, TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_1, ...);
const errKmS1 = validateKmPair(kmAwal1, kmAkhir1, TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_1);

// Baris 742, 757, 767
const errCrossDay2 = validateKmCrossDay(kmAwal2, previousDayKmAkhir2, TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_2, ...);
const errToaS2 = validateToaValue(toaShift2, TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S2);
const errKmS2 = validateKmPair(kmAwal2, kmAkhir2, TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_2);
```

---

## 3. Case: Skenario Lapangan

### Case 1: Operasional Rute dengan Jumlah Trip Ganjil (R79-05)
- **Skenario Lapangan:** Rute JAK.01 mencatatkan total 101 trip operasional dalam satu hari (misalnya karena 1 unit bus ditarik ke pool di tengah trip sebelum menyelesaikan putaran baliknya).
- **Sebelum Perbaikan:** Modal monitoring rute menghitung `Math.round(101 / 2) = 51 Rit`. Korlap dan pengawas melihat selisih 1 trip bayangan (51 rit PP seharusnya setara 102 trip).
- **Sesudah Perbaikan:** Modal menampilkan `50.5 Rit` secara presisi murni tanpa pembulatan artifisial, sesuai dengan rumus domain operasional: $\text{Total Ritase} = \frac{\text{Total Trip}}{2}$.

### Case 2: Perhitungan Produktivitas Armada Desimal Halus (R79-06 / R83-02)
- **Skenario Lapangan:** Rute dengan 10 unit bus realops mencatatkan 101 trip (50.5 ritase PP). Rata-rata ritase per bus dihitung $50.5 / 10 = 5.05$ rit/bus.
- **Sebelum Perbaikan:** Akibat `.toFixed(1)`, nilai ritase per bus terpotong menjadi `5.1 Rit/Bus`. Jika nilai eksplisit dari spreadsheet adalah `5.05`, nilai juga dipaksa menjadi `5.0 Rit/Bus`.
- **Sesudah Perbaikan:** Nilai `5.05 Rit/Bus` tampil utuh dan presisi tanpa terpotong desimalnya.

### Case 3: Prioritas Nilai Eksplisit 0 pada Total Ritase
- **Skenario Lapangan:** Rute baru dibuat atau mengalami kendala cuaca ekstrem sehingga total ritase dicatat eksplisit `0` oleh pengawas di sheet, namun ada data trip parsial `100` yang belum tervalidasi.
- **Sebelum & Sesudah Perbaikan:** Karena pengecekan menggunakan `route.totalRitasePp !== undefined`, nilai `0` eksplisit tetap diutamakan dan tidak jatuh ke fallback trip.

### Case 4: Pesan Validasi Form Input Bus Menggunakan Kamus Terpusat (R83-01)
- **Skenario Lapangan:** Petugas memasukkan KM Akhir Shift 1 lebih kecil dari KM Awal Shift 1, atau mengisi TOA Shift 2 lebih dari 999.
- **Perilaku:** Pesan kesalahan validasi yang muncul pada form modal input bus:
  - `"KM Akhir Shift 1 (199900) tidak boleh lebih kecil dari KM Awal (200000)!"`
  - `"Nilai TOA Shift 2 tidak boleh lebih dari 3 digit (maksimal 999)!"`
  Label `"Shift 1"`, `"Shift 2"`, dan `"TOA Shift 2"` kini 100% berasal dari kamus `TEXT_ALERTS.BUS_INPUT_MODAL`.

---

## 4. Verifikasi & Quality Gates

| Gate | Perintah | Target Baseline | Hasil Aktual | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Unit Test Suite** | `pnpm run test --dir src` | 74 file / 524 tests pass | **74 file / 531 tests pass (0 fail)** | **PASSED** |
| **Target Tests** | `pnpm vitest run src/constants/texts/texts.test.ts src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx src/components/busCard/modal/useBusInputForm.test.tsx` | - | **3 file / 40 tests pass (0 fail)** | **PASSED** |
| **ESLint** | `pnpm run lint` | Max 72 warnings, 0 errors | **72 warnings, 0 errors** (0 warning baru) | **PASSED** |
| **TypeScript & Build** | `pnpm run build` | Exit Code 0 (`tsc -b && vite build`) | **Exit Code 0** | **PASSED** |
| **Knowledge Graph** | `graphify update .` | AST extraction & graph sync | **Rebuilt: 4569 nodes, 5782 edges** | **PASSED** |

Bukti keluaran terminal tersimpan pada folder `refactor-ss-pdo/refact_84/evidence/`:
- `refactor-ss-pdo/refact_84/evidence/test-suite.txt`
- `refactor-ss-pdo/refact_84/evidence/lint.txt`
- `refactor-ss-pdo/refact_84/evidence/build.txt`

---

## 5. Daftar File yang Diubah

1. `src/constants/texts/text_alerts.ts`: Penambahan `LABEL_SHIFT_1`, `LABEL_SHIFT_2`, `LABEL_TOA_S2` pada `BUS_INPUT_MODAL`.
2. `src/constants/texts/texts.test.ts`: Uji integritas kamus baru.
3. `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`: Normalisasi fallback `totalRitasePp` dan presisi murni `ritasePerBus`.
4. `src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx`: Penambahan 6 skenario uji perilaku ritase di tab Produktivitas.
5. `src/components/busCard/modal/useBusInputForm.ts`: Migrasi 9 call-site literal UI ke konstanta kamus teks.
6. `src/components/busCard/modal/useBusInputForm.test.tsx`: Penambahan pengujian verifikasi kemunculan label kamus pada pesan validasi.
7. File Knowledge Graph `graphify-out/`: Diperbarui oleh `graphify update .`.
8. Dokumentasi `refactor-ss-pdo/refact_84/`: `AUDIT_BUGS.md`, `REPAIR_REPORT.md`, dan folder `evidence/`.

---

## 6. Batasan yang Belum Diverifikasi & Catatan untuk Batch Selanjutnya

1. **`busModalPreConfirm.ts`:** Pemanggilan `validateKmPair` dan `validateToaValue` pada modul konfirmasi modal cepat masih menggunakan literal string. Sesuai instruksi batas batch, file ini tidak diubah pada Batch 2.1 dan dicatat untuk Batch berikutnya / Fase 4.
2. **Metrik Non-Ritase di Modal Monitoring:** Metrik penumpang per KM (`paxPerKm`), persentase pelanggan (`paxPercentage`), dan KM per bus (`kmPerBus`) tidak diubah dalam batch ini untuk menjaga isolasi perubahan.
