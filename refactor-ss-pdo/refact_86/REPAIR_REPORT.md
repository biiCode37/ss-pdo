# Laporan Perbaikan Refactor Batch 2.1 Revisi (Refact 86)

**Status:** `READY_FOR_REVIEW`  
**Branch:** `devmode`  
**Git Baseline Commit:** `1fb52a63db24788af7f87a0a6a02e708f8928e20`  
**Siklus:** Fase 2 — Batch 2.1 Revisi (Penguatan Asersi Nol, Pembersihan Literal UI, & Koreksi Pemetaan ID)

---

## 1. Ringkasan Eksekutif Perbaikan

Berdasarkan tinjauan Codex pada `refact_85`, paket revisi ini menuntaskan tiga temuan:
1. **Penguatan Asersi Nol pada Uji Ritase (R85-01):**
   - Mengganti asersi substring luas `expect(container.textContent).toContain("0 Rit")` dengan pembacaan kartu terisolasi via `getMetricCardValue(container, TOTAL_RITASE_PP)`.
   - Menguji secara eksak `expect(cardVal).toBe("0 Rit")` dan `expect(cardVal).not.toBe("50 Rit")`.
   - Memastikan hasil salah `50 Rit` tidak lagi dapat lolos uji secara tidak sengaja.
2. **Pembersihan Sisa Literal UI pada File Target (R85-02):**
   - Menambahkan 3 konstanta baru pada `TEXT_ALERTS.BUS_INPUT_MODAL` (`LABEL_PREVIOUS_DAY`, `LABEL_TRIP_PERGI`, `LABEL_TRIP_PULANG`).
   - Menambahkan 5 konstanta baru pada `TEXT_MONITORING.ROUTE_DETAIL_MODAL` (`DEFAULT_OPERATOR`, `ACTIONS.BTN_CLOSE_TITLE`, serta compound units: `UNIT_RIT_PER_BUS`, `UNIT_PAX_PER_BUS`, `UNIT_PAX_PER_KM`).
   - Memigrasikan seluruh pemanggilan fallback dan unit pada `useBusInputForm.ts` dan `MonitoringRouteDetailModal.tsx`.
   - Melengkapi uji integritas pada `texts.test.ts`.
3. **Koreksi Pemetaan ID Temuan Historis (R85-03):**
   - Memperbaiki pemetaan ID audit:
     - **R79-05:** Fallback total ritase PP (`route.totalTrips / 2` tanpa `Math.round`).
     - **R79-06:** Label error validasi form bus.
     - **R83-01:** Sembilan pemanggil validasi yang sempat terlewat di Fase 1.
     - **R83-02:** Presisi tiga cabang ritase per bus tanpa `.toFixed(1)`.
   - Seluruh temuan berstatus **RESOLVED**.

---

## 2. Implementasi & Before vs After

### Perbaikan A: Penguatan Asersi Nol di `MonitoringRouteDetailModal.test.tsx` (R85-01)

#### Before:
```tsx
      const routeWith0Trips: RegionalRouteItem = {
        ...mockRoute,
        totalTrips: 0,
        totalRitasePp: undefined,
      };
      await act(async () => { root.render(...); });
      expect(container.textContent).toContain("0 Rit"); // Kelemahan: "50 Rit" juga mengandung "0 Rit"

      const routeWithExplicitZero: RegionalRouteItem = {
        ...mockRoute,
        totalTrips: 100,
        totalRitasePp: 0,
      };
      await act(async () => { root.render(...); });
      expect(container.textContent).toContain("0 Rit"); // Kelemahan: "50 Rit" juga lolos
```

#### After:
```tsx
      function getMetricCardValue(container: HTMLElement, labelText: string): string | undefined {
        const allDivs = Array.from(container.querySelectorAll("div"));
        const labelDiv = allDivs.find((el) => el.textContent?.trim() === labelText);
        if (!labelDiv || !labelDiv.parentElement) return undefined;
        const valueDiv = labelDiv.nextElementSibling || labelDiv.parentElement.children[1];
        return valueDiv?.textContent?.trim().replace(/\s+/g, " ");
      }

      // Skenario fallback 0 trips:
      const zeroCardVal = getMetricCardValue(
        container,
        TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.TOTAL_RITASE_PP
      );
      expect(zeroCardVal).toBe("0 Rit");
      expect(zeroCardVal).not.toBe("50 Rit");

      // Skenario explicit totalRitasePp = 0:
      const explicitZeroCardVal = getMetricCardValue(
        container,
        TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.TOTAL_RITASE_PP
      );
      expect(explicitZeroCardVal).toBe("0 Rit");
      expect(explicitZeroCardVal).not.toBe("50 Rit");
```

