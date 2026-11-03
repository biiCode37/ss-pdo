# Laporan Perbaikan: Halaman Plotting Armada Harian & Systematic Debugging (Refactor 195)

Dokumen ini mencatat seluruh implementasi teknis perbaikan bug DevTools (401 & 406) dan 9 temuan audit mendalam pada modul **Halaman Plotting Armada Harian** (`src/components/plotting/`, `src/services/dailyPlottingService.ts`, `src/services/adminActionService.ts`, `src/services/googleSheets/authSession.ts`, dan modul terkait di `SS_PDO`).

---

## 1. Systematic Debugging Bug DevTools (Screenshot User)

### A. HTTP 406 (Not Acceptable) pada `daily_route_plottings`
- **Lokasi:** `src/services/dailyPlottingService.ts`
- **Akar Masalah:**
  Kueri `fetchDailyPlotting` memanggil modifier PostgREST `.single()`. Saat rute dan tanggal yang dipilih belum memiliki data plotting tersimpan di database Supabase, PostgREST mengembalikan error `PGRST116: The result contains 0 rows` dengan status HTTP `406 Not Acceptable`.
- **Implementasi Perbaikan:**
  Mengganti `.single()` dengan `.maybeSingle()`, sehingga jika baris belum tersedia di database, Supabase mengembalikan `data: null` secara mulus tanpa melempar HTTP 406.
- **Before vs After:**
  - *Before:* `.select('*').eq('route_id', routeId).eq('date', date).single()`
  - *After:* `.select('*').eq('route_id', routeId).eq('date', date).maybeSingle()`
- **Case Skenario Lapangan:**
  Petugas subuh membuka halaman plotting rute JAK.58 pada tanggal baru yang belum pernah di-plot. Browser tidak lagi memunculkan pesan merah 406 di console dan aplikasi langsung menginisialisasi plotting subuh secara bersih dari data armada hari ini.

---

### B. HTTP 401 (Unauthorized) pada Edge Function `admin-action`
- **Lokasi:** `src/services/googleSheets/authSession.ts` & `src/services/adminActionService.ts`
- **Akar Masalah:**
  1. Berdasarkan Golden Rule #3, sesi login pengguna dibuat permanen tanpa batas waktu. Namun, token Google OAuth (`access_token`) memiliki masa berlaku 1 jam (`3600` detik).
  2. Fungsi `getGoogleAccessToken()` mengambil token lama yang sudah expired tanpa mengecek `expiresAt` jika silent refresh di localhost gagal.
  3. Edge Function `admin-action` memverifikasi token ke Google Tokeninfo endpoint (`oauth2.googleapis.com/tokeninfo`). Google menolak token yang kedaluwarsa dengan HTTP 400 Bad Request, sehingga Edge Function mengembalikan HTTP 401 Unauthorized ke klien.
  4. SDK `@supabase/functions-js` membungkus pesan error serverless menjadi string generik `"FunctionsHttpError: Edge Function returned a non-2xx status code"`, sementara respons JSON asli tersimpan di dalam `await error.context.json()`.
- **Implementasi Perbaikan:**
  1. Pada `authSession.ts`: Memeriksa `expiresAt` sebelum mengembalikan token. Jika token kedaluwarsa, panggil `reauthenticateSession()` interaktif agar mendapatkan token baru yang valid.
  2. Pada `adminActionService.ts`: Mengurai `await (error as any)?.context?.json()` untuk mendapatkan detail penolakan dari server, serta mendeteksi status 401 / `"Token expired"` untuk otomatis memicu 1x re-autentikasi dan retry permintaan administratif.
- **Before vs After:**
  - *Before:* Token kedaluwarsa tetap dikirim ke Edge Function, memicu HTTP 401 dan modal `"Gagal menyimpan pengaturan izin halaman"`.
  - *After:* Token kedaluwarsa dideteksi secara proaktif; jika Edge Function merespons 401, sistem melakukan re-autentikasi interaktif dan mengulang mutasi dengan aman.
- **Case Skenario Lapangan:**
  Superadmin/Admin membuka modal Pengaturan Akses Halaman setelah aplikasi terbuka selama lebih dari 1 jam. Saat menyimpan whitelist peran atau email, sesi tersegarkan secara otomatis dan konfigurasi tersimpan sukses ke database.

---

## 2. Implementasi Perbaikan 9 Temuan Audit Plotting

### BUG-195-01: Ekstraksi Delta Murni & Proteksi Kolom Keterangan Eksisting
- **Lokasi:** `src/components/plotting/DailyPlottingPage.tsx` (`handleSavePlotting`)
- **Perbaikan:**
  1. Menerapkan mekanisme *dirty-check delta comparison* antara data plotting lokal dengan nilai eksisting di sheet:
     ```typescript
     const hasTripChanged = currentTripPergi !== tripPergi.trim() || currentTripPulang !== tripPulang.trim();
     const hasKeteranganChanged = currentKeterangan !== resolvedKeterangan.trim();
     if (hasTripChanged || hasKeteranganChanged) { ... }
     ```
  2. Melindungi catatan operasional non-kendala eksisting di Google Sheets pada unit yang berstatus `'READY'`. Hanya membersihkan keterangan jika unit sebelumnya memang tercatat mengalami kendala (`BA.02`, `NP`, `OFF`, `T.O EVDAL`) dan kini dinormalkan oleh petugas.
