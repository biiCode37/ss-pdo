# Daftar Masalah v3 — Proyek SS_PDO / SPUM (Sistem Pencatatan Shift Bus)

**Repo:** github.com/biiCode37/ss-pdo (commit "Refactor 2 done", 2026-08-04)
**Jenis dokumen:** Audit lanjutan v3 — dipicu oleh 3 temuan langsung dari pengujian pemilik proyek (swipe navigasi, form rute/tanggal, sistem autentikasi), ditelusuri hingga akar penyebab teknisnya di kode, plus verifikasi status perbaikan v2.
**Terkait dengan:** `02-rekomendasi-solusi-v3.md`, `03-aturan-ai-agent-v3.md`, serta seluruh dokumen v1 & v2 sebelumnya.
**Penomoran:** Melanjutkan dari v2. BUG-01 s.d. BUG-36 sudah dipakai → temuan baru dimulai dari **BUG-37**.

---

## ✅ Verifikasi Perbaikan v2

Sejak audit v2, repo sudah berubah signifikan (integrasi Supabase, swipe navigation, dll). Item v2 yang sempat diverifikasi ulang di sesi ini:

| ID | Status |
|---|---|
| BUG-20 (parsing angka `analytics.ts`) | ✅ Terverifikasi diperbaiki — kini memakai `parseIndonesianNumber` dari `utils/numberUtils.ts` yang dibagi (shared), dengan komentar kode eksplisit mereferensikan BUG-20. |
| BUG-27 (form rute baru berbagi state) | ✅ Terverifikasi diperbaiki — `newRouteUrl` kini state terpisah dari `sheetUrl` aktif. |
| BUG-29 (regresi cegah rute duplikat) | ✅ Terverifikasi diperbaiki, bahkan lebih baik dari solusi awal — kini ditegakkan lewat *unique constraint* di level database Supabase (`route_id + year + month`), bukan cuma cek di client. |
| BUG-32 (test palsu) | ✅ Terverifikasi diperbaiki — `vitest` kini terpasang sungguhan (`"test": "vitest run"`), dan ada test nyata untuk `routeService.ts`. |

Sisa item v2 (BUG-19, 21-26, 28, 30-31, 33-36) tidak sempat diverifikasi ulang secara eksplisit di sesi ini — fokus audit v3 diarahkan ke 3 area yang dilaporkan pemilik proyek. Disarankan verifikasi menyeluruh v2 dilakukan terpisah jika belum.

---

## Ringkasan Temuan Baru

| ID | Judul Singkat | Severity | Lokasi Utama | Dipicu oleh |
|---|---|---|---|---|
| BUG-37 | Allowlist Supabase *fail-open* — user tak terdaftar tetap bisa login | 🔴 Kritis (Keamanan) | `services/routeService.ts` (`verifyUserProfile`) | Laporan user #3 |
| BUG-38 | Auto re-auth (`reauthenticateSession`) tanpa gesture klik user → popup diblokir browser → app sering minta login ulang | 🔴 Kritis (Auth) | `services/googleSheets.ts` (`withAuthRetry`, `reauthenticateSession`) | Laporan user #3 |
| BUG-39 | Swipe halaman memicu di area scroll kategori kolom | 🔴 Kritis (UX) | `components/BusList.tsx`, `components/SwipeableContainer.tsx` | Laporan user #1 |
| BUG-40 | Swipe halaman memicu di area scroll grafik tren TOA harian | 🔴 Kritis (UX) | `components/DailyToaTrendCard.tsx`, `components/SwipeableContainer.tsx` | Ditemukan saat menelusuri BUG-39 |
| BUG-41 | Rute+Bulan+Tahun digabung 1 dropdown teks, bukan 3 selector terpisah | 🟠 Sedang (UX) | `components/RouteSelectorCard.tsx` | Laporan user #2 |
| BUG-42 | Tidak ada penyimpanan rute+tanggal terakhir yang dikunjungi | 🟠 Sedang (UX) | `components/RouteSelectorCard.tsx`, `components/Dashboard.tsx` | Laporan user #2 |
| BUG-43 | Skema & kebijakan RLS Supabase tidak ter-*version control* | 🟠 Sedang (Proses) | (tidak ada file `.sql`/migrasi di repo) | Ditemukan saat menelusuri BUG-37 |
| BUG-44 | `.env.example` melabeli variabel Supabase sebagai "opsional" padahal kritis untuk keamanan | 🟡 Minor (Dokumentasi) | `.env.example` | Ditemukan saat menelusuri BUG-37 |

