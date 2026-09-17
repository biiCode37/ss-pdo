# AUDIT BUGS — REFACTOR 63: RESTORASI FITUR SPEED-RUN INPUT SS, VALIDASI RELASIONAL, & ERGONOMI MOBILE

Dokumentasi audit bug dan degradasi fungsional pada halaman Input SS (Spreadsheet / Kartu Armada Bus) pasca-modernisasi modal React deklaratif.

---

### BUG-63-01: Kehilangan Mode Single-Column Focus Speed-Run saat Filter Kategori Aktif
- **Lokasi Kode:** `src/components/busCard/BusInputModal.tsx`
- **Tingkat Keparahan:** HIGH (Ergonomi & Produktivitas Operator Lapangan)
- **Deskripsi:** Sebelumnya, ketika operator memilih salah satu kolom kategori (misalnya `TOA S1`, `Total TOA`, `KM Awal S1`, `KM Akhir S1`, dll), modal input terbuka dalam mode 1 kolom super cepat (*single-column focus speed-run*). Pada modal baru, modal selalu memaksakan tampilan 4 tab lengkap (Shift 1, Shift 2, Ritase, Catatan) terlepas dari kolom apa yang sedang difilter oleh operator.
- **Dampak User:** Operator yang ingin melakukan pengisian cepat (*speed-run*) satu kolom tertentu untuk puluhan armada harus membuang waktu menatap formulir penuh dan kehilangan rasa fokus cepat satset.
- **Mitigasi:** Menerapkan evaluasi `isSingleColumnEligible` via `SINGLE_COLUMN_META`. Jika filter kategori spesifik aktif dan user belum menekan toggle `[Semua Kolom]`, render antarmuka Single-Column Focus lengkap dengan tombol toggle `[Semua Kolom]` / `[Mode Fokus]`, serta *progressive disclosure chips* (`+ Manual`, `+ Catatan`).

---

### BUG-63-02: Tidak Adanya Autofocus & Autoselect pada Input Aktif
- **Lokasi Kode:** `src/components/busCard/BusInputModal.tsx`
- **Tingkat Keparahan:** HIGH (Kecepatan Operasional)
- **Deskripsi:** Ketika modal terbuka, kursor tidak secara otomatis terfokus (*autofocus*) dan nilai input lama tidak langsung terseleksi (*autoselect*).
- **Dampak User:** Di ponsel maupun desktop, operator harus melakukan tap/klik manual tambahan ke kotak input dan menghapus angka lama satu per satu sebelum mengetik nilai baru. Ini memperlambat entri data 2x hingga 3x lipat.
- **Mitigasi:** Menambahkan `useEffect` dengan delay 60ms (sinkron dengan render animasi portal dan pemunculan mobile soft keyboard) yang memanggil `.focus()` dan `.select()` pada ref input aktif (baik di mode single-column maupun tab aktif).

---

### BUG-63-03: Hilangnya Fitur Enter-to-Save pada Input Form
- **Lokasi Kode:** `src/components/busCard/BusInputModal.tsx`
- **Tingkat Keparahan:** MEDIUM-HIGH (Ergonomi Pengguna)
- **Deskripsi:** Menekan tombol "Done" / "Enter" pada keyboard virtual ponsel maupun tombol Enter fisik pada keyboard Bluetooth/desktop tidak memicu penyimpanan formulir.
- **Dampak User:** Pengguna harus menggeser pandangan dan melakukan tap manual ke tombol "Simpan Data" di bagian bawah layar untuk setiap kartu bus.
- **Mitigasi:** Menambahkan handler `handleInputKeyDown` pada elemen `<input>` yang mendeteksi `e.key === 'Enter'` dan langsung memicu `form.requestSubmit()`, memicu validasi dan penyimpanan instan.

---

