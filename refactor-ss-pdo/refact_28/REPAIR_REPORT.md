# REPAIR REPORT: USER PROFILE HEADER, ACTIVE ROUTE BADGE & INDONESIAN FULL DATE PILL (REFACTOR 28)

Laporan ini merangkum perbaikan dan peningkatan kualitas antarmuka serta pengalaman pengguna (UI/UX) pada header aplikasi dan smart pill selektor jadwal di SS_PDO.

---

## 1. DAFTAR PERUBAHAN & IMPLEMENTASI

### 🔹 1.1 Pembuatan Komponen Mandiri `UserProfileHeader.tsx` (UI-28-01)
- **Lokasi File Baru:** `src/components/UserProfileHeader.tsx`
- **Unit Test Baru:** `src/components/UserProfileHeader.test.tsx`
- **Rincian Implementasi:**
  - Menampilkan foto profil avatar Google pengguna (`PDO_USER_AVATAR`) dengan pelindung gagal muat (*fallback to gradient circle with User icon* jika jaringan lambat atau URL avatar bermasalah).
  - Menampilkan nama pengguna (`PDO_USER_NAME`) secara tegas, proporsional, dan kontras tinggi.
  - **Eliminasi Role Badge (Sesuai Permintaan User):** Menghilangkan `RoleBadge` dari baris profil header agar tidak menimbulkan visual clutter/tabrakan warna di smartphone layar sempit.
  - Menampilkan alamat email akun (`PDO_USER_EMAIL`) dengan tipografi ramping dan elipsis otomatis saat layar menyempit.
  - Memasang interaksi klik / keyboard navigation (Enter/Space) yang langsung membuka `ProfileMenuSheet`.
  - Mengintegrasikan event listener `storage` dan `focus` agar nama/avatar langsung terbarui seketika jika pengguna mengubah akun atau data tersinkronisasi.

### 🔹 1.2 Penempatan Badge Kode Rute Aktif di Pojok Kanan Atas (UX-28-02)
- **Lokasi File:** `src/components/Dashboard.tsx`
- **Rincian Implementasi:**
  - Menggantikan tombol lama `[ 🌐 Wilayah ]` dengan badge `[ 📍 JAK.115 ▾ ]`.
  - Menambahkan indikator interaktif `ChevronDown` (`▾`) agar konsisten dengan elemen interaktif lainnya di dashboard.
  - Menghubungkan resolusi kode rute dari 3 tingkat fallback:
    1. `matchedRoute?.route_code` (rute terverifikasi di cache Supabase)
    2. `currentRouteCode` (dari URL/ID sheet Google Sheets)
    3. `selectedRouteCode` (riwayat `PDO_LAST_VISITED` atau pilihan terkini di selektor)
    4. Fallback `"Pilih Rute"` jika belum ada rute yang dipilih.
  - Memberikan fungsi interaktif pada badge rute: saat diketuk, badge memicu `routeSelectorOpenTrigger` yang langsung membuka bottom sheet selektor rute untuk perpindahan cepat.
  - Tetap mempertahankan badge antrean sinkronisasi offline (`queue.length > 0`) di samping kanan badge rute jika ada transaksi offline pending/gagal.

### 🔹 1.3 Pembaruan Format Tanggal Indonesia Lengkap pada Smart Pill (UI-28-03)
- **Lokasi File:** `src/components/RouteSelectorCard.tsx`
- **File Uji:** `src/components/RouteSelectorCard.test.tsx`
- **Rincian Implementasi:**
  - Mengganti ikon `MapPin` pada smart pill dengan ikon `Calendar`.
  - Mengeliminasi kode rute ganda (`JAK.115 •`) dari segmen kiri smart pill karena kode rute sudah tampil elegan di header atas.
  - **Perapihan Layout & Eliminasi Gap Kosong:** Merapatkan jarak ikon kalender, label tanggal, dan panah `ChevronDown` dengan `gap: 6px` terpadu, menghilangkan ruang kosong aneh (*floating arrow gap*) yang sebelumnya memisahkan teks tanggal dengan panah chevron.
  - Memformat label tanggal menjadi format bahasa Indonesia lengkap: `"hari, tanggal Bulan tahun"` (contoh: `"Rabu, 09 Sep 2026"`).
  - Menggunakan kamus hari resmi: `['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']` dan singkatan bulan standar: `['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']`.
  - Tetap mendukung mode akumulasi secara presisi: `Akumulasi (01 - 09/09/26)`.

---

## 2. BEFORE VS AFTER COMPARISON

