# Daftar Masalah v2 — Proyek SS_PDO (Sistem Pencatatan Shift Bus)

**Repo:** github.com/biiCode37/ss-pdo (di-pull ulang pada commit `24bbc3a`, "Sebelum integrasi SUPABASE (updated2)")
**Jenis dokumen:** Lanjutan audit — dilakukan setelah 30+ commit baru sejak audit v1 (fitur Analytics Dashboard, Morphing Route Selector, Sesi Login Persisten, Human-Friendly Error Handling, dll.)
**Terkait dengan:** `02-rekomendasi-solusi-v2.md`, `03-aturan-ai-agent-v2.md`, serta dokumen v1 (`01-daftar-masalah.md` dkk.) dan `.agents/AGENTS.md` (aturan emas proyek yang sudah ada).
**Penomoran:** Melanjutkan dari v1. BUG-01 s.d. BUG-17 sudah dipakai (lihat verifikasi di bawah), sehingga temuan baru dimulai dari **BUG-18**.

---

## ✅ Verifikasi Perbaikan v1

Sebelum audit lanjutan, seluruh BUG-01 s.d. BUG-17 dari `01-daftar-masalah.md` diverifikasi ulang langsung di kode saat ini (bukan hanya percaya CHANGELOG):

| ID | Status |
|---|---|
| BUG-01 s.d. BUG-12 | ✅ Terverifikasi diperbaiki dengan benar di `useOfflineSync.ts` (atomic read-modify-write, collision detection, retry+backoff, status `failed`/`conflict`) |
| BUG-13 (rute duplikat) | ⚠️ **REGRESI** — CHANGELOG mengklaim sudah diperbaiki, tapi kode aktual saat ini **tidak lagi** melakukan pengecekan duplikat. Lihat **BUG-29** di bawah. |
| BUG-14, BUG-15, BUG-16 | ✅ Terverifikasi diperbaiki |
| BUG-17 (login prompt tak terduga saat tap "Load Data") | ✅ Terverifikasi diperbaiki di `checkSignedIn()`/`ensureValidToken()` |

Sisa dokumen ini murni berisi **temuan baru** (BUG-18 ke atas) dari fitur-fitur yang ditambahkan sejak v1, plus satu regresi di atas.

---

## Ringkasan Temuan Baru

