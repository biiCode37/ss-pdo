# REPAIR REPORT: REFACTOR 199
**Modul:** Penanganan Holistik Unit Non-Operasional (Ritase = 0 / Kosong / OFF) pada Halaman Input SS & Halaman Plotting  
**Tanggal:** 03 November 2026  
**Status:** Terverifikasi 100% Lulus (Zero Regression & Strict Quality Gates)

---

## 1. Implementasi Perbaikan

### A. Utilitas Domain Status Operasional (`src/utils/operationalStatusUtils.ts`)
- Dibuat utilitas murni dengan single source of truth untuk menentukan status operasional armada:
  - `isUnitNonOperational(bus)`: Memvalidasi apakah armada tidak beroperasi berdasarkan:
    1. Golden Rule Mutlak: Target ritase $\le 0$ atau kosong/tidak valid.
    2. Status OFF eksplisit: Nilai kolom keterangan sama dengan `"OFF"`, `"LIBUR"`, `"NP"`, atau `"NP1"`.
    3. Pengecualian Khusus: Catatan teknis sementara `"TO"`, `"T.O"`, `"TO EVDAL"`, `"T.O EVDAL"` **TIDAK** dianggap non-operasional jika memiliki target ritase $> 0$ (berpotensi OKB/RENOP).
  - `shouldClearOffStatus(keterangan)`: Logika selektif pembersihan keterangan yang hanya bernilai murni `"OFF"` atau `"LIBUR"`. Catatan lain (seperti `"BA.02"` atau `"BOCOR"`) tetap dipertahankan.
  - `getNonOperationalBannerType(bus)`: Mengklasifikasikan banner menjadi `'scenario1'` (ritase 0 & keterangan kosong) atau `'scenario2'` (ritase 0 & keterangan OFF/LIBUR).

### B. Kamus Teks Sentral Banner & Tombol Proteksi (`src/constants/texts/text_alerts.ts`)
- Seluruh teks antarmuka dimasukkan ke kamus sentral (anti-hardcoded UI strings):
  - `NON_OP_BANNER_SCENARIO_1`: *"Unit tidak memiliki target Ritase (Tidak Beroperasi) — Hanya kolom Keterangan yang dapat diedit/diisi."*
  - `NON_OP_BANNER_SCENARIO_2`: *"Unit tidak memiliki target Ritase dan berstatus 'OFF (Libur)' — Hanya kolom Keterangan yang dapat diedit/diisi."*
  - `BTN_ACTIVATE_INPUT`: *"🔓 Aktifkan Input"*
  - `DIALOG_ACTIVATE_INPUT_*`: Judul, petunjuk, tombol batal/konfirmasi, dan validasi dialog aktivasi input.

### C. Alur Satset Cerdas & Auto-Park to Bottom pada Input SS (`src/components/bus/BusList.tsx` & `BusCard.tsx`)
- **Auto-Skip Satset:** Fungsi `handleSaveAndNext` otomatis melewati unit-unit non-operasional dan langsung meluncur ke armada operasional berikutnya yang belum lengkap datanya.
- **Auto-Park to Bottom:** Daftar unit yang dirender mengelompokkan armada operasional di bagian atas dan memarkir armada non-operasional di bagian bawah daftar secara teratur.
- **Eksklusi Nomor Urutan Antrean:** Pada `BusCard.tsx`, nomor antrean hanya dimunculkan jika `!isUnitNonOperational(bus)` dan unit memiliki nomor urut valid.

### D. Proteksi Input Angka & Dialog Pembuka Kunci (`src/components/bus/BusInputModal.tsx` & `useBusInputForm.ts`)
- **Fieldset Numerik Terkunci:** Seluruh input angka (Ritase Pergi/Pulang, KM Awal/Akhir Shift 1 & 2, TOA Shift 1 & 2 / Total TOA) dibungkus atribut `disabled` saat `isLocked === true`. Kolom Keterangan dan tombol modal tetap aktif untuk pencatatan memo lapangan.
- **Banner Peringatan Kontekstual:** Menampilkan banner amber ramah non-teknis dengan ikon `AlertCircle` di bagian atas formulir.
- **Tombol Pembuka Kunci `[ 🔓 Aktifkan Input ]`:** Membuka SweetAlert2 modal interaktif untuk menginputkan target ritase baru. Jika target diisi valid ($> 0$), form dibuka kuncinya secara reaktif, dan kolom keterangan otomatis dibersihkan jika hanya memuat status `"OFF"` atau `"LIBUR"`.

