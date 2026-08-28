# Laporan Perbaikan — Revamp Halaman Log Aktivitas (SS_PDO)

## Ringkasan
- Folder refactor: `refactor-ss-pdo/refact_8`
- Perubahan utama: Halaman log aktivitas ditulis ulang dengan bahasa awam, kartu detail berisi before/after untuk log baru, dan kategori diperjelas.

## BUG-29: Bahasa Log Aktivitas Terlalu Teknis
- **Before:**
  - Judul kartu: "Input / Simpan Data Bus"
  - Deskripsi: "Tab: 12 · Baris 14"
  - ID teknis terlihat: `sheetId`, `queueItemId`, `routeId`.
- **After:**
  - Judul kartu: "Budi memperbarui data bus"
  - Deskripsi: "Data operasional satu unit bus diperbarui."
  - Chip: nama kolom yang berubah dalam bahasa manusia (mis. "KM Akhir S1", "Keterangan").
  - Tidak ada ID teknis di permukaan.
- **Case:**
  - Pengawas lapangan membuka halaman log. Sebelumnya harus menebak arti "Sinkronisasi Antrean Offline", sekarang terbaca jelas: "Andi menyinkronkan perubahan ke spreadsheet — Perubahan data yang sebelumnya tertunda berhasil dikirim ke Google Sheets."
  - Supervisor mendapat laporan palsu: "Update Bus oleh Petugas A" tanpa konteks. Sekarang terbaca: "Budi memperbarui data bus MB-01 · Rute M-01".

## BUG-30: Tidak Ada Cara Melihat Nilai Before/After
- **Before:** Log hanya menampilkan chip nama kolom tanpa nilai konkret.
- **After:**
  - Log baru untuk `UPDATE_BUS_DATA` menyimpan `changedValues: { before, after }`.
  - Tombol "Lihat detail" membuka panel dua kolom: SEBELUM dan SESUDAH.
  - Log lama tanpa `changedValues` tampil pesan: "Nilai sebelum dan sesudah belum tersedia untuk riwayat lama."
- **Case:**
  - Supervisor ingin tahu berapa KM Awal S1 sebelum Andik ubah. Buka detail kartu → tampil "SEBELUM: 12450", "SESUDAH: 12875".
  - Riwayat log lama yang tidak membawa snapshot: tampil pesan informatif, tidak crash.

## BUG-31: Kategori Filter Tidak Sesuai
- **Before:** Hanya tersedia tab: Semua, Input Operasional, Pengguna, Sistem.
- **After:** Tab baru: Semua, Data Bus, Pengguna, Rute, Sinkronisasi, Login, Sistem.
- **Case:**
  - Pengawas fokus audit perubahan rute → ketuk tab "Rute" → hanya `CREATE_ROUTE`, `DELETE_ROUTE`, dan `FORMAT_WHOLE_SHEET` tampil.
  - Tim jaringan fokus sync offline → tab "Sinkronisasi" hanya memuat `SYNC_OFFLINE_QUEUE`.

## BUG-32: Nama User Hanya Email
- **Before:** Footer hanya `budi.santoso@transjakarta.co.id`.
- **After:** Ditampilkan sebagai "Budi Santoso" (nama turunan email). Email tetap tersedia sebagai fallback di tooltip.
- **Case:**
  - Daftar log panjang untuk rapat mingguan — supervisor langsung mengenali pelaku tanpa harus membaca email lengkap.

## Aspek Performa dan Keamanan
- Tidak ada request API tambahan — formatter berjalan di sisi client dari data yang sudah dimuat (maks 150 log).
- `formatAction` dimemoization dengan `useMemo` agar tidak diulang tiap render.
- Render detail hanya untuk item yang dibuka (state `expandedIds` sebagai `Set<number>`).
- Field teknis disembunyikan dari UI sehingga mengurangi risiko kebocoran ID internal.
- Payload `details` yang dikirim ke UI hanya menampilkan nilai bersih; tidak ada raw JSON.
