# Daftar Masalah v5 — Proyek SS_PDO / SPUM

**Repo:** github.com/biiCode37/ss-pdo (commit terbaru per 2026-08-21, "Verify GC")
**Jenis dokumen:** Audit lanjutan v5 — analisa menyeluruh semua aspek (keamanan, frontend, backend/data, UX). Folder `graphify-out` sengaja dilewati sesuai instruksi.
**Konteks penting:** Repo ini juga memuat audit independen lain di `refactor-ss-pdo/refact_5/` (penomoran `ISS-XX`, gaya penulisan berbeda — kemungkinan besar dari tool/agent lain, mis. AntiGravity). Dokumen ini memverifikasi status ISS-XX tersebut di kode SEKARANG, dan menambahkan temuan baru dengan penomoran `BUG-XX` yang konsisten dengan seri v1–v4 sebelumnya.
**Penomoran:** Melanjutkan dari v4. BUG-01 s.d. BUG-47 sudah dipakai → temuan baru dimulai dari **BUG-48**.

---

## ✅ Verifikasi Audit ISS-XX (dari `refact_5`) & v4

Hampir seluruh ISS-XX (12 temuan) sudah diperbaiki dengan komentar kode eksplisit:

| ID | Status |
|---|---|
| ISS-01 (state login terlalu optimistis) | ✅ Diperbaiki — `App.tsx`/`googleSheets.ts` kini validasi token async, bukan cuma cek flag |
| ISS-02 (pencocokan sheet/rute rapuh via `includes()`) | ⚠️ **Diperbaiki SEBAGIAN** — lihat BUG-49 |
| ISS-03 (fallback akumulasi abaikan rentang tanggal) | ✅ Diperbaiki — komentar eksplisit "ISS-03 FIX" |
| ISS-04 (ekstraksi spreadsheet ID terlalu sempit) | ⚠️ **Diperbaiki SEBAGIAN** — fungsi baru (`extractSpreadsheetId`) benar, tapi fungsi lama masih dipakai di beberapa tempat — lihat BUG-49 |
| ISS-06 (localStorage single point of failure) | ✅ Diperbaiki — backup ke Supabase, komentar eksplisit "ISS-06 FIX" |
| ISS-08 (`getMonthlyToaTrend` menyamaratakan error jadi nol) | ✅ Diperbaiki — komentar eksplisit "ISS-08 fix" |
| ISS-11 (collision check pakai snapshot tidak stabil) | ⚠️ Belum ada tanda perbaikan eksplisit — lihat BUG-51 (dicatat sebagai rekomendasi penguatan, bukan bug pasti) |
| ISS-12 (whitelist gesture rapuh terhadap komponen baru) | Risiko arsitektural yang masih relevan — lihat catatan di BUG-49/rekomendasi umum |
| ISS-05, 07, 09, 10 | Tidak sempat diverifikasi ulang secara eksplisit di sesi ini |

Perbaikan v4 (BUG-45, 46, 47) juga terverifikasi baik: `unitAnalytics.ts` kini memakai `parseIndonesianNumber`.

---

## Ringkasan Temuan Baru

| ID | Judul Singkat | Severity | Lokasi |
|---|---|---|---|
| BUG-48 | Stored XSS — interpolasi HTML tanpa escaping di modal input SweetAlert2 | 🔴 Kritis (Keamanan) | `utils/alertUtils.ts` |
| BUG-49 | Perbaikan ISS-02/04 (pencocokan sheet rapuh) belum menyebar ke `Dashboard.tsx` & `analytics.ts` | 🔴 Kritis | `components/Dashboard.tsx`, `utils/analytics.ts` |
| BUG-50 | Pelacakan aktivitas user: durasi tidak akurat + semua error dibungkam total | 🟠 Sedang | `hooks/useUserActivityTracking.ts` |
| BUG-51 | Baseline collision-check masih dari props langsung, bukan snapshot eksplisit (ISS-11) | 🟠 Sedang (perlu verifikasi lanjutan) | `components/BusCard.tsx` |
| BUG-52 | Tidak ada pemberitahuan/transparansi ke user soal pelacakan aktivitas | 🟡 Minor | `hooks/useUserActivityTracking.ts` |

