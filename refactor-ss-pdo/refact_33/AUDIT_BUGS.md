# AUDIT BUGS — Refactor 33: Ketidaksinkronan Tanggal Awal Selector Rute

## Ringkasan Eksekutif
Pengguna melaporkan adanya bug visual dan fungsional di mana saat aplikasi pertama kali dibuka, pill tanggal bagian atas menampilkan tanggal hari ini (*today*), namun saat badge pill kode rute di-tap untuk membuka drawer form route & date selector, form input tersebut masih menampilkan tanggal lain (bukan tanggal hari ini), sehingga terjadi ketidaksinkronan state antara header dan selector drawer.

---

## Tabel Temuan Masalah

| ID | Lokasi Kode | Keparahan | Deskripsi Singkat | Dampak Pengguna | Mitigasi / Solusi |
|---|---|---|---|---|---|
| **BUG-33-01** | `src/components/RouteSelectorCard.tsx:247` | 🟠 Tinggi (Integritas Data & UX) | Pemulihan state dari `localStorage` (`PDO_LAST_VISITED`) secara buta menimpa `selectedTab` dengan `parsed.selectedTab` (tanggal sesi lama), tanpa mengecek apakah rute tersebut adalah bulan & tahun berjalan. | Pengguna melihat tanggal lampau di dalam form route selector, dan jika menekan "Muat Data", spreadsheet akan memuat data tanggal lama alih-alih tanggal hari ini. | Validasi apakah rute tersimpan adalah periode berjalan (`currentYear` & `currentMonth`); jika ya, prioritaskan tanggal HARI INI (`String(new Date().getDate())`). |
| **BUG-33-02** | `src/components/RouteSelectorCard.tsx:385` | 🟡 Sedang (Sinkronisasi Reaktif) | Saat `externalOpenTrigger` terpicu (badge kode rute di-tap oleh pengguna), form selector tidak menyelaraskan `selectedTab` dengan `currentTabName` yang sedang aktif di layar. | Dropdown tanggal di dalam drawer form berisiko menampilkan nilai stale/desinkron dengan data yang sedang aktif di dashboard. | Tambahkan listener sinkronisasi reaktif `currentTabName` dan sinkronisasi instan saat `externalOpenTrigger` terpicu sebelum membuka drawer. |
| **BUG-33-03** | `src/components/Dashboard.tsx:449` | 🟢 Rendah (Konsistensi State) | Setelah data berhasil dimuat (`handleLoadData`), `setCurrentTabName(activeTab)` dipanggil namun `handleSetSelectedTab(activeTab)` tidak dipanggil secara eksplisit untuk menjaga konsistensi state dan ref parent. | Potensi drift antara `selectedTab` dan `currentTabName` di level Dashboard jika terjadi pemanggilan async eksternal. | Panggil `handleSetSelectedTab(activeTab)` bersamaan dengan `setCurrentTabName(activeTab)` saat load sukses. |
