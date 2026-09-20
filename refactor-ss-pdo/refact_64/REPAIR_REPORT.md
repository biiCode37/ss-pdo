# REPAIR REPORT — REFACTOR 64: REDESIGN ERGONOMI MODAL INPUT BUS (TOUCH SATSET & ANTI-KEYBOARD VIRTUAL)

Dokumen implementasi perbaikan komprehensif untuk antarmuka modal entri data armada bus (`BusInputModal`), menghadirkan alur kerja pengisian paket data berdampingan yang berkecepatan tinggi (*satset*), auto-prefill 3 digit odometer cerdas, umpan balik selisih real-time, dan tata letak adaptif bebas benturan keyboard virtual mobile.

---

## 📋 Ringkasan Implementasi

1. **Paket Input Kolom Berdampingan (*Paired Columns Shift Layout*):**
   - Merestrukturisasi tampilan `BusInputModalShift1.tsx`:
     - Kolom `TOA S1` dan `KM Akhir S1` ditata berdampingan dalam 1 paket pandangan visual utama.
     - `KM Awal S1` ditempatkan di atas dengan indikator acuan jelas (karena KM Awal diisi pada waktu fokus tersendiri).
     - Kolom sekunder `Manual TOA S1` dan `Keterangan S1` disajikan melalui *progressive disclosure accordion* yang ringkas, sehingga tidak memenuhi layar namun siap dibuka dalam 1 tap jika ada insiden/tiket manual.
   - Merestrukturisasi tampilan `BusInputModalShift2.tsx`:
     - Kolom `TOTAL TOA` dan `KM Akhir S2` ditata berdampingan dalam 1 paket pandangan visual utama.
     - `KM Awal S2` dilengkapi tombol instan `[Salin KM Akhir S1]` untuk menyalin 100% digit dalam 1 kali tap.
     - Kolom sekunder `Manual TOA S2` dan `Keterangan S2` tersimpan rapi dalam accordion.

2. **Auto-Prefill 3 Digit Awal Odometer Odometer Cerdas (`busModalOdometer.ts`):**
   - Mengimplementasikan `extractLeading3Digits(km)`:
     - KM Awal S1: otomatis terisi 3 digit awal dari KM Akhir S2 hari sebelumnya (`previousDayKmAkhir2`).
     - KM Akhir S1: otomatis terisi 3 digit awal dari KM Awal S1 hari ini.
     - KM Awal S2: otomatis terisi 3 digit awal dari KM Akhir S1 hari ini (ditambah opsi salin penuh via tombol).
     - KM Akhir S2: otomatis terisi 3 digit awal dari KM Awal S2 hari ini.
   - Mengurangi 50%–60% beban pengetikan angka odometer bagi petugas di lapangan.

3. **Indikator Live Selisih KM & Validasi Jarak Ekstrem:**
   - Mengimplementasikan fungsi `computeRealtimeDistance(kmAwal, kmAkhir)` yang bereaksi seketika terhadap perubahan angka di formulir:
     - Normal (`status: 'normal'`): Badge hijau `+XX KM`.
     - Negatif (`status: 'negative'`): Badge merah `⚠️ KM Akhir < KM Awal (-XX KM)` dan memblokir submit form.
     - Ekstrem (`status: 'extreme'`): Badge amber/kuning `⚠️ Jarak Ekstrem (>230 KM)` dan memblokir submit form.

4. **Live Calculation & Breakdown TOA Shift 2:**
   - Mengimplementasikan `computeLiveToaShift2(totalToa, toaShift1)` pada `BusInputModalShift2.tsx`:
     - Menghitung porsi penumpang Shift 2 secara live (`Total TOA - TOA S1`).
     - Menampilkan pill informasi di bawah input Total TOA: `Shift 2: XX Penumpang (Total TOA XX - S1 XX)`.

5. **Hook Adaptif Virtual Keyboard Mobile (`useVisualViewport.ts`):**
   - Mendeteksi ketersediaan API `window.visualViewport`.
   - Melacak tinggi viewport riil (`viewportHeight`) dan status kemunculan keyboard virtual (`isKeyboardOpen = window.innerHeight - visualViewport.height > 150`).
   - Menerapkan pembatasan dinamis pada container modal: `maxHeight: Math.min(viewportHeight - 12, 780)px`.
   - Mengamankan tombol aksi formulir menggunakan sticky footer bar di atas keyboard virtual, sehingga tombol Simpan Data tidak pernah terdorong keluar layar.

6. **Peningkatan Ergonomi Touch Target (Standar Apple/Android ≥48px):**
   - Mengubah ukuran tombol aksi footer (`BusInputModalFooter.tsx`) menjadi `min-h-[48px]`.
   - Memberikan transisi fisik pegas Apple `cubic-bezier(0.32, 0.72, 0, 1)` dan efek tactile `active:scale-[0.98]`.
   - Menjaga tombol "Simpan Data" selalu dominan dengan warna emerald terang dan kontras tinggi.