### 📊 Header Pojok Kiri Atas
| Aspek | Sebelum (Before) | Sesudah (After) |
| :--- | :--- | :--- |
| **Komponen** | Judul teks statis "PUSM" | Komponen interaktif `UserProfileHeader` |
| **Subtitle** | Teks deskriptif "PDO Utara Spreadsheet Mobile" | Email pengguna aktif (contoh: `budi@transjakarta.co.id`) |
| **Identitas** | Tidak menampilkan identitas maupun peran pengguna | Menampilkan avatar Google dan nama akun bersih tanpa role badge yang padat |
| **Aksi Tap** | Statis, tidak dapat diklik | Membuka `ProfileMenuSheet` secara langsung |

### 📊 Header Pojok Kanan Atas
| Aspek | Sebelum (Before) | Sesudah (After) |
| :--- | :--- | :--- |
| **Fungsi** | Tombol navigasi `[ 🌐 Wilayah ]` | Badge status & picker `[ 📍 JAK.115 ▾ ]` |
| **Konteks** | Mengarahkan ke halaman monitoring regional yang jarang dikunjungi | Menegaskan konteks rute aktif yang sedang dikelola petugas |
| **Interaksi** | Pindah rute halaman | Membuka bottom sheet seleksi rute cepat |

### 📊 Smart Pill Selektor (Baris Kontrol)
| Aspek | Sebelum (Before) | Sesudah (After) |
| :--- | :--- | :--- |
| **Ikon** | `MapPin` (duplikat konteks lokasi) | `Calendar` (konteks waktu dan jadwal) |
| **Teks Label** | `JAK.115 • Tgl 9` (redundan dengan header) | `Rabu, 23 Sep 2026` (format lengkap Indonesia) |
| **Kejelasan Kalender** | Hanya angka tanggal tanpa nama hari | Memberikan nama hari lengkap (Rabu, Kamis, dst.) |
| **Penyelarasan Panah** | Chevron terdorong jauh ke ujung kanan dengan celah kosong lebar | Ikon kalender, teks tanggal, dan chevron menyatu rapi berdampingan |

---

## 3. CASE: SKENARIO LAPANGAN (FIELD SCENARIOS)

### 🚍 Skenario 1: Verifikasi Akun Petugas Bergilir di Posko Lapangan
- **Kondisi:** Tablet posko operasional digunakan bergantian oleh Petugas Shift Pagi (05:00 - 13:00) dan Petugas Shift Siang (13:00 - 21:00).
- **Sebelum Perbaikan:** Petugas yang baru datang tidak tahu apakah akun yang tertaut di tablet masih milik shift sebelumnya atau miliknya, karena header hanya menampilkan teks besar "PUSM". Untuk memeriksa, petugas harus membuka menu bottom nav.
- **Setelah Perbaikan:** Begitu tablet menyala, di pojok kiri atas langsung terlihat jelas avatar dan nama "Budi Santoso" beserta badge `[ Petugas ]`. Jika belum berganti akun, petugas cukup mengetuk foto profilnya dan memilih ganti akun/logout.

### 🚍 Skenario 2: Konfirmasi Rute Aktif Saat Pengisian di Tengah Keramaian
- **Kondisi:** Petugas sedang melakukan input laporan di terminal dengan banyak rute mikrotrans (JAK.115, JAK.15, JAK.76).
- **Sebelum Perbaikan:** Header kanan atas menampilkan `[ 🌐 Wilayah ]`. Petugas yang terburu-buru harus membaca teks kecil di pill bawah untuk memastikan rute yang sedang dibuka.
- **Setelah Perbaikan:** Header kanan atas memancarkan badge hijau tosca menyala `[ 📍 JAK.115 ]`. Petugas dengan pandangan sekilas (*glanceable UX*) langsung yakin bahwa data yang sedang diinput adalah untuk koridor JAK.115.

### 🚍 Skenario 3: Penjadwalan Laporan Harian vs Hari Libur / Akhir Pekan
- **Kondisi:** Petugas mengisi laporan pada hari libur nasional atau akhir pekan yang memiliki pola renops berbeda dengan hari kerja biasa.
- **Sebelum Perbaikan:** Pill hanya menampilkan `Tgl 9`. Petugas harus membuka aplikasi kalender gawai untuk memastikan apakah tanggal 9 jatuh pada hari Rabu atau akhir pekan.
- **Setelah Perbaikan:** Pill langsung menampilkan `"Rabu, 09 Sep 2026"`. Petugas seketika mengetahui bahwa ini hari kerja biasa dan pola operasionalnya dapat disesuaikan tanpa ragu.

---

## 4. HASIL VERIFIKASI QUALITY GATES

1. **Vitest Unit Test Suite:**
   ```bash
   pnpm vitest run src/
   # Hasil: 39 test files passed, 288 tests passed (100% lulus)
   ```
2. **TypeScript & Production Build:**
   ```bash
   pnpm run build
   # Hasil: tsc -b passed (0 error), Vite production build passed (dist/ built in 1.65s)
   ```