---

## 🔴 KRITIS

### BUG-37 — Allowlist Supabase *fail-open*: user tak terdaftar tetap bisa login
**Lokasi:** `services/routeService.ts`, `verifyUserProfile` (± baris 34–81)
**Ini investigasi langsung dari laporan Anda soal "user yang tidak terdaftar pada supabase tetap bisa login".**
**Deskripsi:** Fungsi ini seharusnya menjadi gerbang otorisasi: hanya email yang terdaftar & aktif di tabel `user_profiles` boleh masuk. Tapi ada **tiga jalur berbeda** yang semuanya berujung pada `{ isAllowed: true }` (mengizinkan login) alih-alih menolak:
1. `if (!isSupabaseConfigured) return { isAllowed: true };` — jika env var `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` tidak terpasang (mis. lupa di-set di dashboard Vercel saat deploy), pengecekan ini **dilewati sepenuhnya** untuk SEMUA user.
2. Blok `catch (err)` di akhir fungsi juga me-*return* `{ isAllowed: true }` — jika query ke Supabase gagal karena SEBAB APAPUN (RLS salah konfigurasi, network error, timeout, kesalahan skema tabel), user tetap **diizinkan** masuk.
3. Hanya jalur `if (error || !data)` (baris terdaftar memang tidak ditemukan, TANPA error lain) yang benar-benar menolak.
**Root cause:** Pola *fail-open* (gagal = izinkan) dipakai pada fungsi yang fungsinya justru pengecekan otorisasi — seharusnya sebaliknya, *fail-closed* (gagal = tolak), khususnya karena tidak ada file SQL/migrasi ter-dokumentasi (lihat BUG-43) untuk memastikan kebijakan RLS `user_profiles` benar-benar mengizinkan `anon` key membaca tabel ini dengan sukses.
**Dampak nyata:** Email Google apa pun — termasuk **akun bersama (shared) yang dipakai untuk mengakses file spreadsheet asli**, seperti yang Anda amati — bisa login ke aplikasi selama Google OAuth-nya sendiri berhasil, TANPA PERNAH benar-benar melewati validasi "apakah orang ini terdaftar sebagai petugas PUSM". Ini adalah kerentanan akses tidak sah (unauthorized access) yang nyata, bukan sekadar bug UX.

