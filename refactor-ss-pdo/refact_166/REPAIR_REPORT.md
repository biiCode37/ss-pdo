# Laporan Perbaikan & Standarisasi Logika: Refactor 166

## Implementasi & Standarisasi Penentuan Status Armada

Sesuai arahan teknis pengguna dan audit integritas data SSOT:
1. **Dihapus**: Regex kata kunci kendala `isExplicitKendala` (`MOGOK`, `RUSAK`, `LAKA`, `BAP`, `SERVICE`, `PERBAIKAN`, dll).
2. **Dihapus**: Asumsi bahwa `tripPergi` adalah Shift 1 dan `tripPulang` adalah Shift 2.
3. **Diterapkan**: Penentu mutlak status operasi bus adalah total akumulasi kolom trip fisik 1 hari penuh:
   ```typescript
   const tripPergi = parseIndonesianNumber(bus.tripPergi);
   const tripPulang = parseIndonesianNumber(bus.tripPulang);
   const totalTrip = tripPergi + tripPulang;
   const isOperating = totalTrip > 0;
   ```

---

## Before vs After

### Before (`src/services/regionalIngestionService.ts`)
```typescript
const trip1 = parseIndonesianNumber(bus.tripPergi);
const trip2 = parseIndonesianNumber(bus.tripPulang);
const tripTotal = trip1 + trip2;

const isExplicitKendala = hasWord(
  /(^|[^A-Z])(MOGOK|RUSAK|LAKA|BAP|SERVICE|PERBAIKAN|TROUBLE|RADIATOR|BAN|BOCOR|DEREK|STUT|SO|TO|EVDAL)([^A-Z]|$)/
);

// Bug: trip1 dianggap Shift 1, trip2 dianggap Shift 2. Dan jika terdapat kata kunci kendala, unit didiskualifikasi dari operasi meski tripTotal > 0
const hasActivityS1 = (trip1 > 0 || (tripTotal > 0 && km1 > 0) || toaS1 > 0 || manS1 > 0) && !isExplicitOff && !isExplicitKendala;
const hasActivityS2 = (trip2 > 0 || (tripTotal > 0 && km2 > 0) || toaS2 > 0 || manS2 > 0) && !isExplicitOff && !isExplicitKendala;
```

### After (`src/services/regionalIngestionService.ts`)
```typescript
const tripPergi = parseIndonesianNumber(bus.tripPergi);
const tripPulang = parseIndonesianNumber(bus.tripPulang);
const totalTrip = tripPergi + tripPulang;
calcTrips += totalTrip;

const rawNote = (bus.keterangan || '').trim();
const ketUpper = rawNote.toUpperCase();
const hasExplicitNote = rawNote.length > 0 && rawNote !== '-' && rawNote !== '0';
const isExplicitOff = /(^|[^A-Z])(OFF|LIBUR|SPARE|CADANGAN)([^A-Z]|$)/.test(ketUpper) || !hasExplicitNote;

// ponytail: Penentu mutlak status operasi bus adalah akumulasi kolom trip fisik 1 hari (tripPergi + tripPulang).
// Jika totalTrip === 0 atau tidak ada nilai sama sekali, unit TIDAK BEROPERASI (1 hari full).
// Hapus ketergantungan regex kata kunci kendala (MOGOK/RUSAK/dll) karena teks keterangan korlap bebas dan dinamis.
const isOperating = totalTrip > 0;

const hasExplicitS1Data = km1 > 0 || toaS1 > 0 || manS1 > 0;
const hasExplicitS2Data = km2 > 0 || toaS2 > 0 || manS2 > 0;

const hasActivityS1 = isOperating && (hasExplicitS1Data || !hasExplicitS2Data);
const hasActivityS2 = isOperating && (hasExplicitS2Data || (!hasExplicitS1Data && !hasExplicitS2Data));

if (hasActivityS1) {
  activeBusesS1++;
  if (hasExplicitNote) {
    nonSgoUnitsS1.push({
      unit: bus.unit,
      note: rawNote,
      isOff: false,
      isOperatingWithNote: true,
    });
  }
} else {
  nonSgoUnitsS1.push({
    unit: bus.unit,
    note: hasExplicitNote ? rawNote : 'OFF',
    isOff: isExplicitOff,
    isOperatingWithNote: false,
  });
}
```

---

## Case: Skenario Lapangan

### Skenario 1: Bus Beroperasi Seharian dan Memiliki Catatan Teknis Lapangan
- **Kondisi Spreadsheet**: `tripPergi: '3'`, `tripPulang: '3'`, `keterangan: 'AC kurang dingin di siang hari'`.
- **Hasil Klasifikasi**:
  - `totalTrip = 6` ➔ `isOperating = true`.
  - Terhitung aktif pada realops (`activeBusesS1++`, `activeBusesS2++`).
  - Masuk ke `nonSgoUnits` dengan status `{ isOff: false, isOperatingWithNote: true, note: 'AC kurang dingin di siang hari' }`.
  - Tampil pada Laporan WhatsApp Format 3 di bawah subheader:
    **`*Catatan Khusus Unit (Beroperasi):*`**.
  - **Hasil**: Realops tidak berkurang, catatan operasional tetap terdokumentasi rapi.

### Skenario 2: Bus Tidak Beroperasi Sama Sekali dengan Catatan Kendala Bebas
- **Kondisi Spreadsheet**: `tripPergi: '0'`, `tripPulang: '0'`, `keterangan: 'Supir izin pulang kampung'`.
- **Hasil Klasifikasi**:
  - `totalTrip = 0` ➔ `isOperating = false`.
  - Tidak terhitung ke realops (`hasActivityS1 = false`, `hasActivityS2 = false`).
  - Karena ada teks alasan selain OFF/LIBUR: `{ isOff: false, isOperatingWithNote: false, note: 'Supir izin pulang kampung' }`.
  - Tampil pada Laporan WhatsApp Format 3 di bawah subheader:
    **`*Rincian Tidak Ops:*`**.
  - **Hasil**: Unit terdata di daftar tidak ops tanpa terpengaruh ada atau tidaknya kata kunci tertentu.

### Skenario 3: Bus Cadangan / Libur Murni
- **Kondisi Spreadsheet**: `tripPergi: '0'`, `tripPulang: '0'`, `keterangan: 'OFF'` (atau kosong/strip).
- **Hasil Klasifikasi**:
  - `totalTrip = 0` ➔ `isOperating = false`.
  - Karena `isExplicitOff = true`: `{ isOff: true, isOperatingWithNote: false, note: 'OFF' }`.
  - Tampil pada Laporan WhatsApp Format 3 di bawah subheader:
    `*Unit Libur (OFF) / Keterangan Khusus:*`.

---

## Status Quality Gates
1. `pnpm vitest run src/`: 120 test files passed (872 tests passed, 0 failures).
2. `pnpm run build`: `tsc -b && vite build` sukses 0 errors.
3. `graphify update .`: Terbarukan.