| ID | Judul Singkat | Severity | Lokasi Utama |
|---|---|---|---|
| BUG-18 | ~~KM Awal/Akhir tidak pernah tersimpan~~ | ❌ **DICABUT** (lihat catatan) | — |
| BUG-19 | Race condition saat ganti tab/tanggal dengan cepat — bisa menyimpan ke hari yang salah | 🔴 Kritis | `components/Dashboard.tsx` (`handleLoadData`, `handleSelectTab`) |
| BUG-20 | `calculateAnalytics` salah parse angka format Indonesia (bukan pakai `parseIndonesianNumber`) | 🔴 Kritis | `utils/analytics.ts` |
| BUG-21 | `getMonthlyToaTrend` membulatkan nilai TOA — melanggar aturan emas SSOT | 🔴 Kritis | `services/googleSheets.ts` |
| BUG-22 | "Gunakan Data Server" tidak benar-benar memuat ulang data terbaru | 🔴 Kritis | `hooks/useOfflineSync.ts` (`resolveConflict`) |
| BUG-23 | `onAuthError` tidak pernah dihubungkan — kegagalan auth saat sync tetap senyap | 🔴 Kritis | `components/Dashboard.tsx` |
| BUG-24 | Tidak ada penjadwalan retry otomatis — hanya jalan saat event online/reload | 🟠 Sedang | `hooks/useOfflineSync.ts` |
| BUG-25 | Delay retry tetap dieksekusi meski item sudah menyerah ('failed') | 🟠 Sedang | `hooks/useOfflineSync.ts` |
| BUG-26 | Deteksi header di `getMonthlyToaTrend` tidak punya validasi BUG-10 (≥50% teks) | 🟠 Sedang | `services/googleSheets.ts` |
| BUG-27 | Form "Tambah Rute Baru" berbagi state dengan rute aktif — batal tidak mengembalikan | 🟠 Sedang | `components/RouteSelectorCard.tsx` |
| BUG-28 | Pil ringkas bisa menampilkan rute/tanggal yang belum benar-benar dimuat | 🟠 Sedang | `components/RouteSelectorCard.tsx` |
| BUG-29 | **Regresi BUG-13**: pencegahan rute duplikat hilang dari `onSaveNewRoute` | 🟠 Sedang | `components/Dashboard.tsx` |
| BUG-30 | Pesan error sesi/auth punya 3 versi kalimat berbeda dari 3 tempat berbeda | 🟠 Sedang | `components/BusCard.tsx`, `utils/errorFormatter.ts`, `hooks/useOfflineSync.ts` |
| BUG-31 | Aturan `.includes('unit')` di errorFormatter terlalu longgar, salah klasifikasi error lain | 🟠 Sedang | `utils/errorFormatter.ts` |
| BUG-32 | "Test" yang ada bukan test sungguhan — tak ada test runner, tak pernah gagal otomatis | 🟡 Minor | `utils/*.test.ts`, `package.json` |
| BUG-33 | `SyncQueueBadge.tsx` kini dead code tapi masih tertinggal di repo | 🟡 Minor | `components/SyncQueueBadge.tsx` |
| BUG-34 | `bus.unit` dipakai mentah sebagai DOM id tanpa sanitasi/jaminan unik | 🟡 Minor | `components/BusCard.tsx` |
| BUG-35 | Tab default "Analytics", bukan "Input" — perlu konfirmasi apakah sesuai kebutuhan petugas lapangan | 🟡 Minor | `components/Dashboard.tsx` |
| BUG-36 | `Math.round()` pada `totalPassengers` berpotensi buang presisi nilai SSOT | 🟡 Minor | `utils/analytics.ts` |

---

## 🔴 KRITIS

### BUG-18 — ❌ DICABUT (retracted): "KM Awal/Akhir tidak pernah tersimpan"
**Status:** Temuan ini **salah** dan dicabut sepenuhnya setelah verifikasi lapangan oleh pemilik proyek (aplikasi terbukti menyimpan angka KM dengan benar ke file asli) dan pengecekan ulang.
**Apa yang salah dalam audit:** Saat memeriksa struktur 4 file contoh (`contoh_file_ss/*.xlsx`) dengan `openpyxl`, output baris header dipotong (`row[:14]`/`row[:16]`) untuk mempersingkat tampilan saat itu. Pemotongan ini menyembunyikan kolom-kolom yang sebenarnya ada lebih ke kanan: **"Kilometer Awal Shift 1"**, **"Kilometer Akhir Shift 1"**, **"Kilometer Awal Shift 2"**, **"Kilometer Akhir Shift 2"** — persis cocok dengan `HEADER_KEYWORDS` yang dicari kode. Kolom "KM 1"/"KM 2" yang terlihat di pemeriksaan awal ternyata adalah kolom TERPISAH (kemungkinan kolom gabungan/lama untuk rujukan lain), bukan pengganti kolom per-shift tersebut.
**Verifikasi ulang:** Dicek lagi tanpa pemotongan kolom pada keempat file — seluruhnya (JAK.115, JAK.15, JAK.76, JAK.88) memiliki keempat kolom "Kilometer Awal/Akhir Shift 1/2" secara konsisten. `headerMap.kmAwal1`/`kmAkhir1`/`kmAwal2`/`kmAkhir2` seharusnya resolve dengan benar (bukan -1), sehingga `addUpdate` di `updateBusData` menulis dengan benar — sesuai pengalaman nyata pemilik proyek.
**Pelajaran untuk audit berikutnya:** Jangan pernah memotong/membatasi tampilan kolom saat memeriksa struktur spreadsheet nyata sebagai dasar temuan — selalu tampilkan lebar penuh (atau secara eksplisit cari kata kunci relevan di seluruh lebar baris) sebelum menyimpulkan sebuah kolom "tidak ada".