### BUG-38 — Auto re-auth tanpa gesture klik user, kemungkinan besar diblokir browser
**Lokasi:** `services/googleSheets.ts`, `withAuthRetry` (± baris 322–341) memanggil `reauthenticateSession` (± baris 273–320)
**Ini investigasi langsung dari laporan Anda soal "app masih sering meminta login dari awal".**
**Deskripsi:** `reauthenticateSession` memiliki komentar kode eksplisit: *"Trigger popup directly from user gesture (click event)"* — developer sendiri sudah tahu popup OAuth Google HARUS dipicu langsung dari klik/tap pengguna agar tidak diblokir browser (ini pembatasan keamanan bawaan browser, terutama ketat di Chrome/Safari mobile). **Tapi** `withAuthRetry` memanggil `reauthenticateSession()` secara **otomatis**, dari dalam rantai `async`/`await` yang dipicu error API (401/403) — BUKAN dari klik langsung. Pada titik ini, browser sudah beberapa `await` jauh dari gesture asli pengguna (jika ada gesture sama sekali — banyak pemanggilan `withAuthRetry` terjadi dari `useEffect` saat memuat data atau dari proses sinkronisasi latar belakang, yang sama sekali tidak dipicu klik).
**Root cause:** Arsitektur "retry otomatis saat error" secara inheren berkonflik dengan syarat "harus dipicu klik langsung" yang didokumentasikan developer sendiri di komentar kode yang sama.
**Dampak nyata:** Ketika refresh token *silent* (`ensureValidToken`, yang memang didesain tanpa perlu klik) gagal — kondisi yang cukup umum di lapangan dengan sinyal lemah, mode privasi browser yang memblokir cookie pihak ketiga, atau setelah aplikasi didiamkan lama — sistem jatuh ke `reauthenticateSession()` yang popup-nya kemungkinan besar diblokir diam-diam oleh browser. Setelah 60 detik timeout, proses gagal, dan yang terlihat oleh Anda adalah: aplikasi "minta login dari awal" (harus buka `LoginScreen`, klik Sign In, ulangi seluruh proses consent OAuth) — persis gejala yang Anda laporkan, dan bertentangan langsung dengan tujuan fitur "Sesi Login Permanen" (BUG-17, v1.6.0).

### BUG-39 — Swipe halaman memicu di area scroll kategori kolom
**Lokasi:** `components/BusList.tsx` (± baris 97, `category-scroll-container`); `components/SwipeableContainer.tsx` (± baris 30, daftar pengecualian)
**Ini investigasi langsung dari laporan Anda soal fitur swipe.**
**Deskripsi:** `SwipeableContainer` (pembungkus konten tab Input/Analytics, terpasang di `Dashboard.tsx`) punya daftar pengecualian eksplisit agar elemen tertentu TIDAK memicu swipe-ganti-tab: `input, textarea, select, .no-swipe, .route-date-tabs`. Tapi container scroll horizontal untuk chip kategori kolom di `BusList.tsx` (`className="category-scroll-container"`) **tidak termasuk** dalam daftar ini.
**Dampak nyata:** Saat pengguna mencoba menggeser jari ke kiri/kanan DI ATAS baris chip kategori (mis. "TOA S1", "KM Awal S1", dst.) untuk mengakses chip yang tersembunyi karena tak muat di layar — gestur itu malah ditangkap sebagai swipe HALAMAN, berpindah dari tab Input ke tab Analytics (atau sebaliknya), persis seperti yang Anda alami.

### BUG-40 — Swipe halaman memicu di area scroll grafik tren TOA harian
**Lokasi:** `components/DailyToaTrendCard.tsx` (± baris 401–404, `className="no-scrollbar"`)
**Ditemukan saat menelusuri BUG-39 — pola bug yang sama persis, di tempat berbeda.**
**Deskripsi:** Container scroll horizontal untuk balok grafik tren TOA (dipakai saat jumlah hari cukup banyak sehingga grafik lebih lebar dari layar) memakai class `"no-scrollbar"` (hanya untuk menyembunyikan scrollbar visual) — BUKAN `"no-swipe"` yang dikenali `SwipeableContainer`.
**Dampak nyata:** Sama seperti BUG-39, tapi di tab Analytics — usaha men-scroll grafik untuk melihat hari-hari lain akan malah berpindah tab.

---

## 🟠 SEDANG

### BUG-41 — Rute+Bulan+Tahun digabung dalam satu dropdown teks
**Lokasi:** `components/RouteSelectorCard.tsx`, ± baris 269–285
**Ini investigasi langsung dari laporan Anda soal form pemilihan rute & tanggal.**
**Deskripsi:** Dropdown "Pilih Rute" menampilkan opsi gabungan teks seperti `"JAK.76 (Agustus 2026)"` — rute, bulan, dan tahun semua digabung jadi satu string dalam satu `<select>` datar. Selector Bulan & Tahun terpisah (`newMonth`/`newYear`) memang ADA di kode, tapi **hanya dipakai di form "Tambah Rute Baru"** — bukan untuk MEMILIH rute+periode yang sudah ada untuk dilihat/diisi datanya.
**Dampak nyata (sesuai analisis Anda):** Seiring waktu, satu rute (mis. "JAK.76") akan punya banyak entri bulan berbeda-beda tahun ("JAK.76 (Agustus 2025)", "JAK.76 (September 2025)", ... "JAK.76 (Agustus 2026)", dst.) — semua bercampur rata dalam satu daftar dropdown datar tanpa pengelompokan, semakin sulit dibaca/dinavigasi seiring bertambahnya riwayat data.

