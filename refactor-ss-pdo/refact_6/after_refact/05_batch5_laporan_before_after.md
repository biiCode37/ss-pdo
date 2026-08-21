# 📋 Laporan Before-After — Batch 5: Penjelasan Tampilan & Penanganan Kejadian Khusus

Dokumen ini menjelaskan perubahan pada **Batch 5** dengan bahasa yang mudah dipahami, berfokus pada kejelasan informasi di layar agar petugas tidak salah paham, serta penanganan kasus-kasus khusus seperti saat menekan tombol Keluar (*Logout*).

---

## 1. Penanda Jelas pada Angka Kilometer di Mode Akumulasi (SOL-R6-029)

### 🔴 Sebelum Diperbaiki (Before):
- Saat membuka tab **AKUMULASI** (rangkuman tanggal 1 s/d tanggal 20 misalnya), label kolom kilometer tetap tertulis biasa: `"KM Awal S1"`.
- **Akibatnya:** Sebagian petugas mengira angka itu adalah KM Awal pada hari ini (tanggal 20), padahal sebenarnya itu adalah KM Awal acuan pada hari pertama (tanggal 1). Hal ini sempat menimbulkan salah paham dalam penghitungan ritase armada.

### 🟢 Sesudah Diperbaiki (After):
- Ketika tab AKUMULASI aktif, label pada kartu bus otomatis berubah menjadi **`KM Awal S1 (Akumulasi)`** dan **`KM Awal S2 (Akumulasi)`**.
- **Manfaat Nyata:** Petugas langsung paham seketika bahwa angka yang tampil adalah angka acuan awal dari rentang akumulasi tanggal yang sedang dilihat, bukan angka harian.

---

## 2. Proses Keluar Akun (Logout) yang Tidak Pernah Macet (SOL-R6-034)

### 🔴 Sebelum Diperbaiki (Before):
- Saat petugas menekan tombol **Keluar (Logout)** saat koneksi internet sedang buruk, proses pembatalan izin ke server Google terkadang macet di tengah jalan.
- **Akibatnya:** Petugas merasa tombol Logout seperti tidak merespons atau aplikasi menggantung beberapa detik.

### 🟢 Sesudah Diperbaiki (After):
- Aplikasi sekarang mengutamakan pembersihan sesi di HP terlebih dahulu.
- Seluruh data login, nama akun, dan memori lokal langsung dibersihkan seketika dalam hitungan milidetik.
- Jika server Google lambat merespons pembatalan kunci akses, proses tersebut ditangani di latar belakang tanpa menahan layar pengguna.
- **Manfaat Nyata:** Petugas bisa keluar akun dengan instan dan aman kapan saja, bahkan saat sinyal sedang hilang.

---

## 3. Tombol Muat Ulang (Refresh) yang Selalu Terhubung ke Grafik (SOL-R6-037)

### 🔴 Sebelum Diperbaiki (Before):
- Setelah petugas menginput data bus baru dan menekan tombol *Refresh* data di bagian atas, data di daftar bus sudah berubah, namun grafik tren di bawah terkadang terlambat memperbarui tampilannya karena "ketinggalan sinyal pemicu".

### 🟢 Sesudah Diperbaiki (After):
- Seluruh pemicu pembaruan layar (*dependencies*) telah disambungkan secara rapat.
- Begitu tombol muat data ditekan atau tanggal diganti, daftar kartu bus dan grafik tren di bawah langsung bersama-sama memperbarui angkanya secara serentak.
- **Manfaat Nyata:** Tidak perlu lagi me-refresh halaman browser manual berkali-kali untuk melihat grafik terbaru.

---

## 4. Benteng Pengujian Otomatis (153 Uji Robot) (SOL-R6-038)

### 🔴 Sebelum Diperbaiki (Before):
- Logika pencegahan tabrakan data (*collision detection* saat 2 petugas mengedit bus yang sama) dan ketelitian angka desimal belum memiliki penjaga otomatis yang menyeluruh.

### 🟢 Sesudah Diperbaiki (After):
- Dibuatkan **153 skenario pengujian otomatis** yang dijalankan sebelum aplikasi dirilis.
- Pengujian ini memastikan:
  - Angka koma/desimal hasil rumus spreadsheet asli tetap murni dan tidak pernah terpotong secara sepihak.
  - Saat offline dan online kembali, data disinkronkan tanpa ada yang hilang.
- **Manfaat Nyata:** Aplikasi memiliki jaminan kualitas yang sangat kokoh, bebas dari kerusakan tak terduga (*anti-bug*).

---

## 📊 Rangkuman Perubahan Batch 5

| Kasus Khusus | Sebelum Perbaikan | Sesudah Perbaikan |
|---|---|---|
| **Label KM di Tab Akumulasi** | Tertulis "KM Awal" biasa (membingungkan) | Tertulis jelas "KM Awal (Akumulasi)" |
| **Tekan Tombol Logout saat Sinyal Lemah** | Bisa macet / menggantung sejenak | Langsung keluar instan dalam hitungan milidetik |
| **Pembaruan Grafik saat Refresh** | Terkadang grafik tidak langsung ikut ter-update | Grafik tren dan kartu bus selalu serentak ter-update |
| **Jaminan Mutu Kode** | Pengujian terbatas | Dilindungi 153 tes otomatis untuk semua kemungkinan |
