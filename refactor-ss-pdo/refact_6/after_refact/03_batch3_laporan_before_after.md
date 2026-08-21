# 📋 Laporan Before-After — Batch 3: Pembersihan Mesin, Penghematan Memori HP, & Keamanan

Dokumen ini menjelaskan perubahan pada **Batch 3** dengan bahasa yang mudah dipahami, berfokus pada kesehatan "mesin di balik layar" aplikasi agar HP petugas tidak cepat panas, tidak boros baterai, dan tetap gesit saat digunakan seharian penuh.

---

## 1. Pembatasan Memori Penyimpanan Spreadsheet (SOL-R6-008)

### 🔴 Sebelum Diperbaiki (Before):
- Saat koordinator atau petugas membuka banyak rute bus yang berbeda dalam satu hari (misalnya membuka 30 link Google Sheet rute berbeda secara bergantian), aplikasi terus menumpuk data identitas lembar kerja tersebut di memori RAM HP tanpa pernah dibuang.
- **Akibatnya:** Jika aplikasi dibuka dari pagi sampai malam, memori HP perlahan membengkak dan aplikasi terasa semakin lambat (*lag*).

### 🟢 Sesudah Diperbaiki (After):
- Aplikasi sekarang memiliki sistem pembatasan cerdas: maksimal hanya menyimpan 50 identitas lembar kerja terakhir.
- Jika sudah melewati batas 50, lembar kerja yang paling lama dibuka akan otomatis dibuang dari RAM untuk memberi ruang bagi yang baru.
- **Manfaat Nyata:** Aplikasi tetap ringan, cepat, dan tidak membuat HP cepat panas meskipun digunakan seharian penuh untuk mengecek puluhan rute.

---

## 2. Pembuangan Jalur Kode Usang / Bekas Percobaan (SOL-R6-006)

### 🔴 Sebelum Diperbaiki (Before):
- Masih terdapat sisa-sisa fungsi pemeriksaan login model lama dari versi awal pembuatan aplikasi yang sebenarnya sudah tidak terpakai lagi.
- Sisa kode ini tetap ikut dimuat setiap kali aplikasi dinyalakan.

### 🟢 Sesudah Diperbaiki (After):
- Semua fungsi usang dan kode mati tersebut telah dibersihkan secara tuntas.
- **Manfaat Nyata:** Ukuran aplikasi menjadi lebih ramping dan waktu muat awal (*loading awal*) menjadi lebih cepat.

---

## 3. Keamanan Alamat Server Database (SOL-R6-026)

### 🔴 Sebelum Diperbaiki (Before):
- Jika suatu saat pengaturan alamat server database terputus atau kosong, aplikasi memiliki alamat cadangan darurat yang mengarah ke domain contoh di internet publik.
- Meskipun tidak berbahaya, ini kurang baik dari sisi standar keamanan data operasional.

### 🟢 Sesudah Diperbaiki (After):
- Alamat cadangan darurat sekarang diarahkan ke ruang aman internal perangkat (*localhost*).
- Aplikasi tidak akan pernah mencoba mengirim data ke alamat asing mana pun di internet jika server sedang tidak tersedia.
- **Manfaat Nyata:** Data operasional armada bus 100% terjaga kerahasiaannya di dalam lingkungan yang terpercaya.

---

## 📊 Rangkuman Perubahan Batch 3

| Komponen | Sebelum Perbaikan | Sesudah Perbaikan |
|---|---|---|
| **Penggunaan RAM HP** | Memori terus bertambah jika buka banyak rute | Dibatasi maksimal 50 rute, yang lama otomatis dibersihkan |
| **Sisa Kode Lama** | Ada fungsi usang yang memperberat loading | Bersih dari kode mati, aplikasi terasa lebih gesit |
| **Keamanan Alamat Server** | Ada potensi menghubungi domain contoh | Terkunci rapat hanya ke server resmi yang sah |
