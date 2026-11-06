# REPAIR REPORT: REFACTOR 200
**Modul:** Klien Supabase, Halaman Monitoring 18 Rute, Dashboard Akumulasi Lintas Periode
**Tanggal:** 06 November 2026
**Status:** Tahap 1 selesai (BUG-QUOTA-200-01 s.d. 04). BUG-QUOTA-200-05 dan 06 **ditunda ke Tahap 2** dan belum diimplementasikan.

---

## 1. Implementasi Perbaikan

### A. Circuit Breaker Request (`src/services/requestCircuitBreaker.ts`, `src/services/supabase.ts`, `src/App.tsx`) — BUG-QUOTA-200-01
- Modul baru `createGuardedFetch` dipasang sebagai `global.fetch` milik klien Supabase.
- Request dihitung per tab dalam jendela geser 60 detik, terpisah untuk dua bucket: `/rest/v1/` (batas 150) dan `/functions/v1/` (batas 200). Request lain (auth, realtime) tidak dihitung.
- Jika batas terlewati, sirkuit **terbuka permanen sampai halaman dimuat ulang**: setiap request berikutnya langsung dibalas `429 CLIENT_CIRCUIT_OPEN` tanpa menyentuh jaringan, sehingga tidak ada egress maupun baris log.
- `App.tsx` mendengarkan event `supabase-circuit-open` dan menampilkan dialog ramah dari kamus teks (`TEXT_ERRORS.REQUEST_LIMIT_TITLE` / `REQUEST_LIMIT_MESSAGE`).
- Ambang ditetapkan dari beban sah tertinggi hasil analisis kode: ingestion regional ±40 upsert REST dan ±80 panggilan sheets-proxy per menit; satu muat Monitoring = 5 request. Asumsi ini dicatat dengan komentar `ponytail` di kode.

### B. Realtime Monitoring Hemat Kuota (`src/components/monitoring/AllRouteMonitoringPage.tsx`) — BUG-QUOTA-200-02
- Mode harian: listener `postgres_changes` memakai `filter: date=eq.<tanggal dilihat>`, sehingga perubahan pada tanggal atau rute lain di masa lalu tidak lagi memicu muat ulang. Mode periode tetap tanpa filter.
- Muat ulang hening dibatasi **paling cepat 60 detik** sejak muat ulang sebelumnya (`REALTIME_MIN_INTERVAL_MS`), dengan peredaman minimal 3 detik (`REALTIME_MIN_DEBOUNCE_MS`). Event yang datang saat timer berjalan digabung menjadi satu muat ulang.
- Saat tab atau PWA tersembunyi, muat ulang ditunda dan ditandai *pending*. Ketika tab kembali terlihat, data dimuat **satu kali**.
- Cleanup tetap lengkap: `clearTimeout`, `removeEventListener('visibilitychange')`, dan `supabase.removeChannel`. Channel berlangganan ulang hanya ketika tanggal filter berubah.

### C. Hapus Request Fleet Shift Ganda (`src/services/allRouteMonitoringService.ts`, `AllRouteMonitoringPage.tsx`) — BUG-QUOTA-200-03
- `RegionalMonitoringResult` mendapat field opsional `fleetShifts`, diisi dari langkah 3b `fetchRegionalMonitoringData`.
- `loadData` memakai `regionalRes.fleetShifts` bila tanggalnya sama dengan `selectedDate`. Pemanggilan `fetchDailyFleetShiftsByDate` hanya dilakukan sebagai cadangan, misalnya di mode periode.

### D. Akumulasi Lintas Periode Tersaring di Server (`src/services/routes/routes.ts`) — BUG-QUOTA-200-04
- `getCrossPeriodAccumulation` kini memfilter bulan di server lewat helper baru `buildMonthRangeFilter`, memproyeksikan 11 kolom yang dipakai (bukan `select *`), dan mengambil data **berhalaman 1.000 baris** (`order id` + `range`) sampai halaman terakhir. Penyaringan hari di bulan batas tetap dilakukan di klien seperti semula.

### E. Kamus Teks (`src/constants/texts/text_errors.ts`)
- Menambah `REQUEST_LIMIT_TITLE` dan `REQUEST_LIMIT_MESSAGE` beserta uji integritas di `texts.test.ts`.

---

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| Loop request di komponen mana pun | Berjalan tanpa batas sampai kuota org habis | Terhenti otomatis setelah >150 request REST per menit per tab; user diminta memuat ulang |
| Pemicu muat ulang Monitoring | Setiap update `daily_route_reports` di semua rute dan semua tanggal (±500/hari), termasuk saat tab tersembunyi | Hanya tanggal yang dilihat, maksimal 1× per 60 detik, ditunda saat tab tersembunyi |
| Batas teoretis muat ulang per penonton | Tidak terbatas (bergantung laju edit lapangan) | ≤60 per jam tab terlihat |
| Request per muat Monitoring | 6 (fleet shift ×2) | 5 |
| Payload akumulasi JAK.60 (Okt–Nov) | 342 KB mentah, `select *` seluruh riwayat | 168 KB mentah, hanya bulan dalam rentang dan 11 kolom |
| Kebenaran angka akumulasi JAK.60 (1 Okt – 6 Nov) | Terpotong di 1.000 baris → 650 baris, KM **89.466** | Lengkap 980 baris, KM **470.559** |

