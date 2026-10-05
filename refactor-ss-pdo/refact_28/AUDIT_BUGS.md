# AUDIT BUGS: USER PROFILE HEADER, ACTIVE ROUTE BADGE & INDONESIAN FULL DATE PILL (REFACTOR 28)

Dokumen ini mendokumentasikan temuan audit UI/UX terkait inefisiensi ruang judul statis "PUSM", dislokasi tombol switcher wilayah di header atas, serta redundansi kode rute dan kurang informatifnya format tanggal harian pada aplikasi SS_PDO.

---

## DAFTAR TEMUAN AUDIT

| ID Temuan | Komponen / File Terkait | Keparahan | Status |
| :--- | :--- | :--- | :---: |
| **UI-28-01** | `src/components/Dashboard.tsx`<br>`src/components/UserProfileHeader.tsx` | 🟡 **MEDIUM** (Inefisiensi Ruang Header: Judul statis PUSM memakan ruang bernilai tinggi tanpa nilai konteks operasional) | Terselesaikan |
| **UX-28-02** | `src/components/Dashboard.tsx` | 🟡 **MEDIUM** (Dislokasi Navigasi & Hilangnya Indikator Konteks: Tombol wilayah di kanan atas redundan dan mengaburkan rute aktif) | Terselesaikan |
| **UI-28-03** | `src/components/RouteSelectorCard.tsx` | 🟡 **MEDIUM** (Redundansi Data & Format Tanggal: Duplikasi kode rute pada smart pill dan format harian `Tgl 9` kurang informatif) | Terselesaikan |

---

## RINCIAN TEMUAN

### 🟡 UI-28-01: Judul Statis PUSM Memakan Ruang Header Tanpa Identitas Pengguna Aktif

- **ID Temuan:** `UI-28-01`
- **Lokasi Kode:** `src/components/Dashboard.tsx` (baris 806–833)
- **Keparahan:** **MEDIUM** (Inefisiensi Tata Letak & UX Identitas Pengguna)
- **Deskripsi Masalah:**
  1. Pada baris paling atas dashboard, terdapat teks statis besar "PUSM" beserta subtitle "PDO Utara Spreadsheet Mobile".
  2. Judul ini tidak interaktif dan hanya berfungsi sebagai penanda aplikasi, padahal pada aplikasi mobile operasional, ruang header paling atas sangat strategis untuk menampilkan identitas pengguna yang sedang bertugas (*who is currently operating this app*).
  3. Untuk melihat siapa yang sedang login dan perannya, pengguna harus mengklik tab "Lainnya" pada bottom navigation di baris paling bawah.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Petugas operasional yang bergantian menggunakan gawai tablet/smartphone lapangan tidak bisa melihat secara instan apakah aplikasi sedang login dengan akun dirinya atau rekan kerja lainnya.
- **Mitigasi:**
  - Membuat komponen mandiri `UserProfileHeader.tsx`.
  - Menampilkan Avatar pengguna (dengan fallback gradien halus dan ikon `User`), nama lengkap, `RoleBadge` (misal: Petugas, Admin, Superadmin), serta alamat email secara rapi dan terpotong elipsis (`text-overflow: ellipsis`) jika panjang.
  - Menjadikan seluruh area profil tersebut interaktif (`cursor: pointer`, accessible ARIA role) sehingga saat diketuk langsung memicu pembukaan `ProfileMenuSheet` secara mulus.

---

### 🟡 UX-28-02: Tombol Switcher Wilayah Redundan dan Mengaburkan Kode Rute Aktif

- **ID Temuan:** `UX-28-02`
- **Lokasi Kode:** `src/components/Dashboard.tsx` (baris 844–867)
- **Keparahan:** **MEDIUM** (Dislokasi Navigasi & Mental Model Konteks)
- **Deskripsi Masalah:**
  1. Di pojok kanan atas terdapat tombol `[ 🌐 Wilayah ]` untuk berpindah ke halaman Monitoring Wilayah.
  2. Fitur Monitoring Wilayah sudah memiliki akses yang sangat representatif di dalam `ProfileMenuSheet` dan bottom navigation.
  3. Menempatkan switcher wilayah di pojok kanan atas membingungkan petugas karena area kanan atas semestinya menjadi jangkar konteks operasional (*context anchor*): rute apa yang sedang dibuka saat ini.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Petugas harus membaca isi pill selector di bawah untuk mencari tahu rute mana yang sedang mereka tinjau.
- **Mitigasi:**
  - Mengganti tombol switcher wilayah dengan badge **Kode Rute Aktif** (contoh: `[ 📍 JAK.115 ]` atau `[ 📍 JAK.15 ]`).
  - Badge rute diberi aksen warna hijau emerald tosca (`var(--accent-color)`) dengan border lembut dan tipografi tegas.
  - Menjadikan badge tersebut interaktif sehingga saat diketuk dapat langsung membuka bottom sheet selektor rute untuk perpindahan rute cepat.

---

### 🟡 UI-28-03: Redundansi Kode Rute & Format Tanggal Kurang Informatif pada Smart Pill

- **ID Temuan:** `UI-28-03`
- **Lokasi Kode:** `src/components/RouteSelectorCard.tsx` (baris 520–557)
- **Keparahan:** **MEDIUM** (Redundansi Informasi & Keterbatasan Kepastian Kalender)
- **Deskripsi Masalah:**
  1. Sebelumnya, segmen kiri smart pill menampilkan `JAK.115 • Tgl 9`.
  2. Karena kode rute kini telah dinaikkan menjadi badge utama di pojok kanan atas header, mencantumkan `JAK.115` kembali di dalam pill menimbulkan duplikasi informasi yang tidak perlu (*visual clutter*).
  3. Selain itu, label `Tgl 9` terlalu singkat dan tidak memberikan konteks nama hari, bulan, dan tahun bagi petugas (misalnya memastikan apakah tanggal 9 jatuh pada hari kerja `Rabu` atau akhir pekan).
- **Dampak ke Pengguna Lapangan (User Impact):**
  Informasi ganda mempersempit ruang layar pada smartphone dengan layar sempit, sementara ketiadaan nama hari memaksa petugas mengecek kalender eksternal.
- **Mitigasi:**
  - Mengganti ikon `MapPin` pada smart pill dengan ikon `Calendar`.
  - Menghilangkan kode rute dari teks smart pill.
  - Memformat label tanggal menjadi format bahasa Indonesia lengkap yang elegan: `"hari, tanggal Bulan tahun"`, contoh: `"Rabu, 09 Sep 2026"`.
  - Untuk mode akumulasi, tetap menampilkan rentang rekap secara presisi (contoh: `Akumulasi (01 - 09/09/26)`).