### BUG-19 — Race condition saat berpindah tab/tanggal dengan cepat
**Lokasi:** `components/Dashboard.tsx`, `handleLoadData` (± baris 114–160) & `handleSelectTab` (± baris 162–167)
**Deskripsi:** `handleSelectTab` langsung memanggil `handleLoadData` setiap kali tab tanggal berganti, tanpa pembatalan request (no `AbortController`) dan tanpa penjagaan urutan respons (no sequence/staleness check).
**Skenario reproduksi:** Petugas mengetuk tab tanggal 15, lalu buru-buru mengetuk tab tanggal 16 sebelum data tanggal 15 selesai dimuat. Jika respons jaringan untuk tanggal 15 (yang lebih dulu diminta) tiba **belakangan** dibanding tanggal 16, maka `setBusData`, `setCurrentSheetId`, dan `setCurrentTabName` dari respons tanggal 15 akan **menimpa** data tanggal 16 yang sudah tampil.
**Dampak ke user:** Tampilan tab tetap menunjukkan "Tanggal 16" (karena `selectedTab` di-set secara sinkron), tapi baris-baris bus yang tampil sebenarnya data tanggal 15 — dan yang lebih berbahaya, `currentSheetId`/`currentTabName` (dipakai saat menyimpan) ikut salah menunjuk ke tanggal 15. Jika petugas kemudian mengedit & menyimpan data dalam kondisi ini, **perubahan bisa tertulis ke tab/tanggal yang SALAH** di spreadsheet.

### BUG-20 — `calculateAnalytics` salah mem-parsing angka berformat Indonesia
**Lokasi:** `utils/analytics.ts`, ± baris 61–78
**Deskripsi:** Fungsi `calculateAnalytics` memakai `parseInt(bus.toaShift1, 10)`/`parseFloat(bus.kmAwal1)` — BUKAN `parseIndonesianNumber()` yang sudah ada di `googleSheets.ts` khusus untuk menangani format angka Indonesia (pemisah ribuan "." dan desimal ",").
**Root cause:** `parseInt("1.234", 10)` hanya menghasilkan `1` (berhenti di titik pertama), bukan `1234`. Nilai TOA/Manual/KM yang ditulis dengan pemisah ribuan ala Indonesia akan salah total, bukan sekadar salah bulat.
**Dampak ke user:** Dampaknya **tersembunyi secara tidak konsisten** — karena `calculateAnalytics` memprioritaskan nilai `sheetSummary` (SSOT langsung dari rumus sheet) di atas hasil hitung lokal, bug ini HANYA muncul pada hari/tab di mana baris ringkasan (summary row) sheet tidak berhasil terdeteksi oleh scanner fuzzy (lihat juga BUG-31 soal fuzzy matching). Artinya angka KPI bisa terlihat benar berbulan-bulan, lalu tiba-tiba meleset drastis (angka penumpang/TOA jauh lebih kecil dari seharusnya) pada tab tertentu tanpa peringatan apa pun — sulit dilacak penyebabnya karena tidak konsisten.
**Catatan pendukung:** `analytics.test.ts` yang ada hanya menguji dengan angka kecil ('83', '127', '210', dst.) — tidak ada satu pun kasus uji dengan format ribuan Indonesia, sehingga bug ini tidak akan terdeteksi meski "test" dijalankan (lihat juga BUG-32).

