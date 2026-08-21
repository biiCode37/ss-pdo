# 📋 Laporan Before-After — Batch 1: Penanganan Masalah Nyata di Layar Pengguna

Dokumen ini menjelaskan perubahan apa saja yang telah diperbaiki pada **Batch 1** menggunakan bahasa sehari-hari yang mudah dipahami, menceritakan kejadian yang sebelumnya dialami petugas di lapangan dan bagaimana kondisinya sekarang setelah diperbaiki.

---

## 1. Tampilan Grafik Tren Penumpang Saat Internet Gangguan (SOL-R6-007)

### 🔴 Sebelum Diperbaiki (Before):
- Saat internet di lapangan sedang lambat atau putus, atau saat Google Sheet gagal dihubungi, grafik tren harian di dashboard tiba-tiba menampilkan angka **0 semua** (grafik terlihat datar di bawah).
- **Akibatnya:** Petugas lapangan mengira bahwa pada hari-hari tersebut memang tidak ada penumpang sama sekali (penumpang kosong), padahal kenyataannya data gagal ditarik karena sinyal. Ini membuat laporan terlihat salah.

### 🟢 Sesudah Diperbaiki (After):
- Sekarang, jika koneksi internet terputus atau data gagal diambil, aplikasi tidak lagi memunculkan angka 0 palsu.
- Aplikasi langsung menampilkan kotak pemberitahuan ramah berwarna oranye/merah di atas grafik yang berbunyi: *"Data tren harian belum dapat dimuat. Periksa koneksi internet Anda."* lengkap dengan tombol coba lagi.
- **Manfaat Nyata:** Petugas tahu pasti bahwa itu kendala sinyal, bukan data penumpang yang kosong.

---

## 2. Pengisian Kolom Keterangan pada Mode Ringkasan (SOL-R6-021)

### 🔴 Sebelum Diperbaiki (Before):
- Ketika petugas berada di tampilan ringkasan utama (Tab `ALL`), lalu mengetuk kolom **Keterangan** untuk mencatat status bus (misal: "Unit Mogok di Pul"), pop-up input yang muncul malah menanyakan angka KM atau TOA, bukan kotak teks catatan.
- **Akibatnya:** Petugas kebingungan karena tidak bisa mengetik catatan gangguan armada dari tampilan ringkasan dan harus berpindah-pindah tab secara manual.

### 🟢 Sesudah Diperbaiki (After):
- Pop-up pengisian kini langsung mengenali bahwa yang diketuk adalah kolom Keterangan.
- Muncul kotak catatan lengkap dengan tombol cepat pilihan status (seperti *BA.01, BA.02, NP1, TO EVDAL, OFF*).
- **Manfaat Nyata:** Petugas bisa langsung mengetik dan memilih keterangan armada dalam 1 kali ketukan tanpa harus bingung mencari menu lain.

---

## 3. Warna Otomatis pada Baris Bus di Google Sheets (SOL-R6-025)

### 🔴 Sebelum Diperbaiki (Before):
- Ketika petugas mengisi keterangan bus dengan kode khusus seperti *BA.01* atau *NP1*, warna baris di Google Sheets kadang menjadi hijau biasa atau kuning tidak sesuai standar operasional.
- Bahkan kata umum seperti "OFFICE DUTY" (tugas kantor) sempat keliru terdeteksi sebagai "OFF" (libur/rusak) sehingga warnanya berubah menjadi kuning salah sasaran.

### 🟢 Sesudah Diperbaiki (After):
- Urutan pembacaan warna sudah diperbaiki dengan aturan pasti:
  1. Jika ada kode **BA.01 s/d BA.04** atau **NP1 / NP2** ➔ Baris otomatis berwarna **Biru Muda (Skyblue)**.
  2. Jika ada status **TO EVDAL** ➔ Baris otomatis berwarna **Merah Terang**.
  3. Jika ada kata **OFF** berdiri sendiri ➔ Baris otomatis berwarna **Kuning**.
  4. Jika keterangan bebas lainnya ➔ Baris otomatis berwarna **Hijau Muda**.
- Kata seperti "OFFICE" tidak lagi keliru diwarnai kuning.
- **Manfaat Nyata:** Tampilan spreadsheet pusat langsung rapi, seragam, dan memudahkan koordinator melihat status armada secara visual dari jauh.

---

## 4. Alur Masuk Akun Google (Login) yang Lebih Lancar (SOL-R6-002 & 003)

### 🔴 Sebelum Diperbaiki (Before):
- Saat pertama kali login dengan akun Google, aplikasi langsung membuka layar utama sebelum data nama dan foto profil selesai diunduh.
- **Akibatnya:** Di pojok kanan atas nama petugas sempat muncul tulisan "google_user" atau foto profil kosong sejenak, baru berubah beberapa detik kemudian, yang kadang membuat aplikasi terasa tersendat.

### 🟢 Sesudah Diperbaiki (After):
- Aplikasi sekarang menunggu konfirmasi nama dan foto profil dari Google terlebih dahulu sebelum layar dashboard terbuka.
- **Manfaat Nyata:** Begitu masuk, nama dan foto petugas langsung terpampang rapi, aplikasi terasa lebih mulus dan profesional.

---

## 5. Keamanan dari Karakter Aneh saat Mengetik Catatan (SOL-R6-022)

### 🔴 Sebelum Diperbaiki (Before):
- Jika petugas mengetik karakter khusus (seperti tanda petik, tanda kurung sudut `< >`, atau simbol dan `&`) di catatan bus, tampilan dialog konfirmasi terkadang berantakan.

### 🟢 Sesudah Diperbaiki (After):
- Semua teks catatan yang diketik dibersihkan secara otomatis sebelum ditampilkan di layar, sehingga teks apa pun yang dimasukkan oleh petugas akan tampil persis apa adanya tanpa merusak tampilan kotak dialog.
- **Manfaat Nyata:** Bebas mengetik catatan apa pun tanpa khawatir tampilan layar rusak.

---

## 📊 Rangkuman Perubahan Batch 1

| Fitur / Bagian | Sebelum Perbaikan | Sesudah Perbaikan |
|---|---|---|
| **Grafik Tren Penumpang** | Muncul angka 0 palsu saat offline | Muncul pesan ramah "Gagal memuat tren, cek internet" |
| **Input Keterangan di Tab ALL** | Muncul kolom angka (salah kolom) | Langsung muncul kotak teks catatan & tombol cepat |
| **Pewarnaan Google Sheets** | Kode BA/NP kadang salah warna | Warna biru, merah, kuning, hijau 100% konsisten |
| **Kecepatan Tampil Akun Login** | Nama profil sempat tertinggal/kosong | Nama dan foto profil langsung tampil saat dashboard terbuka |
| **Ketik Simbol di Catatan** | Tampilan dialog bisa berantakan | Teks aman dan rapi apa pun karakter yang diketik |
