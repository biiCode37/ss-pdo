# Audit Temuan Bug Refact 38: Relasi Many-to-Many Route Operators & Date Navigator Monitoring

Dokumen audit ini mencatat hasil investigasi sistematis (*systematic debugging*) terhadap kendala halaman Monitoring Wilayah Utara di mana tidak ada data rute/KPI yang tampil serta tanggal pemantauan tidak dapat diganti oleh pengguna.

---

## 1. Daftar Temuan Bug

### REF38-DB-001: Kegagalan Relasi Join PostgREST pada `fetchRouteMasterList` (PGRST200)

- **Lokasi Kode**: `src/services/dailyRouteReportService.ts` (`fetchRouteMasterList`, baris 13)
- **Tingkat Keparahan**: **CRITICAL** (Blocker)
- **Deskripsi Bug**:
  Kueri Supabase memanggil `.from('routes').select('*, operators(*)')`. Karena relasi antara tabel `routes` dan `operators` telah dinormalisasi menjadi Many-to-Many melalui tabel pivot `route_operators` pada migrasi `20260911000002_normalize_route_operators.sql` (kolom `operator_id` pada `routes` telah dihapus), PostgREST menolak kueri dengan pesan kesalahan HTTP 400:
  `PGRST200: Searched for a foreign key relationship between 'routes' and 'operators' in the schema 'public', but no matches were found. Hint: Perhaps you meant 'route_operators' instead of 'operators'.`
- **Dampak User**:
  Fungsi `fetchRouteMasterList()` menangkap error dan mengembalikan array kosong `[]`. Akibatnya, pada halaman Monitoring Wilayah Utara (`AllRouteMonitoringPage.tsx`), seluruh metrik regional (Status Kelengkapan 0/0 Rute Siap, 0 org pelanggan, 0,0 km, 0 bus armada) tampil kosong melompong (0) dan tidak ada satu pun kartu rute yang dirender.
- **Mitigasi**:
  Ubah kueri relasi menjadi kueri eksplisit melalui tabel pivot: `.from('routes').select('*, route_operators(operator_id, operators(*))')`, kemudian ekstrak entitas `operators` dari array `route_operators` untuk diformat menggunakan `formatOperatorsDisplay(ops)`.

---

### REF38-UI-001: Date Navigator Mengalami Forced Reset & Shift Timezone di `AllRouteMonitoringPage`

- **Lokasi Kode**: `src/components/AllRouteMonitoringPage.tsx` (`useEffect`, baris 92-96, dan `handleStepDate`, baris 133-144)
- **Tingkat Keparahan**: **HIGH** (Major UX Bug)
- **Deskripsi Bug**:
  1. **Forced Reset Efek Samping**: `useEffect` sinkronisasi tanggal di `AllRouteMonitoringPage.tsx` menyertakan `selectedDate` ke dalam array dependency:
     ```tsx
     useEffect(() => {
       if (currentDate && currentDate !== selectedDate) {
         setSelectedDate(currentDate);
       }
     }, [currentDate, selectedDate]);
     ```
     Ketika user menekan tombol navigasi tanggal (`<` atau `>`) atau memilih tanggal baru, `selectedDate` berubah. Perubahan tersebut langsung memicu eksekusi `useEffect`, yang mendeteksi `currentDate !== selectedDate` (karena prop `currentDate` dari parent belum/tidak berubah), lalu secara paksa mereset kembali `selectedDate` ke `currentDate`. Pengguna melihat tanggal seketika berkedip dan kembali ke tanggal semula.
  2. **Timezone Shift ISO String**: Pada `handleStepDate`, perhitungan tanggal menggunakan `new Date(y, m - 1, d + days).toISOString().split('T')[0]`. Pada zona waktu Indonesia (WIB / UTC+7), jam 00:00:00 lokal dikonversi menjadi jam 17:00:00 UTC hari sebelumnya, sehingga pergeseran tanggal meleset/tidak bertambah.
  3. **Unbound Event Prop**: Di `Dashboard.tsx`, komponen `<AllRouteMonitoringPage>` dirender tanpa prop `onDateChange`, sehingga parent tidak pernah menerima tanggal hasil pilihan user di halaman monitoring.
- **Dampak User**:
  Pengguna sama sekali tidak bisa berpindah tanggal pada halaman Monitoring Wilayah Utara; setiap kali tombol navigasi tanggal atau date picker ditekan, tampilan tanggal langsung terkunci dan kembali ke tanggal hari ini/tanggal sheet aktif.
- **Mitigasi**:
  1. Ganti sinkronisasi `useEffect` menggunakan `prevCurrentDateRef = useRef(currentDate)` sehingga hanya melakukan sinkronisasi jika prop `currentDate` dari parent benar-benar berganti nilainya.
  2. Gunakan fungsi utilitas murni `getRelativeDate(selectedDate, days)` yang berbasis `Date.UTC` untuk mengeliminasi risiko pergeseran zona waktu.
  3. Pasang state `monitoringDate` dan handler `onDateChange` pada `Dashboard.tsx` agar sinkronisasi tanggal dua arah antara Dashboard dan Monitoring Wilayah berjalan mulus.
