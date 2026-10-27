# Repair Report - Refactor 169

## Ringkasan Perbaikan

Siklus Refactor 169 mengimplementasikan standarisasi format kapitalisasi awal kata (*Smart Title Case*) untuk seluruh catatan keterangan manual yang diketik oleh pengguna, dengan perlindungan cerdas terhadap akronim operasional armada dan kode unit, serta menambahkan tombol cepat (*preset smart pills*) `[OKB]` dan `[Renop]` khusus untuk operasional Shift 2.

---

### Implementasi Perbaikan

#### 1. Smart Title Case Catatan Bebas Manual (`keteranganUtils.ts`)
- **Before**:
  Catatan manual yang diketik petugas lapangan seperti `"radiator bocor & perbaikan ac tj-123"` disimpan apa adanya sebagai huruf kecil atau acak.
- **After**:
  Fungsi `toSmartTitleCase` memformat teks menjadi `"Radiator Bocor & Perbaikan AC TJ-123"`. Huruf awal setiap kata menjadi kapital, sedangkan akronim operasional (`AC`, `TJ`, `AP`, `KSO`, `OKB`, `NP1`, `NP2`, `CCTV`, `SPBU`, `GPS`, `SIM`, `KIR`, `STNK`, `BBM`) serta kode unit armada (`TJ-123`, `TJ-0123`) dipertahankan kapital penuh secara akurat. Kata umum non-akronim seperti `Baik`, `Bocor`, `Mogok` tetap diformat Title Case yang rapi.
- **Integrasi UX Lapangan**:
  Pemformatan dijalankan pada event `onBlur` di textarea catatan (`BusInputModalShift1`, `BusInputModalShift2`, `BusInputModalNotes`, dan `SingleFocusNotes`) sehingga pengguna ponsel tidak mengalami gangguan kursor saat mengetik, serta divalidasi ulang saat submit melalui `normalizeKeterangan`.
- **Case Skenario Lapangan**:
  Petugas mengetik `"ban belakang bocor di tol"` di keyboard HP dengan huruf kecil cepat. Begitu petugas berpindah field (blur) atau menyimpan form, teks otomatis bertransformasi menjadi `"Ban Belakang Bocor Di Tol"`. Jika petugas mengetik `"perbaikan ac dan cctv tj-054"`, teks menjadi `"Perbaikan AC Dan CCTV TJ-054"`. Laporan di kartu bus dan Google Sheets menjadi rapi dan terstandarisasi.

#### 2. Preset Smart Pills `[OKB]` dan `[Renop]` Khusus Shift 2
- **Before**:
  Baris preset keterangan hanya memiliki tombol BA (`01`, `02`, `03`, `04`), `OFF`, dan `TO EVDAL`. Petugas Shift 2 harus mengetik manual kata "OKB" atau "Renop" berulang kali.
- **After**:
  - Didefinisikan teks tombol di kamus sentral `text_alerts.ts`: `BTN_OKB: "OKB"` dan `BTN_RENOP: "Renop"`.
  - Pada `KeteranganPresetBar.tsx`, tombol `[OKB]` (tema ungu `#a855f7`) dan `[Renop]` (tema emerald `#10b981`) ditambahkan ke Baris 1.
  - Ditambahkan proteksi kondisional: `const isShift2 = shift === 2 || Boolean(shiftLabel && shiftLabel.includes("2"));`. Tombol `[OKB]` dan `[Renop]` hanya dirender jika form berada di Shift 2. Pada Shift 1, kedua tombol ini disembunyikan secara bersih.
  - Pada `keteranganUtils.ts`, parser `parseKeterangan` dan `hasMeaningfulNote` mengenali `OKB` dan `Renop` sebagai preset yang valid dan langsung tampil pada badge kartu bus.
- **Case Skenario Lapangan**:
  Pukul 15:00 WIB (Shift 2), pengawas mendapati armada cadangan diberdayakan untuk Operasi Khusus Bus. Pengawas cukup mengklik satu kali pill `[OKB]`, maka catatan langsung terisi `OKB` secara instan tanpa perlu mengetik manual. Di sisi lain, petugas Shift 1 di pagi hari tidak terganggu oleh opsi yang tidak relevan dengan dinas pagi mereka.

---

## Verifikasi & Quality Gates

1. **Vitest Unit Tests**:
   - `pnpm vitest run src/constants/texts/texts.test.ts` -> 24/24 tests lulus (100%).
   - `pnpm vitest run src/utils/keteranganUtils.test.ts` -> 37/37 tests lulus (100%).
   - `pnpm vitest run src/components/busCard/modal/notes/KeteranganPresetBar.test.tsx` -> 13/13 tests lulus (100%).
   - `pnpm vitest run src/components/busCard/` -> 14 test files (178 tests) lulus 100%.
   - `pnpm vitest run src/` -> 121 test files (919 tests) lulus 100% tanpa error.
2. **TypeScript Strict & Production Build**:
   - `pnpm run build` (`tsc -b && vite build`) -> Berhasil 100% tanpa error (0 errors).
3. **Knowledge Graph**:
   - `graphify update .` -> Diperbarui dan tersinkronisasi.
