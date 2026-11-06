# AUDIT TEMUAN KUOTA SUPABASE (EGRESS & LOG): REFACTOR 200
**Modul:** Klien Supabase, Halaman Monitoring 18 Rute, Dashboard Akumulasi Lintas Periode, Pemantauan Kuota
**Fokus Masalah:** Insiden 6 Nov 2026 — org Free lama terkena Fair Use Restriction (semua request 402) karena Egress 12,5 / 5 GB (99,8% PostgREST) dan Log Ingestion 3 / 1 GB. App dipulihkan dengan migrasi ke proyek baru `znchudtormqsgpukibsn` (Singapore). Audit ini mencari cara agar kejadian serupa tidak terulang.

---

## Bukti yang Dipakai

1. **Dashboard Usage proyek lama** (siklus 13 Okt – 13 Nov 2026): Egress 12,5 GB, terdiri dari PostgREST 99,8%, Realtime 0,1%, Functions 0,1%. Lonjakan terjadi 24–26 Okt dan 1 Nov (2,6 GB dalam sehari). Setelah 2 Nov egress harian turun mendekati nol.
2. **`pg_stat_statements` proyek lama** (kumulatif sejak 4 Agu 2026, ±2,2 juta request PostgREST):

| Query | Calls | Pemanggil |
|---|---|---|
| `daily_fleet_shifts` per `date` | 827.183 | Monitoring (dipanggil **2×** per muat) |
| `routes` + `route_operators` | 425.188 | Monitoring (`fetchRouteMasterList`) |
| `daily_route_reports` `date = ANY(3 tanggal)` | 402.346 | Monitoring |
| `daily_unit_summaries` 3 tanggal (proyeksi kolom) | 323.851 | Monitoring |
| `daily_fleet_non_sgo_units` | 91.553 | Monitoring |
| `daily_unit_summaries` `select *` per tanggal | 78.603 | Jalur lama |

   Jumlah calls fleet_shifts kira-kira 2× calls monitoring. Ini konsisten dengan temuan BUG-QUOTA-200-03.
3. **Ukuran respons terukur** (proyek baru, 6 Nov 2026, lewat curl):

| Query | Mentah | gzip |
|---|---|---|
| `daily_unit_summaries` 3 tanggal | 164 KB (1.289 baris) | 10 KB |
| `daily_route_reports` 3 tanggal `select *` | 64 KB (54 baris) | 7 KB |
| `daily_unit_summaries` 1 rute seluruh riwayat `select *` | 342 KB (rute terbesar ±1 MB mentah) | 21 KB |

4. **Laju tulis `daily_route_reports`**: 29.669 update sejak 8 Sep 2026, rata-rata ±500 per hari. Setiap update memicu event Realtime ke semua penonton Monitoring.
5. **Anggaran Free Plan**: Egress 5 GB/bulan (±166 MB/hari), Log Ingestion 1 GB/bulan (penagihan baru berlaku awal 2027).

> **Belum terverifikasi:** apakah Supabase menghitung egress PostgREST dari ukuran mentah atau ukuran setelah gzip. Rekonsiliasi kasar (calls × ukuran gzip ≈ 10–11 GB, mendekati 12,5 GB) mengarah ke ukuran **terkompresi**. Namun ada diskusi komunitas yang menyebut kompresi terjadi di CDN setelah titik ukur. Karena itu mitigasi di bawah dirancang aman untuk **kedua** skenario.

---

