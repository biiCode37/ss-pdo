# REPAIR REPORT: DEAKTIVASI & PEMULIHAN AKSES MODE HARIAN DARI REKAP AKUMULASI (REFACTOR 17)

Dokumen ini mencatat implementasi perbaikan, perbandingan Sebelum (*Before*) dan Sesudah (*After*), serta Skenario Lapangan nyata untuk perbaikan temuan `ACC-17-01`.

---

## 1. Implementasi & Detail Solusi

### A. Pembukaan Kuncian Dropdown Tanggal (`src/components/RouteSelectorCard.tsx`)
- **Pelepasan Atribut Disabled Statis:**
  Menghilangkan kondisi `isAccumulation` dari atribut `disabled` pada elemen `<select>` Tanggal (`disabled={!dateEnabled || days.length === 0}`).
- **Opsi Aktif & Bidirectional Switch:**
  Saat mode akumulasi aktif, dropdown menampilkan opsi terpilih `⚡ Rekap Akumulasi`. Ketika pengguna membuka dropdown dan memilih tanggal tertentu (misal: "Tgl 5"), sistem langsung beralih keluar dari mode akumulasi dan mengeksekusi pemuatan data harian untuk tanggal tersebut.
- **Banner Interaktif Pemulihan Mode Harian:**
  Menambahkan banner status berestetika Apple di bagian atas form cascade:
  `⚡ Mode Rekap Akumulasi Aktif` lengkap dengan tombol aksi cepat `[Kembali ke Harian ✕]`.
- **Inisialisasi Sinkronisasi Cascade:**
  Memperbaiki penjagaan `prevLoadedSheetIdRef` agar sinkronisasi pilihan rute tetap berjalan pada *initial mount* ketika `selectedRouteCode` masih kosong.

### B. Handler Deaktivasi Terpusat (`src/components/Dashboard.tsx`)
- **Fungsi `handleExitAccumulation(targetDay?: string)`:**
  - Membersihkan state akumulasi (`setAccRange(null)` dan `setAccRangeDetails(null)`).
  - Mengubah tab terpilih ke tanggal target (atau tanggal hari ini / hari pertama yang tersedia).
  - Memicu pemuatan data harian single-day (`handleLoadData(false, dayToSelect)`).
- **Auto-Clear pada Pemilihan Tab Reguler:**
  Pada `handleSetSelectedTab(tab)`, jika `tab !== "AKUMULASI"`, objek rentang akumulasi otomatis di-reset menjadi `null` untuk mencegah sisa metadata akumulasi membingungkan komponen visual lainnya.
- **Distribusi Handler:**
  Meneruskan handler `onExitAccumulation` ke `RouteSelectorCard`, `BusList`, dan `AccumulationSheet`.

### C. Tombol Aksi Cepat pada Banner Daftar Bus (`src/components/BusList.tsx`)
- Mengubah banner peringatan statis `Rekap Akumulasi (...) aktif` menjadi interaktif dengan tombol `[Kembali ke Harian ➔]`. Pengguna yang sedang meninjau armada bus dapat langsung beralih ke input harian dalam 1 kali sentuh.

### D. Opsi Nonaktifkan pada Bottom Sheet (`src/components/AccumulationSheet.tsx`)
- Menambahkan tombol sekunder `[Kembali ke Mode Harian (Matikan Akumulasi)]` ketika sheet dibuka dalam kondisi mode akumulasi sedang aktif.

---

## 2. Before vs After

| Aspek | Sebelum Perbaikan (*Before*) | Sesudah Perbaikan (*After*) |
| :--- | :--- | :--- |
| **Dropdown Tanggal** | `disabled` secara permanen saat `isAccumulation === true`. Opsi terkunci pada `— Rekap Akumulasi —` tanpa bisa diklik. | **Aktif & Fleksibel.** Menampilkan `⚡ Rekap Akumulasi`, dan pengguna bebas memilih tanggal berapa pun untuk langsung keluar ke mode harian. |
| **Form Selector Rute** | Tidak ada indikator visual maupun kontrol keluar dari mode akumulasi di form selector. | Dilengkapi banner status elegan `⚡ Mode Rekap Akumulasi Aktif` dengan tombol cepat `[Kembali ke Harian ✕]`. |
| **Banner di Tab Unit / BusList** | Teks statis: *"Pilih tanggal harian spesifik untuk menginput data"* namun user tidak bisa melakukannya karena form terkunci. | Dilengkapi tombol aksi `[Kembali ke Harian ➔]` yang langsung mereset mode dan memuat data hari ini. |
| **Modal AccumulationSheet** | Hanya ada tombol "Terapkan Akumulasi Lintas Periode", tidak ada cara membatalkan/mereset. | Menyediakan tombol alternatif `[Kembali ke Mode Harian (Matikan Akumulasi)]`. |
| **State Sanitasi di Dashboard** | `accRange` dan `accRangeDetails` tetap tersimpan di memori meskipun tab berganti. | Otomatis di-reset menjadi `null` saat berpindah ke tab tanggal harian mana pun. |

---

## 3. Case: Skenario Lapangan

### Kasus: Petugas Korlap Beralih dari Pengecekan Akumulasi Mingguan ke Input Sore Hari
1. **Latar Belakang:**
   Pukul 14.00 WIB, seorang Koordinator Lapangan (Korlap) membuka menu profil dan menggunakan fitur "Rekap Akumulasi Lintas Periode" untuk mengecek total KM unit JAK.115 selama tanggal 1 sampai 6 September.
2. **Kendala di Lapangan (Sebelum Perbaikan):**
   Pukul 16.30 WIB, petugas hendak menginput data kilometer dan TOA Shift 1 untuk tanggal 7 September (hari ini). Namun saat form pemilihan dibuka, dropdown Tanggal terkunci abu-abu (*disabled*). Petugas mencoba mengganti pilihan rute atau bulan, tetapi mode akumulasi tetap terkunci. Petugas terpaksa me-refresh aplikasi secara paksa atau mengulang login.
3. **Hasil dengan Perbaikan (Sesudah Perbaikan):**
   - Petugas dapat langsung menekan tombol **`[Kembali ke Harian ➔]`** yang tampil tepat di banner peringatan atas daftar bus, ATAU
   - Petugas membuka form selector dan memilih **`Tgl 7`** langsung dari dropdown Tanggal, ATAU
   - Petugas menekan tombol **`[Kembali ke Harian ✕]`** pada banner form.
   Seketika mode akumulasi nonaktif, data unit tanggal 7 termuat sempurna, dan seluruh form input KM serta TOA aktif kembali tanpa hambatan.
