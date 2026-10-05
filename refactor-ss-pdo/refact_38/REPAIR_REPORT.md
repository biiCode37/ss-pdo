# Laporan Perbaikan Refact 38: Relasi Many-to-Many Route Operators & Date Navigator Monitoring

Laporan ini merangkum perbaikan komprehensif atas kendala hilangnya data operasional pada halaman Monitoring Wilayah Utara serta kegagalan navigasi tanggal monitoring.

---

## 1. Perbaikan Bug & Implementasi

### A. Perbaikan Query Join Relasi Many-to-Many Route Operators (REF38-DB-001)

- **Masalah**:
  Kueri `fetchRouteMasterList()` di `src/services/dailyRouteReportService.ts` sebelumnya memanggil `.select('*, operators(*)')`. Karena relasi langsung telah dihapus saat normalisasi Many-to-Many via tabel `route_operators`, PostgREST mengembalikan status HTTP 400 (`PGRST200`). Hal ini menyebabkan `fetchRouteMasterList()` mengembalikan array kosong `[]`, sehingga halaman Monitoring Wilayah Utara menampilkan seluruh metrik regional (0/0 Rute, 0 pelanggan, 0 bus) dalam keadaan kosong.
- **Solusi**:
  1. Mengubah kueri Supabase menjadi `.select('*, route_operators(operator_id, operators(*))')`.
  2. Mengekstrak entitas operator secara murni dari array relasi pivot:
     ```ts
     const ops = (r.route_operators || []).map((ro: any) => ro.operators).filter(Boolean);
     ```
  3. Memformat nama tampilan operator menggunakan SSOT `formatOperatorsDisplay(ops)`.

#### Before vs After:
```diff
--- Before (Error PGRST200)
- const { data, error } = await supabase
-   .from('routes')
-   .select('*, operators(*)')
-   .eq('is_active', true)
-   .order('route_code', { ascending: true });
-
- const formattedRoutes = (data || []).map((r: any) => ({
-   ...r,
-   operator_name: formatOperatorsDisplay(r.operators) || r.operator_name || 'Mikrotrans'
- }));

+++ After (Berhasil Mengambil 18 Rute)
+ const { data, error } = await supabase
+   .from('routes')
+   .select('*, route_operators(operator_id, operators(*))')
+   .eq('is_active', true)
+   .order('route_code', { ascending: true });
+
+ const formattedRoutes = (data || []).map((r: any) => {
+   const ops = (r.route_operators || []).map((ro: any) => ro.operators).filter(Boolean);
+   return {
+     ...r,
+     operators: ops,
+     operator_name: formatOperatorsDisplay(ops) || r.operator_name || 'Mikrotrans'
+   };
+ });
```

---

### B. Perbaikan Date Navigator & Eliminasi Timezone Shift (REF38-UI-001)

- **Masalah**:
  1. Di `AllRouteMonitoringPage.tsx`, `useEffect` yang menyinkronkan `selectedDate` dengan `currentDate` memiliki `selectedDate` dalam daftar dependency. Akibatnya, setiap kali user mengklik tombol hari berikutnya (`>`) atau sebelumnya (`<`), `selectedDate` yang berubah memicu efek samping yang langsung mereset nilainya kembali ke `currentDate`.
  2. `handleStepDate` menggunakan `new Date(y, m-1, d).toISOString()` yang pada zona waktu WIB (UTC+7) terpotong 7 jam mundur ke hari sebelumnya (UTC 17:00), mengakibatkan pergeseran tanggal tidak presisi.
  3. Di `Dashboard.tsx`, `<AllRouteMonitoringPage>` tidak mengikat handler `onDateChange`.
- **Solusi**:
  1. Menggunakan `prevCurrentDateRef = useRef(currentDate)` sehingga sinkronisasi dari parent hanya terjadi jika prop `currentDate` memang berganti dari parent, bukan karena perubahan lokal pengguna.
  2. Menggunakan fungsi utilitas `getRelativeDate(selectedDate, days)` yang berbasis `Date.UTC` untuk penambahan/pengurangan hari yang aman dari pergeseran zona waktu.
  3. Menambahkan state `monitoringDate` dan handler `onDateChange` di `Dashboard.tsx`, sekaligus menyinkronkan tab spreadsheet jika pengguna memilih suatu rute dari monitoring ke dashboard.

#### Before vs After:
```diff
--- Before (Reset Paksa & Timezone Shift)
- useEffect(() => {
-   if (currentDate && currentDate !== selectedDate) {
-     setSelectedDate(currentDate);
-   }
- }, [currentDate, selectedDate]);
-
- const handleStepDate = (days: number) => {
-   const [y, m, d] = selectedDate.split('-').map(Number);
-   const date = new Date(y, m - 1, d);
-   date.setDate(date.getDate() + days);
-   const nextDateStr = date.toISOString().split('T')[0];
-   setSelectedDate(nextDateStr);
-   onDateChange?.(nextDateStr);
- };

+++ After (Aman dari Reset & Timezone)
+ const prevCurrentDateRef = useRef(currentDate);
+ useEffect(() => {
+   if (currentDate && currentDate !== prevCurrentDateRef.current) {
+     prevCurrentDateRef.current = currentDate;
+     setSelectedDate(currentDate);
+   }
+ }, [currentDate]);
+
+ const handleStepDate = (days: number) => {
+   const nextDateStr = getRelativeDate(selectedDate, days);
+   setSelectedDate(nextDateStr);
+   onDateChange?.(nextDateStr);
+ };
```

---

## 2. Case: Skenario Lapangan

### Skenario 1: Petugas/Korlap Membuka Monitoring Wilayah Utara
- **Kondisi Awal**: Petugas membuka menu "Operasi Rute" / "Monitoring Wilayah Utara".
- **Sebelum Perbaikan**: Konsol browser dipenuhi pesan merah `400 Bad Request` dari Supabase (`PGRST200`). Ringkasan KPI wilayah menampilkan `0/0 Rute Siap`, `0 bus`, dan tidak ada satu pun rute yang muncul.
- **Setelah Perbaikan**: Seluruh 18 master rute aktif termuat sempurna beserta operator resmi masing-masing (termasuk rute KSO ganda seperti JAK.76 KMJ & KJG), KPI armada dan status kelengkapan terhitung dan tampil presisi secara real-time.

### Skenario 2: Korlap Meninjau Rekap Operasional Hari-Hari Sebelumnya
- **Kondisi Awal**: Korlap ingin memeriksa data operasional kemarin (H-1) atau minggu lalu dengan menekan tombol navigasi tanggal (`<`) atau memilih tanggal dari date picker.
- **Sebelum Perbaikan**: Setiap kali tombol ditekan, tanggal berkedip dan kembali lagi ke tanggal hari ini. Korlap tidak bisa berpindah tanggal sama sekali.
- **Setelah Perbaikan**: Korlap dapat dengan leluasa melompat ke tanggal berapa pun (mundur/maju) tanpa mengalami reset. Laporan harian rute untuk tanggal yang dipilih termuat seketika dan akurat.