### ID Temuan: BUG-QUOTA-200-01
- **Lokasi Kode:** `src/services/supabase.ts` (inisialisasi `createClient`)
- **Keparahan:** Critical (akar insiden; satu bug di komponen mana pun bisa mematikan app untuk semua user)
- **Deskripsi:** Tidak ada batas keras jumlah request per tab di sisi klien. Infinite loop di Monitoring (BUG-193-01, diperbaiki 2 Nov di `0dcd00c`) sempat berjalan berhari-hari dan menghasilkan ratusan ribu request. Aturan anti-loop di AGENTS.md hanya bersifat pencegahan saat review. Tidak ada jaring pengaman saat runtime, jadi regresi loop serupa di halaman lain akan terulang tanpa terdeteksi.
- **Dampak User:** Kuota org habis. Semua user (termasuk yang tidak membuka halaman bermasalah) tidak bisa login sampai siklus billing berikutnya, atau sampai dilakukan migrasi darurat seperti 6 Nov.
- **Mitigasi:** Pasang *circuit breaker* di `global.fetch` klien Supabase: hitung request per jendela 60 detik per tab. Jika melewati ambang (ditetapkan dari pengukuran beban sah tertinggi, misalnya bulk operation), blokir request REST berikutnya sampai halaman dimuat ulang dan tampilkan pesan ramah dari kamus teks. Disertai test yang membuktikan breaker terpicu pada loop dan tidak terpicu pada alur bulk yang sah.

---

### ID Temuan: BUG-QUOTA-200-02
- **Lokasi Kode:** `src/components/monitoring/AllRouteMonitoringPage.tsx` (listener `monitoring-realtime-reports`, ±baris 216–247)
- **Keparahan:** High (pengali egress terbesar setelah loop)
- **Deskripsi:** Listener Realtime mendengarkan **semua** perubahan `daily_route_reports` (semua rute, semua tanggal) tanpa filter. Setiap event, setelah debounce 3 detik, memuat ulang **seluruh** paket Monitoring (6 request: rute, laporan 3 tanggal, ringkasan unit 3 tanggal, fleet shift ×2, unit non-SGO). Reload tetap berjalan walaupun tab tersembunyi atau PWA sedang di latar belakang. Dengan ±500 update per hari, satu penonton yang membiarkan Monitoring terbuka bisa memicu ratusan muat ulang per hari.
- **Dampak User:** Skenario mentah: ±0,3 MB × ±500 = ±150 MB/hari per penonton, hampir menghabiskan seluruh anggaran harian (166 MB). Skenario gzip: ±10 MB/hari per penonton, aman tapi tetap boros. Hasilnya kuota menipis tanpa ada yang menyadari.
- **Mitigasi:** (a) Filter event ke tanggal yang sedang dilihat (`filter: date=eq.<selectedDate>`). (b) Lewati reload saat `document.visibilityState !== 'visible'`, tandai sebagai *pending*, lalu muat sekali saat tab kembali terlihat. (c) Throttle reload hening minimal 60 detik. Debounce 3 detik tetap dipertahankan sesuai AGENTS.md.

---

### ID Temuan: BUG-QUOTA-200-03
- **Lokasi Kode:** `src/components/monitoring/AllRouteMonitoringPage.tsx` (`loadData`, `fetchDailyFleetShiftsByDate`) dan `src/services/allRouteMonitoringService.ts` (`fetchRegionalMonitoringData` langkah 3b, ±baris 286–325)
- **Keparahan:** Medium (request ganda di setiap muat Monitoring)
- **Deskripsi:** `daily_fleet_shifts` untuk tanggal yang sama diambil dua kali per muat: sekali lewat `fetchDailyFleetShiftsByDate` di `loadData`, sekali lagi di langkah 3b `fetchRegionalMonitoringData`. Ini terbukti dari calls 827 ribu ≈ 2 × 402 ribu.
- **Dampak User:** Menggandakan request (dan baris log) di jalur terpanas. Payload saat ini kecil, tetapi baris log ikut menambah Log Ingestion yang sudah 300%.
- **Mitigasi:** Pakai satu sumber saja (hasil langkah 3b yang sudah membawa `non_sgo_units`), lalu hapus pemanggilan kedua.

---

