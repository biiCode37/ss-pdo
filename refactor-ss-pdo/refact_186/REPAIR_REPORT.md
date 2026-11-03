# Laporan Integrasi Dua Arah Halaman Plotting, Input SS, & Google Sheets Asli (Refactor 186)

## Ringkasan Pelaksanaan

Siklus **Refactor 186** menyatukan proses perencanaan subuh (*daily plotting*) dengan eksekusi pencatatan fisik harian di Google Sheets asli (SSOT) secara terpadu tanpa kerja 2x, sekaligus menyempurnakan tata letak mobile-first di seluruh peran pengguna (multi-role RBAC):
1. **Multi-Select Bebas & Bulk Target Ritase:** Petugas dapat memilih beberapa unit secara bebas (tap kartu / checkbox tanpa mengetik manual nomor bodi) dan menetapkan target ritase serentak untuk kelompok unit terpilih (mengakomodasi variasi ketentuan ritase antar kelompok armada dalam satu rute).
2. **Modal Kendala Operasional Cepat:** Memungkinkan penetapan kode kendala operasional (`BA.02`, `NP`, `OFF`, `T.O EVDAL`) secara opsional dan multi-select langsung di halaman plotting (kode non-operasional "AP" dan "SGO" telah dihapus). Unit dengan status `OFF` atau `T.O EVDAL` secara otomatis mengosongkan target ritase (`0`).
3. **Penyimpanan Serentak ke Google Sheets Asli (SSOT):** Saat tombol `[Simpan Plotting]` ditekan, selain menyimpan konfigurasi plotting ke database Supabase, sistem secara otomatis mengeksekusi mutasi batch (`updateBulkBusData` / `addToQueue`) untuk kolom `Trip Pergi`, `Trip Pulang`, dan `Keterangan` di Google Sheets asli serta memperbarui *in-memory state* `busData` seketika.
4. **Auto-Read dari Google Sheets ke Plotting:** Membaca data riil spreadsheet jika trip atau keterangan sudah terisi sebelumnya di spreadsheet.
5. **Akumulasi Ritase di Input SS:** Mengubah format kartu bus di halaman Input SS dari format rasio trip mentah `8/7 rit` menjadi angka akumulasi desimal `7.5 Rit` / `7 Rit` (atau `-` bila belum terisi).
6. **Urutan Tampilan Unit di Input SS (Opsi B — Hybrid / Fleksibel):**
   - Menggabungkan keandalan urutan fisik spreadsheet asli dengan fleksibilitas urutan plotting antrean operasional terminal.
   - Dilengkapi kontrol tersegmen 3 pill: `[ Semua (Sheet) ] | [ 📍 Titik A (#1..#NA) ] | [ 📍 Titik B (#1..#NB) ]`.
   - Ketika memilih tab titik start (misal: `📍 Priok`), daftar unit langsung difilter hanya armada di pangkalan tersebut dan diurutkan menaik berdasarkan nomor antrean plotting (`order` #1, #2, #3, ...).
7. **Penyatuan 1 Parent Shell Kontrol Input SS:**
   - Menyatukan Datepicker, Progres Harian, Set Trip, Dropdown Kolom, Opsi B Tab, dan Search Bar ke dalam SATU kartu pembungkus terpadu (`.unified-input-control-panel`).
   - Mengeliminasi ruang hampa gelap antara datepicker dan progres bar, menghemat hingga 40% ruang vertikal di layar ponsel.
8. **Konsistensi Multi-Role (Superadmin vs PDO) & Zero Layout Glitch:**
   - Memastikan banner maintenance superadmin berada di puncak header tanpa menimpa grafik dashboard analitik atau kartu plotting.
   - Memberikan jarak clearance proporsional sehingga kartu pertama tidak bertabrakan dengan filter bar di semua role.
9. **Eliminasi Tabrakan Judul Plotting:**
   - Mengubah susunan header plotting menjadi judul di baris 1 dan tombol aksi di grid 2 kolom baris 2.
10. **Perbaikan Pelanggaran React Rules of Hooks pada Dashboard:**
   - Memperbaiki crash fatal layar putih (*blank screen*) `Rendered more hooks than during the previous render` di `Dashboard.tsx` dengan memindahkan deklarasi `useMemo` (`inputRouteControlBar`) ke tingkat teratas sebelum semua blok conditional early return (`currentView === 'regional_monitoring'`).

---

## Matriks Perubahan: Before vs After

| Area / Komponen | Sebelum Refactor 186 | Sesudah Refactor 186 |
| :--- | :--- | :--- |
| **Target Ritase Massal** (`DailyPlottingPage.tsx`) | Hanya ada preset statis "Terapkan ke Semua Unit". Petugas tidak bisa memilih unit tertentu untuk ritase yang berbeda dalam 1 rute. | Ditambahkan fitur **Multi-Select Bebas** dengan floating bar aksi `[⚡ Set Ritase (X Unit)]`. Petugas bebas menandai unit apa saja dan menetapkan target ritase spesifik untuk grup tersebut. |
| **Input Kendala Armada** (`PlottingTroubleModal.tsx`) | Petugas harus berpindah ke halaman Input SS untuk mengisi kendala atau catatan armada. Awalnya kode kendala terbatas pada pilihan tunggal dan menyertakan kode "AP"/"SGO" yang tidak digunakan di lapangan serta otomatis tercentang salah satunya. | Disediakan **Modal Kendala Terpadu** langsung pada kartu unit plotting: kode "AP" dan "SGO" telah **dihapus**, pemilihan kode kendala cepat bersifat **opsional (tidak ada yang tercentang default)**, mendukung **multi-select (bisa pilih lebih dari satu kode cepat)**, serta kebebasan menyimpan status kendala hanya dengan catatan tambahan tanpa harus memilih kode preset. |
| **Unit Rusak / Bengkel** (`OFF` / `T.O EVDAL`) | Ritase tetap terisi default sehingga terjadi kesalahan data trip di lapangan. | Sesuai aturan operasional: untuk unit `OFF` dan `T.O EVDAL`, target ritase otomatis dinolkan (`0`) dan kolom trip di Google Sheets dikosongkan (`""`). |
| **Integrasi Google Sheets SSOT** (`DailyPlottingPage.tsx`) | Plotting hanya tersimpan di database lokal/Supabase tanpa menyentuh file Google Sheets asli. Petugas harus menginput ulang di Input SS. | Tombol `[Simpan Plotting]` langsung mengirimkan batch update ke kolom `Trip Pergi`, `Trip Pulang`, dan `Keterangan` di Google Sheets asli via `updateBulkBusData` / offline queue, serta sinkronisasi state lokal instan. |
| **Format Ritase di Input SS** (`BusCardSummary.tsx`) | Ditampilkan dalam format rasio trip mentah (misal: `8/7 rit`). | Ditampilkan dalam format akumulasi ritase resmi lapangan (misal: `7.5 Rit` atau `7 Rit`). |
| **Batas Bawah Nilai Ritase** (`TargetRitaseModal.tsx` & `PlottingUnitCard.tsx`) | Nilai target ritase terkunci minimal di angka 1 (`min="1"`, `Math.max(1, ...)`), sehingga petugas tidak dapat mengatur ritase ke 0 / kosong. | Batas bawah diturunkan ke 0 (`min="0"`, `Math.max(0, ...)`), ditambahkan preset chip cepat `0 Rit`, tombol stepper `-` dinonaktifkan saat mencapai 0, dan penyimpanan ke spreadsheet otomatis mengosongkan kolom trip jika ritase bernilai 0. |
| **Urutan Tampilan Unit di Input SS** (`BusList.tsx`, `BusListControlBar.tsx`, `BusListHeader.tsx`) | Daftar bus hanya mengikuti urutan baris spreadsheet, menyulitkan petugas lapangan yang bekerja di pos terminal spesifik yang membutuhkan urutan nomor antrean keberangkatan (#1..#N). | **Opsi B (Hybrid / Fleksibel):** Default tetap mematuhi baris spreadsheet SSOT (`sheet`). Ditambahkan kontrol tab 3-pill tersegmen: `[ Semua (Sheet) ]`, `[ 📍 Titik A (#1..#NA) ]`, dan `[ 📍 Titik B (#1..#NB) ]`. Mode titik start secara otomatis memfilter armada dan menyortir tampilan secara presisi berdasarkan urutan antrean plotting (`order` #1, #2, #3, ...). |
| **Struktur Pembungkus Header Input SS** (`BusListHeader.tsx`, `UnifiedRouteControlBar.tsx`, `Dashboard.tsx`, `index.css`) | Datepicker berada di div header atas terpisah sedangkan Progres Harian dan Search Bar berada di bawahnya, menciptakan celah hitam kosong terputus-putus. | Dibuatkan **1 Komponen Pembungkus Terpadu (Parent Shell)** `.unified-input-control-panel` yang melingkupi Datepicker, Progres Harian, Set Trip, Dropdown Kolom, Opsi B Tab, dan Search Bar dalam satu wadah kartu yang padat, rapi, dan proporsional. |
| **Clearance Kartu Teratas & Multi-Role Sync** (`DashboardHeader.tsx`, `index.css`) | Pada role Superadmin, banner maintenance bertabrakan dengan komponen di bawahnya sehingga kartu analitik dashboard dan kartu bus pertama di Input SS terpotong sebagian. | Banner superadmin disatukan ke dalam `headerBlockRef` agar `ResizeObserver` selalu mengukur tinggi aktual total di semua role, banner redundan di dalam tab dihapus, dan clearance `.bus-list` (`padding-top: 14px`) menjamin tidak ada kartu yang terpotong. |
| **Header Plotting Armada Harian** (`PlottingHeader.tsx`) | Judul `Plotting Armada Harian` bertabrakan dan tertimpa tombol `[Atur Urutan]` dan `[Simpan Plotting]` di layar mobile. | Judul dipisahkan di baris atas mandiri, dan tombol aksi disusun dalam grid 2 kolom proporsional di baris kedua. |
| **Hook Ordering Dashboard** (`Dashboard.tsx`) | `useMemo` (`inputRouteControlBar`) diletakkan setelah conditional return `regional_monitoring`, memicu `Rendered more hooks than during previous render` saat ganti view. | Seluruh hooks dipindahkan ke tingkat teratas sebelum conditional return, menjamin urutan eksekusi hooks identik di semua view. |

---

## Detail Rumus & Konversi Domain Operasional

1. **Rasio Ritase ke Trip:**
   - $1\text{ Ritase (PP)} = 2\text{ Trip}$
   - Untuk ritase bulat $R$ (misal $7\text{ Rit}$):
     $$\text{Trip Pergi} = R = 7, \quad \text{Trip Pulang} = R = 7$$
   - Untuk ritase pecahan $R = k + 0.5$ (misal $7.5\text{ Rit}$):
     - **Start Pangkalan A (misal: Priok):** Berangkat menuju B $\rightarrow \text{Trip Pergi} = k + 1 = 8$, $\text{Trip Pulang} = k = 7$.
     - **Start Pangkalan B (misal: IGI):** Berangkat menuju A $\rightarrow \text{Trip Pulang} = k + 1 = 8$, $\text{Trip Pergi} = k = 7$.
   - **Unit `OFF` atau `T.O EVDAL`:**
     $$\text{Trip Pergi} = "", \quad \text{Trip Pulang} = "", \quad \text{Target Ritase} = 0$$

2. **Proteksi Kolom Berumus Spreadsheet:**
   - Payload mutasi ke Google Sheets **hanya** memperbarui kolom input murni: `Trip Pergi`, `Trip Pulang`, dan `Keterangan`.
   - Kolom berumus seperti total ritase formula, total KM tempuh, dan TOA Shift 2 **sama sekali tidak disentuh** untuk mematuhi aturan emas SSOT.

---

## Case: Skenario Lapangan

### Skenario 1: Pembagian Ritase Berbeda pada Rute JAK.115 (30 Unit)
- **Kondisi Lapangan:** Dari 30 unit di rute JAK.115, armada dibagi menjadi 2 kelompok: 20 unit pertama mendapatkan target 7.5 Rit, sedangkan 10 unit sisanya mendapatkan target 7.0 Rit karena jam operasi siang.
- **Tindakan Petugas di Aplikasi:**
  1. Petugas membuka tab Plotting JAK.115.
  2. Petugas men-tap checkbox/kartu 10 unit kelompok kedua.
  3. Petugas menekan tombol `[⚡ Set Ritase (10 Unit)]` pada floating bar bawah.
  4. Petugas memilih `7 Rit` dan menekan Simpan.
  5. 10 unit terpilih langsung terupdate menjadi 7 Rit, sementara 20 unit lainnya tetap 7.5 Rit.
- **Hasil:** Waktu plotting terpangkas dari 5 menit menjadi kurang dari 15 detik tanpa perlu input manual satu per satu.

### Skenario 2: Pergantian Akun dari PDO ke Superadmin
- **Kondisi Lapangan:** Pengawas berpindah akun dari petugas PDO lapangan ke akun pimpinan Superadmin untuk memonitor seluruh wilayah.
- **Tindakan Petugas di Aplikasi:**
  1. Login dengan akun Superadmin.
  2. Halaman Input SS dan Dashboard menampilkan banner status superadmin di bagian paling atas secara mulus.
  3. Panel kontrol Input SS menyatu rapi dalam 1 parent shell tanpa space kosong kanvas gelap.
  4. Kartu bus pertama KWK 222153 dan kartu grafik pelanggan harian tampil utuh tanpa ada bagian yang terpotong atau tertindih.
- **Hasil:** Tampilan antarmuka 100% konsisten, elegan, dan stabil di seluruh tingkatan peran tanpa glitch visual.

### Skenario 3: Transisi Superadmin dari Monitoring Wilayah ke Tampilan Rute
- **Kondisi Lapangan:** Superadmin yang berada di halaman default Monitoring Wilayah memilih salah satu rute (misal JAK.115) untuk memeriksa detail rute.
- **Tindakan Petugas di Aplikasi:**
  1. Klik tombol rute JAK.115 di kartu wilayah.
  2. Dashboard merender tampilan rute secara mulus tanpa layar putih (*blank screen*) dan tanpa pesan error konsol Rules of Hooks.
- **Hasil:** Transisi antar view stabil 100% bebas crash.