---

## 🔴 KRITIS

### BUG-48 — Stored XSS: interpolasi HTML tanpa escaping di modal input SweetAlert2
**Lokasi:** `utils/alertUtils.ts` — 18 instance pola `value="${...}"`, contoh konkret di `renderSmartKeteranganSection` (± baris 338) dan `showBusInputModal` (± baris 480, 496, 524)
**Deskripsi:** Fitur baru "Progressive Disclosure Input Modal" (menggantikan sebagian alur edit `BusCard.tsx` dengan popup SweetAlert2) membangun HTML modal lewat **template string mentah**, meng-interpolasi nilai dari `bus` (data yang berasal dari sel Google Sheets — `keterangan`, `toaShift1`, dll.) **langsung ke dalam atribut HTML tanpa escaping apa pun**. Dikonfirmasi: **tidak ada satu pun fungsi escape/sanitize** (`escapeHtml`, `DOMPurify`, dsb.) di seluruh file ini.
**Root cause:** SweetAlert2 merender `html:` yang diberikan sebagai HTML mentah (bukan teks polos). String template literal (`` `...${nilai}...` ``) tidak melakukan escaping otomatis seperti JSX React — pola ini AMAN di React (yang jadi kebiasaan di seluruh proyek), tapi berbahaya begitu dipindah ke konteks SweetAlert2 tanpa penyesuaian.
**Dampak nyata:** Field **Keterangan** adalah teks bebas yang bisa diisi siapa saja dengan akses edit ke spreadsheet (termasuk lewat akun bersama yang sudah pernah kita diskusikan di audit auth sebelumnya). Nilai seperti `" onmouseover="..."` atau `"><img src=x onerror="...">` akan **memecah atribut HTML dan mengeksekusi skrip arbitrer** di browser SIAPA PUN yang berikutnya membuka modal input untuk unit bus tersebut — berpotensi mencuri token OAuth Google yang disimpan di `localStorage` (sudah diketahui formatnya dari audit-audit sebelumnya), atau melakukan aksi lain atas nama user yang terkena.
**Tingkat risiko:** Ini kerentanan keamanan paling serius yang ditemukan di seluruh siklus audit v1–v5 — melebihi bahkan temuan BUG-37 (allowlist Supabase) dari segi potensi dampak per-insiden, karena satu baris Keterangan yang “beracun” bisa menyerang SEMUA user yang membuka unit itu, bukan cuma satu sesi login.

### BUG-49 — Perbaikan ISS-02/ISS-04 belum sepenuhnya menyebar
**Lokasi:** `components/Dashboard.tsx` (baris 123, 1064, 1109); `utils/analytics.ts` (baris 175); fungsi lama `extractSheetId` di `services/googleSheets.ts` (baris 484–487, masih dipakai 6× di `Dashboard.tsx`)
**Deskripsi:** Audit sebelumnya (ISS-02, ISS-04 di `refact_5`) mengidentifikasi bahaya pencocokan URL/ID sheet dengan `.includes()` (substring, rapuh) dan fungsi ekstraksi ID yang mengembalikan input mentah saat gagal parse. Perbaikan yang benar SUDAH dibuat (`utils/sheetIdentity.ts`: `extractSpreadsheetId` mengembalikan `null` saat gagal, `matchRouteSheetById` pakai pencocokan ID kanonik) dan sudah dipakai di `RouteSelectorCard.tsx`. **Tapi:**
1. `Dashboard.tsx` — file paling sentral di aplikasi — di 3 tempat berbeda **masih** memakai pola lama `s.sheet_url.includes(sheetUrl)` / `sheetUrl.includes(s.sheet_url)` (bahkan arah perbandingannya tidak konsisten antar 2 dari 3 instance).
2. `analytics.ts` (baris 175) juga masih memakai pola gabungan lama.
3. `extractSheetId` (fungsi LAMA di `googleSheets.ts`) sengaja ditulis ulang jadi `extractSpreadsheetId(urlOrId) ?? urlOrId` — **secara sengaja mengembalikan lagi perilaku ISS-04 yang sudah diperbaiki** (fallback ke input mentah) demi kompatibilitas mundur — dan `Dashboard.tsx` masih memanggil fungsi LAMA ini di 6 lokasi, bukan fungsi baru yang benar.
**Dampak nyata:** Persis seperti yang diperingatkan audit ISS-02 sendiri: rute/bulan/tahun aktif bisa salah terdeteksi, selector bisa "lompat" ke data yang bukan target, dan ini terjadi **diam-diam** (tanpa error yang terlihat) — di file yang justru paling sering dieksekusi (setiap kali app dimuat, tab diganti, atau rute dipilih).
**Catatan:** Ini pola yang sama dengan kasus `parseIndonesianNumber` (BUG-20 → BUG-26 → BUG-45) — perbaikan yang benar dibuat sebagai utilitas baru, tapi tidak semua call-site lama dimigrasikan.