### E. Penyelarasan Urutan & Eksklusi Unit OFF pada Plotting (`src/components/plotting/DailyPlottingPage.tsx` & Komponen Terkait)
- **Normalisasi Sequential `1..N`:** Fungsi `normalizeBaseOrders` memastikan armada aktif mendapatkan nomor urut `1..N`, sedangkan seluruh armada non-operasional/target 0 diberi `order: 0` dan terparkir di posisi paling bawah pangkalan.
- **Badge Urutan Plotting:** `PlottingUnitCard.tsx` menampilkan badge strip `-` untuk unit non-operasional dan menyembunyikan tombol panah reorder naik/turun.
- **Dropdown Acuan Bersih:** `PlottingOrderModal.tsx` menyaring daftar unit acuan sehingga hanya unit aktif (`order > 0`) yang dapat dipilih sebagai referensi penempatan relatif.

---

## 2. Before vs After

| Aspek / Fitur | Sebelum Refactor 199 | Sesudah Refactor 199 |
|---|---|---|
| **Mode Satset (Auto-Next)** | Tetap membuka modal form untuk bus yang OFF/libur/ritase 0, memaksa petugas menutup form berkali-kali. | Otomatis melompati (*auto-skip*) bus OFF/ritase 0 dan langsung meluncur ke bus aktif berikutnya yang belum lengkap. |
| **Proteksi Input Angka Bus OFF** | Semua field angka terbuka lebar; rawan ketidaksengajaan terisi angka KM/TOA pada bus yang libur. | Seluruh kolom input angka terkunci sementara (*read-only*), hanya kolom Keterangan yang dapat diisi. |
| **Banner Kontekstual Form** | Tidak ada banner; pengawas tidak mendapat informasi bahwa bus berstatus non-operasional. | Banner ramah non-teknis tampil dengan 2 skenario jelas (target 0 kosong vs target 0 status OFF/LIBUR). |
| **Penanganan Bus Mendadak Jalan (OKB)** | Petugas bingung cara mengaktifkan kembali bus OFF menjadi bus jalan. | Disediakan tombol `[ 🔓 Aktifkan Input ]`; setelah ritase diisi, status "OFF/LIBUR" otomatis terhapus bersih dari data dan spreadsheet. |
| **Penataan Posisi Unit di Antrean** | Bus OFF tersebar acak di tengah-tengah daftar bus jalan di Halaman Input SS dan Plotting. | Seluruh unit non-operasional otomatis terparkir di posisi paling bawah (*Auto-Park to Bottom*). |
| **Penomoran Urutan Keberangkatan** | Bus OFF ikut memakan nomor urutan (misal bus OFF #3, bus jalan berikutnya #4). | Nomor urut sequential `1..N` strictly hanya untuk bus jalan; bus OFF diberi badge `-` dan `order: 0`. |

---

## 3. Case: Skenario Lapangan

### Skenario 1: Petugas Menggunakan Mode Satset pada Pagi Hari
- **Kondisi:** Di rute JAK.60, terdapat 12 unit armada terdaftar. Unit #1 s/d #8 jalan, Unit #9 dan #10 libur (OFF), Unit #11 jalan, dan Unit #12 rusak di depo (OFF).
- **Sebelum Refactor 199:** Petugas menginput Unit #8, lalu menekan Simpan. Form langsung meluncur membuka Unit #9 yang berstatus OFF. Petugas harus menekan Batal. Lalu form meluncur membuka Unit #10 (OFF lagi), petugas membatalkan lagi.
- **Sesudah Refactor 199:** Petugas menyimpan data Unit #8. Sistem mendeteksi Unit #9 dan #10 memiliki target ritase 0 / berstatus OFF, sehingga secara instan melompati keduanya dan langsung membuka formulir Unit #11 yang beroperasi dan belum lengkap datanya. Efisiensi waktu penginputan meningkat drastis!

### Skenario 2: Armada Libur Mendadak Beroperasi di Siang Hari (OKB/RENOP)
- **Kondisi:** Bus JAK.60-015 tercatat di pagi hari berstatus libur ("OFF") dengan target ritase 0. Di siang hari jam 13:00, bus diminta jalan bantuan sebanyak 3 ritase.
- **Sebelum Refactor 199:** Petugas harus menghapus tulisan OFF manual dan mengetik angka ritase; jika lupa menghapus OFF, data di spreadsheet bertabrakan (ada ritase tapi keterangannya OFF).
- **Sesudah Refactor 199:**
  1. Petugas membuka kartu JAK.60-015. Banner ramah muncul: *"Unit tidak memiliki target Ritase dan berstatus 'OFF (Libur)' — Hanya kolom Keterangan yang dapat diedit/diisi."*
  2. Seluruh input angka dalam kondisi terkunci aman.
  3. Petugas mengetuk tombol `[ 🔓 Aktifkan Input ]`.
  4. Dialog SweetAlert2 muncul meminta target ritase baru. Petugas memasukkan angka `3`.
  5. Seluruh input angka seketika terbuka, target ritase terisi `3`, dan tulisan "OFF" pada kolom keterangan otomatis dibersihkan tanpa menghapus memo penting lainnya.
