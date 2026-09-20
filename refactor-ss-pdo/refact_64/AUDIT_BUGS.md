# AUDIT BUGS — REFACTOR 64: REDESIGN ERGONOMI MODAL INPUT BUS (TOUCH SATSET & ANTI-KEYBOARD VIRTUAL)

Dokumentasi audit UX, ergonomi operasional, dan integritas data pada komponen antarmuka modal input armada bus (`BusInputModal`) sebelum pelaksanaan perombakan komprehensif.

---

### BUG-64-01: Fragmentasi Kolom Berpasangan Shift Operasional (TOA & KM Terpisah)
- **Lokasi Kode:** `src/components/busCard/modal/BusInputModalShift1.tsx`, `BusInputModalShift2.tsx`
- **Tingkat Keparahan:** HIGH (Kecepatan & Ergonomi Petugas Lapangan)
- **Deskripsi:** Secara alur kerja riil di lapangan, petugas pengawas mengisi data secara berbarengan dalam satu waktu:
  - Shift 1: `[TOA S1 + KM Akhir S1]` secara simultan (dengan Manual TOA S1 & Keterangan opsional).
  - Shift 2: `[TOTAL TOA + KM Akhir S2]` secara simultan (dengan Manual TOA S2 & Keterangan opsional).
  Pada desain modal lama, tata letak input tersusun dalam form memanjang vertikal yang kaku atau terpisah per tab tanpa pengelompokan paket kerja berdampingan, memaksa operator melakukan scroll berlebih saat mengisi pasangan data tersebut.
- **Dampak User:** Entri data shift terasa lambat, melelahkan, dan tidak selaras dengan kebiasaan operator yang mencatat TOA dan KM Akhir secara bersamaan saat pergantian shift.
- **Mitigasi:** Merombak layout Shift 1 dan Shift 2 menjadi paket entri data berdampingan (*2-column grid / compact grouped cards*) di mana TOA dan KM Akhir berada dalam satu pandangan mata tanpa perlu scroll.

---

### BUG-64-02: Redundansi Pengetikan 5–6 Digit Angka Odometer KM Setiap Shift
- **Lokasi Kode:** `src/components/busCard/modal/useBusInputForm.ts`
- **Tingkat Keparahan:** HIGH (Produktivitas & Efisiensi Waktu)
- **Deskripsi:** Dalam operasional bus kota, rata-rata jarak tempuh per shift hanya berkisar 100+ KM. Hal ini berarti 3 digit awal odometer bus (misal: `125` dari `125430`) selalu konstan/sama. Formulir lama membiarkan kotak input KM kosong melompong, sehingga petugas harus mengetik ulang seluruh 6 digit odometer untuk setiap shift dan setiap bus.
- **Dampak User:** Untuk rute dengan 20 armada, operator harus mengetik hingga ratusan digit angka odometer yang sebenarnya dapat diprediksi, meningkatkan risiko salah ketik (*typo fat-finger*).
- **Mitigasi:** Menerapkan algoritma cerdas auto-prefill 3 digit awal odometer (`extractLeading3Digits`) saat field KM kosong:
  - KM Awal S1: mengambil 3 digit awal dari KM Akhir S2 hari sebelumnya (`previousDayKmAkhir2`).
  - KM Akhir S1: mengambil 3 digit awal dari KM Awal S1 hari ini.
  - KM Awal S2: mengambil 3 digit awal dari KM Akhir S1 hari ini + tombol `Salin KM Akhir S1` (salin 100% digit).
  - KM Akhir S2: mengambil 3 digit awal dari KM Awal S2 hari ini.

---