### BUG-21 — `getMonthlyToaTrend` membulatkan nilai TOA, melanggar aturan emas SSOT
**Lokasi:** `services/googleSheets.ts`, `getMonthlyToaTrend` (± baris 805)
**Deskripsi:** Baris `trendData.push({ day: dayStr, totalToa: Math.round(finalDayTotal) })` membulatkan nilai harian sebelum ditampilkan di grafik tren TOA harian (`DailyToaTrendCard.tsx`).
**Root cause:** Ini secara langsung bertentangan dengan aturan emas eksplisit di `.agents/AGENTS.md` bagian 2 (Integritas Data - SSOT): *"Dilarang memotong atau membulatkan angka desimal secara sepihak (tampilkan presisi murni hingga 10 desimal jika ada)"*.
**Dampak ke user:** Grafik tren TOA harian (fitur yang baru dibangun) menampilkan angka yang sudah dibulatkan, bukan nilai murni dari sheet — tidak konsisten dengan bagian lain aplikasi (`AnalyticsSummary` di `analytics.ts` secara sengaja TIDAK membulatkan `totalKm`/`kmPerBus`/`passengersPerKm`).

### BUG-22 — "Gunakan Data Server" tidak benar-benar memuat ulang data terbaru
**Lokasi:** `hooks/useOfflineSync.ts`, `resolveConflict` (± baris 229–232)
**Deskripsi:** Saat user menekan "Gunakan Data Server" pada item berkonflik, fungsi ini hanya memanggil `removeItem(itemId)` — membuang item dari antrean — tanpa memicu pengambilan ulang data terbaru dari server maupun memberi tahu Dashboard untuk refresh tampilan.
**Dampak ke user:** Setelah menekan "Gunakan Data Server", user tidak melihat perubahan apa pun di layar — form/kartu bus terkait tetap menampilkan data lama (versi mereka sendiri yang baru saja dibatalkan), bukan data server yang sebenarnya mereka pilih untuk dipakai. User harus me-refresh manual (pull-to-refresh) untuk benar-benar melihat data terkini — berpotensi membingungkan ("saya sudah pilih 'gunakan data server' tapi kenapa tidak berubah?").

### BUG-23 — `onAuthError` tidak pernah dihubungkan, kegagalan auth saat sync tetap senyap
**Lokasi:** `components/Dashboard.tsx` (pemanggilan `useOfflineSync({...})`, ± baris 65–79) vs `hooks/useOfflineSync.ts` (± baris 82, 173–174)
**Deskripsi:** `useOfflineSync` sudah menyediakan opsi `onAuthError?: () => void` yang dipanggil saat sinkronisasi antrean gagal karena sesi kedaluwarsa — infrastruktur ini terlihat lengkap. Namun `Dashboard.tsx` **hanya** menyediakan `onSyncSuccess` saat memanggil `useOfflineSync({...})`; `onAuthError` tidak pernah diisi.
**Dampak ke user:** Ini adalah bug yang SAMA PERSIS dengan yang coba diperbaiki di BUG-03/BUG-04 v1 (kegagalan auth yang senyap), tapi kali ini bersembunyi di balik kode yang TERLIHAT sudah menangani kasus ini. Ketika sesi login kedaluwarsa saat proses sinkronisasi latar belakang berjalan, tidak ada banner, toast, atau notifikasi apa pun yang muncul — antrean berhenti diproses tanpa penjelasan, sama seperti sebelum diperbaiki.

---

## 🟠 SEDANG

### BUG-24 — Tidak ada penjadwalan retry otomatis untuk item yang gagal sementara
**Lokasi:** `hooks/useOfflineSync.ts` (± baris 246–256)
**Deskripsi:** `processQueue()` hanya dipanggil otomatis saat: (a) komponen pertama kali dimuat, dan (b) event `online` browser benar-benar berpindah dari offline→online. Tidak ada `setInterval`/penjadwalan lain di seluruh codebase yang memanggil ulang `processQueue()` secara berkala.
**Dampak ke user:** Array `RETRY_DELAYS` (2 detik → 5 detik → 15 detik → 60 detik) memberi kesan ada mekanisme "coba lagi otomatis setelah jeda X detik" — padahal jeda tersebut hanya mengatur jarak antar-item yang BERBEDA dalam satu pemrosesan, bukan penjadwalan untuk mencoba ULANG item yang sama nanti. Jika koneksi tetap terdeteksi "online" oleh browser tapi request tetap gagal (kondisi sinyal lemah yang sangat umum di lapangan — `navigator.onLine` sering tetap `true` meski request sesungguhnya gagal), item yang gagal akan diam di antrean dengan `retryCount` yang tidak pernah bertambah lagi, sampai user membuka ulang aplikasi, koneksi benar-benar mati-lalu-hidup, atau menekan tombol manual "Sinkronkan Sekarang"/"Coba Lagi".

