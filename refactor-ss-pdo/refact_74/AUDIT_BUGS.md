# Audit Bugs & UX Review - Refactor 74

Dokumentasi audit dan evaluasi penempatan menu profil pada Dashboard Monitoring Wilayah 18 Rute.

---

## 1. Daftar Temuan

### BUG-REFACT74-01: Header Crowding & Thumb Reachability pada Menu Profil Monitoring
* **Lokasi Kode:**
  * [`src/components/monitoring/MonitoringHeader.tsx`](file:///d:/MINE/SS_PDO/src/components/monitoring/MonitoringHeader.tsx)
  * [`src/components/monitoring/MonitoringBottomNav.tsx`](file:///d:/MINE/SS_PDO/src/components/monitoring/MonitoringBottomNav.tsx)
  * [`src/components/monitoring/AllRouteMonitoringPage.tsx`](file:///d:/MINE/SS_PDO/src/components/monitoring/AllRouteMonitoringPage.tsx)
* **Kategori / Keparahan:** UX Ergonomics / Low (Mobile-First Polish)
* **Deskripsi Masalah:**
  Sebelumnya, tombol menu profil pengguna (`UserProfileHeader`) diletakkan di sudut kanan atas `MonitoringHeader`. Pada layar ponsel operasional petugas lapangan (lebar 360px–414px), keberadaan pill profil selebar ~140px menyebabkan area header berdesakan dengan kontrol tanggal, tombol perbarui data, dan tombol aksi direct *Tarik 18 Rute*. Selain itu, sudut kanan atas ponsel sulit dijangkau dengan satu tangan saat pengawas berada di lapangan (*thumb zone accessibility*).
* **Dampak Pengguna:**
  * Kontrol tanggal dan sinkronisasi rute di header rentan salah-tap (*accidental tap*) karena jarak padding yang menyempit di mobile.
  * Tampilan header terasa penuh sesak dan kurang proporsional.
* **Mitigasi & Solusi:**
  1. Hapus `UserProfileHeader` dari `MonitoringHeader` agar header lebih ringkas, fokus, dan lega.
  2. Integrasikan menu profil ke dalam deretan bilah navigasi bawah (`MonitoringBottomNav`) sebagai item ke-5 berlabel "Profil".
  3. Desain tombol profil di bottom nav secara fluid: menampilkan foto avatar pengguna jika tersedia, dengan fallback ikon `User` elegan, kurva pegas Apple iOS `cubic-bezier(0.32, 0.72, 0, 1)`, dan sentuhan interaksi satu jempol.
  4. Amankan seluruh teks antarmuka menggunakan kamus sentral `TEXT_MONITORING.NAV.PROFILE`.