- **Before vs After:**
  - *Before:* Setiap kali klik Simpan Plotting, 30 baris bus selalu dikirim ke Google Sheets API, dan seluruh keterangan unit READY di-reset paksa ke `""`.
  - *After:* Hanya baris armada yang nilainya benar-benar berubah yang dikirim ke Google Sheets (misal hanya 2–3 unit), dan catatan supir/lapangan tetap aman.
- **Case Skenario Lapangan:**
  Operator telah mencatat `"DRIVER: AGUS / AC KURANG DINGIN"` di Google Sheets. Pengawas subuh menyimpan plotting armada. Catatan tersebut tetap utuh di spreadsheet dan kuota API Google Sheets terlindungi.

---

### BUG-195-02: Isolasi Dependensi `buses` via `busesRef` & Flag `isDirtyRef`
- **Lokasi:** `src/components/plotting/DailyPlottingPage.tsx` (`integrateSheetValues` & `useEffect`)
- **Perbaikan:**
  1. Menghapus dependensi `buses` dari array `useCallback` dan `useEffect`, menggantikannya dengan `busesRef = useRef(buses)`.
  2. Menambahkan `isDirtyRef = useRef(false)`. Ketika pengguna sedang menata urutan bus atau mengubah ritase, event background sync / realtime tidak diperkenankan menimpa state lokal yang belum disimpan.
- **Before vs After:**
  - *Before:* `useEffect` memicu `loadPlotting` ulang setiap kali `buses` berubah reference, menghapus penataan urutan bus petugas yang sedang berjalan.
  - *After:* Pemuatan awal hanya bergantung pada `[routeId, date]`. State penataan urutan petugas terlindungi sepenuhnya selama sesi kerja.
- **Case Skenario Lapangan:**
  Petugas sedang menukar posisi 10 armada subuh. Di latar belakang, terjadi sinkronisasi otomatis status armada dari supir lain. Tampilan plotting tidak berkedip dan urutan yang sedang ditata tidak hilang.

---

### BUG-195-03: Aksesibilitas WCAG AA/AAA Light Mode dengan Token Semantik
- **Lokasi:** `src/components/plotting/PlottingHeader.tsx` & `src/components/plotting/PlottingUnitCard.tsx`
- **Perbaikan:**
  Mengganti seluruh warna heksadesimal mentah yang gagal kontras di Light Mode (`#4ade80`, `#f87171`, `#fbbf24`, `#38bdf8`) dengan CSS Variables semantik adaptif:
  - Siap Jalan: `var(--color-success-fg)` & `var(--color-success-bg)`
  - Kendala: `var(--color-warning-fg)` & `var(--color-warning-bg)`
  - OFF: `var(--color-error-fg)` & `var(--color-error-bg)`
  - Badge Start Pangkalan: `var(--color-info-fg)`, `var(--color-info-bg)`, `var(--color-info-border)`
- **Before vs After:**
  - *Before:* Kontras teks di mode terang hanya 1.62:1 s/d 2.18:1 (tidak terbaca di bawah terik matahari).
  - *After:* Lolos standar rasio kontras WCAG AA/AAA (> 7:1) di Light Mode dan Dark Mode.
- **Case Skenario Lapangan:**
  Petugas operasional lapangan menggunakan aplikasi di ponsel di luar ruangan pada siang hari dengan Light Mode aktif; seluruh badge status armada dan tombol terlihat tajam dan jelas.

---

### BUG-195-04: Regex Word Boundary Token pada Modal Kendala
- **Lokasi:** `src/components/plotting/PlottingTroubleModal.tsx` (`parseInitialTroubleState`)
- **Perbaikan:**
  Mengganti metode pencocokan substring `includes()` dengan boundary regex:
  ```typescript
  const escaped = item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, 'i');
  ```
- **Before vs After:**
  - *Before:* Kata `"TANPA"` pada `"RADIATOR TANPA AIR"` otomatis mencentang kendala `"NP"`, dan kata `"OFFICER"` otomatis mencentang `"OFF"`.
  - *After:* Hanya kode independen yang cocok secara utuh yang terdeteksi sebagai preset kendala.
- **Case Skenario Lapangan:**
  Pengawas menulis keterangan `"OFFICER DALOPS TEGUR PENGEMUDI TANPA SERAGAM"`. Sistem tidak salah menganggap bus sedang OFF atau NP; target ritase bus tetap normal.

---

### BUG-195-05: Pembulatan Input Numerik ke Kelipatan 0.5 Ritase
- **Lokasi:** `src/components/plotting/TargetRitaseModal.tsx` & `src/components/plotting/DailyPlottingPage.tsx`
- **Perbaikan:**
  Menerapkan pembulatan presisi `Math.round(val * 2) / 2` pada seluruh handler stepper, direct text input, dan sebelum kalkulasi trip pergi/pulang.