### BUG-42 — Tidak ada penyimpanan rute & tanggal terakhir yang dikunjungi
**Lokasi:** `components/RouteSelectorCard.tsx` (± baris 83–91); `components/Dashboard.tsx` (tidak ditemukan mekanisme persist `sheetUrl`/`selectedTab` ke `localStorage` di mana pun — dikonfirmasi lewat pencarian menyeluruh)
**Ini investigasi langsung dari laporan Anda soal "app mungkin tidak menyimpan state rute dan tanggal terakhir".**
**Deskripsi:** Saat aplikasi dimuat, `RouteSelectorCard` otomatis memilih rute **pertama** dari hasil query Supabase (`flat[0]`, diurutkan berdasarkan `route_code` menaik) jika belum ada `sheetUrl` — bukan rute yang TERAKHIR dikunjungi user. Tanggal (`selectedTab`) juga selalu default ke tanggal hari ini (`new Date().getDate()`), bukan tanggal terakhir yang dilihat.
**Dampak nyata:** Setiap kali membuka ulang aplikasi, petugas/pengawas harus menavigasi ulang secara manual ke rute & tanggal yang sedang mereka kerjakan — friksi harian yang berulang, persis seperti yang Anda perkirakan.

### BUG-43 — Skema & kebijakan RLS Supabase tidak ter-*version control*
**Lokasi:** Tidak ditemukan satu pun file `.sql` atau folder migrasi di seluruh repo (dikonfirmasi lewat pencarian menyeluruh)
**Ditemukan saat menelusuri akar penyebab BUG-37.**
**Deskripsi:** Struktur tabel (`routes`, `route_sheets`, `user_profiles`, `activity_logs`, `sync_queue_backups`) dan kebijakan Row-Level Security-nya tampaknya dikonfigurasi manual langsung di dashboard Supabase, tidak ada representasi di kode yang bisa diaudit, direview lewat pull request, atau direproduksi ulang jika perlu setup environment baru (staging, dsb.).
**Dampak nyata:** Tidak ada cara untuk memverifikasi dari kode saja apakah kebijakan RLS pada `user_profiles` benar-benar mengizinkan `anon` key melakukan `SELECT` (elemen kunci untuk memastikan BUG-37 tidak terjadi karena RLS, bukan cuma karena env var kosong). Perubahan skema di masa depan juga berisiko tidak konsisten antar-environment.

---

## 🟡 MINOR

### BUG-44 — `.env.example` melabeli variabel Supabase sebagai "opsional"
**Lokasi:** `.env.example`, baris komentar `# Supabase (Optional for metadata registry & audit logs)`
**Deskripsi:** Label ini menggambarkan Supabase seolah hanya untuk "registry metadata & log audit" — tidak menyebutkan sama sekali bahwa variabel ini juga menggerakkan **allowlist keamanan login** (`verifyUserProfile`, BUG-37). Siapa pun yang men-deploy ulang aplikasi (atau environment baru) dan membaca komentar ini secara wajar akan menyimpulkan "boleh dilewati dulu" — padahal melewatkannya berarti fitur keamanan utama nonaktif total (jalur `!isSupabaseConfigured` di BUG-37).
**Dampak:** Kontribusi dokumentasi terhadap BUG-37 — pelabelan yang tidak akurat membuat kesalahan konfigurasi produksi lebih mungkin terjadi tanpa disadari.
