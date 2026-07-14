# Improvement v1.3 Design Spec: Offline Auto-Save & Skeleton Loaders

**Date**: 2026-07-14
**Topic**: Fitur Auto-save Draft, UX Visibilitas Offline, dan Skeleton Loading

## Context & Purpose
Setelah menyelesaikan perbaikan keamanan di v1.2, improvement v1.3 berfokus pada meningkatkan kenyamanan (UX) pengguna di lapangan:
1. Menyelamatkan data input form (draft) jika aplikasi ter-refresh atau mati secara tidak sengaja di blank spot.
2. Memberikan indikator UI yang jelas tentang jumlah antrean sinkronisasi agar pengguna tidak ragu.
3. Menggunakan efek loading (shimmer) yang lebih modern saat memuat data.

## 1. Auto-save Drafts (Pendekatan Per-Component LocalStorage)
**Tujuan**: Menyimpan isian form yang belum di-*submit* agar tidak hilang.
- **Mekanisme**: Setiap kali ada perubahan di komponen input (misal `BusCard.tsx`), nilai form akan disimpan ke `localStorage` dengan format *key* `draft_bus_{id}`.
- **Optimasi**: Kita akan menggunakan fungsi `debounce` (misal 1000ms) sebelum menyimpan ke storage agar tidak memberatkan browser di setiap ketikan.
- **Restorasi**: Saat komponen dimuat (`useEffect`), ia akan mengecek apakah ada draft di `localStorage`. Jika ada, data form diisi dengan draft tersebut.
- **Penghapusan**: Jika form berhasil disubmit (baik ke API langsung atau masuk ke antrean `PDO_SYNC_QUEUE`), draft dihapus dari `localStorage`.

## 2. UX Visibilitas Offline (Kombinasi Floating Badge & Modal)
**Tujuan**: Memberikan visibilitas status data yang belum tersinkronisasi.
- **Sync Badge**: Sebuah indikator kecil mengambang (pill) atau menempel di Header, yang hanya muncul jika panjang antrean `PDO_SYNC_QUEUE` > 0. Badge ini menunjukkan angka data yang tertunda.
- **Sync Queue Modal**: Jika `Sync Badge` diklik, sebuah modal/halaman pop-up akan muncul menampilkan rincian data mana saja yang sedang mengantre (misal: "Unit AB1234 - Menunggu Sinyal").
- **Error Status**: Jika ada data yang gagal dikirim setelah percobaan ulang, statusnya dapat ditandai merah di dalam modal ini.

## 3. Skeleton Loader (Menggunakan Phantom UI)
**Tujuan**: Mengganti teks 'Loading...' konvensional dengan *shimmer effect* yang menyesuaikan bentuk elemen asli.
- **Library**: `phantom-ui` (berbasis Web Component).
- **Implementasi**: Komponen yang membutuhkan loading state (seperti Card detail, list data) akan dibungkus dengan tag `<phantom-ui loading={isLoading}>`. 
- **Persiapan**: Kita perlu menambahkan type definition untuk TypeScript (karena ini web component) sesuai panduan dokumentasinya agar tidak ada *error* di JSX.

## Verifikasi dan Test Plan
1. **Test Auto-save**: Isi form, jangan simpan, muat ulang halaman. Pastikan isian form kembali terisi.
2. **Test Offline Badge**: Matikan koneksi (offline mode), isi form dan simpan. Pastikan masuk ke *Sync Badge*. Klik *badge* dan pastikan antrean terlihat di modal.
3. **Test Skeleton**: *Throttle* koneksi (Slow 3G), pastikan skeleton `phantom-ui` muncul dengan bentuk yang tepat meniru tata letak asli.
