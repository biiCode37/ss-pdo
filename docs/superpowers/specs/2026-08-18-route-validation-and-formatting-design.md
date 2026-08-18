# Spesifikasi Desain: Pemformatan & Validasi Pendaftaran Rute Baru

- **Tanggal:** 2026-08-18
- **Topik:** Pemformatan dan Validasi Pendaftaran Rute Baru
- **Status:** Approved

---

## 1. Latar Belakang & Tujuan
Aplikasi **SS_PDO** membutuhkan mekanisme validasi dan pemformatan yang ketat dan otomatis pada saat pengguna mendaftarkan rute baru beserta tautan Google Sheets. Hal ini bertujuan untuk:
1. Mencegah kesalahan ketik pada kode rute.
2. Memastikan tautan Google Sheets benar, dapat diakses publik/terotorisasi, dan memiliki struktur kolom PDO yang sesuai.
3. Otomatisasi deteksi nama trayek dari header spreadsheet.
4. Mencegah duplikasi data rute dan periode di database Supabase.
5. Memberikan pengalaman pengguna (UX) yang mulus (*smart input*, *live check feedback*, dan *auto-switch* ke rute baru).

---

## 2. Rincian Ketentuan & Spesifikasi

### A. Aturan Validasi & Format Kode Rute
1. **Format Baku:** Wajib berformat `JAK.<KODE>`.
2. **Karakter Bagian `<KODE>`:**
   - Hanya boleh berisi karakter alfanumerik kapital (angka `0-9` atau angka+huruf `A-Z`, contoh: `115`, `05`, `76`, `78A`, `29B`).
   - Tidak boleh mengandung spasi (semua spasi otomatis dihapus).
   - Tidak boleh mengandung simbol selain 1 tanda titik (`.`) setelah kata `JAK`.
3. **Smart Input Helper:**
   - Jika pengguna hanya mengetikkan kode/angka (misal `76` atau `115`), sistem otomatis menambahkan prefix `JAK.` menjadi `JAK.76` / `JAK.115`.
   - Mengubah semua huruf kecil menjadi huruf kapital (*UPPERCASE*).

### B. Validasi & Sanitasi Link Google Sheets
1. **Ekstraksi Bersih ID Spreadsheet:**
   - Mengekstrak `spreadsheet_id` murni (44 karakter alfanumerik) dari URL lengkap Google Sheets (mengabaikan parameter `/edit`, `/view`, `#gid=...`, atau query string).
2. **Validasi Anti-Duplikasi:**
   - Memeriksa ke database Supabase apakah `route_code` dengan `month` dan `year` yang sama sudah terdaftar.
   - Memeriksa apakah `spreadsheet_id` sudah pernah digunakan untuk rute dan periode yang sama.
3. **Live Connection & Header Check:**
   - Menguji koneksi langsung ke Google Sheets API secara real-time saat pengguna menempel (*paste*) atau selesai mengisi link.
   - Memeriksa ketersediaan tab spreadsheet dan header kolom dasar PDO (`No Body / Unit`, Trip, dll).
   - Menampilkan status visual secara real-time:
     - ⏳ *Sedang memeriksa akses spreadsheet...*
     - ✅ *Spreadsheet terhubung (Nama Trayek: [Nama Terdeteksi])*
     - ❌ *Spreadsheet tidak dapat diakses / periksa izin akses link*

### C. Deteksi Nama Trayek & Penentuan Periode
1. **Nama Trayek Otomatis:**
   - Jika header kolom trip di spreadsheet berisi nama trayek (misal `"TERM. TJ PRIOK - PEGANGSAAN II IGI"`), sistem mengolahnya menjadi nama trayek ringkas (contoh: `"Tanjung Priok - Pegangsaan II"`).
   - Jika tidak dapat dideteksi dari header, fallback otomatis menggunakan Kode Rute (`JAK.XX`).
2. **Periode:**
   - Dropdown pilihan Bulan (1–12 / Jan–Des) dan Tahun (default tahun berjalan).
   - Batasan 1 sheet per kombinasi rute + bulan + tahun.

### D. Alur UX & Transisi Data
1. Input field dengan visual prefix `JAK.` dan pesan bantuan format.
2. Penanganan pesan kesalahan dalam Bahasa Indonesia non-teknis yang mudah dimengerti petugas operasional.
3. Setelah rute berhasil disimpan ke Supabase & cache lokal:
   - Form pendaftaran rute otomatis tertutup.
   - Pilihan rute, bulan, dan tahun pada dropdown langsung beralih (*auto-switch*) ke rute yang baru didaftarkan.
   - Data spreadsheet rute baru otomatis dimuat ke tampilan dashboard.

---

## 3. Rencana Pengujian (Testing Strategy)
1. **Unit Test Helper Validasi (`src/utils/routeValidation.test.ts`)**:
   - Pengujian fungsi format kode rute (`formatRouteCode`, `validateRouteCode`).
   - Pengujian ekstraksi spreadsheet ID dan validasi URL.
   - Pengujian deteksi nama trayek dari header trip.
2. **Integration Test Service (`src/services/routeService.test.ts`)**:
   - Pengujian `createRouteWithSheet` dengan validasi anti-duplikasi dan live check.
3. **UI/Component Test (`src/components/__tests__/RouteSelectorCard.test.tsx`)**:
   - Pengujian interaksi smart input, live status badge, dan error message.