### BUG-25 — Delay retry tetap dieksekusi meski item sudah ditandai 'failed'
**Lokasi:** `hooks/useOfflineSync.ts`, ± baris 183–202
**Deskripsi:** Kode penghitung delay (`RETRY_DELAYS[Math.min(newRetryCount - 1, ...)]`) dan `await sleep(delay)` dijalankan di LUAR percabangan if/else `newRetryCount >= MAX_RETRIES`, sehingga tetap berjalan bahkan saat item BARU SAJA ditandai `'failed'` (menyerah permanen, retryCount mencapai 5).
**Dampak ke user:** Antrean bisa "tertunda" hingga 60 detik penuh sebelum memproses item BERIKUTNYA yang tidak berkaitan sama sekali — padahal item yang baru gagal itu sudah tidak akan dicoba lagi secara otomatis, jadi menunggu tidak memberi manfaat apa pun.

### BUG-26 — Deteksi header di `getMonthlyToaTrend` tidak mewarisi perbaikan BUG-10
**Lokasi:** `services/googleSheets.ts`, `getMonthlyToaTrend` (± baris 699–711) dibandingkan `getBusData` (± baris 348–360)
**Deskripsi:** `getMonthlyToaTrend` (fitur baru untuk grafik tren) menduplikasi seluruh logika deteksi baris header & composite header dari `getBusData`, tapi TIDAK menyertakan validasi "≥50% sel harus berupa teks" yang ditambahkan sebagai perbaikan BUG-10 di v1. Fungsi ini kembali rentan salah mendeteksi baris data sebagai baris header.
**Dampak ke user:** Grafik tren TOA harian berisiko menampilkan 0 atau angka yang salah untuk hari-hari tertentu akibat kesalahan deteksi header, meski masalah yang sama sudah "diperbaiki" di bagian lain aplikasi.

### BUG-27 — Form "Tambah Rute Baru" berbagi state dengan rute aktif
**Lokasi:** `components/RouteSelectorCard.tsx`, ± baris 179–207
**Deskripsi:** Input "Link Google Sheets..." pada panel "Tambah Rute Baru" terikat langsung ke state `sheetUrl` yang SAMA dengan rute yang sedang aktif dipakai (`value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)}`), bukan state draft terpisah.
**Dampak ke user:** Jika user membuka "Tambah Rute Baru" (mis. tanpa sengaja, atau berniat lalu berubah pikiran), mengetik sebagian/seluruh URL baru, lalu menekan tombol X (batal) — `sheetUrl` TIDAK dikembalikan ke rute aktif semula. Rute yang tadinya aktif bisa "rusak" tergantikan teks parsial yang sempat diketik, dan percobaan "Load Data" berikutnya akan gagal atau memuat rute yang salah.

### BUG-28 — Pil ringkas bisa menampilkan rute/tanggal yang belum benar-benar dimuat
**Lokasi:** `components/RouteSelectorCard.tsx`, ± baris 42–56, 96–101
**Deskripsi:** Judul & tanggal yang tampil di mode "pil ringkas" (morphed) dihitung langsung dari `sheetUrl`/`selectedTab` yang SEDANG dipilih di dropdown — bukan dari rute/tanggal yang datanya BENAR-BENAR sedang ditampilkan. Header form yang bisa diklik untuk menciutkan (± baris 96–101) hanya mensyaratkan `isDataLoaded` (pernah ada data dimuat, kapan pun), bukan "data untuk pilihan saat ini sudah dimuat".
**Dampak ke user:** Bila user mengganti pilihan rute di dropdown TANPA menekan "Load Data Unit", lalu mengetuk header form untuk menciutkannya, pil ringkas akan menampilkan nama rute BARU yang dipilih — padahal data yang tampil di bawahnya masih data rute LAMA. Read lebih lanjut terkait BUG-19 untuk pola serupa pada race condition data.

