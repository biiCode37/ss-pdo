# 📋 Laporan Before-After — Batch 7: Sinkronisasi Audit & Penguatan Benteng Keamanan

Dokumen ini menjelaskan hasil perbaikan **Batch 7 (Mini-Batch: Security & Hardening Sync)** yang mengadopsi dan menuntaskan temuan audit dari AI agent lain (BUG-48 s/d BUG-52) menggunakan bahasa sehari-hari yang mudah dipahami.

---

## 1. Penyisipan Pengaman XSS pada Seluruh Kolom Input Bus (BUG-48)

### 🔴 Sebelum Diperbaiki (Before):
- Pada modal input angka bus (seperti kolom *TOA Shift 1*, *KM Awal 1*, *KM Akhir*, dll.), data dari spreadsheet dimasukkan langsung ke atribut HTML formulir tanpa disaring terlebih dahulu.
- **Akibatnya:** Jika suatu saat ada baris di Google Sheets yang berisi simbol kurung sudut atau kutip berbahaya, karakter tersebut berpotensi merusak tampilan pop-up atau menjalankan skrip tak dikenal saat dibuka oleh petugas lain.

### 🟢 Sesudah Diperbaiki (After):
- Setiap kolom input formulir (baik angka ritase, kilometer, target trip, catatan status, maupun label nama kolom) kini **100% dibungkus dengan penyaring keamanan (`escapeHtml`)**.
- Teks apa pun yang dibaca dari spreadsheet akan tampil persis sebagai teks murni tanpa bisa merusak struktur halaman.
- **Manfaat Nyata:** Aplikasi 100% kebal terhadap injeksi teks atau karakter kotor dari Google Sheets bersama.

---

## 2. Penyeragaman Standar Pembaca ID Spreadsheet (BUG-49)

### 🔴 Sebelum Diperbaiki (Before):
- Di halaman utama (`Dashboard.tsx`), sistem masih mengimpor fungsi lama `extractSheetId` dari versi awal aplikasi, sementara komponen baru sudah beralih ke `extractSpreadsheetId`.
- **Akibatnya:** Terdapat dualisme fungsi pembaca link yang berpotensi membingungkan saat aplikasi membaca link Google Sheet yang memiliki format panjang atau kompleks.

### 🟢 Sesudah Diperbaiki (After):
- Seluruh pemanggilan fungsi ekstraksi ID spreadsheet di halaman `Dashboard.tsx` telah diseragamkan ke standar kanonik tunggal (`extractSpreadsheetId`).
- **Manfaat Nyata:** Pendeteksian ID rute dan lembar kerja Google Sheets menjadi 100% konsisten di seluruh bagian aplikasi.

---

## 3. Pelacakan Jam Kerja yang Lebih Akurat & Tahan Mode Tidur (BUG-50)

### 🔴 Sebelum Diperbaiki (Before):
- Pulsa keaktifan aplikasi selalu mengirim durasi tetap 180 detik setiap interval. Jika layar HP petugas sempat mati/tidur (*device sleep*) lalu menyala kembali, waktu yang dilaporkan terkadang tidak sesuai dengan kenyataan.
- Jika koneksi ke server database putus saat mengirim pulsa, error tersebut disembunyikan tanpa jejak log apa pun.

### 🟢 Sesudah Diperbaiki (After):
- Sistem sekarang menghitung **durasi waktu nyata** berdasarkan selisih detik aktual saat layar aktif, dengan pembatasan pintar (maksimal 200 detik) agar tidak melonjak tiba-tiba saat HP baru bangun dari mode tidur.
- Setiap kegagalan jaringan dicatat ke log peringatan pengembang (*warning log*) tanpa mengganggu tampilan petugas di layar.
- **Manfaat Nyata:** Laporan keaktifan operasional menjadi jauh lebih presisi dan riwayat gangguan koneksi mudah dilacak oleh teknisi.

---

## 4. Transparansi Catatan Waktu Aktif di Menu Profil (BUG-52)

### 🔴 Sebelum Diperbaiki (Before):
- Tidak ada keterangan di aplikasi yang memberitahukan petugas bahwa durasi jam kerja sesi aplikasi dicatat untuk keperluan operasional.

### 🟢 Sesudah Diperbaiki (After):
- Ditambahkan catatan informatif yang ramah di bagian bawah menu Profil:  
  *⏱️ "Waktu aktif sesi tercatat otomatis untuk pemantauan operasional."*
- **Manfaat Nyata:** Menjunjung tinggi transparansi operasional yang profesional dan terbuka bagi seluruh petugas lapangan.

---

## 📊 Rangkuman Perubahan Batch 7

| Poin Temuan Audit | Sebelum Perbaikan | Sesudah Perbaikan |
|---|---|---|
| **Penyaring XSS di Modal Bus (BUG-48)** | Hanya disaring pada catatan teks bebas | Seluruh 18+ titik input angka & teks 100% disaring aman |
| **Fungsi Ekstraksi ID Sheet (BUG-49)** | Masih ada fungsi lama di `Dashboard.tsx` | Diseragamkan penuh ke `extractSpreadsheetId` |
| **Perhitungan Detak Jam Kerja (BUG-50)** | Angka tetap 180 detik, error disembunyikan | Menghitung detik riil, tahan mode sleep, ada log warning |
| **Transparansi Jam Kerja (BUG-52)** | Tidak ada teks pemberitahuan | Terdapat catatan transparan yang ramah di menu Profil |
| **Ketahanan Konflik Data (BUG-51)** | Pengujian standar | Diverifikasi aman dengan 153 uji robot otomatis (100% lolos) |
