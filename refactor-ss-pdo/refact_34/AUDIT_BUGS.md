# AUDIT BUGS — Refactor 34: Isolasi Pemicu Pemuatan Data pada Form Route Selector

## Ringkasan Eksekutif
Pengguna menemukan bahwa saat memilih tanggal pada dropdown di drawer Route & Date Selector, aplikasi langsung memicu proses pemuatan data (*auto-load*) ke Google Sheets di latar belakang sebelum pengguna menekan tombol "Load Data Unit". Perilaku ini menyalahi pola interaksi form dan aturan BUG-68 di mana pemilihan dropdown (tahun, bulan, rute, tanggal) seharusnya hanya mengubah state sementara, dan pemuatan data hanya boleh dieksekusi saat tombol "Load Data Unit" ditekan secara eksplisit.

---

## Tabel Temuan Masalah

| ID | Lokasi Kode | Keparahan | Deskripsi Singkat | Dampak Pengguna | Mitigasi / Solusi |
|---|---|---|---|---|---|
| **BUG-34-01** | `src/components/RouteSelectorCard.tsx:351` | 🟠 Sedang (UX & Efisiensi Jaringan) | `handleTabChange` langsung memanggil `onExitAccumulation(tab)` atau `onLoadData(tab, sheetUrl)` setiap kali nilai dropdown tanggal berubah (`onChange`). | Aplikasi melakukan fetch jaringan prematur saat pengguna baru memilih tanggal di form, mengabaikan tombol "Load Data Unit", dan memicu re-render tak diinginkan jika pengguna belum selesai mengatur form. | Hapus pemanggilan `onLoadData` / `onExitAccumulation` dari `handleTabChange`. Jadikan `handleTabChange` murni hanya memperbarui `selectedTab`. Tangani pemuatan data dan transisi keluar akumulasi hanya pada event klik tombol "Load Data Unit". |
