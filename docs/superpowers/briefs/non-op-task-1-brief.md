# Task 1 Brief: Modul Utilitas Status Operasional (`operationalStatusUtils.ts`)

## Global Constraints
- Strictdevmode: Bekerja pada branch `devmode`.
- Golden Rule Ritase: Nilai/kolom ritase adalah penentu mutlak unit tidak beroperasi. Jika ritase = 0 atau kosong, unit tidak beroperasi.
- Pengecualian TO: Status "TO", "T.O", "TO EVDAL", "T.O EVDAL" BUKAN unit tidak beroperasi (jika ritasenya > 0). Namun jika ritasenya 0 atau kosong, unit tersebut tetap non-operasional karena ritasenya 0.
- Pembersihan Bersyarat: Hanya bersihkan keterangan jika isinya murni "OFF" atau "LIBUR". Selain nilai itu, JANGAN dibersihkan.
- TDD: Tulis test `src/utils/operationalStatusUtils.test.ts` terlebih dahulu.

## Files
- Create: `src/utils/operationalStatusUtils.ts`
- Test: `src/utils/operationalStatusUtils.test.ts`

## Requirements
Implementasikan tiga fungsi murni:
1. `isBusNonOperational(bus: { tripPergi?: string; tripPulang?: string; keterangan?: string }, plottingItem?: { target_ritase?: number; status?: string }): boolean`
   - Hitung total ritase dari bus:
     `const trip1 = parseIndonesianNumber(bus.tripPergi);`
     `const trip2 = parseIndonesianNumber(bus.tripPulang);`
     `const totalRitase = (trip1 + trip2) / 2;`
   - Jika `bus.tripPergi` atau `bus.tripPulang` memiliki nilai numerik dan `totalRitase > 0`, maka return `false` (unit beroperasi!).
   - Jika plottingItem ada dan `plottingItem.target_ritase !== undefined`:
     - Jika `plottingItem.target_ritase === 0` atau `plottingItem.status === 'OFF'`, maka return `true`.
     - Jika `plottingItem.target_ritase > 0` dan tidak ada trip sama sekali (belum input trip), cek apakah plotting target > 0.
   - Jika total trip/ritase pada bus adalah 0 atau kosong (tidak ada angka > 0): return `true`.

2. `getNonOperationalBannerType(bus: { tripPergi?: string; tripPulang?: string; keterangan?: string }, plottingItem?: { target_ritase?: number; status?: string }): 'NONE' | 'EMPTY_RITASE' | 'OFF_LIBUR'`
   - Jika `!isBusNonOperational(bus, plottingItem)` -> return `'NONE'`.
   - Cek `bus.keterangan`:
     - Jika `shouldClearKeteranganOnActivation(bus.keterangan)` bernilai `true` (murni "OFF" atau "LIBUR") -> return `'OFF_LIBUR'`.
     - Selain itu (keterangan kosong atau memuat catatan lain seperti kerusakan/bengkel) -> return `'EMPTY_RITASE'`.

3. `shouldClearKeteranganOnActivation(keterangan?: string | null): boolean`
   - Membersihkan spasi dan cek case-insensitive.
   - Return `true` HANYA jika string murni sama dengan `"OFF"` atau `"LIBUR"`.
   - Return `false` jika kosong, null, atau memuat teks lain (misal: "OFF - BENGKEL", "BA.02", "T.O", dll).

## Acceptance Criteria
- Seluruh pengujian di `src/utils/operationalStatusUtils.test.ts` memverifikasi skenario ritase > 0, ritase 0, variasi banner, dan pembersihan keterangan.
- Jalankan test `pnpm vitest run src/utils/operationalStatusUtils.test.ts` dan pastikan 100% lulus.
- Commit dengan judul: `feat: utilitas evaluasi unit non-operasional dan pembersihan`.