- **Before vs After:**
  - *Before:* Petugas mengetik `7.2` rit, namun sistem menyimpannya sebagai 8 pergi dan 7 pulang (`7.5` rit).
  - *After:* Setiap input otomatis ternormalisasi ke kelipatan 0.5 terdekat (misal `7.2` menjadi `7.0` rit).
- **Case Skenario Lapangan:**
  Kalkulasi trip ganjil (start A = pergi k+1, pulang k) selalu menghasilkan bilangan bulat murni yang sinkron antara UI dan rumus Google Sheets.

---

### BUG-195-06: Pencegahan Gesture Bentrok Mobile via `data-no-swipe="true"`
- **Lokasi:** `src/components/plotting/DailyPlottingPage.tsx`
- **Perbaikan:**
  Menambahkan atribut `data-no-swipe="true"` pada elemen kontainer root halaman plotting.
- **Before vs After:**
  - *Before:* Sentuhan horizontal mikro saat scrolling di layar sentuh ponsel memicu perpindahan tab tidak disengaja.
  - *After:* Navigasi tab terisolasi aman saat pengguna sedang berinteraksi di halaman plotting.
- **Case Skenario Lapangan:**
  Petugas melakukan tap dan scroll cepat daftar 30 unit bus di ponsel tanpa takut layar tiba-tiba terlempar ke Tab Armada atau Tab Dashboard.

---

### BUG-195-07: Proteksi Status OFF dari Penimpaan Target Ritase Massal
- **Lokasi:** `src/components/plotting/DailyPlottingPage.tsx` (`handleApplyTargetRitase`)
- **Perbaikan:**
  Menambahkan guard `u.status === 'OFF' ? 0 : roundedVal` pada penetapan target ritase cakupan pangkalan (`scope === 'base'`) dan rute (`scope === 'all'`).
- **Before vs After:**
  - *Before:* Tombol "Terapkan ke Semua Unit" menimpa unit mogok/bengkel (OFF) menjadi 7.5 Rit.
  - *After:* Unit berstatus OFF tetap mempertahankan ritase 0 Rit.
- **Case Skenario Lapangan:**
  Armada yang sedang turun mesin di bengkel tetap tertera `0 Rit • OFF` meski pengawas menaikkan target ritase seluruh armada aktif menjadi 8.0 Rit.

---

### BUG-195-08: Migrasi Seluruh Teks Antarmuka ke Kamus Sentral `TEXT_PLOTTING`
- **Lokasi:** `src/constants/texts/text_plotting.ts`, `PlottingHeader.tsx`, `PlottingUnitCard.tsx`, `TargetRitaseModal.tsx`, `PlottingBaseTabs.tsx`
- **Perbaikan:**
  Menambahkan key kamus sentral `COUNTERS`, `TABS.ARIA_LABEL`, `UNIT_CARD` title & aria labels, serta `TARGET_MODAL` arias. Seluruh hardcoded UI strings dimigrasikan secara tuntas.
- **Before vs After:**
  - *Before:* 14 string antarmuka di-hardcode langsung pada atribut JSX.
  - *After:* 100% teks antarmuka merujuk ke Single Source of Truth `TEXT_PLOTTING`.

---

### BUG-195-09: Pembersihan Dead Code `onMoveToBottom`
- **Lokasi:** `src/components/plotting/PlottingUnitCard.tsx` & `src/components/plotting/DailyPlottingPage.tsx`
- **Perbaikan:**
  Menghapus prop dan fungsi usang `onMoveToBottom` yang tertutup oleh implementasi circular wrap pada panah atas/bawah.
- **Before vs After:**
  - *Before:* Kode usang membingungkan pemeliharaan komponen.
  - *After:* Kode bersih, ramping, dan modular.

---

## 3. Checklist Hasil Verifikasi Mutlak (Zero-Mistake Quality Gates)

1. **Uji Kontrak Warna Semantic Token & WCAG:**
   `pnpm vitest run src/styles/tokens/color-contract.test.ts`
   ➔ **116 passed (100%)**
2. **Uji Khusus Modul Plotting:**
   `pnpm vitest run src/components/plotting`
   ➔ **27 passed (100%)**
3. **Uji Khusus Kamus Teks Sentral:**
   `pnpm vitest run src/constants/texts/texts.test.ts`
   ➔ **28 passed (100%)**
4. **Uji Seluruh Unit Test Codebase:**
   `pnpm vitest run src/`
   ➔ Terverifikasi lulus 100% tanpa kegagalan.
5. **Kompilasi TypeScript Strict & Vite Production Build:**
   `pnpm run build`
   ➔ Sukses 0 error (`tsc -b` lulus tanpa komplain typecheck).
6. **Pembaruan Knowledge Graph:**
   `graphify update .`
   ➔ Graf pengetahuan kode terbarukan.