7. **Kepatuhan Kamus Teks Sentral (`src/constants/texts/`):**
8. **Penempatan Kursor Cerdas pada Prefill Odometer (`useBusInputForm.ts`):**
   - Menghilangkan perilaku `select()` yang memblokir seluruh 3 digit prefill pada field KM saat autofocus dipicu.
   - Menggantikannya dengan `targetElement.setSelectionRange(len, len)` jika input bertipe KM dan memiliki panjang 1–3 digit (`isPrefillOnly`).
   - Menyematkan auto-positioning kursor ke ujung kanan saat field KM menerima pembaruan prefill asinkron atau saat di-fokuskan kembali oleh petugas.
   - Hasil: Petugas tidak perlu lagi melakukan tap manual ke sisi kanan field; angka yang diketik langsung menyambung setelah 3 digit prefill tanpa risiko tertimpa.

---

## 🔄 Perbandingan Before vs After

| Aspek | Sebelum Perbaikan (Before) | Sesudah Perbaikan (After) |
|---|---|---|
| **Alur Input Shift** | Seluruh kolom ditumpuk vertikal satu per satu; TOA dan KM Akhir terpisah jauh. | Kolom yang biasa diisi berbarengan (`[TOA S1 + KM Akhir S1]` dan `[TOTAL TOA + KM Akhir S2]`) ditata berdampingan dalam 1 paket visual. |
| **Pengisian Angka Odometer** | Kolom input KM kosong; petugas harus mengetik manual 5–6 digit angka berulang-ulang untuk setiap bus. | Otomatis ter-prefill 3 digit awal odometer (mengurangi beban input 3 digit per entri secara akurat). |
| **Fokus pada 3 Digit Prefill** | Autofocus memblokir/menyeleksi seluruh teks (`select()`); jika langsung diketik, 3 digit prefill terhapus/tertimpa. | Autofocus menempatkan kursor di posisi paling kanan (`setSelectionRange(len, len)`); petugas langsung mengetik sisa digit tanpa takut terhapus. |
| **Salin KM Antar Shift** | Pengawas harus menghafal atau bolak-balik melihat KM Akhir S1 untuk dimasukkan ke KM Awal S2. | Tersedia tombol instan `[Salin KM Akhir S1]` yang langsung menyalin 100% digit nilai dalam 1 kali tap. |
| **Kalkulasi Selisih KM** | Tidak ada feedback live; kesalahan KM Akhir < KM Awal baru diketahui saat submit gagal. | Badge interaktif real-time langsung menghitung selisih jarak (`+XX KM`, peringatan negatif, atau peringatan >230 KM). |
| **Perhitungan TOA Shift 2** | Petugas harus menghitung manual di luar aplikasi selisih Total TOA dikurangi Shift 1. | Live breakdown otomatis menghitung dan menampilkan estimasi penumpang khusus Shift 2 seketika. |
| **Tampilan saat Mobile Keyboard Muncul** | Modal statis; tombol simpan di footer kerap terdorong keluar dari layar ponsel. | Dynamic maxHeight berbasis `useVisualViewport` dan sticky action bar memastikan form dan tombol simpan selalu terlihat. |
| **Ukuran Target Sentuh (Touch Target)** | Tombol footer berukuran <40px, rentan salah sentuh oleh jari operator saat terburu-buru. | Seluruh tombol utama memiliki tinggi minimal 48px (`min-h-[48px]`) dengan feedback tactile spring. |

---

## 🎯 Case: Skenario Lapangan

### Skenario 1: Petugas Pengawas Melakukan Penutupan Shift 1 (TOA S1 + KM Akhir S1)
- **Kondisi:** Di pool operasional saat jam pergantian shift siang, pengawas mencatat data 15 unit bus yang baru saja menyelesaikan dinas Shift 1.
- **Alur Kerja Baru:**
  1. Pengawas membuka kartu bus pertama. Modal terbuka langsung pada tab Shift 1 dengan kursor siap di input TOA S1.
  2. Pengawas memasukkan angka TOA S1 (misal `142`).
  3. Pengawas langsung beralih ke input KM Akhir S1 yang berada tepat di sampingnya.
  4. Input KM Akhir S1 sudah otomatis terisi 3 digit awal (misal `125`), pengawas cukup mengetik 3 digit sisanya (misal `580` menjadi `125580`).
  5. Seketika muncul badge hijau `+150 KM`, memastikan angka masuk akal.
  6. Pengawas menekan tombol Enter pada keyboard ponsel atau tap tombol "Simpan Data" yang selalu terlihat jelas di sticky footer. Form tersimpan dan mode satset langsung membuka bus berikutnya.

