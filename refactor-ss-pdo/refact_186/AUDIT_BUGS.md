# Audit Analisis Kebutuhan & Desain Integrasi (Refactor 186)

## Ringkasan Eksekutif

Siklus **Refactor 186** mengimplementasikan integrasi dua arah (*bi-directional*) penuh antara **Halaman Plotting Harian**, **Halaman Input SS**, dan **File Google Sheets Asli (SSOT)** serta penyempurnaan menyeluruh pada tata letak antarmuka mobile di seluruh tingkat peran pengguna (RBAC multi-role):
1. **Multi-Select Bebas Target Ritase:**
   - Memungkinkan petugas memilih beberapa unit secara bebas (tap kartu / checkbox tanpa ketik manual nomor bodi) dan menetapkan jumlah ritase sekaligus untuk kelompok unit terpilih (mengakomodasi variasi ritase antar kelompok armada dalam 1 rute).
2. **Modal Kendala Terpadu di Plotting:**
   - Petugas dapat langsung memilih kode kendala operasional (`BA.02`, `NP`, `OFF`, `T.O EVDAL`) secara opsional dan multi-select, serta catatan tambahan pada kartu unit plotting. Kode "AP" dan "SGO" yang tidak digunakan di lapangan telah dihapus.
   - Aturan khusus: jika berstatus `OFF` atau `T.O EVDAL`, target ritase otomatis dikosongkan (`0`) dan kolom trip di Google Sheets dikosongkan (`""`).
3. **Batas Bawah Target Ritase 0 / Kosong:**
   - Memungkinkan penetapan ritase 0 / kosong langsung dari stepper maupun preset chip `0 Rit` tanpa terkunci di angka 1.
4. **Sinkronisasi Dua Arah (*Bi-Directional*) dengan Google Sheets Asli (SSOT):**
   - Saat tombol `[Simpan Plotting]` ditekan, sistem menyimpan ke Supabase AND mengeksekusi mutasi batch (`updateBulkBusData` / `addToQueue`) untuk kolom `Trip Pergi`, `Trip Pulang`, dan `Keterangan` di Google Sheets asli, serta memperbarui in-memory state `busData` seketika.
   - Saat halaman Plotting dimuat, sistem membaca nilai riil dari Google Sheets (jika trip atau kendala sudah terisi, langsung tercermin di plotting).
5. **Pembaruan Tampilan Ritase di Input SS:**
   - Kartu bus di halaman Input SS menampilkan angka akumulasi ritase murni: misal `7.5 Rit` atau `7 Rit` (bukan rasio trip mentah `8/7 Rit`).
6. **Urutan Tampilan Unit di Input SS (Opsi B — Hybrid / Fleksibel):**
   - Mengakomodasi kebutuhan ganda: urutan default tetap sesuai baris asli spreadsheet (`sheet`), dilengkapi kontrol tab tersegmen `[ Semua (Sheet) ] | [ 📍 Titik A (#1..#NA) ] | [ 📍 Titik B (#1..#NB) ]` untuk menyaring dan mengurutkan armada secara strictly berdasarkan nomor antrean plotting #1..#N.
7. **Penyatuan Komponen Pembungkus Parent (1 Parent Shell) & Eliminasi Space Kosong:**
   - Menyatukan Datepicker (`UnifiedRouteControlBar`) dengan bar Progres Harian (`BusListProgressBar`) dan kontrol baris aksi/filter (`BusListControlBar`) ke dalam satu wadah kartu terpadu (`.unified-input-control-panel`), mengeliminasi celah gelap kosong yang boros ruang di tampilan mobile.
8. **Konsistensi Multi-Role (Superadmin vs PDO) & Zero Layout Glitch:**
   - Memastikan banner maintenance superadmin berada di puncak header tanpa menimpa grafik dashboard analitik atau kartu plotting, serta memberikan clearance kartu unit pertama yang proporsional sehingga tidak tertindih oleh bar pencarian & filter di semua akun.
9. **Perbaikan Tabrakan Judul Plotting:**
   - Memisahkan blok judul `Plotting Armada Harian` dari tombol aksi `[Atur Urutan]` dan `[Simpan Plotting]` menjadi tata letak bertingkat 2 baris yang lega dan rapi di layar ponsel.
10. **Perbaikan Pelanggaran React Rules of Hooks pada Dashboard:**
   - Memperbaiki crash layar putih (*blank screen*) `Rendered more hooks than during the previous render` di `Dashboard.tsx` akibat pemanggilan hook `useMemo` (`inputRouteControlBar`) yang sebelumnya berada di bawah conditional early return `currentView === 'regional_monitoring'`.

---

## Tabel Rincian Fitur & Mitigasi Risiko

