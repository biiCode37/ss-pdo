# REPAIR REPORT — Refactor 178: Relokasi Badge Status [OFF] dan [T.O] ke Sisi Paling Kanan Header Kartu Bus

**Tanggal:** 31 Oktober 2026  
**Basis Repositori:** branch `devmode`  
**Terkait Audit:** `refactor-ss-pdo/refact_178/AUDIT_BUGS.md`  

---

## 1. Ringkasan Implementasi

Perbaikan ini memindahkan penempatan elemen badge status non-operasional (`[OFF]` kuning dan `[T.O]` merah) pada kartu unit armada (`BusCard.tsx`) ke sisi paling kanan dari baris header kartu (`bus-card-header`).

### File yang Dimodifikasi:
1. `src/components/busCard/BusCard.tsx`
   - Memindahkan blok kondisional rendering `isNonSgo && (...)` dari container kiri (di samping `bus.unit`) ke container kanan (sejajar dengan `BusCardSummary` dan `isLoading`).
   - Sisi kiri kini murni memuat identitas armada (`bus.unit`) dan indikator status antrean offline/pending.
   - Sisi kanan kini menampung ringkasan kolom fokus dan badge status operasional `[OFF]` / `[T.O]`.
2. `src/components/busCard/BusCard.test.tsx`
   - Menambahkan pengujian integrasi DOM: `places OFF and T.O badges on the right side of the card header` yang secara eksplisit memverifikasi bahwa badge `[OFF]` berada di container kanan (`headerChildren[1]`) dan container kiri (`headerChildren[0]`) bersih dari badge tersebut.

---

## 2. Before vs After Perbandingan Struktur & Visual

### Before (Sebelum Perbaikan):
```tsx
// BusCard.tsx
<div className="bus-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
  {/* Sisi Kiri: Menumpuk nomor unit + badge OFF/T.O */}
  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
    <span className="bus-card-unit" style={{ fontWeight: 800, fontSize: "16px" }}>{bus.unit}</span>
    {isNonSgo && (
      isUnitOff(activeShiftStatus) ? (
        <span className="unit-status-badge unit-status-badge-off">OFF</span>
      ) : isUnitTo(activeShiftStatus) ? (
        <span className="unit-status-badge unit-status-badge-to">T.O</span>
      ) : null
    )}
    ...
  </div>

  {/* Sisi Kanan: Kosong pada mode ALL / unit OFF */}
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    {activeCategory !== "ALL" && <BusCardSummary ... />}
    {isLoading && <Loader2 ... />}
  </div>
</div>
```
**Tampilan Layar:**
- Mode `Semua Kolom`: `[KWK 222161] [OFF]` menempel di kiri atas, sisi kanan atas kosong.
- Mode `Fokus Kolom`: Unit `SGO` menampilkan info di kanan (`[KM Awal S1: Kosong]`), sedangkan unit `OFF` menampilkan `[KWK 222161] [OFF]` di kiri dan kanannya kosong (asimetris).

### After (Setelah Perbaikan):
```tsx
// BusCard.tsx
<div className="bus-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
  {/* Sisi Kiri: Murni identitas unit */}
  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
    <span className="bus-card-unit" style={{ fontWeight: 800, fontSize: "16px" }}>{bus.unit}</span>
    {(saveStatus === "queued" || isQueued) && (
      <span className="bus-card-status status-queued">{TEXT_DASHBOARD.BUS_CARD_ACTIONS.WAITING_SIGNAL}</span>
    )}
  </div>

  {/* Sisi Kanan: Status operasional & metrik */}
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    {activeCategory !== "ALL" && <BusCardSummary ... />}
    {isNonSgo && (
      isUnitOff(activeShiftStatus) ? (
        <span className="unit-status-badge unit-status-badge-off">OFF</span>
      ) : isUnitTo(activeShiftStatus) ? (
        <span className="unit-status-badge unit-status-badge-to">T.O</span>
      ) : null
    )}
    {isLoading && <Loader2 ... />}
  </div>
</div>
```
**Tampilan Layar:**
- Seluruh kartu bus di aplikasi (baik di halaman Input SS maupun halaman Armada) kini memiliki tata letak simetris:
  - **Sisi Kiri:** Identitas Unit (`KWK 222161`)
  - **Sisi Paling Kanan:** Status Operasional (`[OFF]` / `[T.O]`) atau Metrik Kolom

---

## 3. Case: Skenario Lapangan

### Skenario 1: Mode Semua Kolom (Default Input SS)
- **Tampilan:** Nomor bodi unit berada di kiri (`KWK 222180`), dan badge status `[T.O]` merah berada rapi di sisi kanan atas kartu.
- **Dampak:** Kartu terlihat proporsional, lapang, dan langsung menarik perhatian pengawas ke status unit di pojok kanan kartu.

### Skenario 2: Mode Fokus Kolom (KM Awal S1)
- **Tampilan:**
  - Unit `KWK 222166` (Operasional): Menampilkan nomor unit di kiri dan `[⚠ KM Awal S1: Kosong]` di kanan.
  - Unit `KWK 222159` (OFF): Menampilkan nomor unit di kiri dan `[OFF]` di kanan.
  - Unit `KWK 222180` (T.O): Menampilkan nomor unit di kiri dan `[T.O]` di kanan.
- **Dampak:** Tidak ada lagi efek visual "ompong" atau berat sebelah. Seluruh kartu unit memiliki perataan kanan (*right-aligned badge status*) yang seragam dan elegan.

---

## 4. Hasil Verifikasi Kualitas (Quality Gates)

1. **Uji Kontrak Warna Semantik:**
   `pnpm vitest run src/styles/tokens/color-contract.test.ts`
   ➔ 114 tests passed (100%).
2. **Uji Unit BusCard (termasuk verifikasi posisi sisi kanan):**
   `pnpm vitest run src/components/busCard/BusCard.test.tsx`
   ➔ 15 tests passed (100%).
3. **Uji Regresi Keseluruhan Repositori:**
   `pnpm vitest run src/`
   ➔ 131 test files, 1135 tests passed (100%).
4. **Strict TypeScript & Vite Build:**
   `pnpm run build`
   ➔ `tsc -b && vite build` sukses 0 error.