### Skenario 2: Petugas Memasukkan KM Awal Shift 2 & Total TOA Malam Hari
- **Kondisi:** Saat dinas malam dimulai, petugas harus memasukkan KM Awal S2 untuk unit yang sama.
- **Alur Kerja Baru:**
  1. Petugas membuka modal tab Shift 2.
  2. Pada input KM Awal S2, petugas cukup menekan tombol `[Salin KM Akhir S1]`. Seluruh angka odometer dari Shift 1 langsung tersalin 100% tanpa risiko salah ketik 1 digit pun.
  3. Saat penutupan malam, petugas memasukkan `TOTAL TOA` (misal `310`).
  4. Muncul live breakdown di bawah input: `Shift 2: 168 Penumpang (Total TOA 310 - S1 142)`. Petugas langsung mengetahui performa Shift 2 malam itu tanpa perlu membuka kalkulator.

### Skenario 3: Penggunaan Smartphone Layar 360px dengan Gboard Virtual Keyboard Aktif
- **Kondisi:** Petugas lapangan menggunakan ponsel entry-level dengan resolusi layar terbatas dan keyboard virtual yang memakan 50% tinggi layar.
- **Alur Kerja Baru:**
  1. Saat input disentuh dan keyboard muncul, `useVisualViewport` secara reaktif menyesuaikan batas `maxHeight` modal.
  2. Form melakukan penyesuaian scroll otomatis ke elemen input yang sedang aktif.
  3. Sticky footer tetap terpancang kokoh tepat di atas bilah keyboard virtual, memungkinkan petugas menyimpan data dalam satu sentuhan tanpa perlu memencet tombol "Back" untuk menyembunyikan keyboard terlebih dahulu.

### Skenario 4: Petugas Mengisi KM Awal S1 Pagi Hari dengan Prefill Otomatis Odometer Kemarin
- **Kondisi:** Pagi hari sebelum bus berangkat berdinas Shift 1, petugas membuka form untuk mengisi KM Awal S1.
- **Alur Kerja Baru:**
  1. Saat dashboard memuat data rute hari ini (misal tanggal 15), hook `usePreviousDayOdometer` secara background mengambil data tab kemarin (tanggal 14) atau spreadsheet bulan sebelumnya jika tanggal 1.
  2. Petugas melakukan tap pada bus pertama.
  3. Form terbuka dengan bagian KM Awal S1 langsung terbuka (karena belum tersimpan di sheet).
  4. Kotak input KM Awal S1 sudah otomatis terisi 3 digit awal (misal `125` dari KM Akhir S2 kemarin `125430`), lengkap dengan badge visual `Kemarin: 125430`.
  5. Petugas cukup mengetik 3 digit terakhir dari odometer fisik bus di dashboard pengemudi, lalu menekan Enter.

### Skenario 5: Petugas Membuka Form Input KM Awal S1 Tanpa Perlu Tap Ulang Kotak Input (Langsung Ketik Sisa Digit)
- **Kondisi:** Petugas membuka form KM Awal S1 di lapangan. Kotak input menampilkan prefill `289`.
- **Alur Kerja Baru:**
  1. Modal input terbuka dan auto-focus aktif pada kolom `KM Awal Shift 1`.
  2. Sistem mengenali bahwa kolom bertipe KM dan bernilai 3 digit prefill (`289`).
  3. Sistem **TIDAK** menyeleksi seluruh teks (tidak ada blok biru), melainkan langsung meletakkan kursor di ujung kanan setelah angka `9`.
  4. Petugas langsung menekan angka `5`, `1`, `4` pada keypad ponsel.
  5. Nilai input menjadi `289514` secara mulus tanpa terhapus dan tanpa perlu melakukan tap manual ke sisi kanan kotak input.
  6. Operator menghemat waktu dan terhindar dari frustrasi salah timpa teks.

---

## 🛡️ Status Verifikasi & Quality Gates

1. **Unit Test Suite:**
   - Perintah: `pnpm vitest run src/`
   - Hasil: **57 test files passed, 425 tests passed (100% lulus)**
     - Termasuk `BusInputModal.test.tsx` (17 passed, pengujian kursor di akhir prefill terverifikasi)
     - Termasuk `usePreviousDayOdometer.test.tsx` (3 passed)
     - Termasuk `busModalOdometer.test.ts` (10 passed)
     - Termasuk `useVisualViewport.test.tsx` (2 passed)
     - Termasuk `texts.test.ts` (15 passed)
2. **Typecheck & Production Build:**
   - Perintah: `pnpm run build` (`tsc -b && vite build`)
   - Hasil: **Lulus 0 error (Vite build 1.39s, PWA bundle terverifikasi)**
3. **Graf Pengetahuan (Knowledge Graph):**
   - Perintah: `graphify update .`
   - Hasil: **Rebuilt: 3892 nodes, 5052 edges, 342 communities terbarukan**

