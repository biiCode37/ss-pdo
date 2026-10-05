# AUDIT BUGS — Refactor 35: Isolasi Penuh State Form Tanggal dan Pencegahan Kedipan Refresh

## Ringkasan Eksekutif
Pengguna melaporkan bahwa saat memilih tanggal di form selector rute, nilai tanggal langsung berbalik kembali ke tanggal hari ini dan aplikasi berkedip seolah melakukan refresh/load data padahal tombol "Load Data Unit" belum ditekan. Investigasi mendalam menemukan adanya coupling langsung antara input form tanggal dengan state parent `Dashboard.tsx`, ditambah `useEffect` sinkronisasi yang secara keliru menimpa kembali tanggal form ke tab aktif dashboard pada setiap perubahan.

---

## Tabel Temuan Masalah

| ID | Lokasi Kode | Keparahan | Deskripsi Singkat | Dampak Pengguna | Mitigasi / Solusi |
|---|---|---|---|---|---|
| **BUG-35-01** | `src/components/RouteSelectorCard.tsx:387-405` | 🔴 Kritis (UX Loop & Form Lockout) | `useEffect` sinkronisasi `selectedTab` ke `currentTabName` memiliki `selectedTab` di dependency array dan dipicu oleh `externalOpenTrigger > 0`, sehingga saat pengguna memilih tanggal baru, effect ini langsung menimpa kembali pilihan tanggal ke `currentTabName` (hari ini). | Pengguna terkunci tidak bisa memilih tanggal lain selain hari ini di form route selector. | Hapus kedua `useEffect` destruktif tersebut. Ganti dengan state form lokal mandiri (`formTab`) yang tidak terikat langsung ke parent effect. |
| **BUG-35-02** | `src/components/RouteSelectorCard.tsx:694` | 🟠 Tinggi (Arsitektur Form) | Dropdown tanggal form di-bind langsung ke prop `selectedTab` milik parent `Dashboard.tsx`, bukan state lokal form (berbeda dengan Tahun, Bulan, dan Rute yang memiliki state internal). | Setiap perubahan dropdown tanggal langsung mengubah state root Dashboard, memicu re-render parent dan fetch laporan rute harian prematur (aplikasi berkedip/refresh). | Jadikan tanggal sebagai level ke-4 state lokal form (`formTab`). Komit ke `selectedTab` parent HANYA saat tombol "Load Data Unit" diklik. |
| **BUG-35-03** | `src/components/Dashboard.tsx:561` | 🟡 Sedang (Stabilitas Reaktif) | `operationalReportDate` diturunkan langsung dari `selectedTab`, bukan dari `currentTabName` (tab data aktif). | Fetch laporan operasional rute harian terpicu saat form baru disentuh pengguna. | Prioritaskan `currentTabName || selectedTab` pada `operationalReportDate` agar hanya bereaksi saat data baru benar-benar dimuat. |
| **BUG-35-04** | `src/components/RouteSelectorCard.tsx:273` | 🟡 Sedang (Side-Effect Mount) | Saat rute belum terpilih, `loadRoutes()` memanggil `setSelectedTab('')` yang menghapus state tanggal parent saat mount. | Nilai tanggal di parent Dashboard terhapus secara tidak sengaja. | Hapus pemanggilan `setSelectedTab('')` saat mount; hanya reset `formTab` lokal jika rute kosong. |