### BUG-29 — Regresi BUG-13: pencegahan rute duplikat hilang
**Lokasi:** `components/Dashboard.tsx`, `onSaveNewRoute` (± baris 326–330)
**Deskripsi:** CHANGELOG v1.5.0 mencatat BUG-13 (pencegahan rute duplikat) sebagai selesai. Namun kode `onSaveNewRoute` saat ini:
```js
onSaveNewRoute={(title, url) => {
  const updated = [...savedRoutes, { title, url }];
  setSavedRoutes(updated);
  localStorage.setItem("PDO_SAVED_ROUTES", JSON.stringify(updated));
}}
```
menambahkan rute baru **tanpa pengecekan duplikat apa pun**. Kemungkinan besar perbaikan ini hilang/tertimpa saat `RouteSelectorCard` dibangun ulang total sebagai bagian dari fitur *morphing selector*.
**Dampak ke user:** User bisa kembali menambahkan rute (link Google Sheet) yang sama berkali-kali ke daftar rute tersimpan.

### BUG-30 — Tiga versi pesan berbeda untuk kondisi sesi/auth yang sama
**Lokasi:** `components/BusCard.tsx` (± baris 232–235), `hooks/useOfflineSync.ts` (`isAuthError`, ± baris 44–48), `utils/errorFormatter.ts` (± baris 26–33)
**Deskripsi:** Logika "apakah ini error otentikasi/sesi kedaluwarsa" diimplementasikan secara terpisah di 3 tempat berbeda, dengan teks pesan yang juga berbeda-beda:
- `BusCard.tsx`: "Sesi login telah habis. Silakan refresh dan login ulang." / "Akses ditolak. Sesi mungkin kadaluarsa. Silakan login ulang."
- `errorFormatter.ts`: "Sesi login Anda telah berakhir. Silakan klik tombol Logout (kanan atas) lalu Sign In kembali."
**Dampak ke user:** Instruksi yang diterima user tidak konsisten tergantung DI MANA error itu terjadi (menyimpan langsung vs proses lain) — versi `errorFormatter.ts` lebih actionable (menyebutkan tombol Logout secara spesifik) dibanding versi `BusCard.tsx` yang hanya bilang "refresh". `BusCard.tsx` sepertinya belum dimigrasikan untuk memakai `formatUserError` secara penuh di cabang-cabang awal `handleSave`, padahal utilitas ini justru dibuat khusus untuk memusatkan (centralize) pesan seperti ini.

### BUG-31 — Aturan pencocokan `.includes('unit')` di errorFormatter terlalu longgar
**Lokasi:** `utils/errorFormatter.ts`, ± baris 64–71
**Deskripsi:** Rule "Format kolom Google Sheets tidak sesuai" memicu jika pesan error mengandung substring `"unit"` — kata yang sangat umum (mis. muncul di kata "community", "reunited", atau istilah lain yang tidak berkaitan sama sekali dengan header kolom).
**Dampak ke user:** Error yang sebenarnya tidak berkaitan dengan header kolom (mis. sebagian pesan error Google API yang kebetulan menyinggung kata "unit" untuk alasan lain) bisa salah diklasifikasikan dan menampilkan saran yang salah/tidak relevan ("periksa kembali dokumen Anda") ke user, mengarahkan mereka untuk mencari masalah di tempat yang keliru.

---

## 🟡 MINOR / Keanehan

