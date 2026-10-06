# AUDIT BUGS — Refactor 134

## Ringkasan Audit
- **Tanggal:** 6 Oktober 2026
- **Konteks:** Perbaikan penanganan input Total TOA pada Tab Shift 2 dalam Mode [Semua Kolom] (`all`) yang menimpa rumus spreadsheet asli kolom "TOA SHIFT 2".

---

### Temuan Bug

#### BUG-134-01: Form Input "Total TOA" pada Tab Shift 2 Mengirimkan Mutasi `toaShift2` yang Menimpa Rumus Spreadsheet Asli
- **Lokasi Kode:**
  - `src/components/busCard/modal/BusInputModalShift2.tsx` (handler input `handleToaChange` memanggil `setToaShift2(val)`)
  - `src/components/busCard/modal/busInputPayload.ts` (`updates.toaShift2 = toaShift2.trim()`)
- **Tingkat Keparahan:** High (Data Integrity Corruption pada Google Sheets SSOT)
- **Deskripsi:**
  Pada mode [Semua Kolom], tab [Shift 2] menampilkan form input bertuliskan "Total TOA". Namun di balik layar, form tersebut menyinkronkan nilainya ke state `toaShift2`. Saat form disimpan, payload mutasi menyertakan field `toaShift2`. Akibatnya, adapter `mutations.ts` menimpa cell kolom "TOA SHIFT 2" di Google Sheets yang seharusnya berisi rumus otomatis (`=TOTAL_TOA - TOA_SHIFT_1`), merusak formula spreadsheet dan menyebabkan inkonsistensi kalkulasi.
- **Dampak Pengguna:**
  Petugas operasional yang menginput Total TOA di Shift 2 merusak rumus bawaan spreadsheet induk. Nilai "TOA SHIFT 2" menjadi angka statis mentah hasil input Total TOA alih-alih selisih shift 2 yang dihitung otomatis oleh spreadsheet.
- **Mitigasi:**
  1. Hapus sinkronisasi ke `toaShift2` pada `BusInputModalShift2.tsx`, ikat langsung komponen input ke `totalToa` dan `setTotalToa`.
  2. Omit `updates.toaShift2` pada payload mutasi mode [Semua Kolom] di `busInputPayload.ts` agar kolom "TOA SHIFT 2" tidak pernah disentuh/ditimpa.
  3. Kirim nilai input langsung ke field `totalToa`.

---

#### BUG-134-02: Akumulasi Otomatis Ganda pada `computeEffectiveTotalToa`
- **Lokasi Kode:** `src/components/busCard/modal/busInputPayload.ts` (`computeEffectiveTotalToa`)
- **Tingkat Keparahan:** Medium
- **Deskripsi:**
  Fungsi `computeEffectiveTotalToa` sebelumnya menjumlahkan nilai numerik `finalToaS1 + finalToaS2` secara otomatis. Padahal nilai yang diinput oleh user di tab Shift 2 adalah angka kumulatif total yang terbaca di mesin tiket ("Total TOA"), bukan angka ritase shift 2 saja. Menjumlahkan kembali nilai tersebut dengan Shift 1 menyebabkan angka Total TOA terinflasi ganda.
- **Dampak Pengguna:**
  Total TOA tersimpan dengan nilai yang jauh lebih besar dari kenyataan di lapangan.
- **Mitigasi:**
  Ubah `computeEffectiveTotalToa` untuk langsung mengembalikan nilai `totalToa` yang diinput pengguna tanpa operasi penjumlahan sintesis tambahan.
