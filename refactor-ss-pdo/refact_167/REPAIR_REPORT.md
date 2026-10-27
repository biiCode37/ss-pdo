# Laporan Perbaikan: Refactor 167

## Implementasi & Penyelarasan Status Armada Shift 2

Perbaikan difokuskan pada `src/services/regionalIngestionService.ts` untuk memastikan:
1. Unit yang beroperasi (`isOperating === true`) dihitung aktif pada kedua shift (`activeBusesS1++`, `activeBusesS2++`).
2. Unit beroperasi tanpa catatan adalah armada SGO normal dan **TIDAK dimasukkan ke `nonSgoUnitsS1` maupun `nonSgoUnitsS2`**.
3. Unit beroperasi dengan catatan di kolom Keterangan dimasukkan dengan status `{ isOff: false, isOperatingWithNote: true, note: rawNote }` dan tampil di `*Catatan Khusus Unit (Beroperasi):*`.
4. HANYA unit yang benar-benar tidak beroperasi (`totalTrip === 0` dan tanpa aktivitas) yang dimasukkan ke `nonSgoUnits` sebagai tidak beroperasi (baik `*Rincian Tidak Ops:*` maupun `*Unit Libur (OFF)*`).

---

## Before vs After

### Before (`src/services/regionalIngestionService.ts`)
```typescript
const isOperating = totalTrip > 0;

const hasExplicitS1Data = km1 > 0 || toaS1 > 0 || manS1 > 0;
const hasExplicitS2Data = km2 > 0 || toaS2 > 0 || manS2 > 0;

// Bug: Jika toaS2 masih 0, hasActivityS2 menjadi false!
const hasActivityS1 = isOperating && (hasExplicitS1Data || !hasExplicitS2Data);
const hasActivityS2 = isOperating && (hasExplicitS2Data || (!hasExplicitS1Data && !hasExplicitS2Data));

if (hasActivityS2) {
  activeBusesS2++;
  ...
} else {
  // Masuk ke sini dan mencap unit sebagai OFF padahal unit jalan 14 trip!
  nonSgoUnitsS2.push({
    unit: bus.unit,
    note: hasExplicitNote ? rawNote : 'OFF',
    isOff: isExplicitOff,
    isOperatingWithNote: false,
  });
}
```

### After (`src/services/regionalIngestionService.ts`)
```typescript
const rawNote = (bus.keterangan || '').trim();
const ketUpper = rawNote.toUpperCase();
const hasExplicitNote = rawNote.length > 0 && rawNote !== '-' && rawNote !== '0';
const isExplicitOff = /(^|[^A-Z])(OFF|LIBUR|SPARE|CADANGAN)([^A-Z]|$)/.test(ketUpper);

// ponytail: Penentu mutlak status operasi bus adalah akumulasi kolom trip fisik 1 hari (tripPergi + tripPulang).
// Jika totalTrip > 0 (atau ada pergerakan KM/penumpang), unit BEROPERASI.
// Dilarang keras mencap unit beroperasi sebagai 'OFF' hanya karena input Shift 2 belum masuk.
const isOperating = totalTrip > 0 || km1 > 0 || km2 > 0 || toaS1 > 0 || toaS2 > 0 || manS1 > 0 || manS2 > 0;

if (isOperating) {
  activeBusesS1++;
  activeBusesS2++;

  // Catat jika unit beroperasi namun memiliki keterangan khusus di spreadsheet
  if (hasExplicitNote) {
    const operatingItem: FleetUnitStatusDetail = {
      unit: bus.unit,
      note: rawNote,
      isOff: false,
      isOperatingWithNote: true,
    };
    nonSgoUnitsS1.push(operatingItem);
    nonSgoUnitsS2.push(operatingItem);
  }
} else {
  // Unit tidak beroperasi: jika eksplisit OFF/LIBUR atau tidak ada keterangan -> isOff: true (Unit Libur)
  // Jika memiliki catatan kendala/alasan lain -> isOff: false (Rincian Tidak Ops)
  const isOffStatus = isExplicitOff || !hasExplicitNote;
  const nonOperatingItem: FleetUnitStatusDetail = {
    unit: bus.unit,
    note: hasExplicitNote ? rawNote : 'OFF',
    isOff: isOffStatus,
    isOperatingWithNote: false,
  };

  nonSgoUnitsS1.push(nonOperatingItem);
  nonSgoUnitsS2.push(nonOperatingItem);
}
```

---

## Case: Skenario Lapangan

### Skenario 1: Rute Beroperasi Penuh di Mana Input Shift 2 Masih Kosong (Kasus JAK.115)
- **Kondisi Spreadsheet**: 30 bus memiliki `tripPergi: '7'`, `tripPulang: '7'`, `TOA Shift 1: ~100`, `TOA Shift 2: 0`, `keterangan: ''`.
- **Hasil Klasifikasi**:
  - `totalTrip = 14 > 0` ➔ `isOperating = true`.
  - `activeBusesS1 = 30`, `activeBusesS2 = 30`.
  - `realopsShift1 = 30`, `realopsShift2 = 30`.
  - `nonSgoUnitsS1 = []`, `nonSgoUnitsS2 = []`.
  - **Hasil Laporan Shift 2**: Target SGO 30, Realisasi Ops 30, Tidak Ops 0, Status LENGKAP ✅, dan **TIDAK ADA DAFTAR 30 UNIT OFF DI BAWAHNYA**.

### Skenario 2: Rute Beroperasi Penuh dengan Beberapa Catatan Teknis (Kasus JAK.76)
- **Kondisi Spreadsheet**: 44 bus memiliki trip 12–16. Ada 1 unit dengan catatan `BA02 PRAMUDI SAKIT PERUT`.
- **Hasil Klasifikasi**:
  - Seluruh 44 bus terhitung beroperasi (`activeBusesS1 = 44`, `activeBusesS2 = 44`).
  - Unit dengan catatan masuk ke `*Catatan Khusus Unit (Beroperasi):*`.
  - Realisasi Ops Shift 2 tetap 44 Unit (bukan lagi 1 unit), dan 43 bus lainnya tidak lagi dicap OFF!

---

## Status Quality Gates
1. `pnpm vitest run src/`: 120 test files passed (872 tests passed, 0 failures).
2. `pnpm run build`: `tsc -b && vite build` sukses 0 errors.
3. `graphify update .`: Terbarukan.