### BUG-32 — "Test" yang ada bukan test sungguhan
**Lokasi:** `src/utils/analytics.test.ts`, `src/utils/errorFormatter.test.ts`, `package.json`
**Deskripsi:** Kedua file `.test.ts` memakai `console.assert` di dalam fungsi yang langsung memanggil dirinya sendiri saat file di-import (`runAnalyticsTest()`/`runErrorFormatterTest()` dipanggil di baris terakhir tiap file) — bukan `describe`/`it`/`test` dari framework testing (vitest/jest/dll). Tidak ada dependency test-runner apa pun di `package.json`, dan tidak ada script `"test"`.
**Dampak:** `console.assert` yang gagal hanya mencetak peringatan ke console — tidak pernah menghentikan build (`pnpm run build` tidak menjalankan file ini sama sekali kecuali diimpor oleh kode aplikasi nyata), tidak pernah menggagalkan CI. File ini memberi kesan palsu bahwa ada jaring pengaman otomatis terhadap regresi, padahal tidak ada.

### BUG-33 — `SyncQueueBadge.tsx` kini dead code, tapi masih tertinggal
**Lokasi:** `src/components/SyncQueueBadge.tsx`
**Deskripsi:** Sudah dipastikan tidak diimpor/dirender di manapun lagi (perbaikan BUG-08 v1 sudah benar). Namun file 70-baris ini (lengkap dengan class Tailwind yang tidak pernah berfungsi karena Tailwind tidak terpasang) masih ada di repo.
**Dampak:** Risiko rendah tapi nyata — developer/agent di masa depan bisa tidak sengaja mengimpor ulang komponen ini (mengembalikan BUG-08).

### BUG-34 — `bus.unit` dipakai mentah sebagai DOM id
**Lokasi:** `components/BusCard.tsx`, ± baris 314; `components/Dashboard.tsx`, `onSelectUnit` (± baris 423–437)
**Deskripsi:** `id={\`bus-card-${bus.unit}\`}` memakai nilai mentah dari spreadsheet (mis. `"KMJ 1987 (Mogok)"`, mengandung spasi & tanda kurung) langsung sebagai atribut `id` HTML, tanpa sanitasi. Secara ketat, atribut `id` tidak boleh mengandung spasi menurut spesifikasi HTML5 (browser modern umumnya tetap toleran).
**Dampak:** Fitur auto-scroll & highlight (saat mengetuk baris Keterangan) berfungsi selama kedua sisi (penulisan & pencarian id) memakai string yang identik — yang saat ini benar. Namun tidak ada jaminan `unit` selalu unik antar baris; jika ada dua bus dengan nilai `unit` yang sama persis, `getElementById` hanya akan menemukan/menyorot yang pertama.

### BUG-35 — Tab default "Analytics", bukan "Input"
**Lokasi:** `components/Dashboard.tsx`, ± baris 38
**Deskripsi:** `useState<"input" | "analytics">("analytics")` — setiap kali data selesai dimuat, aplikasi mendarat di tab Analytics, bukan tab Input (tempat petugas mengisi data KM/TOA).
**Catatan:** Ini bisa jadi keputusan desain yang disengaja (jika pengguna utama adalah pengawas, bukan petugas entri data) — dicatat sebagai pertanyaan untuk dikonfirmasi ke pemilik produk, bukan kepastian bug.

### BUG-36 — `Math.round()` pada `totalPassengers` berpotensi buang presisi SSOT
**Lokasi:** `utils/analytics.ts`, ± baris 123
**Deskripsi:** `totalPassengers: Math.round(finalTotalPassengers)` — nilai ini bisa berasal langsung dari `sheetSummary.totalPassengers` (nilai SSOT asli dari rumus sheet), namun tetap dibulatkan. Tidak konsisten dengan `totalKm`, `kmPerBus`, dan `passengersPerKm` di fungsi yang sama, yang secara sengaja TIDAK dibulatkan demi mematuhi aturan SSOT di `.agents/AGENTS.md`.
**Catatan:** Berdampak nyata hanya jika `totalPassengers` di sheet sumber memang bisa berupa desimal (belum dikonfirmasi) — dicatat sebagai potensi pelanggaran aturan emas SSOT yang perlu diverifikasi.