### ID Temuan: BUG-QUOTA-200-04
- **Lokasi Kode:** `src/services/routes/routes.ts` (`getCrossPeriodAccumulation`, ±baris 289–315); dipanggil dari `src/components/dashboard/useDashboardData.ts` (baris 152 & 294)
- **Keparahan:** High (egress tumbuh linear dengan umur data, plus bug kebenaran data)
- **Deskripsi:** Query `daily_unit_summaries` `select *` difilter hanya berdasarkan `route_code`, sehingga seluruh riwayat rute ikut terunduh. Penyaringan rentang tanggal baru dilakukan di browser. Rute terbesar saat ini ±1 MB mentah per panggilan, dan ukurannya terus bertambah setiap hari. PostgREST juga membatasi respons ke 1.000 baris (bawaan Supabase), padahal satu rute bisa melebihi itu. Akibatnya data periode terbaru bisa **terpotong diam-diam** dan akumulasi menjadi salah tanpa pesan error.
- **Dampak User:** Dashboard akumulasi makin lambat dan makin boros kuota dari bulan ke bulan. Angka akumulasi lintas periode berisiko kurang dari yang sebenarnya untuk rute dengan riwayat panjang.
- **Mitigasi:** Pindahkan filter rentang ke server (`year`/`month` dalam rentang, atau `day` di bulan batas), proyeksikan hanya kolom yang dipakai, dan urutkan agar pemotongan tidak terjadi diam-diam.

---

### ID Temuan: BUG-QUOTA-200-05
- **Lokasi Kode:** `src/services/allRouteMonitoringService.ts` (`fetchRegionalMonitoringData` langkah 2–3, `fetchRegionalPeriodMonitoringData`)
- **Keparahan:** Medium (payload terbesar di jalur terpanas)
- **Deskripsi:** Monitoring mengunduh 1.289 baris ringkasan unit (164 KB mentah) hanya untuk dijumlahkan per rute dan tanggal di browser. Laporan rute juga diambil dengan `select *` (±882 B per baris) walaupun hanya sebagian kolom yang dipakai.
- **Dampak User:** Setiap muat Monitoring memakan ±0,3 MB mentah. Bersama BUG-QUOTA-200-02, ini menjadi pengali utama egress.
- **Mitigasi:** Agregasi di database lewat fungsi SQL `SECURITY INVOKER` (tetap tunduk RLS) yang mengembalikan total per rute dan tanggal (±54 baris), plus proyeksi kolom pada `daily_route_reports`. Perkiraan payload turun dari ±230 KB menjadi ±10 KB mentah per muat.

---

### ID Temuan: BUG-QUOTA-200-06
- **Lokasi Kode:** Tidak ada (celah operasional); kandidat: `.github/workflows/` dan `supabase/migrations/`
- **Keparahan:** High (insiden baru diketahui setelah app mati)
- **Deskripsi:** Free Plan tidak punya peringatan dini sebelum restriksi. Lonjakan 24–26 Okt dan 1 Nov sudah terlihat di grafik Usage, tetapi tidak ada yang memantau, sehingga insiden baru disadari ketika semua user gagal login.
- **Dampak User:** Tidak ada kesempatan memperbaiki sebelum app mati.
- **Mitigasi:** Workflow GitHub Actions harian (gratis) yang membaca `pg_stat_statements` lewat secret `SUPABASE_DB_URL` yang sudah ada, menyimpan snapshot jumlah calls per hari ke tabel kecil, dan **menggagalkan job** jika jumlah request harian melewati ambang. GitHub otomatis mengirim email kegagalan ke pemilik repo. Tidak perlu layanan atau dependency baru.

---

## Temuan Sampingan (di luar fokus kuota, dicatat untuk tindak lanjut)
- `daily_unit_summaries` berisi 586 baris dengan tanggal tidak valid (misalnya 31 September). Ini kemungkinan berasal dari parsing kolom tanggal Sheets.
- Endpoint `sheets-proxy` action `health` mengembalikan `client_email` service account ke publik. Ini bertentangan dengan aturan "dilarang membocorkan informasi diagnostik" di AGENTS.md.
- Grant `anon` pada `activity_logs` masih penuh (`arwdDxtm`), artinya anon bisa menghapus log audit. Kondisinya sama persis dengan proyek lama dan belum diubah saat migrasi.
- Legacy API key (JWT `anon`) dijadwalkan pensiun awal 2027. App, Edge Function, dan Apps Script masih bergantung padanya.
