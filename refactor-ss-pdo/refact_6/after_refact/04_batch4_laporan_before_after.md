# 📋 Laporan Before-After — Batch 4: Penataan Ruang & Peningkatan Kecepatan Tampilan

Dokumen ini menjelaskan perubahan pada **Batch 4** menggunakan bahasa yang mudah dipahami, berfokus pada kerapian struktur layar dan hilangnya rasa tersendat-sendat (*stuttering/lag*) saat petugas berpindah antar menu di HP.

---

## 1. Layar Masuk (Login) Terbuka Jauh Lebih Cepat di HP Petugas (SOL-R6-036)

### 🔴 Sebelum Diperbaiki (Before):
- Pada layar login, teks panjang mengenai *Kebijakan Privasi*, *Syarat & Ketentuan*, serta *Kontak Pengembang* diletakkan menumpuk dalam satu file raksasa (lebih dari 1.300 baris kode).
- **Akibatnya:** Pada HP Android petugas lapangan dengan spesifikasi standar, layar login terasa sedikit berat atau lambat saat pertama kali dibuka karena HP harus memproses semua teks panjang itu sekaligus.

### 🟢 Sesudah Diperbaiki (After):
- Kotak penjelasan syarat, privasi, dan kontak dipisahkan ke dalam "laci khusus" tersendiri (`LegalModals.tsx`).
- Layar login utama sekarang menjadi sangat ringan dan hanya memuat tombol masuk Google.
- **Manfaat Nyata:** Layar pembuka aplikasi terbuka secara instan dalam sekejap mata tanpa ada jeda atau jedug di HP petugas.

---

## 2. Dialog Pengisian Angka Bus yang Lebih Cepat Terbuka (SOL-R6-020)

### 🔴 Sebelum Diperbaiki (Before):
- Kotak dialog pop-up saat petugas mengetuk kartu bus untuk mengisi KM atau TOA dicampur aduk di satu file umum dengan puluhan dialog notifikasi lainnya.
- File tersebut membengkak hingga 1.400 baris dan sulit dirawat.

### 🟢 Sesudah Diperbaiki (After):
- Seluruh logika dialog pengisian bus (termasuk tombol pintas status cepat, tombol geser shift, dan format angka Indonesia) dipindahkan ke modul mandiri yang rapi (`busInputModal.ts`).
- **Manfaat Nyata:** Kotak input angka dan status bus muncul dengan sangat cepat dan mulus saat kartu bus disentuh.

---

## 3. Pindah Tab dan Cek Laporan Akumulasi Menjadi Lebih Halus (SOL-R6-019)

### 🔴 Sebelum Diperbaiki (Before):
- Ketika petugas membuka tab **AKUMULASI** untuk melihat total pencapaian armada dari tanggal 1 sampai akhir bulan, aplikasi menghitung ulang tanggal dan rentang data setiap kali layar disentuh sedikit saja.
- **Akibatnya:** Gerakan geser (*scroll*) di tab akumulasi terkadang terasa patah-patah di HP tertentu.

### 🟢 Sesudah Diperbaiki (After):
- Perhitungan rentang tanggal sekarang disimpan dengan cerdas di memori tampilan (*memoized*).
- Aplikasi hanya menghitung saat tanggal benar-benar diganti, bukan setiap kali layar disentuh.
- **Manfaat Nyata:** Navigasi dan *scrolling* di menu akumulasi bulanan terasa sangat licin, lancar, dan responsif (seperti aplikasi bawaan iOS/Android).

---

## 4. Kotak Dialog Antrean Offline yang Mandiri (SOL-R6-035)

### 🔴 Sebelum Diperbaiki (Before):
- Tampilan daftar data yang sedang menunggu sinyal (antrean offline) diletakkan menyatu di dalam halaman utama dashboard, membuat halaman utama semakin padat dan rumit.

### 🟢 Sesudah Diperbaiki (After):
- Dialog antrean offline kini menjadi komponen terpisah (`QueueModal.tsx`) yang baru aktif hanya saat petugas menekan tombol antrean.
- **Manfaat Nyata:** Tampilan layar utama menjadi lebih bersih dan penggunaan memori layar menjadi lebih hemat.

---

## 📊 Rangkuman Perubahan Batch 4

| Bagian Tampilan | Sebelum Perbaikan | Sesudah Perbaikan |
|---|---|---|
| **Kecepatan Layar Login** | Terasa berat karena ada ribuan baris teks privasi | Terbuka instan, teks bantuan dipisah ke laci khusus |
| **Respon Pop-up Input Bus** | Bercampur di file raksasa, rawan lambat | Modul khusus terpisah, pop-up terbuka sangat responsif |
| **Kelancaran Scroll Tab Akumulasi** | Agak patah-patah karena hitung ulang terus | Sangat halus (*smooth*) karena hasil hitungan disimpan pintar |
| **Daftar Antrean Offline** | Menumpuk di layar utama | Dipisah menjadi dialog mandiri yang hemat memori |
