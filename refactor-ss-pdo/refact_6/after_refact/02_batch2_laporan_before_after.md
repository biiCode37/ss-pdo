# 📋 Laporan Before-After — Batch 2: Keandalan & Kenyamanan Saat Bekerja Offline

Dokumen ini menjelaskan perubahan apa saja yang telah diperbaiki pada **Batch 2** menggunakan bahasa sehari-hari yang mudah dipahami, seputar kelancaran penggunaan aplikasi saat sinyal internet naik-turun di lapangan.

---

## 1. Tetap Bisa Buka Aplikasi Saat Internet Mati Total (SOL-R6-011)

### 🔴 Sebelum Diperbaiki (Before):
- Ketika petugas membuka aplikasi di area tanpa sinyal (misalnya di basement pul bus atau terminal bawah tanah), aplikasi berusaha menghubungi server database rute terlebih dahulu.
- Karena sinyal tidak ada, aplikasi langsung macet di layar pembuka (*stuck*) dan menolak masuk.
- **Akibatnya:** Petugas tidak bisa melihat catatan shift sebelumnya atau memasukkan data secara offline.

### 🟢 Sesudah Diperbaiki (After):
- Sekarang, jika server atau internet tidak bisa dihubungi saat aplikasi dibuka, aplikasi secara otomatis menggunakan data rute dan profil yang tersimpan di memori HP.
- Layar utama langsung terbuka dengan lancar tanpa terhalang sinyal mati.
- **Manfaat Nyata:** Petugas tetap bisa bekerja mencatat bus kapan saja dan di mana saja, bahkan di lokasi tanpa sinyal sama sekali.

---

## 2. Pengalaman Perpanjangan Sesi Akun Google (SOL-R6-004 & SOL-R6-005)

### 🔴 Sebelum Diperbaiki (Before):
- Ketika kunci akses Google kedaluwarsa setelah berjam-jam bekerja, aplikasi kerap memunculkan pop-up izin Google berulang-ulang yang meminta konfirmasi akun lagi.
- Jika sinyal sedang lemah saat proses perpanjangan token, terkadang muncul pesan error berbahasa Inggris yang membingungkan petugas.

### 🟢 Sesudah Diperbaiki (After):
- Proses perpanjangan izin Google sekarang berjalan senyap di latar belakang (*silent refresh*).
- Jika petugas sudah pernah mengizinkan, aplikasi langsung memperbarui kunci akses tanpa memunculkan pop-up yang mengganggu pekerjaan.
- Jika sinyal sedang benar-benar hilang, aplikasi menunggu dengan sabar tanpa memunculkan pesan error aneh di layar.
- **Manfaat Nyata:** Petugas tidak terganggu dengan pop-up Google yang berulang-ulang saat sibuk menginput data bus.

---

## 3. Antrean Penyimpanan Data Saat Offline yang Lebih Kuat (SOL-R6-015 & SOL-R6-016)

### 🔴 Sebelum Diperbaiki (Before):
- Saat petugas mengedit 10 unit bus saat tidak ada sinyal, data tersebut masuk ke dalam "Kotak Antrean".
- Namun, jika internet tiba-tiba menyala sebentar lalu mati lagi dengan cepat, ada risiko data antrean terkirim ganda atau urutannya berantakan.

### 🟢 Sesudah Diperbaiki (After):
- Kotak antrean offline kini dilengkapi sistem pengaman ganda:
  1. Setiap data yang diedit diberi nomor seri unik tingkat dunia (*UUID*) sehingga tidak mungkin tertukar atau terkirim ganda.
  2. Proses pengiriman data ke Google Sheets dikunci agar berjalan teratur satu per satu sesuai urutan input petugas.
- **Manfaat Nyata:** Data yang diinput petugas saat sinyal hilang 100% aman, tidak akan hilang, dan akan langsung masuk rapi ke Google Sheets begitu HP mendapat sinyal internet kembali.

---

## 4. Pembersihan Memori Otomatis Saat Ada Pembaruan Aplikasi (SOL-R6-027)

### 🔴 Sebelum Diperbaiki (Before):
- Saat aplikasi mendapatkan fitur baru atau perbaikan, memori lama di HP petugas terkadang masih menyimpan data versi lama.
- **Akibatnya:** Petugas kadang harus menghapus riwayat penjelajahan (*clear cache browser*) secara manual agar fitur baru bisa muncul.

### 🟢 Sesudah Diperbaiki (After):
- Aplikasi sekarang memiliki nomor versi memori otomatis (*Cache Version 6*).
- Begitu ada pembaruan, aplikasi secara otomatis membersihkan sisa data lama yang sudah tidak terpakai dan menggantinya dengan versi terbaru tanpa perlu campur tangan petugas.
- **Manfaat Nyata:** Petugas selalu mendapatkan versi aplikasi yang paling baru, bersih, dan bebas dari sisa error masa lalu tanpa perlu repot membersihkan browser.

---

## 📊 Rangkuman Perubahan Batch 2

| Situasi / Kondisi | Sebelum Perbaikan | Sesudah Perbaikan |
|---|---|---|
| **Buka App di Tempat Tanpa Sinyal** | Aplikasi macet tidak bisa masuk | Langsung masuk menggunakan data rute yang tersimpan di HP |
| **Izin Akun Google Habis** | Muncul jendela pop-up Google berkali-kali | Diperbarui otomatis di latar belakang tanpa mengganggu |
| **Input Data Saat Sinyal Hilang** | Ada risiko data tertukar saat sinyal hidup-mati | Data tersimpan aman di antrean dan terkirim rapi satu per satu |
| **Pembaruan Aplikasi** | Petugas harus manual hapus cache browser | Memori aplikasi otomatis diperbarui dan bersih dengan sendirinya |