### BUG-64-03: Ketiadaan Feedback Selisih Real-Time Odometer & Peringatan Jarak Ekstrem di Form
- **Lokasi Kode:** `src/components/busCard/modal/useBusInputForm.ts`, `BusInputModalShift1.tsx`, `BusInputModalShift2.tsx`
- **Tingkat Keparahan:** HIGH (Integritas Data SSOT)
- **Deskripsi:** Saat petugas mengisi KM Akhir, form tidak menampilkan selisih jarak tempuh (*distance difference*) secara real-time. Jika petugas salah memasukkan angka KM Akhir yang lebih kecil dari KM Awal, atau memasukkan angka anomali (>230 KM), kesalahan tersebut baru diketahui setelah disubmit atau bahkan lolos jika validasi tidak reaktif.
- **Dampak User:** Kesalahan ketik odometer tidak dapat langsung dikoreksi saat mata petugas masih tertuju pada input, berpotensi merusak rekonsiliasi BBM dan ritase di lembar Google Sheets SSOT.
- **Mitigasi:** Mengintegrasikan kalkulasi live `computeRealtimeDistance(kmAwal, kmAkhir)` yang menampilkan badge selisih KM interaktif:
  - Hijau: Normal (`+XX KM`).
  - Merah: Selisih negatif / KM Akhir < KM Awal (`⚠️ KM Akhir < KM Awal`).
  - Kuning/Amber: Selisih ekstrem melebihi batas operasional 230 KM (`⚠️ Jarak Ekstrem (>230 KM)`).

---

### BUG-64-04: Ketiadaan Kalkulasi Live Breakdown TOA Shift 2 saat Pengisian Total TOA
- **Lokasi Kode:** `src/components/busCard/modal/useBusInputForm.ts`, `BusInputModalShift2.tsx`
- **Tingkat Keparahan:** MEDIUM-HIGH (Akurasi & UX)
- **Deskripsi:** Pada Shift 2, petugas memasukkan angka Total TOA harian akumulatif. Petugas sering kali perlu memastikan berapa sebenarnya porsi penumpang yang didapat khusus pada Shift 2 (`Total TOA - TOA S1`). Sebelumnya tidak ada indikator live yang menghitung angka ini secara langsung saat Total TOA diketik.
- **Dampak User:** Operator harus menghitung manual di luar aplikasi atau menerka-nerka apakah angka Total TOA yang dimasukkan sudah masuk akal dibanding hasil Shift 1.
- **Mitigasi:** Menambahkan utilitas `computeLiveToaShift2(totalToa, toaShift1)` dan badge kalkulasi live di bawah kolom Total TOA yang secara otomatis menampilkan breakdown: `Shift 2: XX Penumpang (Total TOA XX - S1 XX)`.

---

### BUG-64-05: Risiko Tertutupnya Input & Tombol Simpan oleh Mobile Virtual Keyboard
- **Lokasi Kode:** `src/components/busCard/BusInputModal.tsx`
- **Tingkat Keparahan:** HIGH (Ergonomi Mobile PWA)
- **Deskripsi:** Di peramban mobile (Chrome Android & Safari iOS), ketika keyboard virtual muncul, tinggi area pandang (*visual viewport*) menyusut drastis hingga 40%–50%. Modal dengan tinggi statis `h-auto` atau `max-h-[90vh]` sering kali terdorong ke atas, memotong header, atau membuat tombol simpan di bagian bawah tertutup sepenuhnya di balik keyboard.
- **Dampak User:** Petugas harus menutup keyboard berulang kali hanya untuk bisa menekan tombol simpan atau melihat kolom yang tersembunyi di bagian bawah modal.
- **Mitigasi:** Membuat custom hook `useVisualViewport` yang mendengarkan event `visualViewport.resize` dan `window.innerHeight`. Mengatur modal dengan `maxHeight: Math.min(viewportHeight - 12, 780)px`, scroll internal halus, dan sticky footer action bar yang selalu menempel di atas keyboard.

---