| ID Fitur / Temuan | Lokasi Kode | Keparahan | Deskripsi Singkat | Dampak Pengguna | Rencana Mitigasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FEAT-186-01** | `src/components/plotting/DailyPlottingPage.tsx`<br>`src/components/plotting/PlottingUnitCard.tsx` | 🔴 **HIGH** | Petugas harus mengatur ritase satu per satu untuk unit-unit yang berbeda target ritasenya | Memperlambat waktu plotting subuh | Tambahkan fitur multi-select bebas dengan floating action bar `[⚡ Set Ritase (X Unit)]` dan dialog preset cepat |
| **FEAT-186-02** | `src/components/plotting/PlottingUnitCard.tsx`<br>`src/components/plotting/PlottingTroubleModal.tsx` | 🟠 **MEDIUM** | Belum ada dialog pemilihan kode kendala terstandar langsung di halaman plotting, serta kode "AP" dan "SGO" tidak digunakan | Petugas harus membuka halaman Input SS untuk mengisi keterangan kendala | Sediakan modal pemilihan kode kendala cepat multi-select (tanpa AP/SGO), opsional, dengan proteksi otomatis kosongkan ritase untuk `OFF`/`T.O EVDAL` |
| **FEAT-186-03** | `src/components/plotting/DailyPlottingPage.tsx` | 🔴 **HIGH** | Simpan plotting belum menyentuh Google Sheets asli, sehingga petugas harus kerja 2x di halaman Input SS | Terjadi duplikasi input dan inkonsistensi data | Kirimkan mutasi massal aman ke kolom `Trip Pergi`, `Trip Pulang`, dan `Keterangan` via `updateBulkBusData` saat `[Simpan Plotting]` |
| **FEAT-186-04** | `src/components/plotting/DailyPlottingPage.tsx` | 🟠 **MEDIUM** | Plotting belum membaca data riil trip dan keterangan yang sudah ada di spreadsheet saat pertama kali dibuka | Perubahan fisik di spreadsheet tidak tercermin di plotting | Terapkan auto-read cerdas saat inisialisasi / mount dari prop `buses` |
| **FEAT-186-05** | `src/components/busCard/BusCardSummary.tsx` | 🟠 **MEDIUM** | Format ritase di kartu bus Input SS menampilkan rasio trip mentah `8/7 rit` | Kurang intuitif dibanding angka ritase akumulasi resmi | Format ulang menjadi akumulasi ritase desimal `7.5 Rit` / `7 Rit` |
| **FEAT-186-06** | `src/components/busList/BusList.tsx`<br>`src/components/busList/BusListControlBar.tsx`<br>`src/components/busList/BusListHeader.tsx` | 🟠 **MEDIUM** | Urutan tampilan armada di halaman Input SS tidak selaras dengan urutan keberangkatan fisik plotting di lapangan jika hanya mengandalkan urutan baris spreadsheet mentah | Petugas lapangan di pos terminal kesulitan mencari bus berdasarkan urutan antrean keberangkatan | Terapkan **Opsi B — Hybrid / Fleksibel**: default tetap urutan baris spreadsheet SSOT, namun sediakan tombol segmented pill `[ Semua (Sheet) ] | [ 📍 Titik A (#1..#N) ] | [ 📍 Titik B (#1..#N) ]` yang menyaring dan mengurutkan secara tepat berdasarkan nomor antrean plotting #1..#N |
| **FEAT-186-07** | `src/components/busList/BusListHeader.tsx`<br>`src/components/routeSelector/UnifiedRouteControlBar.tsx`<br>`src/index.css` | 🟠 **MEDIUM** | Datepicker dan bar Progres Harian terpisah menjadi 2 blok berbeda dengan celah gelap kanvas di antaranya | Boros ruang vertikal dan tampak terfragmentasi di layar ponsel | Satukan Datepicker, Progres Harian, Set Trip, Dropdown Kolom, Opsi B Tab, dan Search Bar ke dalam 1 parent card shell terpadu (`.unified-input-control-panel`) |
| **BUG-186-08** | `src/components/plotting/PlottingHeader.tsx` | 🟠 **MEDIUM** | Tombol `[Atur Urutan]` dan `[Simpan Plotting]` menabrak teks judul `Plotting Armada Harian` di mobile view | Judul terpotong dan antarmuka berantakan | Pisahkan judul ke baris atas penuh dan susun kedua tombol aksi dalam grid 2 kolom seimbang di baris kedua |
| **BUG-186-09** | `src/components/dashboard/DashboardHeader.tsx`<br>`src/components/pageManagement/SuperadminMaintenanceBanner.tsx`<br>`src/index.css` | 🔴 **HIGH** | Banner maintenance superadmin memotong kartu analitik dashboard dan kartu unit pertama di Input SS tertindih filter bar | Pengalaman rusak saat berganti peran dari PDO ke Superadmin | Pindahkan banner superadmin ke dalam `headerBlockRef` agar `ResizeObserver` menghitung tinggi aktual secara presisi, hapus duplikasi banner di tab konten, dan tambahkan clearance `padding-top: 14px` pada `.bus-list` dan `16px` pada `.analytics-container` |
| **BUG-186-10** | `src/components/Dashboard.tsx:391` | 🔴 **CRITICAL** | Pelanggaran React Rules of Hooks (`Rendered more hooks than during the previous render`) saat berpindah tampilan/peran | Layar putih total (*blank screen*) / crash ketika akun dengan view default non-dashboard (misal Superadmin di Regional Monitoring) memilih rute | Pindahkan deklarasi `useMemo` (`inputRouteControlBar`) ke tingkat teratas (*top level*) sebelum semua blok conditional return |