Angka baris terakhir diukur langsung pada data produksi proyek baru (read-only, via REST anon) pada 6 Nov 2026.

---

## 3. Case: Skenario Lapangan

### Case BUG-QUOTA-200-01: Regresi loop di halaman baru
- **Situasi:** Rilis berikutnya tanpa sengaja memasukkan state ke dependency `useCallback`, sehingga sebuah halaman memuat data terus-menerus.
- **Before:** Ratusan ribu request dalam beberapa hari. Kuota egress org habis, semua user (termasuk yang tidak membuka halaman itu) mendapat 402 dan tidak bisa login, seperti insiden 6 Nov.
- **After:** Dalam kurang dari 1 menit tab yang bermasalah melewati batas 150 request. Sirkuit terbuka, user di tab itu melihat dialog "Aplikasi Dijeda Sementara", dan kerusakan berhenti di ±150 request per tab. User lain tidak terdampak, dan pesan di konsol menjadi petunjuk untuk developer.

### Case BUG-QUOTA-200-02: Korwil membiarkan Monitoring terbuka seharian
- **Situasi:** Korwil membuka Monitoring di laptop kantor sejak pagi, sementara petugas di 18 rute terus mengedit spreadsheet (±500 update per hari, sebagian untuk tanggal kemarin).
- **Before:** Setiap jeda edit memicu muat ulang penuh ±0,3 MB, hingga ratusan kali per hari, termasuk saat laptop terkunci atau tab tertutup jendela lain.
- **After:** Hanya update tanggal hari ini yang dihitung, maksimal 1 muat ulang per menit. Saat tab tidak terlihat tidak ada request; begitu Korwil kembali ke tab, data diperbarui sekali. Angka bisa terlambat paling lama ±60 detik.

### Case BUG-QUOTA-200-03: Membuka Monitoring harian
- **Situasi:** Admin membuka Monitoring untuk tanggal hari ini.
- **Before:** `daily_fleet_shifts` diambil dua kali dengan hasil identik.
- **After:** Diambil sekali, dan data armada di tab Fleet Status tetap sama.

### Case BUG-QUOTA-200-04: Rekap akumulasi lintas bulan
- **Situasi:** PDO JAK.60 membuka akumulasi lintas periode 1 Okt – 6 Nov.
- **Before:** Aplikasi mengunduh seluruh riwayat JAK.60 (makin besar setiap hari). PostgREST memotong di 1.000 baris paling awal, sehingga data Oktober akhir dan November hilang tanpa pesan dan total KM tampil 89.466.
- **After:** Hanya data Oktober–November yang diunduh, lengkap lewat paginasi. Total KM yang benar, 470.559, tampil.

### Ditunda ke Tahap 2
- **BUG-QUOTA-200-05** (agregasi Monitoring di database lewat fungsi SQL): butuh migrasi baru, dipisahkan agar Tahap 1 dapat dirilis tanpa perubahan skema.
- **BUG-QUOTA-200-06** (alarm kuota harian via GitHub Actions): belum diimplementasikan.

---

## 4. Verifikasi

| Gate | Status | Hasil |
|---|---|---|
| 1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` | Lulus | 1 file, 116/116 tes |
| 2. `pnpm vitest run src/` | Lulus | 144 file, 1.302/1.302 tes |
| 3. `pnpm run build` (`tsc -b` + Vite) | Lulus | exit 0, built in 1,64 s |
| 4. `graphify update .` | Lulus | 7.476 node, 9.396 edge, 708 komunitas |

Tes baru:
- `requestCircuitBreaker.test.ts`: 5 tes, termasuk loop memutus sirkuit dan beban sah tersebar yang tidak memicu.
- `AllRouteMonitoringPage.test.tsx`: +4 tes, yaitu filter tanggal, throttle 60 detik, jeda saat tab tersembunyi, dan tanpa fleet shift ganda.
- `routes.test.ts`: +4 tes, yaitu filter bulan, paginasi tepat 1.000 baris, dan helper rentang bulan lintas tahun.

**Belum diverifikasi:**
- Ambang circuit breaker belum diuji dengan beban sah nyata (sync 18 rute atau bulk update) di browser produksi.
- Filter Realtime `date=eq.` belum diuji end-to-end terhadap server Realtime. Yang sudah teruji hanya argumen subscribe di unit test.
