# Repair Report Refact 52: Modularisasi & Dekomposisi Modal Informasi Login (LoginInfoModal)

Dokumen ini memuat laporan teknis implementasi dekomposisi `LoginInfoModal.tsx` menjadi subkomponen-subkomponen terisolasi di `src/components/login/`.

---

## 1. Implementasi & Detail Perubahan

### A. Pembagian Submodul Modular (`src/components/login/`)
1. **`LoginInfoHeader.tsx`**:
   - Menampilkan bar tarikan sentuh mobile (*pull indicator*).
   - Menampilkan ikon info berlatar aksen hijau, judul modal, dan tombol silang penutup modal dengan atribut aksesibilitas dan `data-testid="close-info-modal-btn"`.
2. **`LoginInfoAboutSection.tsx`**:
   - Menampilkan judul "Tentang PUSM" dan paragraf orientasi operasional.
   - Menyajikan 3 kartu sorotan fitur (Digitalisasi Pencatatan, Terhubung Spreadsheet Pengawas, dan Pemantauan Cepat) dengan ikon centang hijau.
3. **`LoginInfoComparisonSection.tsx`**:
   - Menampilkan perbandingan 3 aspek kritis antara PUSM dan Spreadsheet biasa di HP:
     1. Kenyamanan layar kartu mobile vs sel kecil yang memerlukan zoom berulang.
     2. Keamanan format data operasional tanpa merusak formula sheet.
     3. Akumulasi data lintas tanggal instan dalam satu ketukan.
4. **`LoginInfoPermissionsSection.tsx`**:
   - Menampilkan icon spreadsheet dan narasi alasan izin akun Google.
   - Tombol toggle interaktif untuk menampilkan/menyembunyikan rincian cakupan izin OAuth (`showDetails`, `onToggleDetails`).
   - Kotak rincian izin OAuth dengan rincian akses baca/tulis spreadsheet dan enkripsi resmi Google.
5. **Kamus Teks Sentral (`src/constants/texts/text_auth.ts`)**:
   - Mendaftarkan entri teks baru: `INFO_MODAL_TITLE`, `INFO_MODAL_CLOSE`, `VIEW_PERMISSIONS_DETAIL`, dan `HIDE_PERMISSIONS_DETAIL`.
   - Menguji integritas kamus di `src/constants/texts/texts.test.ts` (15 tests passed).
6. **`LoginInfoModal.tsx` (Root Orchestrator)**:
   - Berkurang dari 525 baris menjadi **~86 baris** (penurunan -439 baris kode / 84%).
   - Merakit seluruh subkomponen di dalam overlay bottom sheet responsif.
7. **Unit Test Baru (`src/components/login/LoginInfoModal.test.tsx`)**:
   - Menguji perilaku rendering saat modal tertutup (`isOpen: false`) dan terbuka (`isOpen: true`).
   - Menguji interaktivitas buka-tutup kotak rincian izin OAuth Google.
   - Menguji callback `onClose` saat tombol silang atas maupun tombol bawah ditekan.

---

## 2. Perbandingan Before vs After

| Aspek | Sebelum Refactor 52 (Before) | Sesudah Refactor 52 (After) |
| :--- | :--- | :--- |
| **Ukuran `LoginInfoModal.tsx`** | 525 baris (Monolitik masif) | **~86 baris** (Penurunan -439 baris kode / 84%) |
| **Struktur Subkomponen** | About, comparison, permissions menyatu | 4 subkomponen terdedikasi di `src/components/login/` |
| **Pemisahan Tanggung Jawab** | Semua seksi HTML di satu file | Setiap seksi terisolasi rapi dan independen |
| **Kamus Teks Sentral** | Hardcoded title & toggle labels | 100% menggunakan entri kamus terpusat di `text_auth.ts` |
| **Integritas Unit Test** | Belum memiliki unit test khusus | **4/4 tests `LoginInfoModal.test.tsx` passed**, **45/45 test files passed (345 tests) 100%** |
| **Kompilasi & Bundle** | - | **`tsc -b && vite build` lulus 0 error (1.17s)** |
| **Knowledge Graph** | - | Graphify 3.514 nodes, 4.493 edges terbarui |

---

## 3. Skenario Lapangan (Field Cases)

### Case 1: Pengguna Baru Ingin Mengetahui Mengapa Aplikasi Membutuhkan Izin Google
- **Kondisi**: Petugas lapangan baru pertama kali memasang aplikasi dan merasa ragu memberikan akses Google Sheets saat diminta login.
- **Before**: Penjelasan izin Google bercampur dalam kode monolitik yang panjang dan statis.
- **After**: Petugas dapat mengetuk tombol "Lihat rincian izin resmi Google" di `LoginInfoPermissionsSection`, yang secara fluid membuka penjelasan cakupan OAuth dan proteksi enkripsi Google, memberikan transparansi keamanan penuh.

### Case 2: Petugas Membuka Informasi Panduan di Layar Ponsel Kecil
- **Kondisi**: Petugas membuka modal panduan pada perangkat Android layar 5,5 inci di terminal.
- **Before**: Tata letak modal panjang rawan overflow atau terpotong tanpa padding safe-area yang teratur.
- **After**: Subkomponen yang modular menjaga hierarki visual tetap proporsional, scrollbar tersembunyi halus (`.no-scrollbar`), dan tombol "Tutup & Kembali" selalu mudah dijangkau di bagian bawah layar.
