# Audit Bug — Revamp Halaman Log Aktivitas (SS_PDO)

## Ringkasan Eksekutif
- Total temuan: 4 bug
- Tingkat keparahan: 1 Tinggi, 2 Sedang, 1 Rendah

## BUG-29: Bahasa Log Aktivitas Terlalu Teknis untuk User Non-Developer
- Lokasi: `src/components/AuditLogPage.tsx` (`formatAction`)
- Tingkat Keparahan: Tinggi
- Deskripsi: Halaman log menggunakan label seperti "Input / Simpan Data Bus", "Perapian Format Spreadsheet", "Autentikasi sesi via Google OAuth (GIS)", dan "Sinkronisasi Antrean Offline". Detail menampilkan ID teknis seperti `sheetId`, `rowIndex`, `queueItemId`, dan raw JSON.
- Dampak User: Pengawas/admin lapangan membaca narasi yang tidak mencerminkan domain operasional sehingga sulit menelusuri siapa, melakukan apa, di mana, dan apa dampaknya.
- Mitigasi: Bentuk kalimat awam dengan pola "<Nama> <melakukan aksi> <objek>", sembunyikan ID teknis default, simpan di balik tombol "Lihat detail".

## BUG-30: Tidak Ada Cara Melihat Nilai Before/After Perubahan Data
- Lokasi: `src/components/AuditLogPage.tsx` (kartu log) & `src/services/googleSheets/mutations.ts` (`updateBusData`)
- Tingkat Keparahan: Sedang
- Deskripsi: Log hanya menampilkan daftar kolom yang berubah tanpa nilai sebelum dan sesudah, sehingga tidak bisa menelusuri perubahan data secara riil.
- Dampak User: Saat supervisor ingin mengaudit manipulasi data, tidak tersedia nilai konkret. Log hanya berupa chip nama kolom.
- Mitigasi: Simpan `changedValues: { before, after }` pada log baru untuk `UPDATE_BUS_DATA`, tampilkan panel dua kolom saat user mengetuk "Lihat detail".

## BUG-31: Kategori Filter Tidak Sesuai Aktivitas di Lapangan
- Lokasi: `src/components/AuditLogPage.tsx` (tab kategori)
- Tingkat Keparahan: Sedang
- Deskripsi: Hanya ada kategori `Semua`, `Input Operasional`, `Pengguna`, `Sistem`. Aktivitas seperti `CREATE_ROUTE`, `DELETE_ROUTE`, `SYNC_OFFLINE_QUEUE` semuanya jatuh ke "Sistem" padahal domainnya berbeda.
- Dampak User: Pengguna kesulitan memfilter kategori yang relevan, harus menggulung ratusan baris campuran.
- Mitigasi: Tambahkan kategori `Data Bus`, `Rute`, `Sinkronisasi`, `Login`. Klasifikasikan ulang berdasarkan aksi.

## BUG-32: Nama User Hanya Berupa Email Mentah
- Lokasi: `src/components/AuditLogPage.tsx` (footer kartu)
- Tingkat Keparahan: Rendah
- Deskripsi: Footer hanya menampilkan `user_email`. Banyak email internal tidak terbaca manusia (contoh: `budi.santoso@transjakarta.co.id`).
- Dampak User: sulit mengenali identitas pelaku dengan cepat.
- Mitigasi: Tampilkan nama turunan email (segment sebelum `@`, dikapitalisasi) sebagai label utama, dan tetap sertakan email di tooltip / sub-line.