### BUG-64-06: Tombol Aksi Sentuh (Touch Target) di Bawah Standar Ergonomi Mobile (<48px)
- **Lokasi Kode:** `src/components/busCard/modal/BusInputModalFooter.tsx`
- **Tingkat Keparahan:** MEDIUM (Touch Ergonomics)
- **Deskripsi:** Tombol aksi pada footer modal memiliki tinggi `h-9` atau `py-2` (kurang dari 40px), sehingga rawan salah pencet (*miss-tap*) ketika digunakan oleh petugas di lapangan dengan satu tangan atau saat bergerak.
- **Dampak User:** Jari petugas sering meleset atau tidak sengaja menekan tombol batal padahal berniat menekan tombol simpan.
- **Mitigasi:** Menaikkan ukuran touch target tombol footer ke standar ergonomi Apple/Android minimal 48px (`min-h-[48px]`), menambahkan feedback visual aktif yang responsif (`active:scale-[0.98]`), serta menata tombol Simpan Data dengan lebar penuh atau proporsi dominan yang nyaman dijangkau ibu jari.

---

### BUG-64-07: Potensi Pelanggaran Kamus Teks Sentral (Hardcoded UI Strings)
- **Lokasi Kode:** `src/components/busCard/modal/`
- **Tingkat Keparahan:** MEDIUM (Standar Kualitas Kode & I18n)
- **Deskripsi:** Penambahan fitur baru seperti badge selisih KM, status validasi real-time, tombol salin KM, dan indikator breakdown TOA berisiko memunculkan string teks bahasa antarmuka yang di-hardcode langsung di dalam file komponen `.tsx`.
- **Dampak:** Melanggar Golden Rules proyek SS_PDO yang mewajibkan seluruh teks antarmuka tersentralisasi di `src/constants/texts/`.
- **Mitigasi:** Mendaftarkan seluruh token teks baru ke `src/constants/texts/text_alerts.ts` (`KM_DIFF_POSITIVE`, `KM_DIFF_NEGATIVE`, `KM_DIFF_EXTREME`, `TOA_S2_BREAKDOWN`, `COPY_KM_AKHIR_1`, `ODOMETER_AUTO_HINT`, `PREFILL_FROM_YESTERDAY`) dan menyertakan pengujian otomatis pada `src/constants/texts/texts.test.ts`.

---

### BUG-64-08: Terputusnya Alur Prefill Odometer KM Awal S1 Akibat Ketiadaan Prefetch Data Hari Sebelumnya
- **Lokasi Kode:** `src/components/Dashboard.tsx`, `src/components/dashboard/DashboardContentTabs.tsx`, `src/components/busList/BusList.tsx`, `src/components/busCard/BusCard.tsx`, `src/components/busCard/modal/useBusInputForm.ts`
- **Tingkat Keparahan:** HIGH (Fungsionalitas Fitur Prefill Odometer)
- **Deskripsi:** Meskipun utilitas ekstraksi 3 digit `extractLeading3Digits` telah dibuat pada siklus awal, data KM Akhir S2 dari hari sebelumnya tidak pernah di-fetch dari Google Sheets dan prop `previousDayKmAkhir2` tidak diteruskan oleh komponen rantai `BusCard.tsx` ke dalam `BusInputModal`. Selain itu, `useBusInputForm.ts` hanya menginisialisasi prefill pada render awal tanpa efek reaktif saat data asinkron tiba.
- **Dampak User:** Form KM Awal S1 tetap kosong dan tidak menampilkan 3 digit awal odometer bus kemarin, sehingga petugas masih harus mengetik seluruh 5–6 digit secara manual.
- **Mitigasi:** Membuat hook khusus `usePreviousDayOdometer` yang secara otomatis memuat tab hari sebelumnya (baik di spreadsheet yang sama maupun spreadsheet bulan lalu jika tanggal 1) dengan in-memory cache, mengalirkan prop `previousDayKmMap` ke `BusList` dan `BusCard`, serta menambahkan `useEffect` reaktif di `useBusInputForm.ts` dan visual badge `PREFILL_FROM_YESTERDAY` di `BusInputModalShift1.tsx`.