---

### Perbaikan B: Pembersihan Literal UI di `useBusInputForm.ts` (R85-02)

#### Before:
```ts
// Baris 653, 684, 733, 755
previousDayDateLabel || "Kemarin"

// Baris 707 & 712
headerMap?.tripPergiLabel || "Trip Pergi"
headerMap?.tripPulangLabel || "Trip Pulang"

// Baris 969
previousDayDateLabel: previousDayDateLabel || "Kemarin"
```

#### After:
```ts
// Baris 653, 684, 733, 755
previousDayDateLabel || TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_PREVIOUS_DAY

// Baris 707 & 712
headerMap?.tripPergiLabel || TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TRIP_PERGI
headerMap?.tripPulangLabel || TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TRIP_PULANG

// Baris 969
previousDayDateLabel: previousDayDateLabel || TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_PREVIOUS_DAY
```

---

### Perbaikan C: Pembersihan Literal UI & Compound Units di `MonitoringRouteDetailModal.tsx` (R85-02)

#### Before:
```tsx
// Baris 193
{TEXT_MONITORING.ROUTE_DETAIL_MODAL.SUBTITLE(
  route.routeName || route.operatorName || "Mikrotrans",
  route.supervisorName
)}

// Baris 293
<button type="button" onClick={onClose} title="Tutup Modal">

// Baris 510
{paxPerKm} <span style={{ fontSize: "11px" }}>Org/KM</span>

// Baris 719 & 735
{ritasePerBus} <span style={{ fontSize: "11px" }}>{tMetrics.UNIT_RIT}/Bus</span>
{paxPerBus} <span style={{ fontSize: "11px" }}>{tMetrics.UNIT_PAX}/Bus</span>
```

#### After:
```tsx
// Baris 193
{TEXT_MONITORING.ROUTE_DETAIL_MODAL.SUBTITLE(
  route.routeName ||
    route.operatorName ||
    TEXT_MONITORING.ROUTE_DETAIL_MODAL.DEFAULT_OPERATOR,
  route.supervisorName
)}

// Baris 293
<button type="button" onClick={onClose} title={TEXT_MONITORING.ROUTE_DETAIL_MODAL.ACTIONS.BTN_CLOSE_TITLE}>

// Baris 510
{paxPerKm} <span style={{ fontSize: "11px" }}>{tMetrics.UNIT_PAX_PER_KM}</span>

// Baris 719 & 735
{ritasePerBus} <span style={{ fontSize: "11px" }}>{tMetrics.UNIT_RIT_PER_BUS}</span>
{paxPerBus} <span style={{ fontSize: "11px" }}>{tMetrics.UNIT_PAX_PER_BUS}</span>
```

---

## 3. Case: Skenario Lapangan

### Case 1: Pencegahan Regresi Fallback 0 Ritase vs 50 Ritase (R85-01)
- **Skenario Lapangan:** Suatu rute baru berstatus draft memiliki `totalTrips: 100` di lembar kerja kotor, tetapi pengawas wilayah menetapkan `totalRitasePp = 0` karena rute belum resmi beroperasi (semua trip adalah uji coba lintasan tanpa penumpang).
- **Sebelum Perbaikan:** Asersi pengujian `toContain("0 Rit")` memeriksa string global container modal. Jika sistem salah mengambil fallback trip ($100 / 2 = 50$), UI menampilkan `"50 Rit"`. Substring `"0 Rit"` ada di dalam `"50 Rit"`, sehingga tes lama tetap lulus semu (false positive).
- **Sesudah Perbaikan:** Helper `getMetricCardValue` membaca kartu `TOTAL_RITASE_PP` secara spesifik. Nilai kartu harus persis `"0 Rit"`. Jika bernilai `"50 Rit"`, pengujian langsung gagal dengan jelas (`expected "50 Rit" to be "0 Rit"`).