### BUG-63-04: Hilangnya Smart Viewport Auto-Scroll saat Input Berfokus
- **Lokasi Kode:** `src/components/busCard/BusInputModal.tsx`
- **Tingkat Keparahan:** MEDIUM (UX Mobile Keyboard)
- **Deskripsi:** Pada layar ponsel dengan keyboard virtual terbuka (mengambil 40%–50% tinggi layar), input yang sedang diisi sering kali terhalang oleh keyboard karena tidak ada auto-scroll ke tengah viewport.
- **Dampak User:** Pengguna harus menggeser layar modal secara manual agar dapat melihat apa yang sedang diketik.
- **Mitigasi:** Menambahkan handler `onFocus={handleInputFocus}` pada seluruh input dan textarea dengan implementasi `e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })`.

---

### BUG-63-05: Validasi Relasional `validateToaPair` (Total TOA vs TOA S1) & Acuan KM Hilang
- **Lokasi Kode:** `src/components/busCard/BusInputModal.tsx`
- **Tingkat Keparahan:** HIGH (Integritas Data SSOT)
- **Deskripsi:** Utilitas `validateToaPair` dari `busModalValidation.ts` yang memastikan `Total TOA >= TOA S1` tidak dipanggil di dalam modal baru. Selain itu, input Total TOA langsung pada kategori `totalToa` ditimpa oleh formula kalkulasi otomatis tanpa fleksibilitas entri langsung.
- **Dampak User:** Operator bisa secara tidak sengaja memasukkan Total TOA yang lebih kecil dari TOA Shift 1, menyebabkan inkonsistensi formula spreadsheet.
- **Mitigasi:** Memanggil `validateToaPair(toaShift1, effectiveTotalToa)` pada `handleFormSubmit` baik di mode single maupun tab penuh, serta menampilkan alert validasi yang jelas sebelum data disimpan.

---

### BUG-63-06: Duplikasi Banner Shift Lock di Header Bus List & Tersembunyinya Progress Bar
- **Lokasi Kode:** `src/components/busList/BusListHeader.tsx`
- **Tingkat Keparahan:** MEDIUM (Kerapihan Antarmuka)
- **Deskripsi:** Banner peringatan bahwa shift belum dikonfirmasi dirender dua kali: satu di `DashboardStatusBanners.tsx` (`ShiftConfirmationAlertBar`) dan satu lagi di `BusListHeader.tsx` (`BusListShiftLockBanner`). Selain itu, progress bar harian disembunyikan jika shift belum dikonfirmasi.
- **Dampak User:** Layar ponsel terasa sempit karena adanya dua banner bertumpuk dengan pesan yang sama. Pengguna juga kehilangan visibilitas progres input harian.
- **Mitigasi:** Menghapus banner duplikat dari `BusListHeader.tsx` dan membiarkan `ShiftConfirmationAlertBar` di level dashboard sebagai SSOT banner peringatan shift. Menjadikan `BusListProgressBar` selalu tampil konsisten.

---

### BUG-63-07: Pelanggaran Batas Ukuran File & Modularitas (God-File BusInputModal.tsx 1.084 Baris)
- **Lokasi Kode:** `src/components/busCard/BusInputModal.tsx`
- **Tingkat Keparahan:** HIGH (Maintainability & Clean Architecture)
- **Deskripsi:** File `BusInputModal.tsx` membengkak hingga mencapai 1.084 baris karena menyatukan seluruh state form, logika validasi, 4 tab formulir, tampilan single-column focus, header, dan footer dalam satu god file monolitik.
- **Dampak Developer/Maintenance:** Sulit di-review, rawan konflik merge, sulit diuji secara terisolasi, dan melanggar aturan emas proyek (batas maksimal 400–500 baris).
- **Mitigasi:** Memecah komponen menjadi subfolder modular `src/components/busCard/modal/` dengan hook `useBusInputForm.ts` (~380 baris) dan 8 sub-komponen terisolasi (masing-masing 35–180 baris). `BusInputModal.tsx` sebagai orkestrator menyusut drastis menjadi hanya 269 baris.