---

## 🟠 SEDANG

### BUG-50 — Pelacakan aktivitas user: durasi tidak akurat & error dibungkam total
**Lokasi:** `hooks/useUserActivityTracking.ts` (seluruh file, 42 baris)
**Deskripsi:**
1. `sendUserHeartbeat(email, HEARTBEAT_SECONDS)` selalu mengirim **durasi tetap 180 detik** setiap interval, terlepas dari apakah tab benar-benar aktif penuh selama itu (throttling browser di tab background, device sleep, dll. bisa membuat interval telat/molor, tapi durasi yang dilaporkan tetap diasumsikan pas 180 detik).
2. **Setiap** pemanggilan `sendUserHeartbeat(...)` diikuti `.catch(() => {})` — kosong total, tidak ada `console.warn` sekalipun. Jika RLS Supabase memblokir tabel ini, atau ada masalah jaringan berkelanjutan, fitur telemetri ini bisa mati total tanpa ada satu log pun yang menandakannya.
**Dampak:** Data durasi sesi/aktivitas di `user_profiles` berpotensi tidak akurat untuk keperluan analitik operasional, dan jika fiturnya berhenti berfungsi, tidak ada cara mengetahuinya dari log manapun.

### BUG-51 — Baseline collision-check masih dari props langsung (ISS-11, perlu verifikasi lanjutan)
**Lokasi:** `components/BusCard.tsx`, `handleSaveUpdates` (± baris 97–105)
**Deskripsi:** Perbandingan konflik (`localBaseNorm = normalizeFieldValue(bus[field])`) memakai `bus` — data PROP yang mengalir dari state `Dashboard.busData` saat itu — sebagai baseline, bukan snapshot eksplisit yang diambil & dibekukan persis saat user MULAI mengedit field tersebut. Pemeriksaan sudah diperbaiki agar hanya membandingkan field yang benar-benar diedit (perbaikan yang baik, mengurangi false-positive dibanding versi lama), tapi baseline-nya sendiri masih bersifat "nilai props terkini", bukan snapshot yang eksplisit terikat waktu.
**Catatan kejujuran:** Saya tidak berhasil mengonstruksi skenario reproduksi konkret yang pasti gagal dengan implementasi SAAT INI (proteksi `isDirtyRef` yang sudah ada tampaknya menutup celah paling jelas). Karena itu ini dicatat sebagai **rekomendasi penguatan (hardening)**, bukan bug yang dipastikan aktif — supaya tidak mengulang kesalahan overclaim seperti kasus BUG-18 di v2 yang harus dicabut.

---

## 🟡 MINOR

### BUG-52 — Tidak ada transparansi ke user soal pelacakan aktivitas
**Lokasi:** `hooks/useUserActivityTracking.ts`, tidak ditemukan UI terkait di komponen manapun
**Deskripsi:** Sejak user login, heartbeat aktivitas otomatis terkirim ke Supabase setiap beberapa menit — tidak ada indikator UI, pengaturan, atau pemberitahuan apa pun bahwa ini terjadi.
**Catatan:** Untuk alat operasional internal, ini risiko rendah secara hukum/kepatuhan, tapi tetap layak dicatat sebagai praktik transparansi yang baik — terutama karena data ini terkait langsung ke `user_profiles` yang bisa diakses admin.