### Case 2: Konsistensi Fallback Tanggal H-1 pada Form Input Bus (R85-02)
- **Skenario Lapangan:** Saat petugas lapangan menginput data bus pagi hari dan tanggal acuan H-1 belum tersedia dari server, pesan validasi cross-day menampilkan keterangan acuan kemarin.
- **Sebelum Perbaikan:** Pesan validasi bergantung pada string literal `"Kemarin"` yang di-hardcode di dalam hook.
- **Sesudah Perbaikan:** Pesan validasi menggunakan `TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_PREVIOUS_DAY`, menjamin keselarasan dengan teks acuan tombol prefill di UI (`Acuan KM (Kemarin): ...`).

### Case 3: Standardisasi Unit Komparasi Produktivitas Armada (R85-02)
- **Skenario Lapangan:** Pengawas wilayah meninjau tab Produktivitas & Rit pada modal monitoring untuk mengevaluasi ritase rata-rata per bus dan pelanggan per bus.
- **Sebelum Perbaikan:** Unit ditampilkan dengan menggabungkan token kata dasar dan literal: `{tMetrics.UNIT_RIT}/Bus` dan `{tMetrics.UNIT_PAX}/Bus`.
- **Sesudah Perbaikan:** Menggunakan token kamus sentral utuh `UNIT_RIT_PER_BUS` (`Rit/Bus`), `UNIT_PAX_PER_BUS` (`Org/Bus`), dan `UNIT_PAX_PER_KM` (`Org/KM`), mencegah variasi format spasi atau tanda miring.

---

## 4. Verifikasi & Quality Gates

| Gate | Perintah | Target Baseline | Hasil Aktual | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Target Tests** | `pnpm vitest run src/constants/texts/texts.test.ts src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx src/components/busCard/modal/useBusInputForm.test.tsx` | - | **3 file / 40 tests pass (0 fail)** | **PASSED** |
| **Unit Test Suite** | `pnpm run test --dir src` | 74 file / 524 tests | **74 file / 531 tests pass (0 fail)** | **PASSED** |
| **ESLint** | `pnpm run lint` | Max 72 warnings, 0 errors | **72 warnings, 0 errors** (0 warning baru) | **PASSED** |
| **TypeScript & Build** | `pnpm run build` | Exit Code 0 | **Exit Code 0** (`tsc -b && vite build`) | **PASSED** |
| **Knowledge Graph** | `graphify update .` | AST sync & rebuild | **Rebuilt: 4615 nodes, 5823 edges** | **PASSED** |

Bukti log eksekusi terminal tersimpan pada:
- `refactor-ss-pdo/refact_86/evidence/test-suite.txt`
- `refactor-ss-pdo/refact_86/evidence/lint.txt`
- `refactor-ss-pdo/refact_86/evidence/build.txt`

---

## 5. Daftar File yang Diubah

1. `src/constants/texts/text_alerts.ts`: Penambahan `LABEL_PREVIOUS_DAY`, `LABEL_TRIP_PERGI`, `LABEL_TRIP_PULANG`.
2. `src/constants/texts/text_monitoring.ts`: Penambahan `DEFAULT_OPERATOR`, `BTN_CLOSE_TITLE`, `UNIT_RIT_PER_BUS`, `UNIT_PAX_PER_BUS`, `UNIT_PAX_PER_KM`.
3. `src/constants/texts/texts.test.ts`: Uji integritas seluruh token kamus baru.
4. `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`: Migrasi seluruh literal UI (`DEFAULT_OPERATOR`, `BTN_CLOSE_TITLE`, compound units) dan mempertahankan perhitungan domain ritase murni.
5. `src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx`: Penguatan asersi nilai tepat kartu via `getMetricCardValue` untuk membedakan 0 dari 50.
6. `src/components/busCard/modal/useBusInputForm.ts`: Migrasi seluruh fallback literal UI ke konstanta kamus teks.
7. `src/components/busCard/modal/useBusInputForm.test.tsx`: Uji verifikasi label kamus pada pesan error form bus.
8. `graphify-out/`: Regenerasi Knowledge Graph via `graphify update .`.
9. `refactor-ss-pdo/refact_86/`: Dokumentasi audit `AUDIT_BUGS.md`, `REPAIR_REPORT.md`, dan `evidence/`.
